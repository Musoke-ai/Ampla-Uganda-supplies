import React, { useEffect, useMemo, useState } from "react";
import { Add, Cancel, Delete, SkipNext, SkipPrevious } from "@mui/icons-material";
import { Avatar } from "@mui/material";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { Download, FileEarmarkText, Printer, Send } from "react-bootstrap-icons";
import { useSelector } from "react-redux";

import SalesReceipt from "./components/SalesReceipt";
import NewDocModal from "./components/NewDocModal";
import NewDocumentForm from "./components/NewDocumentForm";
import Receipt from "./templates/Receipt";
import { selectSales, useCancelSalesMutation } from "../features/api/salesSlice";
import { selectProfile } from "../auth/authSlice";
import "../Components/pages/WorkspacePages.css";

const palette = {
  border: "#e7efe9",
  text: "#15202b",
  muted: "#6f7d8c",
  green: "#2f8f57",
};

const toolbarButtonStyle = {
  minHeight: 44,
  padding: "0.65rem 1.1rem",
  borderRadius: 16,
  border: `1px solid ${palette.border}`,
  backgroundColor: "#ffffff",
  color: palette.text,
  fontWeight: 700,
  boxShadow: "none",
};

const Invoice = () => {
  const businessInfo = useSelector(selectProfile);
  const sales = useSelector(selectSales) ?? [];

  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [modalShow, setModalShow] = useState(false);
  const [showNewDocModal, setshowNewDocModal] = useState(false);

  const [cancelSales, { isLoading, isSuccess }] = useCancelSalesMutation();

  const receiptNumbers = useMemo(
    () =>
      [...new Set(sales.map((sale) => Number(sale.SR_ID)).filter((value) => value !== 0))].sort(
        (a, b) => b - a
      ),
    [sales]
  );

  const [index, setIndex] = useState(0);
  const receiptNo = receiptNumbers[index];
  const [receipt, setReceipt] = useState(
    sales.filter((entry) => Number(entry?.SR_ID) === Number(receiptNo))
  );

  useEffect(() => {
    if (!receiptNumbers.length) {
      setReceipt([]);
      return;
    }

    const normalizedIndex = Math.min(index, Math.max(receiptNumbers.length - 1, 0));
    if (normalizedIndex !== index) {
      setIndex(normalizedIndex);
      return;
    }

    const currentReceiptNo = receiptNumbers[normalizedIndex];
    setReceipt(sales.filter((entry) => Number(entry?.SR_ID) === Number(currentReceiptNo)));
  }, [index, receiptNumbers, sales]);

  const handlePrev = () => {
    if (!receiptNumbers.length) return;
    setIndex((currentIndex) =>
      currentIndex - 1 < 0 ? receiptNumbers.length - 1 : currentIndex - 1
    );
  };

  const handleNext = () => {
    if (!receiptNumbers.length) return;
    setIndex((currentIndex) =>
      currentIndex + 1 >= receiptNumbers.length ? 0 : currentIndex + 1
    );
  };

  const handleCancelSales = async () => {
    if (!receiptNo) return;
    try {
      await cancelSales({ SR_ID: receiptNo }).unwrap();
      setShowDeleteAlert(false);
    } catch (error) {
      // keep existing silent failure behavior
    }
  };

  return (
    <div className="documents-workspace">
      <div className="documents-toolbar-card">
        <div className="documents-toolbar-copy">
          <h3 className="workspace-section-title">Receipt Preview</h3>
          <p className="workspace-section-copy">
            Browse through saved receipts, preview the printable output, or start a new document flow.
          </p>
        </div>

        <div className="documents-toolbar-actions">
          <Button variant="light" onClick={() => setModalShow(true)} style={toolbarButtonStyle}>
            <Add className="me-2" />
            New Document
          </Button>

          <Button
            variant="light"
            onClick={() => setShowDeleteAlert(true)}
            style={{ ...toolbarButtonStyle, color: "#c73636" }}
            disabled={!receiptNo}
          >
            <Cancel className="me-2" />
            Cancel Receipt
          </Button>
        </div>
      </div>

      <div className="documents-receipt-shell">
        <div className="documents-receipt-header">
          <div className="documents-receipt-tabs">
            <span className="documents-tab documents-tab-active">Receipt</span>
            <span className="documents-tab">Invoice</span>
          </div>

          <div className="documents-receipt-controls">
            <button className="documents-icon-button" onClick={handlePrev} disabled={!receiptNumbers.length}>
              <SkipPrevious />
            </button>
            <div className="documents-counter-chip">
              {receiptNumbers.length ? index + 1 : 0}/{receiptNumbers.length}
            </div>
            <button className="documents-icon-button" onClick={handleNext} disabled={!receiptNumbers.length}>
              <SkipNext />
            </button>

            <div className="documents-divider" />

            <button className="documents-icon-button" disabled>
              <Avatar className="bg-white shadow-sm" sx={{ width: 38, height: 38 }}>
                <Send className="text-dark" fontSize="small" />
              </Avatar>
            </button>

            <Receipt
              businessInfo={businessInfo}
              receiptItems={receipt}
              receiptNumber={receiptNo}
            />
          </div>
        </div>

        <div className="documents-receipt-meta">
          <div className="documents-receipt-meta-item">
            <FileEarmarkText className="me-2" />
            <span>Receipt No:</span>
            <strong>{receiptNo || "N/A"}</strong>
          </div>
          <div className="documents-receipt-meta-item">
            <Download className="me-2" />
            <span>Items:</span>
            <strong>{receipt.length}</strong>
          </div>
          <div className="documents-receipt-meta-item">
            <Printer className="me-2" />
            <span>Status:</span>
            <strong>{receipt.length ? "Ready" : "No receipt selected"}</strong>
          </div>
        </div>

        <div className="documents-preview-card">
          <SalesReceipt receiptNo={receiptNo} receipt={receipt} />
        </div>
      </div>

      <NewDocModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        setshowNewDocModal={setshowNewDocModal}
      />
      <NewDocumentForm
        setshowNewDocModal={setshowNewDocModal}
        showNewDocModal={showNewDocModal}
      />

      <Modal show={showDeleteAlert} onHide={() => setShowDeleteAlert(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Warning</Modal.Title>
        </Modal.Header>
        <Modal.Body className="fw-bold">
          Receipt information and sales will be deleted permanently.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteAlert(false)}>
            Close
          </Button>
          {isLoading ? (
            <div>Deleting...</div>
          ) : (
            <Button variant="danger" onClick={handleCancelSales} disabled={!receiptNo}>
              Delete
            </Button>
          )}
          {isSuccess ? <div>Receipt Deleted</div> : ""}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Invoice;
