import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// ─── Types ──────────────────────────────────────────────────────────
export type LineItemPDF = {
  description: string;
  quantity: string;
  unitPrice: string;
};

export type InvoicePDFData = {
  invoiceNumber: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  issueDate: string;
  dueDate: string;
  amount: string;
  notes: string | null;
  lineItems: LineItemPDF[];
  client: {
    name: string;
    email: string;
    company: string | null;
    phone: string | null;
  };
  user: {
    name: string;
    email: string;
    company: string | null;
    phone: string | null;
  };
};

// ─── Palette ────────────────────────────────────────────────────────
const C = {
  indigo: "#4f46e5",
  indigoLight: "#eef2ff",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray300: "#d1d5db",
  gray500: "#6b7280",
  gray700: "#374151",
  gray900: "#111827",
  emerald: "#059669",
  amber: "#d97706",
  red: "#dc2626",
  white: "#ffffff",
};

const STATUS_COLOR: Record<string, string> = {
  PAID: C.emerald,
  PENDING: C.amber,
  OVERDUE: C.red,
};

// ─── Styles ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.gray700,
    backgroundColor: C.white,
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 52,
  },

  // Header bar
  headerBar: {
    backgroundColor: C.indigo,
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    letterSpacing: 3,
  },
  headerNumber: {
    fontSize: 11,
    color: "#c7d2fe",
    marginTop: 4,
  },
  headerRight: { alignItems: "flex-end" },
  headerMeta: { color: "#e0e7ff", fontSize: 9, marginTop: 2 },

  // Status badge
  badge: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    color: C.white,
  },

  // Two-column party section
  parties: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 28,
  },
  partyBox: {
    flex: 1,
    backgroundColor: C.gray50,
    borderRadius: 6,
    padding: 14,
    borderWidth: 1,
    borderColor: C.gray100,
  },
  partyLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.indigo,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  partyName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.gray900,
    marginBottom: 3,
  },
  partyDetail: { color: C.gray500, marginBottom: 2, lineHeight: 1.4 },

  // Dates row
  datesRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  dateBox: {
    flex: 1,
    borderTopWidth: 2,
    borderColor: C.gray100,
    paddingTop: 10,
  },
  dateLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.gray500,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  dateValue: { fontSize: 10, color: C.gray900, fontFamily: "Helvetica-Bold" },

  // Items table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.indigo,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 0,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: C.gray100,
  },
  tableRowAlt: { backgroundColor: C.gray50 },
  col_desc: { flex: 1 },
  col_qty: { width: 50, textAlign: "center" },
  col_price: { width: 80, textAlign: "right" },
  col_total: { width: 80, textAlign: "right" },
  cellText: { color: C.gray700 },

  // Total section
  totalSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
    marginBottom: 28,
  },
  totalBox: {
    width: 200,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  totalRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: C.indigo,
    borderRadius: 4,
    marginTop: 4,
  },
  totalLabel: { color: C.gray500, fontSize: 9 },
  totalValue: { color: C.gray700, fontFamily: "Helvetica-Bold", fontSize: 9 },
  totalFinalLabel: { color: C.white, fontFamily: "Helvetica-Bold", fontSize: 10 },
  totalFinalValue: { color: C.white, fontFamily: "Helvetica-Bold", fontSize: 12 },

  // Notes
  notesBox: {
    backgroundColor: C.indigoLight,
    borderRadius: 6,
    padding: 14,
    marginBottom: 28,
    borderLeftWidth: 3,
    borderLeftColor: C.indigo,
  },
  notesLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.indigo,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  notesText: { color: C.gray700, lineHeight: 1.6 },

  // Footer
  footer: {
    borderTopWidth: 1,
    borderColor: C.gray100,
    paddingTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: { color: C.gray300, fontSize: 8 },
  footerBrand: { color: C.indigo, fontFamily: "Helvetica-Bold", fontSize: 8 },
});

