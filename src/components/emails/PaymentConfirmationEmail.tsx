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

interface PaymentConfirmationEmailProps {
  customerFirstName: string;
  invoiceNumber: string;
  amountPaid: number;
  paidDate: string;
}

const brandNavy = "#1a1a2e";
const brandRed = "#e94560";

export function PaymentConfirmationEmail({
  customerFirstName,
  invoiceNumber,
  amountPaid,
  paidDate,
}: PaymentConfirmationEmailProps) {
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
              Payment Received - Thank You!
            </Heading>

            <Text style={{ color: "#374151", fontSize: 15, lineHeight: 1.6, margin: "0 0 20px" }}>
              Hi {customerFirstName},
            </Text>
            <Text style={{ color: "#374151", fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
              We have received your payment. Thank you for choosing Mountain West Surface! Below are the details of your transaction.
            </Text>

            {/* Payment Summary Box */}
            <Section style={{ backgroundColor: "#f0fdf4", borderRadius: 8, padding: "20px 24px", marginBottom: 24, border: "1px solid #bbf7d0" }}>
              <Row>
                <Column>
                  <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
                    Invoice Number
                  </Text>
                  <Text style={{ color: brandNavy, fontSize: 16, fontWeight: 700, margin: "4px 0 0" }}>
                    {invoiceNumber}
                  </Text>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
                    Amount Paid
                  </Text>
                  <Text style={{ color: "#166534", fontSize: 22, fontWeight: 800, margin: "4px 0 0" }}>
                    ${amountPaid.toFixed(2)}
                  </Text>
                </Column>
              </Row>
              <Text style={{ color: "#6b7280", fontSize: 12, margin: "12px 0 0" }}>
                Payment date: {paidDate}
              </Text>
            </Section>

            <Text style={{ color: "#374151", fontSize: 15, lineHeight: 1.6, margin: "0 0 16px" }}>
              Your invoice has been marked as paid. You will also receive a receipt directly from Square for your records.
            </Text>

            <Text style={{ color: "#374151", fontSize: 15, lineHeight: 1.6, margin: "0 0 0" }}>
              If you have any questions about your payment or need anything else, please don&apos;t hesitate to reach out. We appreciate your business!
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
