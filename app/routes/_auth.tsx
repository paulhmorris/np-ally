import { Outlet } from "@remix-run/react";
import { IconPlanet } from "@tabler/icons-react";

export default function AuthLayout() {
  return (
    <div className="flex min-h-full flex-col items-center dark:bg-background sm:bg-secondary">
      <main className="grid w-full grow place-items-center">
        <Outlet />
      </main>
      <footer className="mx-auto mb-8 mt-auto shrink">
        <p className="text-xs text-muted-foreground">
          {new Date().getFullYear()} •{" "}
          <a
            href="https://getcosmic.dev"
            target="_blank"
            rel="noreferrer"
            className="decoration-2 underline-offset-2 hover:underline"
          >
            Cosmic Development <IconPlanet className="mb-0.5 inline size-3.5" />
          </a>
        </p>
      </footer>
    </div>
  );
}
