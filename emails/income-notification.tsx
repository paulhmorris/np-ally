import { Body, Button, Container, Head, Html, Preview, Section, Text } from "@react-email/components";

import { formatCentsAsDollars } from "~/lib/utils";

interface Props {
  url: string;
  accountName: string;
  amountInCents: number;
  userFirstname: string | null;
}

export function IncomeNotificationEmail({ userFirstname, amountInCents, accountName, url }: Props) {
  return (
    <Html>
      <Head />
      <Preview>New income has been added to your account.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={paragraph}>Hi{userFirstname ? " " + userFirstname : ""},</Text>
          <Text style={paragraph}>
            A transaction of {formatCentsAsDollars(amountInCents)} was just added to account {accountName}. Check it out
            on your dashboard.
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

IncomeNotificationEmail.PreviewProps = {
  userFirstname: "Paul",
  url: "https://np-ally.org",
  accountName: "3001-PM",
  amountInCents: 1534,
} as Props;

export default IncomeNotificationEmail;

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
