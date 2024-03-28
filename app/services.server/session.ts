import { Organization, User, UserRole } from "@prisma/client";
import { Session as RemixSession, SessionData, redirect } from "@remix-run/node";

import { db } from "~/integrations/prisma.server";
import { forbidden, unauthorized } from "~/lib/responses.server";
import { sessionStorage } from "~/lib/session.server";

interface ISessionService {
  getSession(request: Request): Promise<RemixSession<SessionData, SessionData>>;
  commitSession(session: RemixSession<SessionData, SessionData>): Promise<string>;
  getUserId(request: Request): Promise<User["id"] | undefined>;
  getUser(request: Request): Promise<User | null>;
  getSessionUser(request: Request): Promise<User | null>;
  requireUserId(request: Request, redirectTo?: string): Promise<User["id"]>;
  requireAdmin(request: Request): Promise<User>;
  requireSuperAdmin(request: Request): Promise<User>;
  createUserSession({
    request,
    userId,
    remember,
    redirectTo,
  }: {
    request: Request;
    userId: string;
    remember: boolean;
    redirectTo: string;
  }): Promise<Response>;
}

class Session implements ISessionService {
  public USER_SESSION_KEY = "userId";
  public ORGANIZATION_SESSION_KEY = "orgId";

  async logout(request: Request) {
    const session = await this.getSession(request);
    return redirect("/login", {
      headers: {
        "Set-Cookie": await sessionStorage.destroySession(session),
      },
    });
  }

  async getSession(request: Request) {
    const cookie = request.headers.get("Cookie");
    return sessionStorage.getSession(cookie);
  }

  async commitSession(session: RemixSession<SessionData, SessionData>) {
    return sessionStorage.commitSession(session);
  }

  async getUserId(request: Request): Promise<User["id"] | undefined> {
    const session = await this.getSession(request);
    const userId = session.get(this.USER_SESSION_KEY) as User["id"] | undefined;
    return userId;
  }

  async getUser(request: Request) {
    const userId = await this.getUserId(request);
    const org = await SessionService.getOrg(request);
    if (userId === undefined) return null;

    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        contact: true,
        contactAssignments: true,
        memberships: true,
      },
    });

    if (user && org) {
      return { ...user, org };
    }

    if (user) {
      return { ...user, org: null };
    }

    throw await this.logout(request);
  }

  async getSessionUser(request: Request) {
    const userId = await this.getUserId(request);
    if (userId === undefined) return null;

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { contact: true },
    });
    if (user) return user;

    throw await this.logout(request);
  }

  async getOrgId(request: Request): Promise<Organization["id"] | undefined> {
    const session = await this.getSession(request);
    const orgId = session.get(this.ORGANIZATION_SESSION_KEY) as Organization["id"] | undefined;
    return orgId;
  }

  async getOrg(request: Request) {
    const orgId = await this.getOrgId(request);
    if (!orgId) {
      return null;
    }
    return db.organization.findUnique({ where: { id: orgId } });
  }

  async requireOrgId(request: Request) {
    const orgId = await this.getOrgId(request);
    if (!orgId) {
      const originURL = new URL(request.url);
      const returnUrl = new URL("/choose-org", originURL.origin);
      returnUrl.searchParams.set("redirectTo", returnUrl.pathname);
      throw redirect(returnUrl.toString());
    }
    return orgId;
  }

  async requireUserId(request: Request, redirectTo: string = new URL(request.url).pathname) {
    const userId = await this.getUserId(request);
    if (!userId) {
      const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
      throw redirect(`/login?${searchParams.toString()}`);
    }
    return userId;
  }

  private async requireUserByRole(request: Request, allowedRoles?: Array<UserRole>) {
    const defaultAllowedRoles: Array<UserRole> = ["USER", "ADMIN"];
    const userId = await this.requireUserId(request);

    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        contact: true,
        memberships: {
          include: {
            org: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (user && user.role === UserRole.SUPERADMIN) {
      return user;
    }

    if (user && allowedRoles && allowedRoles.length > 0) {
      if (allowedRoles.includes(user.role)) {
        return user;
      }
      throw unauthorized({ user });
    }

    if (user && defaultAllowedRoles.includes(user.role)) {
      return user;
    }
    throw forbidden({ user });
  }

  async requireUser(request: Request) {
    return this.requireUserByRole(request);
  }

  async requireAdmin(request: Request) {
    return this.requireUserByRole(request, ["ADMIN"]);
  }

  async requireSuperAdmin(request: Request) {
    return this.requireUserByRole(request, ["SUPERADMIN"]);
  }

  async createUserSession({
    request,
    userId,
    remember,
    redirectTo,
    orgId,
  }: {
    request: Request;
    userId: string;
    remember: boolean;
    redirectTo: string;
    orgId?: string;
  }) {
    const session = await this.getSession(request);
    session.set(this.USER_SESSION_KEY, userId);
    if (orgId) {
      session.set(this.ORGANIZATION_SESSION_KEY, orgId);
    }
    return redirect(redirectTo, {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session, {
          maxAge: remember
            ? 60 * 60 * 24 * 7 // 7 days
            : undefined,
        }),
      },
    });
  }
}

export const SessionService = new Session();
