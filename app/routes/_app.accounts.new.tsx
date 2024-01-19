import { UserRole } from "@prisma/client";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { type MetaFunction } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, validationError } from "remix-validated-form";
import { z } from "zod";

import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { ButtonGroup } from "~/components/ui/button-group";
import { FormField, FormSelect } from "~/components/ui/form";
import { SubmitButton } from "~/components/ui/submit-button";
import { prisma } from "~/integrations/prisma.server";
import { AccountType } from "~/lib/constants";
import { toast } from "~/lib/toast.server";
import { SessionService } from "~/services/SessionService.server";

const validator = withZod(
  z.object({
    code: z.string().min(1, { message: "Code is required" }),
    description: z.string().min(1, { message: "Description is required" }),
    typeId: z.coerce.number().pipe(z.nativeEnum(AccountType)),
    userId: z.string().optional(),
  }),
);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await SessionService.requireAdmin(request);

  const accountTypes = await prisma.accountType.findMany();
  const users = await prisma.user.findMany({
    where: {
      role: { in: [UserRole.USER, UserRole.ADMIN] },
      accountId: null,
    },
    include: {
      contact: true,
    },
  });

  return typedjson({
    users,
    accountTypes,
  });
};

export const meta: MetaFunction = () => [{ title: "Edit Account | Alliance 436" }];

export const action = async ({ request }: ActionFunctionArgs) => {
  await SessionService.requireAdmin(request);
  const result = await validator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  const { userId, ...data } = result.data;
  const account = await prisma.account.create({
    data: {
      ...data,
      user: {
        connect: userId ? { id: userId } : undefined,
      },
    },
  });

  return toast.redirect(request, `/accounts/${account.id}`, {
    title: "Account created",
    description: "Well done.",
  });
};

export default function NewAccountPage() {
  const { users, accountTypes } = useTypedLoaderData<typeof loader>();
  return (
    <>
      <PageHeader title="New Account" />
      <PageContainer>
        <ValidatedForm validator={validator} method="post" className="space-y-4 sm:max-w-md">
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
            <SubmitButton>Create Account</SubmitButton>
            <Button type="reset" variant="outline">
              Reset
            </Button>
          </ButtonGroup>
        </ValidatedForm>
      </PageContainer>
    </>
  );
}
