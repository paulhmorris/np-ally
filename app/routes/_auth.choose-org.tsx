import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useSearchParams } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { IconChevronRight } from "@tabler/icons-react";
import { redirect, typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, validationError } from "remix-validated-form";
import { z } from "zod";

import { AuthCard } from "~/components/auth-card";
import { ErrorComponent } from "~/components/error-component";
import { normalizeEnum } from "~/lib/utils";
import { SessionService } from "~/services/SessionService.server";
import { UserService } from "~/services/UserService.server";

const validator = withZod(
  z.object({
    redirectTo: z.string().optional(),
    orgId: z.string().min(1, { message: "Organization is required" }),
  }),
);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await SessionService.getUserId(request);
  if (!userId) {
    return redirect("/login");
  }

  const user = await UserService.getUserById(userId, {
    include: {
      orgMemberships: {
        select: {
          role: true,
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

  if (!user) {
    return redirect("/login");
  }

  return typedjson({ orgs: user.orgMemberships.map((m) => ({ id: m.org.id, name: m.org.name, role: m.role })) });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const result = await validator.validate(await request.formData());

  if (result.error) {
    return validationError(result.error);
  }

  const { orgId, redirectTo } = result.data;

  const session = await SessionService.getSession(request);
  session.set(SessionService.ORGANIZATION_SESSION_KEY, orgId);

  const url = new URL(request.url);
  const redirectUrl = new URL(redirectTo ?? "/", url.origin);

  return redirect(redirectUrl.toString(), {
    headers: {
      "Set-Cookie": await SessionService.commitSession(session),
    },
  });
};

export const meta: MetaFunction = () => [{ title: "Choose Organization" }];

export default function LoginPage() {
  const { orgs } = useTypedLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  return (
    <AuthCard>
      <h1 className="text-4xl font-extrabold">Choose organization</h1>
      <p className="mt-1 text-sm text-muted-foreground">You can change organizations at any time.</p>
      <ValidatedForm validator={validator} method="post" className="mt-8 space-y-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div className="flex flex-col gap-y-4">
          {orgs.map((org) => {
            return (
              <button
                key={org.id}
                type="submit"
                name="orgId"
                value={org.id}
                className="flex w-full items-center justify-between gap-2 rounded-md border p-6 text-left hover:bg-secondary"
              >
                <div>
                  <p className="text-lg font-bold text-foreground">{org.name}</p>
                  <p className="text-sm text-muted-foreground">{normalizeEnum(org.role)}</p>
                </div>
                <IconChevronRight />
              </button>
            );
          })}
        </div>
      </ValidatedForm>
    </AuthCard>
  );
}

export function ErrorBoundary() {
  return <ErrorComponent />;
}
