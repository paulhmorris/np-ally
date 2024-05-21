import { ReimbursementRequestStatus } from "@prisma/client";
import { Body, Button, Container, Head, Hr, Html, Preview, Section, Text } from "@react-email/components";

import { capitalize } from "~/lib/utils";

interface Props {
  url: string;
  status: ReimbursementRequestStatus;
  note?: string;
}

export function ReimbursementRequestUpdateEmail({ status, note, url }: Props) {
  return (
    <Html>
      <Head />
      <Preview>There&apos;s an update on your reimbursement request.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={paragraph}>Hi there,</Text>
          <Text style={paragraph}>
            Your reimbursement request has been marked as{" "}
            <span style={{ fontWeight: "bold", display: "inline", ...paragraph }}>{capitalize(status)}</span>.
          </Text>
          <Hr />
          <Text style={paragraph}>Administrator note:</Text>
          <Text style={adminNote}>{note ? note : "N/A"}</Text>
          <Section style={btnContainer}>
            <Button style={button} href={url}>
              Log In
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

ReimbursementRequestUpdateEmail.PreviewProps = {
  status: "APPROVED",
  url: "https://np-ally.org",
  note: "Culpa laborum qui qui id. Excepteur elit cupidatat occaecat ex eu. Eu aute Lorem veniam ad sint ullamco do enim. Laboris exercitation magna non est nisi. Incididunt culpa id ipsum excepteur quis. Exercitation eiusmod proident non anim veniam et excepteur labore. Laboris elit aliquip commodo minim aute aliqua voluptate cupidatat amet ad. Non sint duis qui et elit minim cillum id ea quis laborum occaecat laboris.",
} as Props;

export default ReimbursementRequestUpdateEmail;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
};

const adminNote = {
  fontSize: "16px",
  lineHeight: "26px",
  fontStyle: "italic",
};

const btnContainer = {
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#4B7081",
  borderRadius: "3px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px",
};
