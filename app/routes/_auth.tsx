import { Outlet } from "@remix-run/react";
import { IconPlanet } from "@tabler/icons-react";

export default function AuthLayout() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center dark:bg-background sm:bg-secondary">
      <main className="mt-[33%] w-full">
        <Outlet />
      </main>
      <footer className="mx-auto mb-8 mt-auto">
        <p className="text-xs text-muted-foreground">
          Copyright {new Date().getFullYear()} • Cosmic Development <IconPlanet className="mb-0.5 inline size-3.5" />
        </p>
      </footer>
    </div>
  );
}
