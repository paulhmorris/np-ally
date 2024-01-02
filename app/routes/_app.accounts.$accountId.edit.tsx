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
import { requireUser } from "~/lib/session.server";
import { toast } from "~/lib/toast.server";

const validator = withZod(
  z.object({
    code: z.string().min(1, { message: "Code is required" }),
    description: z.string().min(1, { message: "Description is required" }),
    typeId: z.coerce.number().pipe(z.nativeEnum(AccountType)),
  }),
);

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await requireUser(request, ["ADMIN"]);
  invariant(params.accountId, "accountId not found");

  const account = await prisma.account.findUnique({ where: { id: params.accountId } });
  const accountTypes = await prisma.accountType.findMany();
  if (!account || !accountTypes.length) throw notFound({ message: "Account or Account Types not found" });

  return typedjson({
    accountTypes,
    ...setFormDefaults("account-form", { ...account }),
  });
};

export const meta: MetaFunction = () => [{ title: "Edit Account • Alliance 436" }];

export const action = async ({ params, request }: ActionFunctionArgs) => {
  await requireUser(request, ["ADMIN"]);
  const result = await validator.validate(await request.formData());
  if (result.error) return validationError(result.error);

  await prisma.account.update({
    where: { id: params.accountId },
    data: result.data,
  });

  return toast.redirect(request, `/accounts/${params.accountId}`, {
    variant: "default",
    title: "Account updated",
    description: "Great job.",
  });
};

export default function EditAccountPage() {
  const { accountTypes } = useTypedLoaderData<typeof loader>();
  return (
    <>
      <PageHeader title="Edit Account" />
      <PageContainer>
        <ValidatedForm id="account-form" validator={validator} method="post" className="space-y-4 sm:max-w-md">
          <FormField label="Code" id="name" name="code" required />
          <FormField label="Description" id="name" name="description" required />
          <FormSelect
            required
            label="Type"
            name="typeId"
            placeholder="Select type"
            options={accountTypes.map((a) => ({ label: a.name, value: a.id }))}
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
