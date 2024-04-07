import { Prisma } from "@prisma/client";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { MetaFunction, useLoaderData } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { ValidatedForm, validationError } from "remix-validated-form";
import { z } from "zod";

import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { Button } from "~/components/ui/button";
import { ButtonGroup } from "~/components/ui/button-group";
import { FormField } from "~/components/ui/form";
import { SubmitButton } from "~/components/ui/submit-button";
import { db } from "~/integrations/prisma.server";
import { Sentry } from "~/integrations/sentry";
import { handlePrismaError, serverError } from "~/lib/responses.server";
import { toast } from "~/lib/toast.server";
import { SessionService } from "~/services.server/session";

const schema = withZod(
  z.object({
    name: z.string().nonempty("Organization name is required"),
    host: z.string().nonempty("Host is required"),
    replyToEmail: z.string().nonempty("Reply-to email is required"),
    administratorEmail: z.string().optional(),
    inquiriesEmail: z.string().optional(),
  }),
);

export async function loader({ request }: LoaderFunctionArgs) {
  await SessionService.requireAdmin(request);
  const orgId = await SessionService.requireOrgId(request);

  try {
    const org = await db.organization.findUniqueOrThrow({ where: { id: orgId } });
    return json({ org });
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw handlePrismaError(error);
    }
    throw serverError("Unknown error occurred");
  }
}

export async function action({ request }: ActionFunctionArgs) {
  await SessionService.requireAdmin(request);
  const orgId = await SessionService.requireOrgId(request);

  const result = await schema.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  try {
    await db.organization.update({ where: { id: orgId }, data: result.data });
    return toast.redirect(request, "/organization/settings", {
      type: "success",
      title: "Organization settings updated",
    });
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw handlePrismaError(error);
    }
    throw serverError("Unknown error occurred");
  }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: `Settings | ${data?.org.name}` }];
};

export default function OrganizationSettings() {
  const { org } = useLoaderData<typeof loader>();
  return (
    <>
      <PageHeader title={`${org.name} Settings`} />
      <div>
        <p className="text-sm text-muted-foreground">
          Emails will be sent from {org.replyToEmail}@{org.host}
        </p>
      </div>
      <PageContainer>
        <ValidatedForm validator={schema} className="space-y-4 sm:max-w-md" method="post">
          <FormField required label="Organization Name" name="name" defaultValue={org.name} />
          <FormField
            required
            label="Host"
            name="host"
            defaultValue={org.host ?? ""}
            description={`Your company's primary domain, e.g. "outlook.com".`}
          />
          <FormField required label="Reply-to Email" name="replyToEmail" defaultValue={org.replyToEmail} />
          <FormField
            label="Administrator Email"
            name="administratorEmail"
            defaultValue={org.administratorEmail ?? ""}
          />
          <FormField label="Inquiries Email" name="inquiriesEmail" defaultValue={org.inquiriesEmail ?? ""} />
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
