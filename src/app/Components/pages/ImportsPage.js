import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { useSelector } from "react-redux";
import {
  CheckCircleFill,
  CloudArrowUp,
  Download,
  ExclamationTriangleFill,
  FileEarmarkSpreadsheet,
  PencilSquare,
  Search,
  Sliders,
  XCircleFill,
} from "react-bootstrap-icons";
import {
  useConfirmImportBatchMutation,
  useGetImportHistoryQuery,
  useUploadImportBatchMutation,
  useUpdateImportRowMutation,
  useValidateImportBatchMutation,
} from "../../features/api/importSlice";
import { selectBranchScope } from "../../auth/authSlice";
import "./WorkspacePages.css";

const importTypes = {
  products: {
    label: "Products",
    description: "Create or update catalog products with opening quantities, prices, categories, and suppliers.",
    fields: [
      { key: "name", label: "Product Name", required: true, aliases: ["product", "product name", "item", "item name", "name"] },
      { key: "category", label: "Category", aliases: ["category", "product category"] },
      { key: "sku", label: "SKU", aliases: ["sku", "item sku", "code"] },
      { key: "barcode", label: "Barcode", aliases: ["barcode", "bar code"] },
      { key: "brand", label: "Brand", aliases: ["brand"] },
      { key: "model", label: "Model", aliases: ["model", "item model"] },
      { key: "unit", label: "Unit", aliases: ["unit", "uom"] },
      { key: "supplier", label: "Supplier", aliases: ["supplier", "vendor"] },
      { key: "quantity", label: "Opening Quantity", aliases: ["quantity", "qty", "opening stock", "stock"] },
      { key: "costPrice", label: "Cost Price", aliases: ["cost", "cost price", "buying price", "purchase price"] },
      { key: "sellingPrice", label: "Selling Price", aliases: ["selling price", "sale price", "retail price", "price"] },
      { key: "wholesalePrice", label: "Wholesale Price", aliases: ["wholesale", "wholesale price"] },
      { key: "reorderLevel", label: "Reorder Level", aliases: ["reorder", "reorder level", "minimum stock"] },
      { key: "condition", label: "Condition", aliases: ["condition"] },
      { key: "quality", label: "Quality", aliases: ["quality"] },
      { key: "size", label: "Size", aliases: ["size"] },
      { key: "notes", label: "Notes", aliases: ["notes", "description"] },
    ],
    template: [
      {
        "Product Name": "Cement 50kg",
        Category: "Building Materials",
        SKU: "CEM-50",
        Barcode: "",
        Brand: "Tororo",
        Model: "Generic",
        Unit: "bag",
        Supplier: "Main Supplier",
        "Opening Quantity": 100,
        "Cost Price": 28000,
        "Selling Price": 32000,
        "Wholesale Price": 30000,
        "Reorder Level": 20,
        Condition: "New",
        Quality: "Original",
        Size: "50kg",
        Notes: "Opening import",
      },
    ],
  },
  customers: {
    label: "Customers",
    description: "Create or update customer profiles for sales, credit tracking, receipts, and follow-up.",
    fields: [
      { key: "name", label: "Customer Name", required: true, aliases: ["customer", "customer name", "name"] },
      { key: "phone", label: "Phone", aliases: ["phone", "contact", "telephone", "mobile"] },
      { key: "email", label: "Email", aliases: ["email", "customer email"] },
      { key: "location", label: "Location", aliases: ["location", "address", "area"] },
    ],
    template: [
      {
        "Customer Name": "Acme Hardware",
        Phone: "0750000000",
        Email: "customer@example.com",
        Location: "Kampala",
      },
    ],
  },
  stock: {
    label: "Stock Intake",
    description: "Add stock quantities to existing products using product name, SKU, or barcode.",
    fields: [
      { key: "productName", label: "Product Name", aliases: ["product", "product name", "item", "item name", "name"] },
      { key: "sku", label: "SKU", aliases: ["sku", "item sku", "code"] },
      { key: "barcode", label: "Barcode", aliases: ["barcode", "bar code"] },
      { key: "quantity", label: "Quantity In", required: true, aliases: ["quantity", "qty", "quantity in", "stock in"] },
      { key: "costPrice", label: "Cost Price", aliases: ["cost", "cost price", "buying price", "purchase price"] },
      { key: "sellingPrice", label: "Selling Price", aliases: ["selling price", "sale price", "retail price"] },
      { key: "supplier", label: "Supplier", aliases: ["supplier", "vendor"] },
    ],
    template: [
      {
        "Product Name": "Cement 50kg",
        SKU: "CEM-50",
        Barcode: "",
        "Quantity In": 40,
        "Cost Price": 28000,
        "Selling Price": 32000,
        Supplier: "Main Supplier",
      },
    ],
  },
  sales: {
    label: "Sales",
    description: "Import historical sales as receipt records. Rows with the same receipt reference become line items on one receipt.",
    fields: [
      { key: "receiptNo", label: "Receipt Reference", aliases: ["receipt", "receipt no", "receipt number", "reference", "invoice"] },
      { key: "saleDate", label: "Sale Date", aliases: ["date", "sale date", "sold on", "transaction date"] },
      { key: "productName", label: "Product Name", aliases: ["product", "product name", "item", "item name", "name"] },
      { key: "sku", label: "SKU", aliases: ["sku", "item sku", "code"] },
      { key: "barcode", label: "Barcode", aliases: ["barcode", "bar code"] },
      { key: "quantity", label: "Quantity Sold", required: true, aliases: ["quantity", "qty", "quantity sold", "sold quantity"] },
      { key: "unitPrice", label: "Unit Price", aliases: ["unit price", "sale price", "selling price", "price"] },
      { key: "discount", label: "Discount", aliases: ["discount", "sale discount"] },
      { key: "amountPaid", label: "Amount Paid", aliases: ["paid", "amount paid", "cash paid", "tendered amount"] },
      { key: "paymentMethod", label: "Payment Method", aliases: ["payment method", "method", "payment"] },
      { key: "customerName", label: "Customer Name", aliases: ["customer", "customer name", "buyer"] },
      { key: "customerPhone", label: "Customer Phone", aliases: ["phone", "customer phone", "contact", "customer contact"] },
      { key: "notes", label: "Notes", aliases: ["notes", "details", "description"] },
    ],
    template: [
      {
        "Receipt Reference": "OLD-001",
        "Sale Date": "2026-05-08",
        "Product Name": "Cement 50kg",
        SKU: "CEM-50",
        Barcode: "",
        "Quantity Sold": 2,
        "Unit Price": 32000,
        Discount: 0,
        "Amount Paid": 104000,
        "Payment Method": "cash",
        "Customer Name": "Acme Hardware",
        "Customer Phone": "0750000000",
        Notes: "Historical import",
      },
      {
        "Receipt Reference": "OLD-001",
        "Sale Date": "2026-05-08",
        "Product Name": "Paint 20L",
        SKU: "PNT-20",
        Barcode: "",
        "Quantity Sold": 1,
        "Unit Price": 40000,
        Discount: "",
        "Amount Paid": "",
        "Payment Method": "",
        "Customer Name": "Acme Hardware",
        "Customer Phone": "0750000000",
        Notes: "",
      },
    ],
  },
};

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const autoMapHeaders = (headers, fields) => {
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header),
  }));

  return fields.reduce((mapping, field) => {
    const aliases = [field.label, field.key, ...(field.aliases || [])].map(normalizeHeader);
    const exact = normalizedHeaders.find((header) => aliases.includes(header.normalized));
    const partial =
      exact ||
      normalizedHeaders.find((header) =>
        aliases.some((alias) => header.normalized.includes(alias) || alias.includes(header.normalized))
      );

    return {
      ...mapping,
      [field.key]: partial?.original || "",
    };
  }, {});
};

