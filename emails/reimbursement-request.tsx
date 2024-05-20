import { Body, Button, Container, Head, Html, Preview, Section, Text } from "@react-email/components";

import { formatCentsAsDollars } from "~/lib/utils";

interface Props {
  url: string;
  accountName: string;
  amountInCents: number;
  requesterName: string | null;
}

export function ReimbursementRequestEmail({ requesterName, amountInCents, accountName, url }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Someone has requested a reimbursement.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={paragraph}>
            There&apos;s a new reimbursement request for {formatCentsAsDollars(amountInCents)} from {requesterName} for
            account {accountName}. Please log in to review and respond to the request.
          </Text>
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

ReimbursementRequestEmail.PreviewProps = {
  requesterName: "Paul",
  url: "https://np-ally.org",
  accountName: "3001-PM",
  amountInCents: 1534,
} as Props;

export default ReimbursementRequestEmail;

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
