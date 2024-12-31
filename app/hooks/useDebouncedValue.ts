import { useSearchParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

export function useDebouncedValue(ms = 500): [string, (value: string) => void] {
  const [value, setValue] = useState("");
  const [debouncedValue] = useDebounce(value, ms);
  const [_, setSearchParams] = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams();
    // User deleted the search
    if (debouncedValue.length === 0) {
      params.delete("s");
      setSearchParams(params, { replace: true });
      return;
    }

    // Needs at least 3 characters
    if (debouncedValue.length < 3) {
      return;
    }

    params.set("s", debouncedValue);
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  return [value, setValue];
}
