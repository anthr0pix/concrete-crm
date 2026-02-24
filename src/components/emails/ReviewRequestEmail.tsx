import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Heading,
} from "@react-email/components";

interface ReviewRequestEmailProps {
  customerFirstName: string;
  jobTitle: string;
  reviewUrl: string;
}

const brandNavy = "#1a1a2e";
const brandRed = "#e94560";

export function ReviewRequestEmail({
  customerFirstName,
  jobTitle,
  reviewUrl,
}: ReviewRequestEmailProps) {
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
              How Did We Do?
            </Heading>

            <Text style={{ color: "#374151", fontSize: 15, lineHeight: 1.6, margin: "0 0 20px" }}>
              Hi {customerFirstName},
            </Text>
            <Text style={{ color: "#374151", fontSize: 15, lineHeight: 1.6, margin: "0 0 16px" }}>
              Thank you for choosing Mountain West Surface for your recent project &mdash; <strong>{jobTitle}</strong>. We hope you&apos;re happy with the results!
            </Text>
            <Text style={{ color: "#374151", fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
              Your feedback means the world to us and helps our small business grow. If you have a moment, we&apos;d really appreciate a quick Google review sharing your experience.
            </Text>

            {/* CTA */}
            <Section style={{ textAlign: "center", margin: "32px 0" }}>
              <Button
                href={reviewUrl}
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
                Leave a Review
              </Button>
            </Section>

            <Text style={{ color: "#374151", fontSize: 15, lineHeight: 1.6, margin: "0 0 4px" }}>
              Thank you,
            </Text>
            <Text style={{ color: "#374151", fontSize: 15, fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
              The Mountain West Surface Team
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
