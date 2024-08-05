import { ExcelBuilder, ExcelSchemaBuilder } from "@chronicstone/typed-xlsx";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

import { db } from "~/integrations/prisma.server";
import { toast } from "~/lib/toast.server";
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

  const transactionItems = await db.transactionItem.findMany({
    where: {
      orgId,
      AND: [
        { transaction: { date: { gte: new Date(parsedParams.data.startDate) } } },
        { transaction: { date: { lte: new Date(parsedParams.data.endDate) } } },
      ],
    },
    select: {
      org: {
        select: {
          name: true,
        },
      },
      id: true,
      amountInCents: true,
      method: {
        select: {
          name: true,
        },
      },
      type: {
        select: {
          name: true,
        },
      },
      transaction: {
        select: {
          date: true,
          description: true,
          amountInCents: true,
          account: {
            select: {
              code: true,
              description: true,
            },
          },
          contact: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!transactionItems.length) {
    return toast.redirect(request, "/reports", {
      type: "error",
      title: "No transactions found",
      description: `No transactions found from ${startDate} to ${endDate}. Update your date filters.`,
    });
  }

  const org = transactionItems[0].org;

  const schema = ExcelSchemaBuilder.create<(typeof transactionItems)[0]>()
    .column("ID", { key: "id" })
    .column("Description", { key: "transaction.description" })
    .column("Total", {
      cellStyle: { numFmt: "" },
      key: "transaction.amountInCents",
      transform: (a) => (a ? a / 100 : 0),
    })
    .column("Method", { key: "method.name" })
    .column("Type", { key: "type.name" })
    .column("Date", { key: "transaction.date" })
    .column("Account Code", { key: "transaction.account.code" })
    .column("Account Description", { key: "transaction.account.description" })
    .column("Contact", { key: "transaction.contact", transform: (c) => `${c?.firstName} ${c?.lastName}` })
    .build();

  const file = ExcelBuilder.create()
    .sheet("Sheet1")
    .addTable({ data: transactionItems, schema })
    .build({ output: "buffer", bordered: false });

  return new Response(file, {
    headers: {
      "Content-Disposition": `attachment; filename=${org.name}-transactions-report-${parsedParams.data.startDate}-${parsedParams.data.endDate}.xlsx`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
