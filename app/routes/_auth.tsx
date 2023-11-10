import { Outlet } from "@remix-run/react";

export default function AuthLayout() {
  return (
    <div className="flex h-full w-full items-start justify-center">
      <Outlet />
    </div>
  );
}
