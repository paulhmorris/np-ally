import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { type MetaFunction } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import dayjs from "dayjs";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm, setFormDefaults, validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import { z } from "zod";

import { PageContainer } from "~/components/page-container";
import { PageHeader } from "~/components/page-header";
import { FormField, FormSelect, FormTextarea } from "~/components/ui/form";
import { SubmitButton } from "~/components/ui/submit-button";
import { prisma } from "~/integrations/prisma.server";
import { ContactType, EngagementType } from "~/lib/constants";
import { notFound } from "~/lib/responses.server";
import { requireUser } from "~/lib/session.server";
import { toast } from "~/lib/toast.server";

const validator = withZod(
  z.object({
    id: z.coerce.number(),
    date: z.coerce.date(),
    description: z.string().optional(),
    typeId: z.coerce.number().pipe(z.nativeEnum(EngagementType)),
    contactId: z.string().cuid({ message: "Contact required" }),
  }),
);

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await requireUser(request);
  invariant(params.engagementId, "engagementId not found");

  const [engagement, contacts, engagementTypes] = await Promise.all([
    prisma.engagement.findUnique({ where: { id: Number(params.engagementId) } }),
    prisma.contact.findMany({
      where: { typeId: { in: [ContactType.External, ContactType.Donor, ContactType.Organization] } },
    }),
    prisma.engagementType.findMany(),
  ]);

  if (!engagement) {
    throw notFound("Engagement not found");
  }

  return typedjson({
    engagementTypes,
    contacts,
    engagement,
    ...setFormDefaults("engagement-form", { ...engagement }),
  });
};

export const meta: MetaFunction = () => [{ title: "Edit Account • Alliance 436" }];

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUser(request);
  const result = await validator.validate(await request.formData());
  if (result.error) {
    return validationError(result.error);
  }

  const engagement = await prisma.engagement.update({
    where: { id: result.data.id },
    data: result.data,
  });

  return toast.json(
    request,
    { engagement },
    {
      title: "Engagement updated",
      description: "Thanks!",
    },
  );
};

export default function EditEngagementPage() {
  const { engagement, engagementTypes, contacts } = useTypedLoaderData<typeof loader>();

  return (
    <>
      <PageHeader title="Edit Engagement" />
      <PageContainer>
        <ValidatedForm id="engagement-form" method="post" validator={validator} className="space-y-4 sm:max-w-md">
          <input type="hidden" name="id" value={engagement.id} />
          <div className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
            <FormField
              required
              name="date"
              label="Date"
              type="date"
              defaultValue={dayjs(engagement.date).format("YYYY-MM-DD")}
            />
            <FormSelect
              required
              name="typeId"
              label="Type"
              placeholder="Select type"
              options={engagementTypes.map((t) => ({
                value: t.id,
                label: t.name,
              }))}
            />
          </div>
          <FormSelect
            required
            name="contactId"
            label="Contact"
            placeholder="Select contact"
            options={contacts.map((c) => ({
              value: c.id,
              label: `${c.firstName} ${c.lastName}`,
            }))}
          />
          <FormTextarea name="description" label="Description" />
          <SubmitButton>Submit</SubmitButton>
        </ValidatedForm>
      </PageContainer>
    </>
  );
}
