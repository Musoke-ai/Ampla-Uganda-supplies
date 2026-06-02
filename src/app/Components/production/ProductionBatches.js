import React, { useCallback, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Table } from "react-bootstrap";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ClipboardCheck,
  ClipboardData,
  FileEarmarkPdf,
  FiletypeCsv,
  Hammer,
  PencilSquare,
  PlusCircle,
  Printer,
  SendCheck,
  Trash,
} from "react-bootstrap-icons";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

import { selectBranchScope } from "../../auth/authSlice";
import { selectBranches, useGetBranchesQuery } from "../../features/api/branchesSlice";
import { selectEmployees, useGetEmployeesQuery } from "../../features/api/employeesSlice";
import { selectOrders, useGetOrdersQuery } from "../../features/api/orderSlice";
import {
  selectProductionBatches,
  useAddProductionBatchExpenseMutation,
  useAddProductionBatchLaborMutation,
  useAddProductionBatchMaterialMutation,
  useCreateProductionBatchMutation,
  useDeleteProductionBatchMutation,
  useDeleteProductionBatchExpenseMutation,
  useDeleteProductionBatchLaborMutation,
  useDeleteProductionBatchMaterialMutation,
  useDeleteProductionBatchOutputMutation,
  useGetProductionBatchesQuery,
  usePostProductionBatchOutputMutation,
  useUpdateProductionBatchExpenseMutation,
  useUpdateProductionBatchLaborMutation,
  useUpdateProductionBatchMaterialMutation,
  useUpdateProductionBatchOutputMutation,
  useUpdateProductionBatchMutation,
  useUpdateProductionBatchQualityMutation,
  useUpdateProductionBatchStatusMutation,
} from "../../features/api/productionBatchSlice";
import { selectRawMaterials, useGetRawMaterialsQuery } from "../../features/api/rawmaterialsSlice";
import { selectStock, useGetStockQuery } from "../../features/stock/stockSlice";

const toNumber = (value) => Number(value || 0);
const today = () => new Date().toISOString().slice(0, 10);
const safeText = (value, fallback = "") => (value === undefined || value === null || value === "" ? fallback : String(value));
const csvCell = (value) => `"${safeText(value).replace(/"/g, '""')}"`;
const escapeHtml = (value) =>
  safeText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
const toDateKey = (value) => {
  if (!value) return "";
  const direct = String(value).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) return direct;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
};

const recordMatchesReportDate = (record, date) => {
  const dates = [
    record?.createdAt,
    record?.updatedAt,
    record?.paymentDate,
    record?.dailyRawmaterialsDateCreated,
    record?.dailyProductionDateCreated,
  ]
    .map(toDateKey)
    .filter(Boolean);

  return dates.length ? dates.includes(date) : true;
};

const initialBatchForm = (branchId = "") => ({
  branchId,
  orderId: "",
  productId: "",
  supervisorId: "",
  quantityPlanned: "",
  startDate: today(),
  notes: "",
});

const initialActionForm = {
  materialId: "",
  quantity: "",
  employeeId: "",
  role: "",
  hoursWorked: "",
  laborCost: "",
  category: "",
  description: "",
  amount: "",
  productId: "",
  outputQuantity: "",
  wastageQuantity: "",
  qualityStatus: "approved",
  qualityNotes: "",
  status: "in_progress",
  notes: "",
  paymentStatus: "unpaid",
  amountPaid: "",
  paymentDate: "",
};

const hasBranchValue = (record) =>
  record?.branchId !== undefined && record?.branchId !== null && String(record.branchId) !== "";

const scopedOptions = (records, branchId) => {
  if (!branchId) return records;

  const filtered = records.filter(
    (record) => !hasBranchValue(record) || String(record.branchId) === String(branchId)
  );

  return filtered.length ? filtered : records;
};

