import React, { useEffect, useMemo, useRef, useState } from "react";
import { Container, Form, Spinner } from "react-bootstrap";
import {
  Calendar2Range,
  ChevronLeft,
  ChevronRight,
  Download,
  Files,
  Printer,
  Receipt,
  Search,
} from "react-bootstrap-icons";
import { useSelector } from "react-redux";
import jsPDF from "jspdf";

import { selectProfile } from "../../auth/authSlice";
import { useGetReceiptsQuery } from "../../features/api/salesSlice";
import {
  ReceiptDocumentView,
  formatAmount,
  getReceiptPaperWidth,
  receiptTemplateOptions,
} from "../receipts/AmplaReceipt";
import { useSettings } from "../Settings";
import "./WorkspacePages.css";

const todayIso = () => new Date().toISOString().slice(0, 10);
const POWERED_BY_TEXT = "Powered by HamuzahAndSteve Technologies";

const formatDateTime = (value) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeReceiptForPreview = (receipt = {}) => ({
  cart: receipt.items || [],
  customerName: receipt.customerName || "Walk-in Customer",
  saleDetails: {
    receiptNumber: receipt.receiptNumber || receipt.receiptId,
    branchName: receipt.branchName || "Main branch",
    cashierName: receipt.cashierName || (receipt.createdBy ? `User #${receipt.createdBy}` : "Current user"),
    paymentMethod: receipt.paymentMethod || "Cash",
    tenderedAmount: Number(receipt.tenderedAmount || 0),
    dueAmount: Number(receipt.dueAmount || 0),
    discountAmount: Number(receipt.discountAmount || 0),
    taxAmount: Number(receipt.taxAmount || 0),
    total: Number(receipt.total || 0),
    moreInfo: receipt.moreInfo || "Generated from Ampla POS.",
  },
});

const receiptTotal = (receipt) => Number(receipt?.total || 0);
const receiptPaid = (receipt) => Number(receipt?.tenderedAmount || 0);
const receiptDue = (receipt) => Number(receipt?.dueAmount || 0);