const toCsv = (rows) => {
  const headers = Object.keys(rows[0] || {});
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
};

const statusIcon = (status) => {
  if (status === "ready" || status === "imported") return <CheckCircleFill />;
  if (status === "error" || status === "failed") return <XCircleFill />;
  return <ExclamationTriangleFill />;
};

const reportAction = (row) => {
  const status = row.status || "pending";
  const normalized = row.normalizedData || {};

  if (status === "error" || status === "failed") return "Fix source row and validate again";
  if (status === "warning") return normalized.action === "skip" ? "Review skipped row" : "Review warning before confirming";
  if (status === "skipped") return "No live record created";
  if (status === "imported") return "Imported";
  if (normalized.action === "skip") return "Will be skipped";
  return "Ready to import";
};

const reportRecord = (row) => {
  const normalized = row.normalizedData || {};
  return normalized.name || normalized.productName || normalized.receiptNo || normalized.phone || normalized.customerName || "";
};

const buildValidationReportRows = (batch, headers) => {
  const sourceHeaders = Array.from(
    new Set([...(headers || []), ...(batch?.rows || []).flatMap((row) => Object.keys(row.rawData || {}))])
  ).filter(Boolean);

  return (batch?.rows || []).map((row) => {
    const raw = row.rawData || {};
    const normalized = row.normalizedData || {};
    const messages = [...(row.errors || []), ...(row.warnings || [])];
    const base = {
      "Batch ID": batch.id || "",
      "Import Type": batch.importType || "",
      "File Name": batch.fileName || "",
      "Row Number": row.rowNumber || "",
      Status: row.status || "pending",
      Action: reportAction(row),
      Record: reportRecord(row),
      "Created Entity": row.createdEntityType && row.createdEntityId ? `${row.createdEntityType} #${row.createdEntityId}` : "",
      Messages: messages.join(" "),
      "Normalized Data": JSON.stringify(normalized),
    };

    sourceHeaders.forEach((header) => {
      base[`Source: ${header}`] = raw[header] ?? "";
    });

    return base;
  });
};

