import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

import { prisma } from "~/integrations/prisma.server";
import { badRequest } from "~/lib/responses.server";
import { toast } from "~/lib/toast.server";
import { SessionService } from "~/services/SessionService.server";

export async function action({ request }: ActionFunctionArgs) {
  await SessionService.requireUserId(request);

  switch (request.method) {
    case "DELETE": {
      const validator = z.object({ id: z.string().cuid() });
      const result = validator.safeParse(await request.json());
      if (!result.success) {
        return badRequest(fromZodError(result.error).toString());
      }

      const receipt = await prisma.reimbursementRequest.delete({
        where: {
          id: result.data.id,
        },
      });

      return toast.json(
        request,
        { receipt },
        {
          type: "success",
          title: "Reimbursement request deleted",
          description: "Your request was deleted successfully.",
        },
      );
    }
    default: {
      return new Response("Method not allowed", { status: 405 });
    }
  }
}