function drawReceiptPdfPage(doc, receipt, companyInfo, currency, receiptPaperWidth = "80mm", receiptTemplate = "modern") {
  const paperWidth = receiptPaperWidth === "58mm" ? 58 : 80;
  const margin = 5;
  const rightAlign = paperWidth - margin;
  const center = paperWidth / 2;
  const items = receipt.items || [];
  const subtotal = Number(receipt.subtotal || 0);
  const discount = Number(receipt.discountAmount || 0);
  const tax = Number(receipt.taxAmount || 0);
  let y = 10;

  const money = (value) => formatAmount(value, currency);

  if (receiptTemplate !== "modern") {
    const line = () => {
      doc.setDrawColor(31, 41, 55);
      doc.setLineWidth(0.2);
      doc.line(margin, y, rightAlign, y);
      y += 5;
    };
    const summaryLine = (label, value, strong = false) => {
      doc.setFont("Helvetica", strong ? "bold" : "normal");
      doc.setFontSize(strong ? 10 : 8);
      doc.setTextColor(17, 24, 39);
      doc.text(label, margin, y);
      doc.text(value, rightAlign, y, { align: "right" });
      y += strong ? 7 : 5;
    };

    doc.setTextColor(17, 24, 39);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(receiptTemplate === "compact" ? 11 : 13);
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
    doc.setFontSize(9);
    doc.text("SALES RECEIPT", center, y, { align: "center" });
    y += 6;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`Receipt: ${receipt.receiptNumber || receipt.receiptId || "N/A"}`, margin, y);
    doc.text(formatDateTime(receipt.issuedAt), rightAlign, y, { align: "right", maxWidth: 34 });
    y += 5;
    doc.text(`Customer: ${receipt.customerName || "Walk-in Customer"}`, margin, y, {
      maxWidth: paperWidth - margin * 2,
    });
    y += 5;
    doc.text(`Branch: ${receipt.branchName || "Main branch"}`, margin, y, {
      maxWidth: paperWidth - margin * 2,
    });
    y += 5;
    doc.text(`Cashier: ${receipt.cashierName || (receipt.createdBy ? `User #${receipt.createdBy}` : "Current user")}`, margin, y, {
      maxWidth: paperWidth - margin * 2,
    });
    y += 5;
    line();
    doc.setFont("Helvetica", "bold");
    doc.text("ITEM", margin, y);
    doc.text("QTY", center, y, { align: "center" });
    doc.text("AMOUNT", rightAlign, y, { align: "right" });
    y += 4;
    line();

    items.forEach((item) => {
      const name = item.itemName || `Item #${item.saleItemId || ""}`;
      const quantity = Number(item.saleQuantity || 0);
      const price = Number(item.salePrice || 0);
      const wrappedName = doc.splitTextToSize(name, paperWidth / 2 - 6);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.text(wrappedName, margin, y);
      doc.text(String(quantity), center, y, { align: "center" });
      doc.text(money(quantity * price), rightAlign, y, { align: "right" });
      y += wrappedName.length * 3.5 + 2;
      if (receiptTemplate !== "compact") {
        doc.setFontSize(6);
        doc.text(`${money(price)} each`, margin, y);
        y += 4;
      }
    });

    line();
    summaryLine("Subtotal", money(subtotal));
    summaryLine("Discount", `-${money(discount)}`);
    summaryLine("Tax", money(tax));
    line();
    summaryLine("Total", money(receiptTotal(receipt)), true);
    summaryLine("Tendered", money(receiptPaid(receipt)));
    summaryLine("Balance Due", money(receiptDue(receipt)), true);
    line();
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7);
    doc.text(receipt.moreInfo || "Generated from Ampla POS.", center, y, {
      align: "center",
      maxWidth: paperWidth - margin * 2,
    });
    y += 7;
    doc.setFont("Helvetica", "bold");
    doc.text("Thank you for your business.", center, y, { align: "center" });
    y += 5;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(6);
    doc.text(POWERED_BY_TEXT, center, y, { align: "center" });
    return;
  }

  doc.setFillColor(247, 252, 248);
  doc.roundedRect(margin, 5, paperWidth - margin * 2, 28, 3, 3, "F");

  doc.setFillColor(228, 243, 232);
  doc.roundedRect(margin + 3, 9, 10, 10, 2, 2, "F");
  doc.setTextColor(47, 143, 87);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.text((companyInfo?.busName || "A").charAt(0).toUpperCase(), margin + 8, 16, {
    align: "center",
  });

  doc.setTextColor(24, 48, 35);
  doc.setFontSize(11);
  doc.text(companyInfo?.busName || "Business Name", margin + 16, 14);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 128, 111);
  doc.text(companyInfo?.busLocation || "Business location not set", margin + 16, 19);
  doc.text(companyInfo?.busContactOne || "No contact set", margin + 16, 23);

  doc.setFont("Helvetica", "bold");
  doc.setTextColor(47, 143, 87);
  doc.roundedRect(rightAlign - 22, 9, 18, 6, 3, 3);
  doc.text(receiptDue(receipt) > 0 ? "PART PAID" : "PAID", rightAlign - 13, 13.3, {
    align: "center",
  });

  y = 39;
  doc.setDrawColor(223, 233, 226);
  doc.roundedRect(margin, y, paperWidth - margin * 2, 35, 3, 3);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(111, 125, 140);
  doc.text("RECEIPT NO.", margin + 3, y + 5);
  doc.text("ISSUED", center + 2, y + 5);
  doc.text("CUSTOMER", margin + 3, y + 16);
  doc.text("PAYMENT", center + 2, y + 16);
  doc.text("BRANCH", margin + 3, y + 27);
  doc.text("CASHIER", center + 2, y + 27);

  doc.setFontSize(8);
  doc.setTextColor(24, 48, 35);
  doc.text(String(receipt.receiptNumber || receipt.receiptId || "N/A"), margin + 3, y + 9);
  doc.text(formatDateTime(receipt.issuedAt), center + 2, y + 9, { maxWidth: 30 });
  doc.text(receipt.customerName || "Walk-in Customer", margin + 3, y + 20, { maxWidth: 32 });
  doc.text(receipt.paymentMethod || "Cash", center + 2, y + 20, { maxWidth: 28 });
  doc.text(receipt.branchName || "Main branch", margin + 3, y + 31, { maxWidth: 32 });
  doc.text(receipt.cashierName || (receipt.createdBy ? `User #${receipt.createdBy}` : "Current user"), center + 2, y + 31, { maxWidth: 28 });

  y += 42;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(47, 143, 87);
  doc.text("ITEMS", margin, y);
  y += 5;

  doc.setTextColor(111, 125, 140);
  doc.text("PRODUCT", margin, y);
  doc.text("QTY", center, y, { align: "center" });
  doc.text("AMOUNT", rightAlign, y, { align: "right" });
  y += 2;
  doc.setDrawColor(216, 229, 220);
  doc.line(margin, y, rightAlign, y);
  y += 4;

  items.forEach((item) => {
    const name = item.itemName || `Item #${item.saleItemId || ""}`;
    const quantity = Number(item.saleQuantity || 0);
    const price = Number(item.salePrice || 0);
    const wrappedName = doc.splitTextToSize(name, 34);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(24, 48, 35);
    doc.text(wrappedName, margin, y);
    doc.text(String(quantity), center, y, { align: "center" });
    doc.text(money(quantity * price), rightAlign, y, { align: "right" });

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(123, 142, 129);
    doc.text(`${money(price)} each`, margin, y + wrappedName.length * 3.4);

    y += wrappedName.length * 3.4 + 6;
    doc.setDrawColor(237, 242, 238);
    doc.line(margin, y - 2, rightAlign, y - 2);
  });

  const summaryLine = (label, value, strong = false) => {
    doc.setFont("Helvetica", strong ? "bold" : "normal");
    doc.setFontSize(strong ? 10 : 8);
    doc.setTextColor(strong ? 24 : 88, strong ? 48 : 112, strong ? 35 : 98);
    doc.text(label, margin + 3, y);
    doc.text(value, rightAlign - 3, y, { align: "right" });
    y += strong ? 7 : 5;
  };

  doc.setDrawColor(223, 233, 226);
  doc.roundedRect(margin, y + 1, paperWidth - margin * 2, 28, 3, 3);
  y += 7;
  summaryLine("Subtotal", money(subtotal));
  summaryLine("Discount", `-${money(discount)}`);
  summaryLine("Tax", money(tax));
  doc.setDrawColor(208, 223, 212);
  doc.line(margin + 3, y - 2, rightAlign - 3, y - 2);
  summaryLine("Total", money(receiptTotal(receipt)), true);

  doc.setFillColor(243, 250, 245);
  doc.roundedRect(margin, y + 1, paperWidth - margin * 2, 18, 3, 3, "F");
  y += 7;
  summaryLine("Tendered", money(receiptPaid(receipt)));
  summaryLine("Balance Due", money(receiptDue(receipt)));

  y += 5;
  doc.setDrawColor(216, 229, 220);
  doc.line(margin, y, rightAlign, y);
  y += 6;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(115, 134, 121);
  doc.text(receipt.moreInfo || "Generated from Ampla POS.", center, y, {
    align: "center",
    maxWidth: paperWidth - margin * 2,
  });
  y += 7;
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(24, 48, 35);
  doc.text("Thank you for your business.", center, y, { align: "center" });
  y += 5;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(115, 134, 121);
  doc.text(POWERED_BY_TEXT, center, y, { align: "center" });
}

