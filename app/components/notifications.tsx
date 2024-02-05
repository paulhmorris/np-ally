import {
  IconAlertCircleFilled,
  IconAlertTriangleFilled,
  IconCircleCheckFilled,
  IconInfoCircleFilled,
} from "@tabler/icons-react";
import { useEffect } from "react";
import { useTheme } from "remix-themes";
import { useTypedRouteLoaderData } from "remix-typedjson";
import { Toaster, toast } from "sonner";

import { loader } from "~/root";

export function Notifications() {
  const [theme] = useTheme();
  const data = useTypedRouteLoaderData<typeof loader>("root");
  useEffect(() => {
    if (!data?.serverToast) return;
    const { title, type, ...rest } = data.serverToast;
    switch (type) {
      case "success": {
        toast.success(title, {
          ...rest,
          icon: <IconCircleCheckFilled className="h-5 w-5" />,
        });
        break;
      }
      case "error": {
        toast.error(title, {
          ...rest,
          icon: <IconAlertCircleFilled className="h-5 w-5" />,
          duration: Infinity,
        });
        break;
      }
      case "warning": {
        toast.warning(title, {
          ...rest,
          icon: <IconAlertTriangleFilled className="h-5 w-5" />,
        });
        break;
      }
      case "info": {
        toast.info(title, {
          ...rest,
          icon: <IconInfoCircleFilled className="h-5 w-5" />,
        });
        break;
      }
      case "normal":
      default: {
        toast(title, rest);
        break;
      }
    }
  }, [data]);

  return (
    <Toaster
      expand
      richColors
      closeButton
      theme={theme ?? undefined}
      toastOptions={{
        classNames: {
          closeButton: "!bg-background !text-foreground !border-border",
        },
      }}
    />
  );
}
