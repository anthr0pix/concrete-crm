import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Heading,
} from "@react-email/components";

interface DepositConfirmationEmailProps {
  customerFirstName: string;
  quoteNumber: string;
  depositAmount: number;
  paidDate: string;
}

const brandNavy = "#1a1a2e";
const brandRed = "#e94560";

export function DepositConfirmationEmail({
  customerFirstName,
  quoteNumber,
  depositAmount,
  paidDate,
}: DepositConfirmationEmailProps) {
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
              Deposit Received
            </Heading>

            <Text style={{ color: "#374151", fontSize: 15, lineHeight: 1.6, margin: "0 0 20px" }}>
              Hi {customerFirstName},
            </Text>
            <Text style={{ color: "#374151", fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
              Great news! We have received your deposit payment. Thank you for moving forward with Mountain West Surface. Here are the details of your deposit.
            </Text>

            {/* Deposit Summary Box */}
            <Section style={{ backgroundColor: "#f0fdf4", borderRadius: 8, padding: "20px 24px", marginBottom: 24, border: "1px solid #bbf7d0" }}>
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
                    Deposit Paid
                  </Text>
                  <Text style={{ color: "#166534", fontSize: 22, fontWeight: 800, margin: "4px 0 0" }}>
                    ${depositAmount.toFixed(2)}
                  </Text>
                </Column>
              </Row>
              <Text style={{ color: "#6b7280", fontSize: 12, margin: "12px 0 0" }}>
                Payment date: {paidDate}
              </Text>
            </Section>

            {/* Next Steps */}
            <Section style={{ backgroundColor: "#f9fafb", borderLeft: `3px solid ${brandRed}`, padding: "16px 20px", borderRadius: "0 6px 6px 0", marginBottom: 24 }}>
              <Text style={{ color: brandNavy, fontSize: 14, fontWeight: 700, margin: "0 0 8px" }}>
                What Happens Next?
              </Text>
              <Text style={{ color: "#374151", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Our team will be reaching out shortly to schedule your project. The remaining balance will be due upon completion of the work. You will also receive a receipt directly from Square for your records.
              </Text>
            </Section>

            <Text style={{ color: "#374151", fontSize: 15, lineHeight: 1.6, margin: "0 0 0" }}>
              If you have any questions in the meantime, feel free to give us a call or reply to this email. We look forward to working with you!
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
