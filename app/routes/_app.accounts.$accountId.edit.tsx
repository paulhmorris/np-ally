import { UserRole } from "@prisma/client";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { type MetaFunction } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, setFormDefaults, validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { z } from "zod";

import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { ButtonGroup } from "~/components/ui/button-group";
import { FormField, FormSelect } from "~/components/ui/form";
import { SubmitButton } from "~/components/ui/submit-button";
import { prisma } from "~/integrations/prisma.server";
import { AccountType } from "~/lib/constants";
import { notFound } from "~/lib/responses.server";
import { toast } from "~/lib/toast.server";
import { SessionService } from "~/services/SessionService.server";

const validator = withZod(
  z.object({
    id: z.string().cuid(),
    code: z.string().min(1, { message: "Code is required" }),
    description: z.string().min(1, { message: "Description is required" }),
    typeId: z.coerce.number().pipe(z.nativeEnum(AccountType)),
    userId: z.string().optional(),
  }),
);

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await SessionService.requireAdmin(request);
  invariant(params.accountId, "accountId not found");

  const [account, accountTypes, users] = await Promise.all([
    prisma.account.findUnique({ where: { id: params.accountId }, include: { user: true } }),
    prisma.accountType.findMany(),
    prisma.user.findMany({
      where: {
        role: { in: [UserRole.USER, UserRole.ADMIN] },
        OR: [{ accountId: null }, { accountId: params.accountId }],
      },
      include: {
        contact: true,
      },
    }),
  ]);

  if (!account || !accountTypes.length) throw notFound({ message: "Account or Account Types not found" });

  return typedjson({
    account,
    accountTypes,
    users,
    ...setFormDefaults("account-form", { ...account, userId: account.user?.id, typeId: String(account.typeId) }),
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    title: `Edit Account ${data?.account.code} | Alliance 436`,
  },
];

export const action = async ({ request }: ActionFunctionArgs) => {
  await SessionService.requireAdmin(request);
  const result = await validator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  const { userId, ...data } = result.data;
  await prisma.account.update({
    where: { id: data.id },
    data: {
      ...data,
      user: userId
        ? {
            connect: { id: userId },
          }
        : {
            disconnect: true,
          },
    },
  });

  return toast.redirect(request, `/accounts/${result.data.id}`, {
    variant: "default",
    title: "Account updated",
    description: "Great job.",
  });
};

export default function EditAccountPage() {
  const { account, accountTypes, users } = useTypedLoaderData<typeof loader>();
  return (
    <>
      <PageHeader title="Edit Account" />
      <PageContainer>
        <ValidatedForm id="account-form" validator={validator} method="post" className="space-y-4 sm:max-w-md">
          <input type="hidden" name="id" value={account.id} />
          <FormField label="Code" id="name" name="code" required />
          <FormField label="Description" id="name" name="description" required />
          <FormSelect
            required
            label="Type"
            name="typeId"
            placeholder="Select type"
            options={accountTypes.map((a) => ({ label: a.name, value: a.id }))}
          />
          <FormSelect
            label="Linked User"
            name="userId"
            placeholder="Select user"
            description="Link this account to a user. They will be able to see this account and all related transactions."
            options={users.map((a) => ({ label: `${a.contact.firstName} ${a.contact.lastName}`, value: a.id }))}
          />

          <ButtonGroup>
            <SubmitButton>Save</SubmitButton>
            <Button type="reset" variant="outline">
              Reset
            </Button>
          </ButtonGroup>
        </ValidatedForm>
      </PageContainer>
    </>
  );
}