const firstValue = (record, keys = []) => {
  const match = keys.find(
    (key) => record?.[key] !== undefined && record?.[key] !== null && String(record[key]) !== ""
  );

  return match ? record[match] : "";
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getOrderProductId = (order, productList = []) => {
  if (!order) return "";

  const directId = firstValue(order, [
    "prodId",
    "productId",
    "itemId",
    "prod_id",
    "product_id",
    "item_id",
  ]);

  if (directId) return String(directId);

  const productName = normalizeText(
    firstValue(order, ["productName", "itemName", "prodName", "customSize", "description"])
  );

  if (!productName) return "";

  const match = productList.find((product) =>
    [product.itemName, product.productName, product.name]
      .map(normalizeText)
      .filter(Boolean)
      .some((name) => name === productName || name.includes(productName) || productName.includes(name))
  );

  return match?.itemId ? String(match.itemId) : "";
};

const getOrderQuantity = (order) =>
  firstValue(order, ["quantity", "orderQuantity", "qty", "quantityOrdered"]) || "";

const batchHasRecordedActivity = (batch) =>
  toNumber(batch?.quantityProduced) > 0 ||
  toNumber(batch?.wastageQuantity) > 0 ||
  toNumber(batch?.costing?.materialCost) > 0 ||
  toNumber(batch?.costing?.laborCost) > 0 ||
  toNumber(batch?.costing?.expenseCost) > 0 ||
  toNumber(batch?.costing?.outputQuantity) > 0 ||
  toNumber(batch?.costing?.wastageQuantity) > 0;

export default function ProductionBatches() {
  const branchScope = useSelector(selectBranchScope);
  const currentBranchId = branchScope?.effective_branch_id
    ? String(branchScope.effective_branch_id)
    : "";
  const canSwitchBranches = Boolean(branchScope?.can_switch_branches);
  const branches = useSelector(selectBranches) ?? [];
  const products = useSelector(selectStock) ?? [];
  const rawMaterials = useSelector(selectRawMaterials) ?? [];
  const orders = useSelector(selectOrders) ?? [];
  const employees = useSelector(selectEmployees) ?? [];
  const batches = useSelector(selectProductionBatches) ?? [];

  useGetBranchesQuery();
  useGetStockQuery();
  useGetRawMaterialsQuery();
  useGetOrdersQuery();
  useGetEmployeesQuery();
  useGetProductionBatchesQuery();

  const [createBatch, { isLoading: isCreating }] = useCreateProductionBatchMutation();
  const [updateBatch, { isLoading: isUpdatingBatch }] = useUpdateProductionBatchMutation();
  const [deleteBatch, { isLoading: isDeletingBatch }] = useDeleteProductionBatchMutation();
  const [addMaterial, { isLoading: isAddingMaterial }] = useAddProductionBatchMaterialMutation();
  const [updateMaterial, { isLoading: isUpdatingMaterial }] = useUpdateProductionBatchMaterialMutation();
  const [deleteMaterial, { isLoading: isDeletingMaterial }] = useDeleteProductionBatchMaterialMutation();
  const [addLabor, { isLoading: isAddingLabor }] = useAddProductionBatchLaborMutation();
  const [updateLabor, { isLoading: isUpdatingLabor }] = useUpdateProductionBatchLaborMutation();
  const [deleteLabor, { isLoading: isDeletingLabor }] = useDeleteProductionBatchLaborMutation();
  const [addExpense, { isLoading: isAddingExpense }] = useAddProductionBatchExpenseMutation();
  const [updateExpense, { isLoading: isUpdatingExpense }] = useUpdateProductionBatchExpenseMutation();
  const [deleteExpense, { isLoading: isDeletingExpense }] = useDeleteProductionBatchExpenseMutation();
  const [postOutput, { isLoading: isPostingOutput }] = usePostProductionBatchOutputMutation();
  const [updateOutput, { isLoading: isUpdatingOutput }] = useUpdateProductionBatchOutputMutation();
  const [deleteOutput, { isLoading: isDeletingOutput }] = useDeleteProductionBatchOutputMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateProductionBatchStatusMutation();
  const [updateQuality, { isLoading: isUpdatingQuality }] = useUpdateProductionBatchQualityMutation();

  const [batchForm, setBatchForm] = useState(initialBatchForm(currentBranchId));
  const [editingBatchId, setEditingBatchId] = useState("");
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [actionForm, setActionForm] = useState(initialActionForm);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionMode, setActionMode] = useState("material");
  const [editingActionRecord, setEditingActionRecord] = useState(null);
  const [dailyReportBatch, setDailyReportBatch] = useState(null);
  const [dailyReportDate, setDailyReportDate] = useState(today());

  const selectedBatch = useMemo(
    () => batches.find((batch) => String(batch.batchId) === String(selectedBatchId)) || batches[0],
    [batches, selectedBatchId]
  );

  const branchId = batchForm.branchId || currentBranchId;
  const actionBranchId = selectedBatch?.branchId || branchId;
  const branchProducts = useMemo(
    () => scopedOptions(products, branchId),
    [branchId, products]
  );
  const branchOrders = useMemo(
    () => scopedOptions(orders, branchId),
    [branchId, orders]
  );
  const branchMaterials = useMemo(
    () => scopedOptions(rawMaterials, branchId),
    [branchId, rawMaterials]
  );
  const branchEmployees = useMemo(
    () => scopedOptions(employees, branchId),
    [branchId, employees]
  );
  const actionProducts = useMemo(
    () => scopedOptions(products, actionBranchId),
    [actionBranchId, products]
  );
  const actionMaterials = useMemo(
    () => scopedOptions(rawMaterials, actionBranchId),
    [actionBranchId, rawMaterials]
  );
  const actionEmployees = useMemo(
    () => scopedOptions(employees, actionBranchId),
    [actionBranchId, employees]
  );

  const productMap = useMemo(
    () => new Map(products.map((product) => [String(product.itemId), product.itemName])),
    [products]
  );
  const branchMap = useMemo(
    () => new Map(branches.map((branch) => [String(branch.branchId), branch.branchName])),
    [branches]
  );

  const totals = useMemo(() => {
    return batches.reduce(
      (summary, batch) => {
        summary.total += 1;
        if (batch.status === "in_progress") summary.inProgress += 1;
        if (batch.status === "completed") summary.completed += 1;
        summary.cost += toNumber(batch.costing?.totalCost);
        summary.output += toNumber(batch.costing?.outputQuantity);
        summary.wastage += toNumber(batch.costing?.wastageQuantity);
        return summary;
      },
      { total: 0, inProgress: 0, completed: 0, cost: 0, output: 0, wastage: 0 }
    );
  }, [batches]);

  const resetBatchForm = () => {
    setBatchForm(initialBatchForm(currentBranchId));
    setEditingBatchId("");
  };

  const openEditBatch = (batch) => {
    setEditingBatchId(String(batch.batchId));
    setBatchForm({
      branchId: batch.branchId ? String(batch.branchId) : currentBranchId,
      orderId: batch.orderId ? String(batch.orderId) : "",
      productId: batch.productId ? String(batch.productId) : "",
      supervisorId: batch.supervisorId ? String(batch.supervisorId) : "",
      quantityPlanned: batch.quantityPlanned || "",
      startDate: batch.startDate || today(),
      endDate: batch.endDate || "",
      status: batch.status || "planned",
      notes: batch.notes || "",
    });
  };

  const handleSaveBatch = async (event) => {
    event.preventDefault();
    const payload = {
      ...batchForm,
      branchId: batchForm.branchId || currentBranchId,
    };

    try {
      if (editingBatchId) {
        await updateBatch({ ...payload, batchId: editingBatchId }).unwrap();
        toast.success("Production batch updated.");
      } else {
        await createBatch(payload).unwrap();
        toast.success("Production batch created.");
      }
      resetBatchForm();
    } catch (error) {
      toast.error(error?.data?.message || error?.error || "Production batch could not be saved.");
    }
  };

  const handleDeleteBatch = async () => {
    if (!batchToDelete?.batchId) return;

    try {
      await deleteBatch({ batchId: batchToDelete.batchId }).unwrap();
      toast.success("Production batch deleted.");
      setBatchToDelete(null);
      if (String(editingBatchId) === String(batchToDelete.batchId)) {
        resetBatchForm();
      }
    } catch (error) {
      toast.error(error?.data?.message || error?.error || "Production batch could not be deleted.");
    }
  };

  const openAction = (mode, batch, record = null) => {
    setActionMode(mode);
    setSelectedBatchId(String(batch.batchId));
    setActionForm({
      ...initialActionForm,
      ...(record || {}),
      materialId: record?.materialId ? String(record.materialId) : "",
      quantity: record?.quantity ?? "",
      employeeId: record?.employeeId ? String(record.employeeId) : "",
      role: record?.role || "",
      hoursWorked: record?.hoursWorked ?? "",
      laborCost: record?.laborCost ?? "",
      category: record?.category || "",
      description: record?.description || "",
      amount: record?.amount ?? "",
      productId: batch.productId || "",
      ...(record?.productId ? { productId: String(record.productId) } : {}),
      outputQuantity: Math.max(toNumber(batch.quantityPlanned) - toNumber(batch.quantityProduced), 0) || "",
      ...(record?.quantity !== undefined && mode === "output" ? { outputQuantity: record.quantity } : {}),
      wastageQuantity: record?.wastageQuantity ?? "",
      status: batch.status || "in_progress",
      notes: record?.notes || "",
      paymentStatus: record?.paymentStatus || "unpaid",
      amountPaid: record?.amountPaid ?? "",
      paymentDate: record?.paymentDate || "",
    });
    setEditingActionRecord(record);
    setShowActionModal(true);
  };

  const closeAction = () => {
    setShowActionModal(false);
    setActionForm(initialActionForm);
    setEditingActionRecord(null);
  };

  const handleActionSubmit = async (event) => {
    event.preventDefault();
    if (!selectedBatch) return;

    const batchId = selectedBatch.batchId;

    try {
      if (actionMode === "material") {
        const payload = {
          batchId,
          id: editingActionRecord?.id,
          materialId: actionForm.materialId,
          quantity: actionForm.quantity,
          notes: actionForm.notes,
        };
        if (editingActionRecord?.id) {
          await updateMaterial(payload).unwrap();
          toast.success("Material usage updated.");
        } else {
          await addMaterial(payload).unwrap();
          toast.success("Material usage recorded.");
        }
      } else if (actionMode === "labor") {
        const payload = {
          batchId,
          id: editingActionRecord?.id,
          employeeId: actionForm.employeeId,
          role: actionForm.role,
          hoursWorked: actionForm.hoursWorked,
          laborCost: actionForm.laborCost,
          amountPaid: actionForm.amountPaid,
          paymentStatus: actionForm.paymentStatus,
          paymentDate: actionForm.paymentDate,
          notes: actionForm.notes,
        };
        if (editingActionRecord?.id) {
          await updateLabor(payload).unwrap();
          toast.success("Labor and payroll updated.");
        } else {
          await addLabor(payload).unwrap();
          toast.success("Labor cost recorded.");
        }
      } else if (actionMode === "expense") {
        const payload = {
          batchId,
          id: editingActionRecord?.id,
          category: actionForm.category || "Production",
          description: actionForm.description,
          amount: actionForm.amount,
        };
        if (editingActionRecord?.id) {
          await updateExpense(payload).unwrap();
          toast.success("Production expense updated.");
        } else {
          await addExpense(payload).unwrap();
          toast.success("Production expense recorded.");
        }
      } else if (actionMode === "output") {
        const payload = {
          batchId,
          id: editingActionRecord?.id,
          productId: actionForm.productId,
          quantity: actionForm.outputQuantity,
          wastageQuantity: actionForm.wastageQuantity,
          notes: actionForm.notes,
        };
        if (editingActionRecord?.id) {
          await updateOutput(payload).unwrap();
          toast.success("Finished goods output updated.");
        } else {
          await postOutput(payload).unwrap();
          toast.success("Finished goods posted to inventory.");
        }
      } else if (actionMode === "quality") {
        await updateQuality({
          batchId,
          qualityStatus: actionForm.qualityStatus,
          qualityNotes: actionForm.qualityNotes,
        }).unwrap();
        toast.success("Quality check updated.");
      } else if (actionMode === "status") {
        await updateStatus({
          batchId,
          status: actionForm.status,
        }).unwrap();
        toast.success("Batch status updated.");
      }

      closeAction();
    } catch (error) {
      toast.error(error?.data?.message || error?.error || "Batch action could not be completed.");
    }
  };

  const handleDeleteLine = async (mode, record) => {
    if (!record?.id) return;
    const label = {
      material: "material usage",
      labor: "labor/payroll record",
      expense: "production expense",
      output: "finished goods output",
    }[mode] || "record";

    if (!window.confirm(`Remove this ${label}? Related stock will be reversed where needed.`)) {
      return;
    }

    try {
      if (mode === "material") {
        await deleteMaterial({ id: record.id }).unwrap();
      } else if (mode === "labor") {
        await deleteLabor({ id: record.id }).unwrap();
      } else if (mode === "expense") {
        await deleteExpense({ id: record.id }).unwrap();
      } else if (mode === "output") {
        await deleteOutput({ id: record.id }).unwrap();
      }
      toast.success(`${label} removed.`);
    } catch (error) {
      toast.error(error?.data?.message || error?.error || `${label} could not be removed.`);
    }
  };

  const money = useCallback((value) =>
    `UGX ${Number(value || 0).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`,
  []);
  const dailyReport = useMemo(
    () => buildDailyBatchReport(dailyReportBatch, dailyReportDate, money),
    [dailyReportBatch, dailyReportDate, money]
  );
  const openDailyReport = (batch) => {
    setDailyReportBatch(batch);
    setDailyReportDate(today());
  };
  const closeDailyReport = () => {
    setDailyReportBatch(null);
    setDailyReportDate(today());
  };
  const exportDailyReportCsv = () => {
    if (!dailyReportBatch) return;
    const headers = ["Section", "Item", "Quantity/Hours", "Cost/Amount", "Notes"];
    const body = dailyReport.rows.length
      ? dailyReport.rows
      : [["No Activity", "No activity recorded for this day", "", "", ""]];
    const csv = [headers, ...body].map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${dailyReport.fileName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };
  const exportDailyReportPdf = () => {
    if (!dailyReportBatch) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Daily Production Batch Report", 14, 16);
    doc.setFontSize(10);
    doc.text(`Batch: ${dailyReportBatch.batchNo || dailyReportBatch.batchId}`, 14, 24);
    doc.text(`Date: ${dailyReportDate}`, 14, 30);
    doc.text(`Product: ${dailyReportBatch.productName || productMap.get(String(dailyReportBatch.productId)) || "Product"}`, 14, 36);

    autoTable(doc, {
      startY: 44,
      head: [["Metric", "Value"]],
      body: [
        ["Material cost", dailyReport.totals.materialCost],
        ["Labor cost", dailyReport.totals.laborCost],
        ["Amount paid", dailyReport.totals.amountPaid],
        ["Expenses", dailyReport.totals.expenseCost],
        ["Output quantity", dailyReport.totals.outputQuantity],
        ["Wastage quantity", dailyReport.totals.wastageQuantity],
        ["Daily total cost", dailyReport.totals.totalCost],
      ],
      theme: "grid",
      styles: { fontSize: 9 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [["Section", "Item", "Qty/Hours", "Cost/Amount", "Notes"]],
      body: dailyReport.rows.length
        ? dailyReport.rows
        : [["No Activity", "No activity recorded for this day", "", "", ""]],
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [35, 87, 54] },
    });
    doc.save(`${dailyReport.fileName}.pdf`);
  };
  const printDailyReport = () => {
    if (!dailyReportBatch) return;
    const printWindow = window.open("", "_blank", "width=980,height=720");
    if (!printWindow) {
      toast.error("Allow pop-ups to print the daily batch report.");
      return;
    }
    const rows = dailyReport.rows.length
      ? dailyReport.rows
      : [["No Activity", "No activity recorded for this day", "", "", ""]];
    printWindow.document.write(`
      <html>
        <head>
          <title>${dailyReport.fileName}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #172532; margin: 28px; }
            h1 { font-size: 22px; margin: 0 0 6px; }
            .meta { color: #5b6775; margin-bottom: 18px; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 18px; }
            .tile { border: 1px solid #dbe7df; border-radius: 8px; padding: 10px; }
            .tile span { display: block; color: #5b6775; font-size: 11px; text-transform: uppercase; }
            .tile strong { display: block; margin-top: 4px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #dbe7df; padding: 8px; text-align: left; vertical-align: top; }
            th { background: #eaf4ed; }
          </style>
        </head>
        <body>
          <h1>Daily Production Batch Report</h1>
          <div class="meta">
            Batch ${escapeHtml(safeText(dailyReportBatch.batchNo, dailyReportBatch.batchId))} |
            ${escapeHtml(dailyReportDate)} |
            ${escapeHtml(safeText(dailyReportBatch.productName || productMap.get(String(dailyReportBatch.productId)), "Product"))}
          </div>
          <div class="summary">
            ${Object.entries(dailyReport.totals).map(([label, value]) => `<div class="tile"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}
          </div>
          <table>
            <thead><tr><th>Section</th><th>Item</th><th>Qty/Hours</th><th>Cost/Amount</th><th>Notes</th></tr></thead>
            <tbody>
              ${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}
            </tbody>
          </table>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };
  const selectedOrder = useMemo(
    () => branchOrders.find((order) => String(order.orderId) === String(batchForm.orderId)) || null,
    [batchForm.orderId, branchOrders]
  );
  const editingBatch = useMemo(
    () => batches.find((batch) => String(batch.batchId) === String(editingBatchId)) || null,
    [batches, editingBatchId]
  );
  const editingBatchHasActivity = batchHasRecordedActivity(editingBatch);
  const selectedOrderProductId = getOrderProductId(selectedOrder, products);
  const selectedProductFromAll = products.find(
    (product) => String(product.itemId) === String(batchForm.productId)
  );
  const batchProductOptions = useMemo(() => {
    if (selectedOrderProductId) {
      const orderProduct = products.find(
        (product) => String(product.itemId) === String(selectedOrderProductId)
      );

      return orderProduct ? [orderProduct] : [];
    }

    const optionMap = new Map(branchProducts.map((product) => [String(product.itemId), product]));

    if (selectedProductFromAll) {
      optionMap.set(String(selectedProductFromAll.itemId), selectedProductFromAll);
    }

    return Array.from(optionMap.values());
  }, [branchProducts, products, selectedOrderProductId, selectedProductFromAll]);

  return (
    <div className="production-modal-stack">
      <Row className="g-3">
        <Col md={6} xl={3}>
          <Metric title="Batches" value={totals.total} note={`${totals.inProgress} in progress`} />
        </Col>
        <Col md={6} xl={3}>
          <Metric title="Completed" value={totals.completed} note="Finished batches" />
        </Col>
        <Col md={6} xl={3}>
          <Metric title="Batch Cost" value={money(totals.cost)} note="Materials + labor + expenses" />
        </Col>
        <Col md={6} xl={3}>
          <Metric title="Output" value={totals.output} note={`${totals.wastage} wastage recorded`} />
        </Col>
      </Row>

      <Card className="border-0 shadow-sm production-batch-form-card">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center justify-content-between gap-3 mb-3 flex-wrap">
            <div className="d-flex align-items-center gap-2">
              {editingBatchId ? <PencilSquare /> : <PlusCircle />}
              <h5 className="mb-0">{editingBatchId ? "Edit Production Batch" : "Create Production Batch"}</h5>
            </div>
            {editingBatchId ? (
              <Button variant="outline-secondary" size="sm" onClick={resetBatchForm}>
                Cancel Edit
              </Button>
            ) : null}
          </div>
          <Form onSubmit={handleSaveBatch}>
            <Row className="g-3">
              <Col md={6} xl={3}>
                <Form.Group>
                  <Form.Label>Branch</Form.Label>
                  <Form.Select
                    disabled={!canSwitchBranches || editingBatchHasActivity}
                    value={batchForm.branchId || currentBranchId}
                    onChange={(event) =>
                      setBatchForm({ ...batchForm, branchId: event.target.value, orderId: "", productId: "" })
                    }
                    required
                  >
                    <option value="">Select branch</option>
                    {branches.map((branch) => (
                      <option key={branch.branchId} value={branch.branchId}>
                        {branch.branchName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6} xl={3}>
                <Form.Group>
                  <Form.Label>Order</Form.Label>
                  <Form.Select
                    disabled={editingBatchHasActivity}
                    value={batchForm.orderId}
                    onChange={(event) => {
                      const order = branchOrders.find((item) => String(item.orderId) === event.target.value);
                      const orderProductId = getOrderProductId(order, branchProducts);
                      setBatchForm({
                        ...batchForm,
                        orderId: event.target.value,
                        productId: orderProductId || batchForm.productId,
                        quantityPlanned: getOrderQuantity(order) || batchForm.quantityPlanned,
                      });
                    }}
                  >
                    <option value="">No linked order</option>
                    {branchOrders.map((order) => (
                      <option key={order.orderId} value={order.orderId}>
                        #{order.orderId} - {productMap.get(getOrderProductId(order, products)) || order.productName || order.customSize || "Custom item"}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6} xl={3}>
                <Form.Group>
                  <Form.Label>Product</Form.Label>
                  <Form.Select
                    value={batchForm.productId}
                    onChange={(event) => setBatchForm({ ...batchForm, productId: event.target.value })}
                    disabled={Boolean(batchForm.orderId) || editingBatchHasActivity}
                    required
                  >
                    <option value="">Select product</option>
                    {batchProductOptions.map((product) => (
                      <option key={product.itemId} value={product.itemId}>
                        {product.itemName}
                      </option>
                    ))}
                  </Form.Select>
                  {batchForm.orderId ? (
                    <Form.Text>
                      Auto-selected from order
                      {selectedOrderProductId && productMap.get(String(selectedOrderProductId))
                        ? `: ${productMap.get(String(selectedOrderProductId))}`
                        : ""}
                      . Clear the linked order to choose a different product.
                    </Form.Text>
                  ) : null}
                </Form.Group>
              </Col>
              <Col md={6} xl={3}>
                <Form.Group>
                  <Form.Label>Planned Qty</Form.Label>
                  <Form.Control
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={batchForm.quantityPlanned}
                    onChange={(event) => setBatchForm({ ...batchForm, quantityPlanned: event.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6} xl={3}>
                <Form.Group>
                  <Form.Label>Supervisor</Form.Label>
                  <Form.Select
                    value={batchForm.supervisorId}
                    onChange={(event) => setBatchForm({ ...batchForm, supervisorId: event.target.value })}
                  >
                    <option value="">No supervisor</option>
                    {branchEmployees.map((employee) => (
                      <option key={employee.empID} value={employee.empID}>
                        {employee.empName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6} xl={3}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={batchForm.status || "planned"}
                    onChange={(event) => setBatchForm({ ...batchForm, status: event.target.value })}
                  >
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="quality_check">Quality Check</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6} xl={3}>
                <Form.Group>
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={batchForm.startDate}
                    onChange={(event) => setBatchForm({ ...batchForm, startDate: event.target.value })}
                  />
                </Form.Group>
              </Col>
              {editingBatchId ? (
                <Col md={6} xl={3}>
                  <Form.Group>
                    <Form.Label>End Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={batchForm.endDate || ""}
                      onChange={(event) => setBatchForm({ ...batchForm, endDate: event.target.value })}
                    />
                  </Form.Group>
                </Col>
              ) : null}
              <Col md={12} xl={6}>
                <Form.Group>
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    value={batchForm.notes}
                    onChange={(event) => setBatchForm({ ...batchForm, notes: event.target.value })}
                    placeholder="Production instructions, reservation notes, or QC expectations"
                  />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Button type="submit" variant="success" disabled={isCreating || isUpdatingBatch}>
                  {editingBatchId
                    ? (isUpdatingBatch ? "Updating..." : "Update Batch")
                    : (isCreating ? "Creating..." : "Create Batch")}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <ClipboardData />
            <h5 className="mb-0">Batch Costing & Workflow</h5>
          </div>

          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Product</th>
                  <th>Progress</th>
                  <th>Cost</th>
                  <th>QC</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => {
                  const produced = toNumber(batch.quantityProduced);
                  const planned = toNumber(batch.quantityPlanned);
                  const progress = planned > 0 ? Math.min(100, Math.round((produced / planned) * 100)) : 0;

                  return (
                    <React.Fragment key={batch.batchId}>
                      <tr>
                        <td>
                          <div className="fw-bold">{batch.batchNo}</div>
                          <small className="text-muted">
                            {branchMap.get(String(batch.branchId)) || "Branch"} | {batch.status}
                          </small>
                        </td>
                        <td>{batch.productName || productMap.get(String(batch.productId)) || "Product"}</td>
                        <td>
                          <div>{produced} / {planned}</div>
                          <small className="text-muted">{progress}% complete</small>
                        </td>
                        <td>
                          <div className="fw-bold">{money(batch.costing?.totalCost)}</div>
                          <small className="text-muted">Unit {money(batch.costing?.costPerUnit)}</small>
                        </td>
                        <td>
                          <Badge bg={batch.qualityStatus === "approved" ? "success" : "warning"}>
                            {batch.qualityStatus || "pending"}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-2">
                            <Button size="sm" variant="outline-success" onClick={() => openAction("material", batch)}>
                              Material
                            </Button>
                            <Button size="sm" variant="outline-secondary" onClick={() => openAction("labor", batch)}>
                              Labor
                            </Button>
                            <Button size="sm" variant="outline-secondary" onClick={() => openAction("expense", batch)}>
                              Expense
                            </Button>
                            <Button size="sm" variant="success" onClick={() => openAction("output", batch)}>
                              Output
                            </Button>
                            <Button size="sm" variant="outline-primary" onClick={() => openAction("quality", batch)}>
                              QC
                            </Button>
                            <Button size="sm" variant="outline-dark" onClick={() => openAction("status", batch)}>
                              Status
                            </Button>
                            <Button size="sm" variant="outline-success" onClick={() => openDailyReport(batch)}>
                              <ClipboardData className="me-1" />
                              Daily Report
                            </Button>
                            <Button size="sm" variant="outline-primary" onClick={() => openEditBatch(batch)}>
                              <PencilSquare className="me-1" />
                              Edit
                            </Button>
                            <Button size="sm" variant="outline-danger" onClick={() => setBatchToDelete(batch)}>
                              <Trash className="me-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                      <tr className="production-batch-detail-row">
                        <td colSpan={6}>
                          <BatchResourcePanel
                            batch={batch}
                            money={money}
                            onEdit={openAction}
                            onDelete={handleDeleteLine}
                            isBusy={isDeletingMaterial || isDeletingLabor || isDeletingExpense || isDeletingOutput}
                          />
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </Table>
          </div>

          {!batches.length ? (
            <Alert variant="info" className="mb-0">
              No production batches have been created yet.
            </Alert>
          ) : null}
        </Card.Body>
      </Card>

      <Modal
        show={showActionModal}
        onHide={closeAction}
        centered
        dialogClassName="production-modal-shell production-batch-action-modal"
      >
        <Form onSubmit={handleActionSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{actionTitle(actionMode, Boolean(editingActionRecord))}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="text-muted">
              Batch <strong>{selectedBatch?.batchNo}</strong>
            </p>
            {actionMode === "material" ? (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Raw Material</Form.Label>
                  <Form.Select
                    value={actionForm.materialId}
                    onChange={(event) => setActionForm({ ...actionForm, materialId: event.target.value })}
                    required
                  >
                    <option value="">Select material</option>
                    {actionMaterials.map((material) => (
                      <option key={material.materialId} value={material.materialId}>
                        {material.name || material.materialName} - Available {material.Quantity || material.quantity || 0}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <NumberField label="Quantity Used" value={actionForm.quantity} onChange={(quantity) => setActionForm({ ...actionForm, quantity })} />
                <Form.Group className="mb-3">
                  <Form.Label>Usage Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={actionForm.notes}
                    onChange={(event) => setActionForm({ ...actionForm, notes: event.target.value })}
                    placeholder="Optional production notes, wastage reason, or approval reference"
                  />
                </Form.Group>
              </>
            ) : null}

            {actionMode === "labor" ? (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Worker</Form.Label>
                  <Form.Select
                    value={actionForm.employeeId}
                    onChange={(event) => setActionForm({ ...actionForm, employeeId: event.target.value })}
                  >
                    <option value="">No linked worker</option>
                    {actionEmployees.map((employee) => (
                      <option key={employee.empID} value={employee.empID}>
                        {employee.empName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Control value={actionForm.role} onChange={(event) => setActionForm({ ...actionForm, role: event.target.value })} />
                </Form.Group>
                <NumberField label="Hours Worked" value={actionForm.hoursWorked} onChange={(hoursWorked) => setActionForm({ ...actionForm, hoursWorked })} />
                <NumberField label="Labor Cost" value={actionForm.laborCost} onChange={(laborCost) => setActionForm({ ...actionForm, laborCost })} />
                <Row className="g-3">
                  <Col md={6}>
                    <NumberField label="Amount Paid" value={actionForm.amountPaid} onChange={(amountPaid) => setActionForm({ ...actionForm, amountPaid })} required={false} />
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Payroll Status</Form.Label>
                      <Form.Select
                        value={actionForm.paymentStatus}
                        onChange={(event) => setActionForm({ ...actionForm, paymentStatus: event.target.value })}
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={actionForm.paymentDate}
                    onChange={(event) => setActionForm({ ...actionForm, paymentDate: event.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Labor Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={actionForm.notes}
                    onChange={(event) => setActionForm({ ...actionForm, notes: event.target.value })}
                    placeholder="Optional work details, overtime notes, or payroll reference"
                  />
                </Form.Group>
              </>
            ) : null}

            {actionMode === "expense" ? (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Control value={actionForm.category} onChange={(event) => setActionForm({ ...actionForm, category: event.target.value })} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control value={actionForm.description} onChange={(event) => setActionForm({ ...actionForm, description: event.target.value })} />
                </Form.Group>
                <NumberField label="Amount" value={actionForm.amount} onChange={(amount) => setActionForm({ ...actionForm, amount })} />
              </>
            ) : null}

            {actionMode === "output" ? (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Finished Product</Form.Label>
                  <Form.Select
                    value={actionForm.productId}
                    onChange={(event) => setActionForm({ ...actionForm, productId: event.target.value })}
                    required
                  >
                    <option value="">Select product</option>
                    {actionProducts.map((product) => (
                      <option key={product.itemId} value={product.itemId}>
                        {product.itemName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <NumberField label="Produced Quantity" value={actionForm.outputQuantity} onChange={(outputQuantity) => setActionForm({ ...actionForm, outputQuantity })} />
                <NumberField label="Wastage Quantity" value={actionForm.wastageQuantity} onChange={(wastageQuantity) => setActionForm({ ...actionForm, wastageQuantity })} />
                <Form.Group className="mb-3">
                  <Form.Label>Output Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={actionForm.notes}
                    onChange={(event) => setActionForm({ ...actionForm, notes: event.target.value })}
                    placeholder="Optional batch output notes, QA handover, or inventory reference"
                  />
                </Form.Group>
              </>
            ) : null}

            {actionMode === "quality" ? (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Quality Status</Form.Label>
                  <Form.Select
                    value={actionForm.qualityStatus}
                    onChange={(event) => setActionForm({ ...actionForm, qualityStatus: event.target.value })}
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rework">Needs rework</option>
                    <option value="rejected">Rejected</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Quality Notes</Form.Label>
                  <Form.Control as="textarea" rows={3} value={actionForm.qualityNotes} onChange={(event) => setActionForm({ ...actionForm, qualityNotes: event.target.value })} />
                </Form.Group>
              </>
            ) : null}

            {actionMode === "status" ? (
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={actionForm.status}
                  onChange={(event) => setActionForm({ ...actionForm, status: event.target.value })}
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="quality_check">Quality Check</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={closeAction}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              disabled={
                isAddingMaterial ||
                isAddingLabor ||
                isAddingExpense ||
                isPostingOutput ||
                isUpdatingMaterial ||
                isUpdatingLabor ||
                isUpdatingExpense ||
                isUpdatingOutput ||
                isUpdatingQuality ||
                isUpdatingStatus
              }
            >
              {editingActionRecord ? "Update" : "Save"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={Boolean(dailyReportBatch)}
        onHide={closeDailyReport}
        centered
        size="xl"
        dialogClassName="production-modal-shell production-daily-report-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <ClipboardData className="me-2" />
            Daily Batch Report
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="production-daily-report-toolbar">
            <div>
              <div className="fw-bold">{dailyReportBatch?.batchNo || "Batch"}</div>
              <div className="text-muted small">
                {dailyReportBatch?.productName || productMap.get(String(dailyReportBatch?.productId)) || "Product"} | {dailyReportBatch?.status || "status"}
              </div>
            </div>
            <Form.Group className="production-daily-report-date">
              <Form.Label>Report Day</Form.Label>
              <Form.Control
                type="date"
                value={dailyReportDate}
                onChange={(event) => setDailyReportDate(event.target.value)}
              />
            </Form.Group>
          </div>

          <div className="production-daily-report-summary">
            <div>
              <span>Material Cost</span>
              <strong>{dailyReport.totals.materialCost}</strong>
            </div>
            <div>
              <span>Labor Cost</span>
              <strong>{dailyReport.totals.laborCost}</strong>
            </div>
            <div>
              <span>Amount Paid</span>
              <strong>{dailyReport.totals.amountPaid}</strong>
            </div>
            <div>
              <span>Expenses</span>
              <strong>{dailyReport.totals.expenseCost}</strong>
            </div>
            <div>
              <span>Output</span>
              <strong>{dailyReport.totals.outputQuantity}</strong>
            </div>
            <div>
              <span>Wastage</span>
              <strong>{dailyReport.totals.wastageQuantity}</strong>
            </div>
            <div>
              <span>Total Cost</span>
              <strong>{dailyReport.totals.totalCost}</strong>
            </div>
          </div>

          <Table responsive hover className="align-middle production-daily-report-table">
            <thead>
              <tr>
                <th>Section</th>
                <th>Item</th>
                <th>Qty / Hours</th>
                <th>Cost / Amount</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {dailyReport.rows.length ? (
                dailyReport.rows.map((row, index) => (
                  <tr key={`${row[0]}-${index}`}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    No activity was recorded for this batch on {dailyReportDate}.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={closeDailyReport}>
            Close
          </Button>
          <Button variant="outline-secondary" onClick={printDailyReport}>
            <Printer className="me-1" />
            Print
          </Button>
          <Button variant="outline-success" onClick={exportDailyReportCsv}>
            <FiletypeCsv className="me-1" />
            CSV
          </Button>
          <Button variant="success" onClick={exportDailyReportPdf}>
            <FileEarmarkPdf className="me-1" />
            PDF
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={Boolean(batchToDelete)} onHide={() => setBatchToDelete(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Production Batch</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Delete batch <strong>{batchToDelete?.batchNo}</strong>?
          </p>
          <Alert variant="warning" className="mb-0">
            Only batches with no recorded materials, labor, expenses, or output can be deleted.
            Active production history should be cancelled or completed instead.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setBatchToDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteBatch} disabled={isDeletingBatch}>
            {isDeletingBatch ? "Deleting..." : "Delete Batch"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function buildDailyBatchReport(batch, reportDate, money) {
  const materials = (Array.isArray(batch?.materials) ? batch.materials : []).filter((record) =>
    recordMatchesReportDate(record, reportDate)
  );
  const labor = (Array.isArray(batch?.labor) ? batch.labor : []).filter((record) =>
    recordMatchesReportDate(record, reportDate)
  );
  const expenses = (Array.isArray(batch?.expenses) ? batch.expenses : []).filter((record) =>
    recordMatchesReportDate(record, reportDate)
  );
  const outputs = (Array.isArray(batch?.outputs) ? batch.outputs : []).filter((record) =>
    recordMatchesReportDate(record, reportDate)
  );

  const materialCost = materials.reduce((total, row) => total + toNumber(row.totalCost), 0);
  const laborCost = labor.reduce((total, row) => total + toNumber(row.laborCost), 0);
  const amountPaid = labor.reduce((total, row) => total + toNumber(row.amountPaid), 0);
  const expenseCost = expenses.reduce((total, row) => total + toNumber(row.amount), 0);
  const outputQuantity = outputs.reduce((total, row) => total + toNumber(row.quantity), 0);
  const wastageQuantity = outputs.reduce((total, row) => total + toNumber(row.wastageQuantity), 0);

  const rows = [
    ...materials.map((row) => [
      "Raw Material",
      row.materialName || row.name || `Material #${row.materialId}`,
      `${toNumber(row.quantity)} ${row.unitOfMeasure || ""}`.trim(),
      money(row.totalCost),
      row.notes || row.materialCode || "",
    ]),
    ...labor.map((row) => [
      "Labor & Payroll",
      row.employeeName || row.role || "Unassigned worker",
      `${toNumber(row.hoursWorked)} hrs`,
      `${money(row.laborCost)} | Paid ${money(row.amountPaid)} | ${row.paymentStatus || "unpaid"}`,
      [row.role, row.paymentDate ? `Paid on ${row.paymentDate}` : "", row.notes].filter(Boolean).join(" | "),
    ]),
    ...expenses.map((row) => [
      "Expense",
      row.category || "Production",
      "-",
      money(row.amount),
      row.description || "",
    ]),
    ...outputs.map((row) => [
      "Finished Output",
      row.productName || `Product #${row.productId}`,
      `${toNumber(row.quantity)} produced | ${toNumber(row.wastageQuantity)} wastage`,
      money(row.totalCost),
      row.notes || "",
    ]),
  ];

  const fileSafeBatch = safeText(batch?.batchNo || batch?.batchId || "batch").replace(/[^a-z0-9_-]+/gi, "_");

  return {
    fileName: `daily_batch_report_${fileSafeBatch}_${reportDate || today()}`,
    rows,
    totals: {
      materialCost: money(materialCost),
      laborCost: money(laborCost),
      amountPaid: money(amountPaid),
      expenseCost: money(expenseCost),
      outputQuantity: outputQuantity.toLocaleString(undefined, { maximumFractionDigits: 3 }),
      wastageQuantity: wastageQuantity.toLocaleString(undefined, { maximumFractionDigits: 3 }),
      totalCost: money(materialCost + laborCost + expenseCost),
    },
  };
}

function Metric({ title, value, note }) {
  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Body className="p-3">
        <div className="d-flex align-items-start gap-2">
          <Hammer className="text-success mt-1" />
          <div>
            <div className="text-muted small">{title}</div>
            <div className="h5 fw-bold mb-1">{value}</div>
            <div className="text-muted small">{note}</div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

function BatchResourcePanel({ batch, money, onEdit, onDelete, isBusy }) {
  const materials = Array.isArray(batch?.materials) ? batch.materials : [];
  const labor = Array.isArray(batch?.labor) ? batch.labor : [];
  const expenses = Array.isArray(batch?.expenses) ? batch.expenses : [];
  const outputs = Array.isArray(batch?.outputs) ? batch.outputs : [];

  return (
    <div className="production-batch-resource-panel">
      <div className="production-batch-resource-header">
        <div>
          <div className="fw-bold">Batch Resource Control</div>
          <div className="text-muted small">Review and correct the live resources assigned to this batch.</div>
        </div>
        <Badge bg="light" text="dark">
          {materials.length + labor.length + expenses.length + outputs.length} records
        </Badge>
      </div>

      <div className="production-batch-resource-grid">
        <ResourceTable
          title="Raw Materials"
          emptyText="No raw materials assigned."
          rows={materials}
          columns={[
            {
              label: "Material",
              render: (row) => (
                <>
                  <div className="fw-semibold">{row.materialName || row.name || `Material #${row.materialId}`}</div>
                  <div className="text-muted small">{row.materialCode || row.rawMaterialBarcode || "No code"}</div>
                </>
              ),
            },
            { label: "Qty", render: (row) => `${toNumber(row.quantity)} ${row.unitOfMeasure || ""}`.trim() },
            { label: "Cost", render: (row) => money(row.totalCost) },
          ]}
          onEdit={(row) => onEdit("material", batch, row)}
          onDelete={(row) => onDelete("material", row)}
          isBusy={isBusy}
        />

        <ResourceTable
          title="Employees & Payroll"
          emptyText="No employee or payroll lines recorded."
          rows={labor}
          columns={[
            {
              label: "Worker",
              render: (row) => (
                <>
                  <div className="fw-semibold">{row.employeeName || row.role || "Unassigned worker"}</div>
                  <div className="text-muted small">{row.role || "No role"}</div>
                </>
              ),
            },
            { label: "Hours", render: (row) => toNumber(row.hoursWorked) },
            {
              label: "Payroll",
              render: (row) => (
                <>
                  <div>{money(row.laborCost)}</div>
                  <span className={`production-payroll-chip production-payroll-${row.paymentStatus || "unpaid"}`}>
                    {row.paymentStatus || "unpaid"} {toNumber(row.amountPaid) ? `- ${money(row.amountPaid)}` : ""}
                  </span>
                </>
              ),
            },
          ]}
          onEdit={(row) => onEdit("labor", batch, row)}
          onDelete={(row) => onDelete("labor", row)}
          isBusy={isBusy}
        />

        <ResourceTable
          title="Expenses"
          emptyText="No production expenses recorded."
          rows={expenses}
          columns={[
            { label: "Category", render: (row) => row.category || "Production" },
            { label: "Description", render: (row) => row.description || "No description" },
            { label: "Amount", render: (row) => money(row.amount) },
          ]}
          onEdit={(row) => onEdit("expense", batch, row)}
          onDelete={(row) => onDelete("expense", row)}
          isBusy={isBusy}
        />

        <ResourceTable
          title="Finished Output"
          emptyText="No finished goods posted."
          rows={outputs}
          columns={[
            { label: "Product", render: (row) => row.productName || `Product #${row.productId}` },
            { label: "Produced", render: (row) => toNumber(row.quantity) },
            { label: "Wastage", render: (row) => toNumber(row.wastageQuantity) },
            { label: "Value", render: (row) => money(row.totalCost) },
          ]}
          onEdit={(row) => onEdit("output", batch, row)}
          onDelete={(row) => onDelete("output", row)}
          isBusy={isBusy}
        />
      </div>
    </div>
  );
}

function ResourceTable({ title, rows, columns, emptyText, onEdit, onDelete, isBusy }) {
  return (
    <div className="production-batch-resource-card">
      <div className="production-batch-resource-card-title">
        <span>{title}</span>
        <Badge bg="light" text="dark">
          {rows.length}
        </Badge>
      </div>
      {rows.length ? (
        <Table responsive size="sm" className="align-middle mb-0 production-resource-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.label}>{column.label}</th>
              ))}
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id || index}>
                {columns.map((column) => (
                  <td key={column.label}>{column.render(row)}</td>
                ))}
                <td>
                  <div className="d-flex justify-content-end gap-2">
                    <Button size="sm" variant="outline-primary" onClick={() => onEdit(row)} disabled={isBusy}>
                      <PencilSquare />
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => onDelete(row)} disabled={isBusy}>
                      <Trash />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <div className="production-batch-resource-empty">{emptyText}</div>
      )}
    </div>
  );
}

function NumberField({ label, value, onChange, required = true }) {
  return (
    <Form.Group className="mb-3">
      <Form.Label>{label}</Form.Label>
      <Form.Control
        type="number"
        min="0"
        step="0.001"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </Form.Group>
  );
}

function actionTitle(mode, isEditing = false) {
  const labels = {
    material: isEditing ? "Edit Material Usage" : "Record Material Usage",
    labor: isEditing ? "Edit Labor & Payroll" : "Add Labor & Payroll",
    expense: isEditing ? "Edit Production Expense" : "Add Production Expense",
    output: isEditing ? "Edit Finished Goods" : "Post Finished Goods",
    quality: "Quality Check",
    status: "Update Batch Status",
  };

  const icons = {
    material: <ClipboardData className="me-2" />,
    labor: <Hammer className="me-2" />,
    expense: <ClipboardData className="me-2" />,
    output: <SendCheck className="me-2" />,
    quality: <ClipboardCheck className="me-2" />,
    status: <ClipboardData className="me-2" />,
  };

  return (
    <>
      {icons[mode]}
      {labels[mode] || "Batch Action"}
    </>
  );
}