const rowSourceHeaders = (row, headers) =>
  Array.from(new Set([...(headers || []), ...Object.keys(row?.rawData || {})])).filter(Boolean);

const ImportsPage = () => {
  const branchScope = useSelector(selectBranchScope);
  const { data: history = [] } = useGetImportHistoryQuery();
  const [uploadImportBatch, { isLoading: isUploading }] = useUploadImportBatchMutation();
  const [validateImportBatch, { isLoading: isValidating }] = useValidateImportBatchMutation();
  const [updateImportRow, { isLoading: isSavingRow }] = useUpdateImportRowMutation();
  const [confirmImportBatch, { isLoading: isConfirming }] = useConfirmImportBatchMutation();

  const [importType, setImportType] = useState("products");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [batch, setBatch] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [editingRow, setEditingRow] = useState(null);
  const [editingValues, setEditingValues] = useState({});
  const [options, setOptions] = useState({
    duplicateStrategy: "skip",
    createMissingCategories: true,
  });

  const config = importTypes[importType];
  const visibleRows = useMemo(() => (batch?.rows || []).slice(0, 40), [batch?.rows]);
  const activeBranchId = branchScope?.effective_branch_id || "";

  const resetBatch = () => {
    setBatch(null);
    setMessage({ type: "", text: "" });
  };

  const handleTypeChange = (event) => {
    const nextType = event.target.value;
    setImportType(nextType);
    setMapping(autoMapHeaders(headers, importTypes[nextType].fields));
    resetBatch();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheet];
      const parsedRows = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
        raw: false,
      });
      const parsedHeaders = Array.from(
        new Set(parsedRows.flatMap((row) => Object.keys(row).map((key) => String(key).trim())))
      ).filter(Boolean);

      setFileName(file.name);
      setHeaders(parsedHeaders);
      setRows(parsedRows);
      setMapping(autoMapHeaders(parsedHeaders, config.fields));
      setBatch(null);
      setMessage({
        type: "success",
        text: `${parsedRows.length} rows loaded from ${file.name}. Review the column mapping before validating.`,
      });
    } catch (error) {
      setMessage({
        type: "danger",
        text: "The file could not be read. Please use a valid Excel or CSV file.",
      });
    }
  };

  const handlePrepare = async () => {
    if (!rows.length) {
      setMessage({ type: "warning", text: "Choose an Excel or CSV file first." });
      return;
    }

    try {
      const response = await uploadImportBatch({
        type: importType,
        fileName,
        headers,
        rows,
        branchId: activeBranchId,
      }).unwrap();
      setBatch(response.data);
      setMessage({ type: "success", text: response.message || "Import prepared." });
    } catch (error) {
      setMessage({ type: "danger", text: error?.data?.message || "The import could not be prepared." });
    }
  };

  const handleValidate = async () => {
    if (!batch?.id) {
      setMessage({ type: "warning", text: "Prepare the import before validation." });
      return;
    }

    try {
      const response = await validateImportBatch({
        batchId: batch.id,
        mapping,
        options,
      }).unwrap();
      setBatch(response.data);
      const validated = response.data;
      const errorRows = validated?.errorRows ?? validated?.summary?.errors ?? 0;
      const warningRows = validated?.warningRows ?? validated?.summary?.warnings ?? 0;
      const readyRows = validated?.validRows ?? validated?.summary?.ready ?? 0;
      const skippedRows = validated?.skippedRows ?? validated?.summary?.skipped ?? 0;
      setMessage({
        type: errorRows ? "warning" : "success",
        text: `Validation complete: ${readyRows} ready, ${warningRows} warnings, ${errorRows} errors, ${skippedRows} skipped.`,
      });
    } catch (error) {
      setMessage({ type: "danger", text: error?.data?.message || "Validation failed." });
    }
  };

  const handleConfirm = async () => {
    if (!batch?.id) return;

    try {
      const response = await confirmImportBatch(batch.id).unwrap();
      setBatch(response.data);
      setMessage({ type: "success", text: response.message || "Import completed successfully." });
    } catch (error) {
      setMessage({ type: "danger", text: error?.data?.message || "Import confirmation failed." });
    }
  };

  const openRowEditor = (row) => {
    setEditingRow(row);
    setEditingValues(row.rawData || {});
  };

  const closeRowEditor = () => {
    setEditingRow(null);
    setEditingValues({});
  };

  const handleSaveRow = async () => {
    if (!batch?.id || !editingRow?.id) return;

    try {
      const response = await updateImportRow({
        batchId: batch.id,
        rowId: editingRow.id,
        rawData: editingValues,
      }).unwrap();
      setBatch(response.data);
      closeRowEditor();
      setMessage({ type: "success", text: response.message || "Import row updated. Validate again before confirming." });
    } catch (error) {
      setMessage({ type: "danger", text: error?.data?.message || "Import row could not be updated." });
    }
  };

  const downloadTemplate = () => {
    const csv = toCsv(config.template);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${importType}-import-template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadValidationReport = () => {
    if (!batch?.rows?.length) {
      setMessage({ type: "warning", text: "Validate rows before downloading a fix report." });
      return;
    }

    const csv = toCsv(buildValidationReportRows(batch, headers));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${importType}-validation-report-${batch.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const summary = batch?.summary || {};
  const canDownloadValidationReport = Boolean(batch?.rows?.length);

  return (
    <div className="workspace-page-shell imports-page">
      <div className="workspace-page-stack">
        <header className="workspace-page-hero">
          <div>
            <h2 className="workspace-page-title">Import Workspace</h2>
            <p className="workspace-page-subtitle">
              Bring data from Excel or CSV into Ampla through a controlled mapping,
              validation, preview, and confirmation flow.
            </p>
          </div>
          <div className="workspace-page-actions">
            <button type="button" className="imports-secondary-button" onClick={downloadTemplate}>
              <Download size={16} />
              Template
            </button>
          </div>
        </header>

        {message.text ? (
          <div className={`imports-alert imports-alert-${message.type}`}>
            {message.type === "danger" ? <XCircleFill /> : <CheckCircleFill />}
            <span>{message.text}</span>
          </div>
        ) : null}

        <section className="imports-layout">
          <div className="imports-main">
            <div className="imports-panel">
              <div className="imports-panel-head">
                <div>
                  <h3>1. Select File And Import Type</h3>
                  <p>{config.description}</p>
                </div>
                <FileEarmarkSpreadsheet size={22} />
              </div>

              <div className="imports-form-grid">
                <label className="imports-field">
                  <span>Import Type</span>
                  <select value={importType} onChange={handleTypeChange}>
                    {Object.entries(importTypes).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="imports-field">
                  <span>Excel Or CSV File</span>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
                </label>
              </div>

              <div className="imports-file-summary">
                <div>
                  <strong>{fileName || "No file selected"}</strong>
                  <span>{rows.length ? `${rows.length} rows ready for staging` : "Upload a spreadsheet to begin"}</span>
                </div>
                <button type="button" className="imports-primary-button" onClick={handlePrepare} disabled={isUploading || !rows.length}>
                  <CloudArrowUp size={16} />
                  {isUploading ? "Preparing..." : "Prepare Import"}
                </button>
              </div>
            </div>

            <div className="imports-panel">
              <div className="imports-panel-head">
                <div>
                  <h3>2. Map Columns</h3>
                  <p>Match spreadsheet columns to Ampla fields. Required fields are marked clearly.</p>
                </div>
                <Sliders size={22} />
              </div>

              <div className="imports-mapping-grid">
                {config.fields.map((field) => (
                  <label className="imports-field" key={field.key}>
                    <span>
                      {field.label}
                      {field.required ? <b>Required</b> : null}
                    </span>
                    <select
                      value={mapping[field.key] || ""}
                      onChange={(event) =>
                        setMapping((previous) => ({
                          ...previous,
                          [field.key]: event.target.value,
                        }))
                      }
                    >
                      <option value="">Do not import</option>
                      {headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              <div className="imports-options-row">
                <label className="imports-field">
                  <span>Duplicates</span>
                  <select
                    value={options.duplicateStrategy}
                    onChange={(event) =>
                      setOptions((previous) => ({
                        ...previous,
                        duplicateStrategy: event.target.value,
                      }))
                    }
                  >
                    <option value="skip">Skip existing records</option>
                    <option value="update">Update existing records</option>
                  </select>
                </label>

                {importType === "products" ? (
                  <label className="imports-check-field">
                    <input
                      type="checkbox"
                      checked={options.createMissingCategories}
                      onChange={(event) =>
                        setOptions((previous) => ({
                          ...previous,
                          createMissingCategories: event.target.checked,
                        }))
                      }
                    />
                    <span>Create missing categories</span>
                  </label>
                ) : null}

                {importType === "sales" ? (
                  <label className="imports-check-field">
                    <input
                      type="checkbox"
                      checked={options.adjustInventory ?? true}
                      onChange={(event) =>
                        setOptions((previous) => ({
                          ...previous,
                          adjustInventory: event.target.checked,
                        }))
                      }
                    />
                    <span>Deduct sold quantities from inventory</span>
                  </label>
                ) : null}

                <button type="button" className="imports-primary-button" onClick={handleValidate} disabled={isValidating || !batch?.id}>
                  <Search size={16} />
                  {isValidating ? "Validating..." : "Validate Rows"}
                </button>
              </div>
            </div>

            <div className="imports-panel">
              <div className="imports-panel-head">
                <div>
                  <h3>3. Preview And Confirm</h3>
                  <p>Review row status before committing anything to live records.</p>
                </div>
              </div>

              <div className="imports-summary-grid">
                <div>
                  <strong>{batch?.totalRows ?? rows.length}</strong>
                  <span>Total Rows</span>
                </div>
                <div>
                  <strong>{batch?.validRows ?? summary.ready ?? 0}</strong>
                  <span>Ready</span>
                </div>
                <div>
                  <strong>{batch?.warningRows ?? summary.warnings ?? 0}</strong>
                  <span>Warnings</span>
                </div>
                <div>
                  <strong>{batch?.errorRows ?? summary.errors ?? 0}</strong>
                  <span>Errors</span>
                </div>
              </div>

              <div className="imports-preview-table-wrap">
                <table className="imports-preview-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Status</th>
                      <th>Record</th>
                      <th>Messages</th>
                      <th>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.length ? (
                      visibleRows.map((row) => {
                        const normalized = row.normalizedData || {};
                        const messages = [...(row.errors || []), ...(row.warnings || [])];
                        return (
                          <tr key={row.id}>
                            <td>{row.rowNumber}</td>
                            <td>
                              <span className={`imports-status imports-status-${row.status}`}>
                                {statusIcon(row.status)}
                                {row.status}
                              </span>
                            </td>
                            <td>{normalized.name || normalized.productName || normalized.receiptNo || normalized.phone || "Not mapped"}</td>
                            <td>{messages.length ? messages.join(" ") : "Ready to import"}</td>
                            <td>
                              <button
                                type="button"
                                className="imports-icon-button"
                                onClick={() => openRowEditor(row)}
                                disabled={batch?.status === "completed" || row.status === "imported"}
                                title="Edit row"
                              >
                                <PencilSquare size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5">Validate rows to see the import preview.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="imports-confirm-row">
                <span>
                  {batch?.status === "completed"
                    ? `${batch.importedRows || 0} rows imported.`
                    : "Only validated rows are committed. Error rows remain untouched."}
                </span>
                <button
                  type="button"
                  className="imports-secondary-button"
                  onClick={downloadValidationReport}
                  disabled={!canDownloadValidationReport}
                >
                  <Download size={16} />
                  Fix Report
                </button>
                <button
                  type="button"
                  className="imports-primary-button"
                  onClick={handleConfirm}
                  disabled={isConfirming || !batch?.id || !["validated", "validated_with_errors"].includes(batch?.status)}
                >
                  <CheckCircleFill size={16} />
                  {isConfirming ? "Importing..." : "Confirm Import"}
                </button>
              </div>
            </div>
          </div>

          <aside className="imports-side">
            <div className="imports-panel">
              <div className="imports-panel-head">
                <div>
                  <h3>Import Guardrails</h3>
                  <p>Best practice before confirming a batch.</p>
                </div>
              </div>
              <ul className="imports-guideline-list">
                <li>Use the active branch for location-specific records.</li>
                <li>Keep product names, SKUs, and barcodes unique.</li>
                <li>Validate first, then fix source rows before confirming.</li>
                <li>Import sales after related product and customer records exist.</li>
              </ul>
            </div>

            <div className="imports-panel">
              <div className="imports-panel-head">
                <div>
                  <h3>Recent Imports</h3>
                  <p>Latest batches prepared by this account.</p>
                </div>
              </div>
              <div className="imports-history-list">
                {history.length ? (
                  history.slice(0, 8).map((item) => (
                    <div key={item.id}>
                      <strong>{item.fileName}</strong>
                      <span>
                        {item.importType} - {item.status} - {item.importedRows || 0}/{item.totalRows || 0}
                      </span>
                    </div>
                  ))
                ) : (
                  <div>
                    <strong>No imports yet</strong>
                    <span>Prepared batches will appear here.</span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </section>

        {editingRow ? (
          <div className="imports-modal-backdrop" role="presentation">
            <div className="imports-modal" role="dialog" aria-modal="true" aria-labelledby="imports-row-editor-title">
              <div className="imports-modal-head">
                <div>
                  <h3 id="imports-row-editor-title">Edit Row {editingRow.rowNumber}</h3>
                  <p>Update staged values, then validate again before confirming.</p>
                </div>
                <button type="button" className="imports-icon-button" onClick={closeRowEditor} title="Close">
                  <XCircleFill size={18} />
                </button>
              </div>

              <div className="imports-row-editor-grid">
                {rowSourceHeaders(editingRow, headers).map((header) => (
                  <label className="imports-field" key={header}>
                    <span>{header}</span>
                    <input
                      type="text"
                      value={editingValues[header] ?? ""}
                      onChange={(event) =>
                        setEditingValues((previous) => ({
                          ...previous,
                          [header]: event.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>

              <div className="imports-modal-actions">
                <button type="button" className="imports-secondary-button" onClick={closeRowEditor}>
                  Cancel
                </button>
                <button type="button" className="imports-primary-button" onClick={handleSaveRow} disabled={isSavingRow}>
                  <CheckCircleFill size={16} />
                  {isSavingRow ? "Saving..." : "Save Row"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ImportsPage;
