import { Body, Button, Container, Head, Html, Preview, Section, Text } from "@react-email/components";

interface Props {
  url: string;
}

export function PasswordResetEmail({ url }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Someone requested a password reset for your account.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={paragraph}>Hi there,</Text>
          <Text style={paragraph}>
            Someone requested a password reset for your account. If this was you, click the button below to set a new
            password. If you didn&apos;t request a password reset, you can safely ignore this email.
          </Text>
          <Section style={btnContainer}>
            <Button style={button} href={url} target="_blank">
              Reset Your Password
            </Button>
          </Section>
          <Text style={paragraph}>
            The link will expire in 15 minutes. You can request a new link from your administrator or from your profile
            at any time.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

PasswordResetEmail.PreviewProps = {
  url: "https://np-ally.org",
} as Props;

export default PasswordResetEmail;

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
