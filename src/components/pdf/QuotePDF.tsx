import path from "path";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const LOGO_PATH = path.join(process.cwd(), "public", "logo-horizontal-trimmed.png");

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 48,
    color: "#1a1a2e",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: "#e94560",
  },
  logo: {
    width: 220,
    height: 54,
    marginBottom: 6,
  },
  companyContact: {
    fontSize: 9,
    color: "#444",
    marginTop: 1,
  },
  docTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#e94560",
    textAlign: "right",
  },
  docNumber: {
    fontSize: 12,
    color: "#1a1a2e",
    textAlign: "right",
    marginTop: 4,
  },
  docDate: {
    fontSize: 9,
    color: "#666",
    textAlign: "right",
    marginTop: 2,
  },
  statusBadge: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f3460",
    textAlign: "right",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  infoBox: {
    flex: 1,
    marginRight: 16,
  },
  infoLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#e94560",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 10,
    color: "#1a1a2e",
    lineHeight: 1.5,
  },
  infoTextSmall: {
    fontSize: 9,
    color: "#555",
    lineHeight: 1.5,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 3,
  },
  tableHeaderText: {
    color: "#fff",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tableRowAlt: {
    backgroundColor: "#f9f9f9",
  },
  colDescription: { flex: 3 },
  colQty: { flex: 0.8, textAlign: "right" },
  colUnit: { flex: 1.2, textAlign: "right" },
  colTotal: { flex: 1.2, textAlign: "right" },
  cellText: {
    fontSize: 10,
    color: "#1a1a2e",
  },
  totalsSection: {
    alignItems: "flex-end",
    marginBottom: 24,
  },
  totalsBox: {
    width: 200,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 10,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  totalsLabel: {
    fontSize: 9,
    color: "#666",
  },
  totalsValue: {
    fontSize: 10,
    color: "#1a1a2e",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 2,
    borderTopColor: "#e94560",
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a2e",
  },
  totalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#e94560",
  },
  validUntil: {
    fontSize: 9,
    color: "#666",
    marginBottom: 12,
  },
  notesSection: {
    backgroundColor: "#f5f5f5",
    borderLeftWidth: 3,
    borderLeftColor: "#e94560",
    padding: 12,
    marginBottom: 24,
  },
  notesLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#e94560",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: "#444",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  footerText: {
    fontSize: 8,
    color: "#999",
  },
  footerBrand: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a2e",
  },
});

interface QuotePDFProps {
  quote: {
    quoteNumber: string;
    status: string;
    createdAt: Date | string;
    validUntil?: Date | string | null;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    notes?: string | null;
    customer: {
      firstName: string;
      lastName: string;
      email?: string | null;
      phone: string;
      address: string;
      city: string;
      state: string;
      zip: string;
    };
    lineItems: Array<{
      id: string;
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    job?: {
      title: string;
      address?: string | null;
      city?: string | null;
      state?: string | null;
    } | null;
  };
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function QuotePDF({ quote }: QuotePDFProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Image style={styles.logo} src={LOGO_PATH} />
            <Text style={styles.companyContact}>(435) 709-6999</Text>
            <Text style={styles.companyContact}>mwsurfaceco@gmail.com</Text>
            <Text style={styles.companyContact}>mountainwestsurface.com</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>QUOTE</Text>
            <Text style={styles.docNumber}>{quote.quoteNumber}</Text>
            <Text style={styles.docDate}>Date: {formatDate(quote.createdAt)}</Text>
            {quote.validUntil && (
              <Text style={styles.docDate}>Valid Until: {formatDate(quote.validUntil)}</Text>
            )}
            <Text style={styles.statusBadge}>{quote.status}</Text>
          </View>
        </View>

        {/* Bill To / Job Address */}
        <View style={styles.infoSection}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Prepared For</Text>
            <Text style={styles.infoText}>
              {quote.customer.firstName} {quote.customer.lastName}
            </Text>
            <Text style={styles.infoTextSmall}>{quote.customer.address}</Text>
            <Text style={styles.infoTextSmall}>
              {quote.customer.city}, {quote.customer.state} {quote.customer.zip}
            </Text>
            {quote.customer.phone && (
              <Text style={styles.infoTextSmall}>{quote.customer.phone}</Text>
            )}
            {quote.customer.email && (
              <Text style={styles.infoTextSmall}>{quote.customer.email}</Text>
            )}
          </View>
          {quote.job && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Job Details</Text>
              <Text style={styles.infoText}>{quote.job.title}</Text>
              {quote.job.address && (
                <Text style={styles.infoTextSmall}>{quote.job.address}</Text>
              )}
              {quote.job.city && (
                <Text style={styles.infoTextSmall}>
                  {quote.job.city}{quote.job.state ? `, ${quote.job.state}` : ""}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDescription]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Sq Ft</Text>
            <Text style={[styles.tableHeaderText, styles.colUnit]}>Price / Sq Ft</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
          </View>
          {quote.lineItems.map((item, i) => (
            <View key={item.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.cellText, styles.colDescription]}>{item.description}</Text>
              <Text style={[styles.cellText, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.cellText, styles.colUnit]}>${item.unitPrice.toFixed(2)}</Text>
              <Text style={[styles.cellText, styles.colTotal]}>${item.total.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>${quote.subtotal.toFixed(2)}</Text>
            </View>
            {quote.taxRate > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Tax ({quote.taxRate}%)</Text>
                <Text style={styles.totalsValue}>${quote.taxAmount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${quote.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {quote.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{quote.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Thank you for choosing Mountain West Surface!</Text>
          <Text style={styles.footerBrand}>Mountain West Surface LLC · (435) 709-6999</Text>
          <Text style={styles.footerText}>{quote.quoteNumber}</Text>
        </View>
      </Page>
    </Document>
  );
}
