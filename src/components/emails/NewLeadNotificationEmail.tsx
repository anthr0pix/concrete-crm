import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Heading,
  Hr,
} from "@react-email/components";

interface NewLeadNotificationEmailProps {
  customerName: string;
  phone: string;
  email?: string;
  service?: string;
  sqFootage?: string;
  location?: string;
  message?: string;
  source?: string;
  crmUrl: string;
  timestamp: string;
}

const brandNavy = "#1a1a2e";
const brandRed = "#e94560";

export default function NewLeadNotificationEmail({
  customerName,
  phone,
  email,
  service,
  sqFootage,
  location,
  message,
  source,
  crmUrl,
  timestamp,
}: NewLeadNotificationEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={{ backgroundColor: "#f4f4f5", fontFamily: "'Inter', Arial, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: "40px auto", padding: "0 20px" }}>
          {/* Header */}
          <Section style={{ backgroundColor: brandNavy, borderRadius: "8px 8px 0 0", padding: "28px 32px", textAlign: "center" }}>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: 800, letterSpacing: 2, margin: 0, textTransform: "uppercase" }}>
              MOUNTAIN WEST SURFACE
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, margin: "4px 0 0", letterSpacing: 1 }}>
              New Website Lead
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ backgroundColor: "#fff", padding: "32px 32px 24px", borderLeft: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb" }}>
            <Heading as="h2" style={{ color: brandNavy, fontSize: 22, fontWeight: 700, margin: "0 0 16px" }}>
              New Lead Received
            </Heading>

            <Text style={{ color: "#374151", fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
              A new lead has been submitted through the website contact form. Details below:
            </Text>

            {/* Lead Details Box */}
            <Section style={{ backgroundColor: "#f9fafb", borderRadius: 8, padding: "20px 24px", marginBottom: 24, border: "1px solid #e5e7eb" }}>
              <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px" }}>
                Lead Details
              </Text>

              <Text style={{ color: "#374151", fontSize: 14, margin: "0 0 8px", lineHeight: 1.5 }}>
                <strong>Name:</strong> {customerName}
              </Text>

              <Text style={{ color: "#374151", fontSize: 14, margin: "0 0 8px", lineHeight: 1.5 }}>
                <strong>Phone:</strong> {phone}
              </Text>

              {email && (
                <Text style={{ color: "#374151", fontSize: 14, margin: "0 0 8px", lineHeight: 1.5 }}>
                  <strong>Email:</strong> {email}
                </Text>
              )}

              {service && (
                <Text style={{ color: "#374151", fontSize: 14, margin: "0 0 8px", lineHeight: 1.5 }}>
                  <strong>Service:</strong> {service}
                </Text>
              )}

              {sqFootage && (
                <Text style={{ color: "#374151", fontSize: 14, margin: "0 0 8px", lineHeight: 1.5 }}>
                  <strong>Sq. Footage:</strong> {sqFootage}
                </Text>
              )}

              {location && (
                <Text style={{ color: "#374151", fontSize: 14, margin: "0 0 8px", lineHeight: 1.5 }}>
                  <strong>Location:</strong> {location}
                </Text>
              )}

              {source && (
                <Text style={{ color: "#374151", fontSize: 14, margin: "0 0 8px", lineHeight: 1.5 }}>
                  <strong>Source:</strong> {source}
                </Text>
              )}

              {message && (
                <>
                  <Hr style={{ borderTop: "1px solid #e5e7eb", margin: "12px 0" }} />
                  <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px" }}>
                    Message
                  </Text>
                  <Text style={{ color: "#374151", fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                    {message}
                  </Text>
                </>
              )}
            </Section>

            {/* CTA */}
            <Section style={{ textAlign: "center", margin: "32px 0" }}>
              <Button
                href={crmUrl}
                style={{
                  backgroundColor: brandRed,
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  padding: "14px 32px",
                  borderRadius: 6,
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                View in CRM
              </Button>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={{ backgroundColor: "#f9fafb", borderRadius: "0 0 8px 8px", padding: "20px 32px", border: "1px solid #e5e7eb", borderTop: "none", textAlign: "center" }}>
            <Text style={{ color: "#6b7280", fontSize: 12, margin: 0 }}>
              Received at {timestamp}
            </Text>
            <Text style={{ color: "#9ca3af", fontSize: 11, margin: "8px 0 0" }}>
              Mountain West Surface CRM — Automated Notification
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