// ─── Helpers ────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function fmtMoney(v: string | number) {
  return `$${Number(v).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ─── Document ───────────────────────────────────────────────────────
export function InvoiceDocument({ data }: { data: InvoicePDFData }) {
  const statusColor = STATUS_COLOR[data.status];
  const statusLabel = data.status.charAt(0) + data.status.slice(1).toLowerCase();

  return (
    <Document
      title={`Invoice ${data.invoiceNumber}`}
      author={data.user.name}
      creator="Invora"
    >
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <View style={s.headerBar}>
          <View>
            <Text style={s.headerTitle}>INVOICE</Text>
            <Text style={s.headerNumber}>{data.invoiceNumber}</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={[s.headerMeta, { fontSize: 11, color: C.white, fontFamily: "Helvetica-Bold" }]}>
              {data.user.name}
            </Text>
            <Text style={s.headerMeta}>{data.user.email}</Text>
            <View style={[s.badge, { backgroundColor: statusColor }]}>
              <Text style={s.badgeText}>{statusLabel}</Text>
            </View>
          </View>
        </View>

        {/* ── Parties ── */}
        <View style={s.parties}>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>From</Text>
            <Text style={s.partyName}>{data.user.name}</Text>
            {data.user.company && (
              <Text style={s.partyDetail}>{data.user.company}</Text>
            )}
            <Text style={s.partyDetail}>{data.user.email}</Text>
            {data.user.phone && (
              <Text style={s.partyDetail}>{data.user.phone}</Text>
            )}
          </View>

          <View style={s.partyBox}>
            <Text style={s.partyLabel}>Bill To</Text>
            <Text style={s.partyName}>{data.client.name}</Text>
            {data.client.company && (
              <Text style={s.partyDetail}>{data.client.company}</Text>
            )}
            <Text style={s.partyDetail}>{data.client.email}</Text>
            {data.client.phone && (
              <Text style={s.partyDetail}>{data.client.phone}</Text>
            )}
          </View>
        </View>

        {/* ── Dates ── */}
        <View style={s.datesRow}>
          {[
            { label: "Invoice Date", value: fmtDate(data.issueDate) },
            { label: "Due Date", value: fmtDate(data.dueDate) },
            { label: "Invoice No.", value: data.invoiceNumber },
          ].map(({ label, value }) => (
            <View key={label} style={s.dateBox}>
              <Text style={s.dateLabel}>{label}</Text>
              <Text style={s.dateValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* ── Items table ── */}
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderText, s.col_desc]}>Description</Text>
          <Text style={[s.tableHeaderText, s.col_qty]}>Qty</Text>
          <Text style={[s.tableHeaderText, s.col_price]}>Unit Price</Text>
          <Text style={[s.tableHeaderText, s.col_total]}>Total</Text>
        </View>

        {data.lineItems.map((li, i) => {
          const lineTotal = Number(li.quantity) * Number(li.unitPrice);
          return (
            <View key={i} style={[s.tableRow, i % 2 === 0 ? s.tableRowAlt : {}]}>
              <Text style={[s.cellText, s.col_desc]}>{li.description}</Text>
              <Text style={[s.cellText, s.col_qty, { textAlign: "center" }]}>
                {Number(li.quantity) % 1 === 0
                  ? String(Number(li.quantity))
                  : Number(li.quantity).toFixed(2)}
              </Text>
              <Text style={[s.cellText, s.col_price, { textAlign: "right" }]}>
                {fmtMoney(li.unitPrice)}
              </Text>
              <Text style={[s.cellText, s.col_total, { textAlign: "right", fontFamily: "Helvetica-Bold" }]}>
                {fmtMoney(lineTotal)}
              </Text>
            </View>
          );
        })}

        {/* ── Total ── */}
        <View style={s.totalSection}>
          <View style={s.totalBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text style={s.totalValue}>{fmtMoney(data.amount)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Tax (0%)</Text>
              <Text style={s.totalValue}>$0.00</Text>
            </View>
            <View style={s.totalRowFinal}>
              <Text style={s.totalFinalLabel}>Total Due</Text>
              <Text style={s.totalFinalValue}>{fmtMoney(data.amount)}</Text>
            </View>
          </View>
        </View>

        {/* ── Notes ── */}
        {data.notes && (
          <View style={s.notesBox}>
            <Text style={s.notesLabel}>Notes</Text>
            <Text style={s.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            Generated {new Date().toLocaleDateString("en-US", { dateStyle: "long" })}
          </Text>
          <Text style={s.footerBrand}>Invora · Invoice Manager</Text>
        </View>
      </Page>
    </Document>
  );
}
