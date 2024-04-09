import { Link, LinkProps } from "@remix-run/react";
import { IconArrowLeft } from "@tabler/icons-react";

export function BackButton({ to }: { to: LinkProps["to"] }) {
  return (
    <Link
      to={to}
      className="mt-2 inline-flex grow-0 items-center gap-1.5 rounded-lg border px-2 py-0.5 text-sm shadow-sm hover:bg-secondary"
    >
      <IconArrowLeft className="size-4" />
      <span>Back</span>
    </Link>
  );
}
