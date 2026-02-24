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

interface InvoiceEmailProps {
  customerFirstName: string;
  invoiceNumber: string;
  invoiceTotal: number;
  dueDate?: string | null;
  portalUrl: string;
  lineItems: Array<{ description: string; quantity: number; total: number }>;
  notes?: string | null;
}

const brandNavy = "#1a1a2e";
const brandRed = "#e94560";

export function InvoiceEmail({
  customerFirstName,
  invoiceNumber,
  invoiceTotal,
  dueDate,
  portalUrl,
  lineItems,
  notes,
}: InvoiceEmailProps) {
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
          <Section style={{ backgroundColor: "#fff", padding: "32px 32px 24px", borderLeft: `1px solid #e5e7eb`, borderRight: `1px solid #e5e7eb` }}>
            <Heading as="h2" style={{ color: brandNavy, fontSize: 22, fontWeight: 700, margin: "0 0 16px" }}>
              Invoice from Mountain West Surface
            </Heading>

            <Text style={{ color: "#374151", fontSize: 15, lineHeight: 1.6, margin: "0 0 20px" }}>
              Hi {customerFirstName},
            </Text>
            <Text style={{ color: "#374151", fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
              Thank you for choosing Mountain West Surface! Please find your invoice details below. A PDF copy is attached for your records.
            </Text>

            {/* Invoice Summary Box */}
            <Section style={{ backgroundColor: "#f9fafb", borderRadius: 8, padding: "20px 24px", marginBottom: 24, border: `1px solid #e5e7eb` }}>
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
                    Amount Due
                  </Text>
                  <Text style={{ color: brandRed, fontSize: 22, fontWeight: 800, margin: "4px 0 0" }}>
                    ${invoiceTotal.toFixed(2)}
                  </Text>
                </Column>
              </Row>
              {dueDate && (
                <Text style={{ color: "#6b7280", fontSize: 12, margin: "12px 0 0" }}>
                  Due: {dueDate}
                </Text>
              )}
            </Section>

            {/* Line Items */}
            {lineItems.length > 0 && (
              <Section style={{ marginBottom: 24 }}>
                <Text style={{ color: "#374151", fontSize: 13, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Services
                </Text>
                {lineItems.map((item, i) => (
                  <Row key={i} style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: 6, marginBottom: 6 }}>
                    <Column>
                      <Text style={{ color: "#374151", fontSize: 13, margin: 0 }}>
                        {item.description}
                        {item.quantity !== 1 && ` (×${item.quantity})`}
                      </Text>
                    </Column>
                    <Column style={{ textAlign: "right" }}>
                      <Text style={{ color: brandNavy, fontSize: 13, fontWeight: 600, margin: 0 }}>
                        ${item.total.toFixed(2)}
                      </Text>
                    </Column>
                  </Row>
                ))}
              </Section>
            )}

            {notes && (
              <Section style={{ backgroundColor: "#fef2f2", borderLeft: `3px solid ${brandRed}`, padding: "12px 16px", borderRadius: "0 4px 4px 0", marginBottom: 24 }}>
                <Text style={{ color: "#374151", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                  <strong>Notes:</strong> {notes}
                </Text>
              </Section>
            )}

            {/* Payment Info */}
            <Section style={{ backgroundColor: "#f0fdf4", borderRadius: 6, padding: "16px 20px", marginBottom: 24, border: "1px solid #bbf7d0" }}>
              <Text style={{ color: "#166534", fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>
                How to Pay
              </Text>
              <Text style={{ color: "#374151", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                Please make checks payable to <strong>Mountain West Surface LLC</strong>, or call us at (435) 709-6999 to arrange payment.
              </Text>
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
                View Invoice Online
              </Button>
            </Section>

            <Text style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              Questions about this invoice? Don't hesitate to reach out — we're happy to help.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={{ backgroundColor: "#f9fafb", borderRadius: "0 0 8px 8px", padding: "20px 32px", border: `1px solid #e5e7eb`, borderTop: "none", textAlign: "center" }}>
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
