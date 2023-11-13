import { Outlet } from "@remix-run/react";

import { DesktopNav } from "~/components/desktop-nav";
import { MobileNav } from "~/components/mobile-nav";

export default function AppLayout() {
  return (
    <div className="h-full bg-muted">
      <div className="mx-auto flex h-full w-full max-w-screen-2xl flex-col bg-background sm:flex-row">
        <MobileNav />
        <DesktopNav />
        <main className="w-full grow overflow-y-scroll p-6 sm:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
