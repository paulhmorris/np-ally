import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

import { DesktopNav } from "~/components/desktop-nav";
import { MobileNav } from "~/components/mobile-nav";
import { SessionService } from "~/services/SessionService.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const orgId = await SessionService.getOrgId(request);
  if (!orgId) {
    throw await SessionService.logout(request);
  }
  return json({});
}

export default function AppLayout() {
  return (
    // eslint-disable-next-line react/no-unknown-property
    <div vaul-drawer-wrapper="" className="mx-auto flex min-h-dvh w-full flex-col bg-background md:flex-row">
      <MobileNav />
      <DesktopNav />
      <main className="w-full max-w-screen-2xl grow p-6 md:ml-64 md:p-10">
        <Outlet />
      </main>
    </div>
  );
}
