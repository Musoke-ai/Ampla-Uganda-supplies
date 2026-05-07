import React, { useMemo, useRef, forwardRef } from "react";
import { useSelector } from "react-redux";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Modal, Button, Form } from "react-bootstrap";

import { selectStock } from "../../features/stock/stockSlice";
import { selectCustomers } from "../../features/api/customers";
import { useSettings } from "../Settings";

const getQty = (item) => Number(item?.saleQuantity ?? item?.itemQuantity ?? item?.qty ?? 0);
const getPrice = (item) => Number(item?.salePrice ?? item?.price ?? 0);
const getItemId = (item) => item?.saleItemId ?? item?.itemId ?? item?.id;
const getDiscountAmount = (saleDetails = {}) =>
  Number(saleDetails.discountAmount ?? saleDetails.discount ?? 0);
const getTaxAmount = (saleDetails = {}) => Number(saleDetails.taxAmount ?? saleDetails.tax ?? 0);
const getSubtotal = (cart = []) => cart.reduce((acc, item) => acc + getQty(item) * getPrice(item), 0);
const formatAmount = (value, currency = "UGX") =>
  `${currency} ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const receiptStyles = {
  shell: {
    width: "100%",
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    color: "#183023",
    background: "#ffffff",
    borderRadius: "20px",
    border: "1px solid #dfe9e2",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
  },
  hero: {
    padding: "20px 18px 16px",
    background:
      "radial-gradient(circle at top right, rgba(47, 143, 87, 0.18), transparent 34%), linear-gradient(180deg, #f7fcf8 0%, #ffffff 100%)",
    borderBottom: "1px solid #e7efe9",
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "12px",
  },
  brandBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    background: "#e4f3e8",
    color: "#2f8f57",
    fontWeight: 800,
    fontSize: "15px",
    letterSpacing: "0.06em",
  },
  paidChip: {
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#e7f5ec",
    color: "#2f8f57",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  title: {
    fontSize: "20px",
    fontWeight: 800,
    letterSpacing: "-0.03em",
    margin: 0,
  },
  subtitle: {
    fontSize: "12px",
    color: "#64806f",
    margin: "4px 0 0",
    lineHeight: 1.5,
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
    padding: "16px 18px",
    borderBottom: "1px solid #edf2ee",
    background: "#fbfefc",
  },
  metaCard: {
    border: "1px solid #e7efe9",
    borderRadius: "14px",
    padding: "10px 12px",
    background: "#ffffff",
  },
  metaLabel: {
    fontSize: "10px",
    color: "#6f7d8c",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: "4px",
  },
  metaValue: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#183023",
    lineHeight: 1.4,
  },
  section: {
    padding: "18px",
  },
  sectionTitle: {
    fontSize: "11px",
    color: "#2f8f57",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: "10px",
  },
  lineItemHeader: {
    display: "grid",
    gridTemplateColumns: "1.8fr 0.6fr 1fr",
    gap: "10px",
    fontSize: "11px",
    fontWeight: 800,
    color: "#6f7d8c",
    paddingBottom: "8px",
    borderBottom: "1px dashed #d8e5dc",
  },
  lineItem: {
    display: "grid",
    gridTemplateColumns: "1.8fr 0.6fr 1fr",
    gap: "10px",
    alignItems: "start",
    padding: "12px 0",
    borderBottom: "1px solid #edf2ee",
  },
  itemName: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#183023",
    lineHeight: 1.35,
  },
  itemMeta: {
    fontSize: "11px",
    color: "#7b8e81",
    marginTop: "3px",
  },
  alignCenter: {
    textAlign: "center",
    fontSize: "13px",
    fontWeight: 700,
  },
  alignRight: {
    textAlign: "right",
    fontSize: "13px",
    fontWeight: 700,
  },
  summaryBox: {
    marginTop: "16px",
    borderRadius: "18px",
    border: "1px solid #dfe9e2",
    background: "#fbfefc",
    padding: "14px 14px 8px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "10px",
    fontSize: "13px",
    color: "#587062",
  },
  summaryValue: {
    fontWeight: 700,
    color: "#183023",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px dashed #d0dfd4",
    fontSize: "18px",
    fontWeight: 800,
    color: "#183023",
  },
  paymentBox: {
    display: "grid",
    gap: "10px",
    marginTop: "16px",
    padding: "14px",
    borderRadius: "18px",
    background: "#f3faf5",
    border: "1px solid #dfeee4",
  },
  footer: {
    padding: "0 18px 18px",
    textAlign: "center",
  },
  footerNote: {
    borderTop: "1px dashed #d8e5dc",
    paddingTop: "14px",
    fontSize: "11px",
    color: "#738679",
    lineHeight: 1.6,
  },
  footerThanks: {
    fontSize: "13px",
    fontWeight: 800,
    color: "#183023",
    marginTop: "8px",
  },
};

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
  } = props;

  if (!show) return null;

  const subtotal = getSubtotal(cart);
  const paymentStatus = Number(saleDetails?.dueAmount || 0) > 0 ? "Part Paid" : "Paid";

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
          className="receipt-template-shell mx-auto"
          style={{
            ...receiptStyles.shell,
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
              {companyInfo?.busContactTwo ? ` · ${companyInfo.busContactTwo}` : ""}
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
  const [receiptSize, setReceiptSize] = React.useState("80mm");
  const previewRef = useRef();
  const { settings } = useSettings();
  const currency = settings?.currency && settings.currency !== "none" ? settings.currency : "UGX";

  const products = useSelector(selectStock) ?? [];
  const customers = useSelector(selectCustomers) ?? [];

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
  const issuedAt = useMemo(() => new Date().toLocaleString(), [show]);

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
          setTimeout(function() { window.print(); window.close(); }, 250);
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
    doc.roundedRect(margin, y, paperWidth - margin * 2, 24, 3, 3);

    const metaLeft = margin + 3;
    const metaRight = center + 2;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(111, 125, 140);
    doc.text("RECEIPT NO.", metaLeft, y + 5);
    doc.text("ISSUED", metaRight, y + 5);
    doc.text("CUSTOMER", metaLeft, y + 15);
    doc.text("PAYMENT", metaRight, y + 15);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(24, 48, 35);
    doc.text(receiptNumber, metaLeft, y + 9);
    doc.text(issuedAt, metaRight, y + 9);
    doc.text(resolvedCustomerName, metaLeft, y + 19);
    doc.text(saleDetails?.paymentMethod || "Cash", metaRight, y + 19);

    y += 31;
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
    />
  );
}
