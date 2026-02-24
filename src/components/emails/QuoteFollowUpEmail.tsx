import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Button,
  Heading,
} from "@react-email/components";

interface QuoteFollowUpEmailProps {
  customerFirstName: string;
  quoteNumber: string;
  quoteTotal: number;
  portalUrl: string;
  daysSince: number;
}

const brandNavy = "#1a1a2e";
const brandRed = "#e94560";

export function QuoteFollowUpEmail({
  customerFirstName,
  quoteNumber,
  quoteTotal,
  portalUrl,
  daysSince,
}: QuoteFollowUpEmailProps) {
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
              Professional Surface Cleaning &amp; Sealing
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ backgroundColor: "#fff", padding: "32px 32px 24px", borderLeft: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb" }}>
            <Heading as="h2" style={{ color: brandNavy, fontSize: 22, fontWeight: 700, margin: "0 0 16px" }}>
              Checking In On Your Quote
            </Heading>

            <Text style={{ color: "#374151", fontSize: 15, lineHeight: 1.6, margin: "0 0 20px" }}>
              Hi {customerFirstName},
            </Text>
            <Text style={{ color: "#374151", fontSize: 15, lineHeight: 1.6, margin: "0 0 16px" }}>
              We wanted to follow up on the quote we sent you {daysSince} days ago. We know life gets busy, so we wanted to make sure you had a chance to review it and let us know if you have any questions.
            </Text>
            <Text style={{ color: "#374151", fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
              We&apos;d love the opportunity to work with you on this project. If anything has changed or you&apos;d like to discuss adjustments, don&apos;t hesitate to reach out &mdash; we&apos;re happy to help.
            </Text>

            {/* Quote Summary Box */}
            <Section style={{ backgroundColor: "#f9fafb", borderRadius: 8, padding: "20px 24px", marginBottom: 24, border: "1px solid #e5e7eb" }}>
              <Row>
                <Column>
                  <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
                    Quote Number
                  </Text>
                  <Text style={{ color: brandNavy, fontSize: 16, fontWeight: 700, margin: "4px 0 0" }}>
                    {quoteNumber}
                  </Text>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
                    Total
                  </Text>
                  <Text style={{ color: brandRed, fontSize: 22, fontWeight: 800, margin: "4px 0 0" }}>
                    ${quoteTotal.toFixed(2)}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* CTA */}
            <Section style={{ textAlign: "center", margin: "32px 0" }}>
              <Button
                href={portalUrl}
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
                View Your Quote
              </Button>
            </Section>

            <Text style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              Click the button above to view the full details of your quote, approve it, or get in touch with any questions. We look forward to hearing from you!
            </Text>
          </Section>

          {/* Footer */}
          <Section style={{ backgroundColor: "#f9fafb", borderRadius: "0 0 8px 8px", padding: "20px 32px", border: "1px solid #e5e7eb", borderTop: "none", textAlign: "center" }}>
            <Text style={{ color: "#374151", fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>
              Mountain West Surface LLC
            </Text>
            <Text style={{ color: "#6b7280", fontSize: 12, margin: 0 }}>
              (435) 709-6999 · mwsurfaceco@gmail.com · mountainwestsurface.com
            </Text>
            <Text style={{ color: "#9ca3af", fontSize: 11, margin: "8px 0 0" }}>
              Park City · Summit County · Wasatch County · Utah
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
