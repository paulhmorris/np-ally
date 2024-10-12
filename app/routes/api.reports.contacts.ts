import { ExcelBuilder, ExcelSchemaBuilder } from "@chronicstone/typed-xlsx";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

import { db } from "~/integrations/prisma.server";
import { ContactType } from "~/lib/constants";
import { Toasts } from "~/lib/toast.server";
import { SessionService } from "~/services.server/session";

export const TransactionsReportSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

export async function loader({ request }: LoaderFunctionArgs) {
  await SessionService.requireAdmin(request);
  const orgId = await SessionService.requireOrgId(request);
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const parsedParams = TransactionsReportSchema.safeParse({
    startDate,
    endDate,
  });
  if (!parsedParams.success) {
    return json({ message: fromZodError(parsedParams.error).toString() }, { status: 400 });
  }

  const contacts = await db.contact.findMany({
    where: {
      orgId,
      typeId: { notIn: [ContactType.Staff] },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      organizationName: true,
      org: {
        select: {
          name: true,
        },
      },
      transactions: {
        select: {
          account: {
            select: {
              code: true,
              description: true,
            },
          },
        },
      },
    },
  });

  if (!contacts.length) {
    return Toasts.redirectWithError("/reports", {
      title: "No contacts found",
      description: `No contacts found for report.`,
    });
  }

  const org = contacts[0].org;

  const schema = ExcelSchemaBuilder.create<(typeof contacts)[0]>()
    .column("Transaction ID", { key: "id" })
    .column("First Name", { key: "firstName" })
    .column("Last Name", { key: "lastName" })
    .column("Organization Name", { key: "organizationName" })

    .build();

  const file = ExcelBuilder.create()
    .sheet("Sheet1")
    .addTable({ data: contacts, schema })
    .build({ output: "buffer", bordered: false });

  return new Response(file, {
    headers: {
      "Content-Disposition": `attachment; filename=${org.name}-transactions-report-${parsedParams.data.startDate}-${parsedParams.data.endDate}.xlsx`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
