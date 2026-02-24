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

interface ResealReminderEmailProps {
  customerFirstName: string;
  jobTitle: string;
  resealDueDate: string;
  address: string;
  contactPhone?: string;
}

const brandNavy = "#1a1a2e";
const brandRed = "#e94560";

export function ResealReminderEmail({
  customerFirstName,
  jobTitle,
  resealDueDate,
  address,
  contactPhone,
}: ResealReminderEmailProps) {
  const phone = contactPhone ?? "(435) 709-6999";

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
              Time to Protect Your Surface
            </Heading>

            <Text style={{ color: "#374151", fontSize: 15, lineHeight: 1.6, margin: "0 0 20px" }}>
              Hi {customerFirstName},
            </Text>
            <Text style={{ color: "#374151", fontSize: 15, lineHeight: 1.6, margin: "0 0 20px" }}>
              We hope you&apos;ve been enjoying your beautifully sealed surface! We wanted to reach out because
              your surface at <strong>{address}</strong> is coming up for its recommended resealing maintenance.
            </Text>

            {/* Job Details Box */}
            <Section style={{ backgroundColor: "#f9fafb", borderRadius: 8, padding: "20px 24px", marginBottom: 24, border: "1px solid #e5e7eb" }}>
              <Row>
                <Column>
                  <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
                    Original Service
                  </Text>
                  <Text style={{ color: brandNavy, fontSize: 16, fontWeight: 700, margin: "4px 0 0" }}>
                    {jobTitle}
                  </Text>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
                    Reseal Due
                  </Text>
                  <Text style={{ color: brandRed, fontSize: 16, fontWeight: 800, margin: "4px 0 0" }}>
                    {resealDueDate}
                  </Text>
                </Column>
              </Row>
            </Section>

            <Text style={{ color: "#374151", fontSize: 15, lineHeight: 1.6, margin: "0 0 12px" }}>
              Regular resealing is one of the best ways to protect your investment. Here&apos;s why it matters:
            </Text>

            <Section style={{ paddingLeft: 8, marginBottom: 24 }}>
              <Text style={{ color: "#374151", fontSize: 14, lineHeight: 1.7, margin: "0 0 6px" }}>
                &bull; <strong>Protects your investment</strong> &mdash; sealing prevents costly damage from water, UV rays, and freeze-thaw cycles
              </Text>
              <Text style={{ color: "#374151", fontSize: 14, lineHeight: 1.7, margin: "0 0 6px" }}>
                &bull; <strong>Prevents deterioration</strong> &mdash; keeps cracks, stains, and discoloration from developing
              </Text>
              <Text style={{ color: "#374151", fontSize: 14, lineHeight: 1.7, margin: "0 0 6px" }}>
                &bull; <strong>Maintains appearance</strong> &mdash; keeps your surfaces looking fresh and well-maintained
              </Text>
            </Section>

            <Text style={{ color: "#374151", fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
              We&apos;d love to help you keep your surface in top shape. Give us a call to schedule your
              resealing appointment, or simply reply to this email and we&apos;ll get you on the calendar.
            </Text>

            {/* CTA */}
            <Section style={{ textAlign: "center", margin: "32px 0" }}>
              <Button
                href="tel:+14357096999"
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
                Schedule Resealing
              </Button>
            </Section>

            <Text style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.6, margin: 0, textAlign: "center" }}>
              You can also reply to this email or call us at {phone}.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={{ backgroundColor: "#f9fafb", borderRadius: "0 0 8px 8px", padding: "20px 32px", border: "1px solid #e5e7eb", borderTop: "none", textAlign: "center" }}>
            <Text style={{ color: "#374151", fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>
              Mountain West Surface LLC
            </Text>
            <Text style={{ color: "#6b7280", fontSize: 12, margin: 0 }}>
              (435) 709-6999 &middot; mwsurfaceco@gmail.com &middot; mountainwestsurface.com
            </Text>
            <Text style={{ color: "#9ca3af", fontSize: 11, margin: "8px 0 0" }}>
              Park City &middot; Summit County &middot; Wasatch County &middot; Utah
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
