import { Outlet } from "@remix-run/react";

import { DesktopNav } from "~/components/desktop-nav";
import { IssueDialog } from "~/components/issue-dialog";
import { MobileNav } from "~/components/mobile-nav";

export default function AppLayout() {
  return (
    <div className="mx-auto flex h-full w-full flex-col bg-background sm:flex-row">
      <MobileNav />
      <DesktopNav />
      <main className="w-full grow overflow-y-scroll p-6 sm:p-10">
        <Outlet />
        <IssueDialog />
      </main>
    </div>
  );
}
