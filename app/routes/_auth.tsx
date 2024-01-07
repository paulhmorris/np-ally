import { Outlet } from "@remix-run/react";

export default function AuthLayout() {
  return (
    <div className="grid min-h-screen w-full items-start justify-center pt-[25%] sm:place-items-center sm:pt-0">
      <Outlet />
    </div>
  );
}
