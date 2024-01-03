import { Outlet } from "@remix-run/react";

export default function AuthLayout() {
  return (
    <div className="mt-[50%] flex w-full items-start justify-center sm:mt-0 sm:h-full">
      <Outlet />
    </div>
  );
}
