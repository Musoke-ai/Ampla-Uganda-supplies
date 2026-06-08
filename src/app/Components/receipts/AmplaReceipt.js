import React, { useMemo, useRef, forwardRef } from "react";
import { useSelector } from "react-redux";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Modal, Button, Form } from "react-bootstrap";

import { selectStock } from "../../features/stock/stockSlice";
import { selectCustomers } from "../../features/api/customers";
import { useSettings } from "../Settings";

const EMPTY_ARRAY = [];

const getQty = (item) => Number(item?.saleQuantity ?? item?.itemQuantity ?? item?.qty ?? 0);
const getPrice = (item) => Number(item?.salePrice ?? item?.price ?? 0);
const getItemId = (item) => item?.saleItemId ?? item?.itemId ?? item?.id;
const getDiscountAmount = (saleDetails = {}) =>
  Number(saleDetails.discountAmount ?? saleDetails.discount ?? 0);
const getTaxAmount = (saleDetails = {}) => Number(saleDetails.taxAmount ?? saleDetails.tax ?? 0);
const getSubtotal = (cart = []) => cart.reduce((acc, item) => acc + getQty(item) * getPrice(item), 0);
export const formatAmount = (value, currency = "UGX") =>
  `${currency} ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

export const receiptTemplateOptions = {
  modern: "Standard POS",
  compact: "Compact POS",
  classic: "Classic Retail",
};

export const getReceiptPaperWidth = (value) => (value === "58mm" ? "58mm" : "80mm");
const POWERED_BY_TEXT = "Powered by HamuzahAndSteve Technologies";

const getReceiptTemplateVariables = (template = "modern") => {
  if (template === "compact") {
    return {
      "--receipt-radius": "0px",
      "--receipt-shadow": "none",
      "--receipt-border": "#111111",
      "--receipt-hero-bg": "#ffffff",
      "--receipt-hero-border": "#111111",
      "--receipt-text": "#111111",
      "--receipt-muted": "#444444",
      "--receipt-accent": "#111111",
      "--receipt-accent-soft": "#f4f4f4",
      "--receipt-card-bg": "#ffffff",
      "--receipt-section-bg": "#ffffff",
      "--receipt-line": "#111111",
      "--receipt-chip-bg": "#ffffff",
      "--receipt-chip-border": "#111111",
    };
  }

  if (template === "classic") {
    return {
      "--receipt-radius": "10px",
      "--receipt-shadow": "0 12px 30px rgba(15, 23, 42, 0.08)",
      "--receipt-border": "#1f2937",
      "--receipt-hero-bg": "#f8fafc",
      "--receipt-hero-border": "#1f2937",
      "--receipt-text": "#111827",
      "--receipt-muted": "#4b5563",
      "--receipt-accent": "#111827",
      "--receipt-accent-soft": "#eef2f7",
      "--receipt-card-bg": "#ffffff",
      "--receipt-section-bg": "#f9fafb",
      "--receipt-line": "#1f2937",
      "--receipt-chip-bg": "#ffffff",
      "--receipt-chip-border": "#1f2937",
    };
  }

  return {
    "--receipt-radius": "2px",
    "--receipt-shadow": "0 18px 42px rgba(15, 23, 42, 0.08)",
    "--receipt-border": "#111111",
    "--receipt-hero-bg": "#ffffff",
    "--receipt-hero-border": "#111111",
    "--receipt-text": "#111111",
    "--receipt-muted": "#444444",
    "--receipt-accent": "#111111",
    "--receipt-accent-soft": "#f2f2f2",
    "--receipt-card-bg": "#ffffff",
    "--receipt-section-bg": "#ffffff",
    "--receipt-line": "#111111",
    "--receipt-chip-bg": "#ffffff",
    "--receipt-chip-border": "#111111",
  };
};

export const receiptStyles = {
  shell: {
    width: "100%",
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    color: "var(--receipt-text)",
    background: "#ffffff",
    borderRadius: "var(--receipt-radius)",
    border: "1px solid var(--receipt-border)",
    boxShadow: "var(--receipt-shadow)",
    overflow: "hidden",
  },
  hero: {
    padding: "16px 14px 12px",
    background: "var(--receipt-hero-bg)",
    borderBottom: "1px dashed var(--receipt-hero-border)",
    textAlign: "center",
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "10px",
  },
  brandBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "var(--receipt-accent-soft)",
    color: "var(--receipt-accent)",
    fontWeight: 800,
    fontSize: "15px",
    letterSpacing: "0.06em",
  },
  paidChip: {
    padding: "4px 8px",
    borderRadius: "999px",
    background: "var(--receipt-chip-bg)",
    color: "var(--receipt-accent)",
    border: "1px solid var(--receipt-chip-border)",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  title: {
    fontSize: "17px",
    fontWeight: 800,
    letterSpacing: 0,
    margin: 0,
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: "10px",
    color: "var(--receipt-muted)",
    margin: "4px 0 0",
    lineHeight: 1.5,
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "6px 10px",
    padding: "12px 14px",
    borderBottom: "1px dashed var(--receipt-line)",
    background: "var(--receipt-section-bg)",
  },
  metaCard: {
    border: 0,
    borderRadius: 0,
    padding: 0,
    background: "var(--receipt-card-bg)",
  },
  metaLabel: {
    fontSize: "9px",
    color: "var(--receipt-muted)",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: "4px",
  },
  metaValue: {
    fontSize: "11px",
    fontWeight: 700,
    color: "var(--receipt-text)",
    lineHeight: 1.4,
  },
  section: {
    padding: "14px",
  },
  sectionTitle: {
    fontSize: "10px",
    color: "var(--receipt-accent)",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: "10px",
  },
  lineItemHeader: {
    display: "grid",
    gridTemplateColumns: "1.7fr 0.45fr 0.85fr",
    gap: "8px",
    fontSize: "10px",
    fontWeight: 800,
    color: "var(--receipt-muted)",
    paddingBottom: "8px",
    borderBottom: "1px dashed var(--receipt-line)",
  },
  lineItem: {
    display: "grid",
    gridTemplateColumns: "1.7fr 0.45fr 0.85fr",
    gap: "8px",
    alignItems: "start",
    padding: "8px 0",
    borderBottom: "1px dotted var(--receipt-line)",
  },
  itemName: {
    fontSize: "11px",
    fontWeight: 700,
    color: "var(--receipt-text)",
    lineHeight: 1.35,
  },
  itemMeta: {
    fontSize: "9px",
    color: "var(--receipt-muted)",
    marginTop: "3px",
  },
  alignCenter: {
    textAlign: "center",
    fontSize: "11px",
    fontWeight: 700,
  },
  alignRight: {
    textAlign: "right",
    fontSize: "11px",
    fontWeight: 700,
  },
  summaryBox: {
    marginTop: "12px",
    borderRadius: 0,
    border: 0,
    borderTop: "1px dashed var(--receipt-line)",
    borderBottom: "1px dashed var(--receipt-line)",
    background: "var(--receipt-section-bg)",
    padding: "10px 0 4px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "7px",
    fontSize: "11px",
    color: "var(--receipt-muted)",
  },
  summaryValue: {
    fontWeight: 700,
    color: "var(--receipt-text)",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px dashed var(--receipt-line)",
    fontSize: "15px",
    fontWeight: 800,
    color: "var(--receipt-text)",
  },
  paymentBox: {
    display: "grid",
    gap: "10px",
    marginTop: "10px",
    padding: "10px 0 4px",
    borderRadius: 0,
    background: "var(--receipt-section-bg)",
    border: 0,
    borderBottom: "1px dashed var(--receipt-line)",
  },
  footer: {
    padding: "0 18px 18px",
    textAlign: "center",
  },
  footerNote: {
    borderTop: "1px dashed var(--receipt-line)",
    paddingTop: "14px",
    fontSize: "11px",
    color: "var(--receipt-muted)",
    lineHeight: 1.6,
  },
  footerThanks: {
    fontSize: "13px",
    fontWeight: 800,
    color: "var(--receipt-text)",
    marginTop: "8px",
  },
  poweredBy: {
    marginTop: "8px",
    paddingTop: "8px",
    borderTop: "1px dotted var(--receipt-line)",
    fontSize: "9px",
    fontWeight: 700,
    color: "var(--receipt-muted)",
    textTransform: "uppercase",
  },
};

export const ReceiptDocumentView = forwardRef(
  (
    {
      cart = [],
      saleDetails = {},
      companyInfo = {},
      customerName = "",
      productsMap = new Map(),
      currency = "UGX",
      receiptNumber = "N/A",
      issuedAt = "",
      receiptSize = "80mm",
      receiptTemplate = "modern",
    },
    ref
  ) => {
    const subtotal = getSubtotal(cart);
    const paymentStatus = Number(saleDetails?.dueAmount || 0) > 0 ? "Part Paid" : "Paid";
    const templateVariables = getReceiptTemplateVariables(receiptTemplate);

    return (
      <div
        ref={ref}
        className={`receipt-template-shell receipt-template-${receiptTemplate} mx-auto`}
        style={{
          ...receiptStyles.shell,
          ...templateVariables,
          width: receiptSize,
          transition: "width 0.3s ease-in-out",
        }}
      >
        <div style={receiptStyles.hero}>
          <div style={receiptStyles.brandRow}>
            <div style={receiptStyles.brandBadge}>
              {(companyInfo?.busName || "A").charAt(0).toUpperCase()}
            </div>
            <div style={receiptStyles.paidChip}>{paymentStatus}</div>
          </div>

          <h2 style={receiptStyles.title}>{companyInfo?.busName || "Business Name"}</h2>
          <p style={receiptStyles.subtitle}>
            {companyInfo?.busLocation || "Business location not set"}
            <br />
            {companyInfo?.busContactOne || "No contact set"}
            {companyInfo?.busContactTwo ? ` - ${companyInfo.busContactTwo}` : ""}
          </p>
        </div>

        <div style={receiptStyles.metaGrid}>
          <div style={receiptStyles.metaCard}>
            <div style={receiptStyles.metaLabel}>Receipt No.</div>
            <div style={receiptStyles.metaValue}>{receiptNumber}</div>
          </div>
          <div style={receiptStyles.metaCard}>
            <div style={receiptStyles.metaLabel}>Issued</div>
            <div style={receiptStyles.metaValue}>{issuedAt}</div>
          </div>
          <div style={receiptStyles.metaCard}>
            <div style={receiptStyles.metaLabel}>Customer</div>
            <div style={receiptStyles.metaValue}>{customerName || "Walk-in Customer"}</div>
          </div>
          <div style={receiptStyles.metaCard}>
            <div style={receiptStyles.metaLabel}>Payment</div>
            <div style={receiptStyles.metaValue}>{saleDetails?.paymentMethod || "Cash"}</div>
          </div>
          <div style={receiptStyles.metaCard}>
            <div style={receiptStyles.metaLabel}>Branch</div>
            <div style={receiptStyles.metaValue}>{saleDetails?.branchName || "Main branch"}</div>
          </div>
          <div style={receiptStyles.metaCard}>
            <div style={receiptStyles.metaLabel}>Cashier</div>
            <div style={receiptStyles.metaValue}>{saleDetails?.cashierName || "Current user"}</div>
          </div>
        </div>

        <div style={receiptStyles.section}>
          <div style={receiptStyles.sectionTitle}>Items</div>
          <div style={receiptStyles.lineItemHeader}>
            <span>Product</span>
            <span style={{ textAlign: "center" }}>Qty</span>
            <span style={{ textAlign: "right" }}>Amount</span>
          </div>
          {cart.map((item, index) => (
            <div key={`${getItemId(item)}-${index}`} style={receiptStyles.lineItem}>
              <div>
                <div style={receiptStyles.itemName}>
                  {item.itemName || productsMap.get(getItemId(item)) || `ID: ${getItemId(item)}`}
                </div>
                <div style={receiptStyles.itemMeta}>{formatAmount(getPrice(item), currency)} each</div>
              </div>
              <div style={receiptStyles.alignCenter}>{getQty(item)}</div>
              <div style={receiptStyles.alignRight}>
                {formatAmount(getQty(item) * getPrice(item), currency)}
              </div>
            </div>
          ))}

          <div style={receiptStyles.summaryBox}>
            <div style={receiptStyles.summaryRow}>
              <span>Subtotal</span>
              <span style={receiptStyles.summaryValue}>{formatAmount(subtotal, currency)}</span>
            </div>
            <div style={receiptStyles.summaryRow}>
              <span>Discount</span>
              <span style={receiptStyles.summaryValue}>
                -{formatAmount(getDiscountAmount(saleDetails), currency)}
              </span>
            </div>
            <div style={receiptStyles.summaryRow}>
              <span>Tax</span>
              <span style={receiptStyles.summaryValue}>
                {formatAmount(getTaxAmount(saleDetails), currency)}
              </span>
            </div>
            <div style={receiptStyles.totalRow}>
              <span>Total</span>
              <span>{formatAmount(saleDetails?.total, currency)}</span>
            </div>
          </div>

          <div style={receiptStyles.paymentBox}>
            <div style={receiptStyles.summaryRow}>
              <span>Tendered</span>
              <span style={receiptStyles.summaryValue}>
                {formatAmount(saleDetails?.tenderedAmount, currency)}
              </span>
            </div>
            <div style={receiptStyles.summaryRow}>
              <span>Balance Due</span>
              <span style={receiptStyles.summaryValue}>
                {formatAmount(saleDetails?.dueAmount, currency)}
              </span>
            </div>
          </div>
        </div>

        <div style={receiptStyles.footer}>
          <div style={receiptStyles.footerNote}>
            {saleDetails?.moreInfo || "Generated from Ampla POS."}
            <div style={receiptStyles.footerThanks}>Thank you for your business.</div>
            <div style={receiptStyles.poweredBy}>{POWERED_BY_TEXT}</div>
          </div>
        </div>
      </div>
    );
  }
);

const ReceiptPreviewModal = forwardRef((props, ref) => {
  const {
    show,
    onClose,
    onDownload,
    onPrint,
    cart,
    saleDetails,
    companyInfo,
    customerName,
    receiptSize,
    onSizeChange,
    productsMap,
    currency,
    receiptNumber,
    issuedAt,
    receiptTemplate,
  } = props;

  if (!show) return null;

  const subtotal = getSubtotal(cart);
  const paymentStatus = Number(saleDetails?.dueAmount || 0) > 0 ? "Part Paid" : "Paid";
  const templateVariables = getReceiptTemplateVariables(receiptTemplate);

  return (
    <Modal
      show={show}
      onHide={onClose}
      size="lg"
      centered
      className="receipt-preview-modal"
      dialogClassName="receipt-preview-dialog"
      contentClassName="receipt-preview-content"
      backdropClassName="receipt-preview-backdrop"
    >
      <Modal.Header closeButton>
        <Modal.Title as="h3">Receipt Preview</Modal.Title>
        <div className="d-flex align-items-center ms-auto me-3">
          <span className="text-muted me-2 small">Size:</span>
          {["80mm", "58mm"].map((size) => (
            <Form.Check
              key={size}
              inline
              type="radio"
              id={`receipt-size-${size}`}
              label={size}
              name="receiptSizePreview"
              value={size}
              checked={receiptSize === size}
              onChange={(event) => onSizeChange(event.target.value)}
            />
          ))}
        </div>
      </Modal.Header>

      <Modal.Body className="bg-light-subtle">
        <div
          ref={ref}
          className={`receipt-template-shell receipt-template-${receiptTemplate} mx-auto`}
          style={{
            ...receiptStyles.shell,
            ...templateVariables,
            width: receiptSize,
            transition: "width 0.3s ease-in-out",
          }}
        >
          <div style={receiptStyles.hero}>
            <div style={receiptStyles.brandRow}>
              <div style={receiptStyles.brandBadge}>
                {(companyInfo?.busName || "A").charAt(0).toUpperCase()}
              </div>
              <div style={receiptStyles.paidChip}>{paymentStatus}</div>
            </div>

            <h2 style={receiptStyles.title}>{companyInfo?.busName || "Business Name"}</h2>
            <p style={receiptStyles.subtitle}>
              {companyInfo?.busLocation || "Business location not set"}
              <br />
              {companyInfo?.busContactOne || "No contact set"}
              {companyInfo?.busContactTwo ? ` - ${companyInfo.busContactTwo}` : ""}
            </p>
          </div>

          <div style={receiptStyles.metaGrid}>
            <div style={receiptStyles.metaCard}>
              <div style={receiptStyles.metaLabel}>Receipt No.</div>
              <div style={receiptStyles.metaValue}>{receiptNumber}</div>
            </div>
            <div style={receiptStyles.metaCard}>
              <div style={receiptStyles.metaLabel}>Issued</div>
              <div style={receiptStyles.metaValue}>{issuedAt}</div>
            </div>
            <div style={receiptStyles.metaCard}>
              <div style={receiptStyles.metaLabel}>Customer</div>
              <div style={receiptStyles.metaValue}>{customerName || "Walk-in Customer"}</div>
            </div>
            <div style={receiptStyles.metaCard}>
              <div style={receiptStyles.metaLabel}>Payment</div>
              <div style={receiptStyles.metaValue}>{saleDetails?.paymentMethod || "Cash"}</div>
            </div>
            <div style={receiptStyles.metaCard}>
              <div style={receiptStyles.metaLabel}>Branch</div>
              <div style={receiptStyles.metaValue}>{saleDetails?.branchName || "Main branch"}</div>
            </div>
            <div style={receiptStyles.metaCard}>
              <div style={receiptStyles.metaLabel}>Cashier</div>
              <div style={receiptStyles.metaValue}>{saleDetails?.cashierName || "Current user"}</div>
            </div>
          </div>

          <div style={receiptStyles.section}>
            <div style={receiptStyles.sectionTitle}>Items</div>
            <div style={receiptStyles.lineItemHeader}>
              <span>Product</span>
              <span style={{ textAlign: "center" }}>Qty</span>
              <span style={{ textAlign: "right" }}>Amount</span>
            </div>
            {cart.map((item, index) => (
              <div key={`${getItemId(item)}-${index}`} style={receiptStyles.lineItem}>
                <div>
                  <div style={receiptStyles.itemName}>
                    {item.itemName || productsMap.get(getItemId(item)) || `ID: ${getItemId(item)}`}
                  </div>
                  <div style={receiptStyles.itemMeta}>
                    {formatAmount(getPrice(item), currency)} each
                  </div>
                </div>
                <div style={receiptStyles.alignCenter}>{getQty(item)}</div>
                <div style={receiptStyles.alignRight}>
                  {formatAmount(getQty(item) * getPrice(item), currency)}
                </div>
              </div>
            ))}

            <div style={receiptStyles.summaryBox}>
              <div style={receiptStyles.summaryRow}>
                <span>Subtotal</span>
                <span style={receiptStyles.summaryValue}>{formatAmount(subtotal, currency)}</span>
              </div>
              <div style={receiptStyles.summaryRow}>
                <span>Discount</span>
                <span style={receiptStyles.summaryValue}>
                  -{formatAmount(getDiscountAmount(saleDetails), currency)}
                </span>
              </div>
              <div style={receiptStyles.summaryRow}>
                <span>Tax</span>
                <span style={receiptStyles.summaryValue}>
                  {formatAmount(getTaxAmount(saleDetails), currency)}
                </span>
              </div>
              <div style={receiptStyles.totalRow}>
                <span>Total</span>
                <span>{formatAmount(saleDetails?.total, currency)}</span>
              </div>
            </div>

            <div style={receiptStyles.paymentBox}>
              <div style={receiptStyles.summaryRow}>
                <span>Tendered</span>
                <span style={receiptStyles.summaryValue}>
                  {formatAmount(saleDetails?.tenderedAmount, currency)}
                </span>
              </div>
              <div style={receiptStyles.summaryRow}>
                <span>Balance Due</span>
                <span style={receiptStyles.summaryValue}>
                  {formatAmount(saleDetails?.dueAmount, currency)}
                </span>
              </div>
            </div>
          </div>

          <div style={receiptStyles.footer}>
            <div style={receiptStyles.footerNote}>
              {saleDetails?.moreInfo || "Generated from Ampla POS."}
              <div style={receiptStyles.footerThanks}>Thank you for your business.</div>
              <div style={receiptStyles.poweredBy}>{POWERED_BY_TEXT}</div>
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="dark" onClick={onPrint}>
          Print
        </Button>
        <Button variant="primary" onClick={onDownload}>
          Download PDF
        </Button>
      </Modal.Footer>
    </Modal>
  );
});

export default function AmplaReceipt({
  show = false,
  onClose = () => {},
  companyInfo = {},
  customerName = "",
  cart = [],
  saleDetails = {},
}) {
  const previewRef = useRef();
  const { settings } = useSettings();
  const currency = settings?.currency && settings.currency !== "none" ? settings.currency : "UGX";
  const receiptTemplate =
    settings?.receiptTemplate in receiptTemplateOptions ? settings.receiptTemplate : "modern";
  const defaultReceiptSize = getReceiptPaperWidth(settings?.receiptPaperWidth);
  const printerMode = settings?.receiptPrinterMode === "system" ? "system" : "browser";
  const [receiptSize, setReceiptSize] = React.useState(defaultReceiptSize);
  const [issuedAt, setIssuedAt] = React.useState(() => new Date().toLocaleString());

  React.useEffect(() => {
    if (show) {
      setReceiptSize(defaultReceiptSize);
      setIssuedAt(new Date().toLocaleString());
    }
  }, [defaultReceiptSize, show]);

  const products = useSelector(selectStock) ?? EMPTY_ARRAY;
  const customers = useSelector(selectCustomers) ?? EMPTY_ARRAY;

  const productsMap = useMemo(
    () => new Map(products.map((product) => [product.itemId, product.itemName])),
    [products]
  );
  const customersMap = useMemo(
    () => new Map(customers.map((customer) => [customer.custId, customer.custName])),
    [customers]
  );

  const resolvedCustomerName =
    customersMap.get(customerName) || customerName || saleDetails?.customerName || "Walk-in Customer";
  const receiptNumber = useMemo(
    () => saleDetails?.receiptNumber || `RC-${Math.floor(10000 + Math.random() * 90000)}`,
    [saleDetails]
  );
  const handlePrint = () => {
    const printContent = previewRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "", "height=800,width=800");
    if (!printWindow) return;

    printWindow.document.write("<!DOCTYPE html><html><head><title>Print Receipt</title>");
    printWindow.document.write(`
      <style>
        body {
          margin: 0;
          background: #ffffff;
          font-family: Inter, "Segoe UI", sans-serif;
          color: #183023;
        }
        @media print {
          @page { size: ${receiptSize} auto; margin: 4mm; }
          body { width: ${receiptSize}; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .receipt-template-shell { width: 100% !important; max-width: 100% !important; box-shadow: none !important; border: 0 !important; border-radius: 0 !important; }
        }
      </style>
    `);
    printWindow.document.write("</head><body>");
    printWindow.document.write(printContent.outerHTML);
    printWindow.document.write(`
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            ${printerMode === "browser" ? "window.close();" : ""}
          }, 250);
        }
      </script>
    `);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
  };

  const generateAndDownloadPdf = () => {
    const paperWidth = receiptSize === "80mm" ? 80 : 58;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [paperWidth, 297] });
    const margin = 5;
    const rightAlign = paperWidth - margin;
    const center = paperWidth / 2;
    const subtotal = getSubtotal(cart);
    const discountAmount = getDiscountAmount(saleDetails);
    const taxAmount = getTaxAmount(saleDetails);
    let y = 12;

    if (receiptTemplate !== "modern") {
      const isCompact = receiptTemplate === "compact";
      const line = () => {
        doc.setDrawColor(20, 20, 20);
        doc.setLineWidth(0.2);
        doc.line(margin, y, rightAlign, y);
        y += isCompact ? 4 : 5;
      };
      const summaryLine = (label, value, strong = false) => {
        doc.setFont("Helvetica", strong ? "bold" : "normal");
        doc.setFontSize(strong ? 10 : 8);
        doc.text(label, margin, y);
        doc.text(value, rightAlign, y, { align: "right" });
        y += strong ? 7 : 5;
      };

      doc.setTextColor(15, 23, 42);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(isCompact ? 11 : 13);
      doc.text(companyInfo?.busName || "Business Name", center, y, { align: "center" });
      y += 6;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.text(companyInfo?.busLocation || "Business location not set", center, y, {
        align: "center",
        maxWidth: paperWidth - margin * 2,
      });
      y += 4;
      doc.text(companyInfo?.busContactOne || "No contact set", center, y, { align: "center" });
      y += 5;
      line();

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(isCompact ? 9 : 10);
      doc.text("SALES RECEIPT", center, y, { align: "center" });
      y += 6;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.text(`Receipt: ${receiptNumber}`, margin, y);
      doc.text(issuedAt, rightAlign, y, { align: "right", maxWidth: 34 });
      y += 5;
      doc.text(`Customer: ${resolvedCustomerName}`, margin, y, {
        maxWidth: paperWidth - margin * 2,
      });
      y += 5;
      doc.text(`Payment: ${saleDetails?.paymentMethod || "Cash"}`, margin, y);
      y += 5;
      doc.text(`Branch: ${saleDetails?.branchName || "Main branch"}`, margin, y, {
        maxWidth: paperWidth - margin * 2,
      });
      y += 5;
      doc.text(`Cashier: ${saleDetails?.cashierName || "Current user"}`, margin, y, {
        maxWidth: paperWidth - margin * 2,
      });
      y += 5;
      line();

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7);
      doc.text("ITEM", margin, y);
      doc.text("QTY", center, y, { align: "center" });
      doc.text("AMOUNT", rightAlign, y, { align: "right" });
      y += 4;
      line();

      cart.forEach((item) => {
        const name = item.itemName || productsMap.get(getItemId(item)) || `ID: ${getItemId(item)}`;
        const wrappedName = doc.splitTextToSize(name, paperWidth / 2 - 6);
        const itemTotal = getQty(item) * getPrice(item);

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7);
        doc.text(wrappedName, margin, y);
        doc.text(String(getQty(item)), center, y, { align: "center" });
        doc.text(formatAmount(itemTotal, currency), rightAlign, y, { align: "right" });
        y += wrappedName.length * 3.5 + 2;
        if (!isCompact) {
          doc.setFontSize(6);
          doc.text(`${formatAmount(getPrice(item), currency)} each`, margin, y);
          y += 4;
        }
      });

      line();
      summaryLine("Subtotal", formatAmount(subtotal, currency));
      summaryLine("Discount", `-${formatAmount(discountAmount, currency)}`);
      summaryLine("Tax", formatAmount(taxAmount, currency));
      line();
      summaryLine("Total", formatAmount(saleDetails?.total, currency), true);
      summaryLine("Tendered", formatAmount(saleDetails?.tenderedAmount, currency));
      summaryLine("Balance Due", formatAmount(saleDetails?.dueAmount, currency), true);
      line();
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.text(saleDetails?.moreInfo || "Generated from Ampla POS.", center, y, {
        align: "center",
        maxWidth: paperWidth - margin * 2,
      });
      y += 6;
      doc.setFont("Helvetica", "bold");
      doc.text("Thank you for your business.", center, y, { align: "center" });
      y += 5;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6);
      doc.text(POWERED_BY_TEXT, center, y, { align: "center" });

      doc.save(`receipt-${String(resolvedCustomerName).replace(/\s/g, "_")}-${Date.now()}.pdf`);
      return;
    }

    doc.setFillColor(247, 252, 248);
    doc.roundedRect(margin, 6, paperWidth - margin * 2, 28, 3, 3, "F");

    doc.setFillColor(228, 243, 232);
    doc.roundedRect(margin + 3, 10, 10, 10, 2, 2, "F");
    doc.setTextColor(47, 143, 87);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text((companyInfo?.busName || "A").charAt(0).toUpperCase(), margin + 8, 17, {
      align: "center",
    });

    doc.setTextColor(24, 48, 35);
    doc.setFontSize(12);
    doc.text(companyInfo?.busName || "Business Name", margin + 16, 15);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 128, 111);
    doc.text(companyInfo?.busLocation || "Business location not set", margin + 16, 20);
    doc.text(companyInfo?.busContactOne || "No contact set", margin + 16, 24);

    doc.setFont("Helvetica", "bold");
    doc.setTextColor(47, 143, 87);
    doc.roundedRect(rightAlign - 20, 10, 16, 6, 3, 3);
    doc.text(Number(saleDetails?.dueAmount || 0) > 0 ? "PART PAID" : "PAID", rightAlign - 12, 14.3, {
      align: "center",
    });

    y = 40;
    doc.setDrawColor(223, 233, 226);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, y, paperWidth - margin * 2, 34, 3, 3);

    const metaLeft = margin + 3;
    const metaRight = center + 2;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(111, 125, 140);
    doc.text("RECEIPT NO.", metaLeft, y + 5);
    doc.text("ISSUED", metaRight, y + 5);
    doc.text("CUSTOMER", metaLeft, y + 15);
    doc.text("PAYMENT", metaRight, y + 15);
    doc.text("BRANCH", metaLeft, y + 25);
    doc.text("CASHIER", metaRight, y + 25);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(24, 48, 35);
    doc.text(receiptNumber, metaLeft, y + 9);
    doc.text(issuedAt, metaRight, y + 9);
    doc.text(resolvedCustomerName, metaLeft, y + 19);
    doc.text(saleDetails?.paymentMethod || "Cash", metaRight, y + 19);
    doc.text(saleDetails?.branchName || "Main branch", metaLeft, y + 29, { maxWidth: 30 });
    doc.text(saleDetails?.cashierName || "Current user", metaRight, y + 29, { maxWidth: 28 });

    y += 41;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(47, 143, 87);
    doc.text("ITEMS", margin, y);
    y += 4;

    doc.setTextColor(111, 125, 140);
    doc.setFontSize(7);
    doc.text("PRODUCT", margin, y);
    doc.text("QTY", center, y, { align: "center" });
    doc.text("AMOUNT", rightAlign, y, { align: "right" });
    y += 2;
    doc.setDrawColor(216, 229, 220);
    doc.line(margin, y, rightAlign, y);
    y += 4;

    doc.setTextColor(24, 48, 35);
    cart.forEach((item) => {
      const name = item.itemName || productsMap.get(getItemId(item)) || `ID: ${getItemId(item)}`;
      const wrappedName = doc.splitTextToSize(name, paperWidth / 2 - 6);
      const itemTotal = getQty(item) * getPrice(item);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.text(wrappedName, margin, y);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(123, 142, 129);
      doc.text(`${formatAmount(getPrice(item), currency)} each`, margin, y + wrappedName.length * 3.4);
      doc.setTextColor(24, 48, 35);
      doc.setFont("Helvetica", "bold");
      doc.text(String(getQty(item)), center, y, { align: "center" });
      doc.text(formatAmount(itemTotal, currency), rightAlign, y, { align: "right" });

      y += wrappedName.length * 3.4 + 6;
      doc.setDrawColor(237, 242, 238);
      doc.line(margin, y - 2, rightAlign, y - 2);
    });

    doc.setDrawColor(223, 233, 226);
    doc.roundedRect(margin, y + 1, paperWidth - margin * 2, 28, 3, 3);
    y += 7;

    const drawSummaryLine = (label, value, options = {}) => {
      doc.setFont("Helvetica", options.bold ? "bold" : "normal");
      doc.setFontSize(options.size || 8);
      doc.setTextColor(options.color || 88, options.green || 112, options.blue || 98);
      doc.text(label, margin + 3, y);
      doc.text(value, rightAlign - 3, y, { align: "right" });
      y += options.spacing || 5;
    };

    drawSummaryLine("Subtotal", formatAmount(subtotal, currency));
    drawSummaryLine("Discount", `-${formatAmount(discountAmount, currency)}`);
    drawSummaryLine("Tax", formatAmount(taxAmount, currency));
    doc.setDrawColor(208, 223, 212);
    doc.line(margin + 3, y - 2, rightAlign - 3, y - 2);
    drawSummaryLine("Total", formatAmount(saleDetails?.total, currency), {
      bold: true,
      size: 10,
      color: 24,
      green: 48,
      blue: 35,
      spacing: 7,
    });

    doc.setFillColor(243, 250, 245);
    doc.roundedRect(margin, y + 1, paperWidth - margin * 2, 18, 3, 3, "F");
    y += 7;
    drawSummaryLine("Tendered", formatAmount(saleDetails?.tenderedAmount, currency));
    drawSummaryLine("Balance Due", formatAmount(saleDetails?.dueAmount, currency));

    y += 4;
    doc.setDrawColor(216, 229, 220);
    doc.line(margin, y, rightAlign, y);
    y += 6;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(115, 134, 121);
    doc.text(saleDetails?.moreInfo || "Generated from Ampla POS.", center, y, {
      align: "center",
      maxWidth: paperWidth - margin * 2,
    });
    y += 6;
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(24, 48, 35);
    doc.text("Thank you for your business.", center, y, { align: "center" });
    y += 5;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(115, 134, 121);
    doc.text(POWERED_BY_TEXT, center, y, { align: "center" });

    doc.save(`receipt-${String(resolvedCustomerName).replace(/\s/g, "_")}-${Date.now()}.pdf`);
  };

  return (
    <ReceiptPreviewModal
      ref={previewRef}
      show={show}
      onClose={onClose}
      onDownload={generateAndDownloadPdf}
      onPrint={handlePrint}
      cart={cart}
      saleDetails={saleDetails}
      companyInfo={companyInfo}
      customerName={resolvedCustomerName}
      receiptSize={receiptSize}
      onSizeChange={setReceiptSize}
      productsMap={productsMap}
      currency={currency}
      receiptNumber={receiptNumber}
      issuedAt={issuedAt}
      receiptTemplate={receiptTemplate}
    />
  );
}
