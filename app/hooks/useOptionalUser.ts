import { useTypedRouteLoaderData } from "remix-typedjson";

import { loader as rootLoader } from "~/root";

export function useOptionalUser() {
  const data = useTypedRouteLoaderData<typeof rootLoader>("root");
  if (!data) {
    return undefined;
  }
  return data.user;
}