function exportReceiptsAsPdf(receipts, companyInfo, currency, filename, receiptPaperWidth = "80mm", receiptTemplate = "modern") {
  if (!receipts.length) return;

  const paperWidth = receiptPaperWidth === "58mm" ? 58 : 80;
  const pageHeight = (receipt) => Math.max(185, 118 + (receipt.items?.length || 0) * 13);
  const firstHeight = pageHeight(receipts[0]);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [paperWidth, firstHeight] });

  receipts.forEach((receipt, index) => {
    if (index > 0) {
      doc.addPage([paperWidth, pageHeight(receipt)], "portrait");
    }
    drawReceiptPdfPage(doc, receipt, companyInfo, currency, receiptPaperWidth, receiptTemplate);
  });

  doc.save(filename);
}

function MetricCard({ icon, title, value, note }) {
  return (
    <div className="workspace-metric-card">
      <div className="workspace-metric-icon">{icon}</div>
      <div className="workspace-metric-body">
        <div className="workspace-metric-title">{title}</div>
        <div className="workspace-metric-value">{value}</div>
        <div className="workspace-metric-note">{note}</div>
      </div>
    </div>
  );
}

const Documents = () => {
  const companyProfile = useSelector(selectProfile) || {};
  const { settings } = useSettings();
  const currency = settings?.currency && settings.currency !== "none" ? settings.currency : "UGX";
  const receiptPaperWidth = getReceiptPaperWidth(settings?.receiptPaperWidth);
  const receiptTemplate =
    settings?.receiptTemplate in receiptTemplateOptions ? settings.receiptTemplate : "modern";
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const previewRef = useRef(null);

  const { data: receipts = [], isLoading, isFetching, isError } = useGetReceiptsQuery({
    dateFrom,
    dateTo,
  });

  const filteredReceipts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return receipts;

    return receipts.filter((receipt) => {
      const haystack = [
        receipt.receiptNumber,
        receipt.receiptId,
        receipt.customerName,
        receipt.customerContact,
        receipt.branchName,
        receipt.paymentMethod,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [receipts, search]);

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedIds([]);
  }, [dateFrom, dateTo, search]);

  useEffect(() => {
    if (currentIndex > filteredReceipts.length - 1) {
      setCurrentIndex(Math.max(filteredReceipts.length - 1, 0));
    }
  }, [currentIndex, filteredReceipts.length]);

  const currentReceipt = filteredReceipts[currentIndex] || null;
  const currentPreview = normalizeReceiptForPreview(currentReceipt || {});
  const selectedReceipts = filteredReceipts.filter((receipt) =>
    selectedIds.includes(Number(receipt.receiptId))
  );

  const totals = useMemo(
    () => ({
      count: filteredReceipts.length,
      paid: filteredReceipts.reduce((sum, receipt) => sum + receiptPaid(receipt), 0),
      due: filteredReceipts.reduce((sum, receipt) => sum + receiptDue(receipt), 0),
      gross: filteredReceipts.reduce((sum, receipt) => sum + receiptTotal(receipt), 0),
    }),
    [filteredReceipts]
  );

  const goPrevious = () => {
    if (!filteredReceipts.length) return;
    setCurrentIndex((index) => (index === 0 ? filteredReceipts.length - 1 : index - 1));
  };

  const goNext = () => {
    if (!filteredReceipts.length) return;
    setCurrentIndex((index) => (index + 1 >= filteredReceipts.length ? 0 : index + 1));
  };

  const toggleSelected = (receiptId) => {
    const id = Number(receiptId);
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
  };

  const toggleAllVisible = () => {
    if (selectedIds.length === filteredReceipts.length) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(filteredReceipts.map((receipt) => Number(receipt.receiptId)));
  };

  const handlePrint = () => {
    if (!previewRef.current) return;

    const printWindow = window.open("", "", "height=800,width=800");
    if (!printWindow) return;

    printWindow.document.write("<!DOCTYPE html><html><head><title>Print Receipt</title>");
    printWindow.document.write(`
      <style>
        body { margin: 0; background: #ffffff; font-family: Inter, "Segoe UI", sans-serif; color: #183023; }
        @media print {
          @page { size: ${receiptPaperWidth} auto; margin: 4mm; }
          body { width: ${receiptPaperWidth}; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .receipt-template-shell { width: 100% !important; max-width: 100% !important; box-shadow: none !important; border: 0 !important; border-radius: 0 !important; }
        }
      </style>
    `);
    printWindow.document.write("</head><body>");
    printWindow.document.write(previewRef.current.outerHTML);
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

  const exportCurrent = () => {
    if (!currentReceipt) return;
    exportReceiptsAsPdf(
      [currentReceipt],
      companyProfile,
      currency,
      `receipt-${currentReceipt.receiptNumber || currentReceipt.receiptId}.pdf`,
      receiptPaperWidth,
      receiptTemplate
    );
  };

  const exportSelected = () => {
    const targets = selectedReceipts.length ? selectedReceipts : filteredReceipts;
    exportReceiptsAsPdf(
      targets,
      companyProfile,
      currency,
      `receipts-${todayIso()}.pdf`,
      receiptPaperWidth,
      receiptTemplate
    );
  };

  return (
    <Container fluid className="workspace-page-shell documents-receipts-page">
      <div className="workspace-page-stack">
        <header className="workspace-page-hero">
          <div>
            <h2 className="workspace-page-title">Receipt Workspace</h2>
            <p className="workspace-page-subtitle">
              Browse POS receipts, filter by date, preview the exact receipt shape, and export one or many as PDF.
            </p>
          </div>
        </header>

        <div className="workspace-metric-grid">
          <MetricCard
            icon={<Receipt size={18} />}
            title="Receipts"
            value={totals.count}
            note="Receipts in the current filter"
          />
          <MetricCard
            icon={<Printer size={18} />}
            title="Sales Value"
            value={formatAmount(totals.gross, currency)}
            note="Receipt totals after discount"
          />
          <MetricCard
            icon={<Download size={18} />}
            title="Paid"
            value={formatAmount(totals.paid, currency)}
            note="Tendered amount recorded"
          />
          <MetricCard
            icon={<Files size={18} />}
            title="Balance Due"
            value={formatAmount(totals.due, currency)}
            note="Outstanding receipt balances"
          />
        </div>

        <section className="documents-receipt-workbench">
          <div className="documents-filter-bar">
            <label className="documents-filter-field">
              <span>
                <Calendar2Range size={15} /> From
              </span>
              <Form.Control
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </label>
            <label className="documents-filter-field">
              <span>
                <Calendar2Range size={15} /> To
              </span>
              <Form.Control
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </label>
            <label className="documents-filter-field documents-search-field">
              <span>
                <Search size={15} /> Search
              </span>
              <Form.Control
                type="search"
                value={search}
                placeholder="Receipt, customer, branch, payment"
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <button className="documents-secondary-button" onClick={() => { setDateFrom(""); setDateTo(""); setSearch(""); }}>
              Clear
            </button>
          </div>

          <div className="documents-book-layout">
            <aside className="documents-book-index">
              <div className="documents-book-index-header">
                <div>
                  <strong>Receipt Pages</strong>
                  <span>{isFetching ? "Refreshing..." : `${filteredReceipts.length} shown`}</span>
                </div>
                <button
                  className="documents-link-button"
                  onClick={toggleAllVisible}
                  disabled={!filteredReceipts.length}
                >
                  {selectedIds.length === filteredReceipts.length ? "Clear" : "Select all"}
                </button>
              </div>

              <div className="documents-receipt-list">
                {isLoading ? (
                  <div className="documents-empty-state">
                    <Spinner animation="border" size="sm" />
                    Loading receipts
                  </div>
                ) : isError ? (
                  <div className="documents-empty-state">Could not load receipts.</div>
                ) : filteredReceipts.length === 0 ? (
                  <div className="documents-empty-state">No receipts match this filter.</div>
                ) : (
                  filteredReceipts.map((receipt, index) => {
                    const selected = selectedIds.includes(Number(receipt.receiptId));
                    const active = index === currentIndex;

                    return (
                      <button
                        key={receipt.receiptId}
                        type="button"
                        className={`documents-receipt-page-tab${active ? " active" : ""}`}
                        onClick={() => setCurrentIndex(index)}
                      >
                        <span
                          className={`documents-selection-box${selected ? " selected" : ""}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleSelected(receipt.receiptId);
                          }}
                        />
                        <span className="documents-receipt-page-copy">
                          <strong>Receipt #{receipt.receiptNumber || receipt.receiptId}</strong>
                          <span>{receipt.customerName || "Walk-in Customer"}</span>
                          <small>{formatDateTime(receipt.issuedAt)}</small>
                        </span>
                        <span className="documents-receipt-page-total">
                          {formatAmount(receiptTotal(receipt), currency)}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            <main className="documents-book-reader">
              <div className="documents-book-toolbar">
                <button className="documents-icon-button" onClick={goPrevious} disabled={!filteredReceipts.length}>
                  <ChevronLeft size={18} />
                </button>
                <div className="documents-counter-chip">
                  {filteredReceipts.length ? currentIndex + 1 : 0}/{filteredReceipts.length}
                </div>
                <button className="documents-icon-button" onClick={goNext} disabled={!filteredReceipts.length}>
                  <ChevronRight size={18} />
                </button>

                <div className="documents-toolbar-spacer" />

                <button className="documents-secondary-button" onClick={handlePrint} disabled={!currentReceipt}>
                  <Printer size={16} />
                  Print
                </button>
                <button className="documents-secondary-button" onClick={exportCurrent} disabled={!currentReceipt}>
                  <Download size={16} />
                  Export one
                </button>
                <button className="documents-primary-button" onClick={exportSelected} disabled={!filteredReceipts.length}>
                  <Files size={16} />
                  Export {selectedReceipts.length ? selectedReceipts.length : "all"}
                </button>
              </div>

              {currentReceipt ? (
                <>
                  <div className="documents-current-meta">
                    <div>
                      <span>Branch</span>
                      <strong>{currentReceipt.branchName || "Not recorded"}</strong>
                    </div>
                    <div>
                      <span>Cashier</span>
                      <strong>
                        {currentReceipt.cashierName ||
                          (currentReceipt.createdBy ? `User #${currentReceipt.createdBy}` : "Not recorded")}
                      </strong>
                    </div>
                    <div>
                      <span>Lines</span>
                      <strong>{currentReceipt.lineCount || currentReceipt.items?.length || 0}</strong>
                    </div>
                    <div>
                      <span>Status</span>
                      <strong>{receiptDue(currentReceipt) > 0 ? "Part paid" : "Paid"}</strong>
                    </div>
                  </div>

                  <div className="documents-receipt-preview-stage">
                    <ReceiptDocumentView
                      ref={previewRef}
                      companyInfo={companyProfile}
                      customerName={currentPreview.customerName}
                      cart={currentPreview.cart}
                      saleDetails={currentPreview.saleDetails}
                      currency={currency}
                      receiptNumber={currentPreview.saleDetails.receiptNumber}
                      issuedAt={formatDateTime(currentReceipt.issuedAt)}
                      receiptSize={receiptPaperWidth}
                      receiptTemplate={receiptTemplate}
                    />
                  </div>
                </>
              ) : (
                <div className="documents-reader-empty">
                  <Receipt size={28} />
                  <strong>No receipt selected</strong>
                  <span>Adjust the date range or search to find receipts.</span>
                </div>
              )}
            </main>
          </div>
        </section>
      </div>
    </Container>
  );
};

export default Documents;
