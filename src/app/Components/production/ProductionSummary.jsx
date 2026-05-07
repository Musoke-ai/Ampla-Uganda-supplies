import React, { useMemo, useState } from "react";
import { Alert, Badge, Button, Col, Form, Modal, ProgressBar, Row, Table } from "react-bootstrap";
import {
  BarChartLine,
  Boxes,
  CashCoin,
  ClipboardCheck,
  Download,
  ExclamationTriangleFill,
  GearWideConnected,
  GraphUpArrow,
  SendCheck,
} from "react-bootstrap-icons";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

import { selectBranches, useGetBranchesQuery } from "../../features/api/branchesSlice";
import {
  selectProductionBatches,
  useGetProductionBatchesQuery,
  usePostProductionBatchOutputMutation,
} from "../../features/api/productionBatchSlice";
import { selectRawMaterials, useGetRawMaterialsQuery } from "../../features/api/rawmaterialsSlice";
import { selectStock, useGetStockQuery } from "../../features/stock/stockSlice";
import { useSettings } from "../Settings";

const palette = {
  green: "#2f8f57",
  greenSoft: "#e8f5ec",
  blue: "#2f80ed",
  blueSoft: "#e8f1ff",
  amber: "#f59e0b",
  amberSoft: "#fff4df",
  red: "#ef4444",
  redSoft: "#ffebeb",
  text: "#15202b",
  muted: "#6f7d8c",
  border: "#e7efe9",
};

const statusLabels = {
  planned: "Planned",
  in_progress: "In Progress",
  quality_check: "Quality Check",
  completed: "Completed",
  cancelled: "Cancelled",
};

const toNumber = (value) => Number(value || 0);
const toDateKey = (value) => String(value || "").slice(0, 10);
const percent = (value, total) => (total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0);

export default function ProductionSummary() {
  const { settings } = useSettings();
  const currency = settings?.currency !== "none" ? settings?.currency : "UGX";
  const batches = useSelector(selectProductionBatches) ?? [];
  const products = useSelector(selectStock) ?? [];
  const branches = useSelector(selectBranches) ?? [];
  const rawMaterials = useSelector(selectRawMaterials) ?? [];

  const { isLoading: isLoadingBatches, isError, error } = useGetProductionBatchesQuery();
  const [postOutput, { isLoading: isPostingOutput }] = usePostProductionBatchOutputMutation();
  useGetStockQuery();
  useGetBranchesQuery();
  useGetRawMaterialsQuery();

  const [filters, setFilters] = useState({
    status: "all",
    branchId: "all",
    productId: "all",
    startDate: "",
    endDate: "",
  });
  const [quickOutput, setQuickOutput] = useState({
    show: false,
    batch: null,
    quantity: "",
    wastageQuantity: "",
  });

  const productMap = useMemo(
    () => new Map(products.map((product) => [String(product.itemId), product])),
    [products]
  );

  const branchMap = useMemo(
    () => new Map(branches.map((branch) => [String(branch.branchId), branch.branchName])),
    [branches]
  );

  const filteredBatches = useMemo(
    () =>
      batches.filter((batch) => {
        const dateKey = toDateKey(batch.startDate || batch.createdAt);
        if (filters.status !== "all" && String(batch.status || "planned") !== filters.status) return false;
        if (filters.branchId !== "all" && String(batch.branchId || "") !== filters.branchId) return false;
        if (filters.productId !== "all" && String(batch.productId || "") !== filters.productId) return false;
        if (filters.startDate && (!dateKey || dateKey < filters.startDate)) return false;
        if (filters.endDate && (!dateKey || dateKey > filters.endDate)) return false;
        return true;
      }),
    [batches, filters]
  );

  const lowMaterials = useMemo(
    () =>
      rawMaterials
        .map((material) => {
          const quantity = toNumber(material.Quantity ?? material.quantity);
          const reorderLevel = toNumber(material.reorderLevel) || 10;
          const unitPrice = toNumber(material.unitPrice);
          return {
            ...material,
            quantity,
            reorderLevel,
            value: quantity * unitPrice,
            gap: Math.max(reorderLevel - quantity, 0),
          };
        })
        .filter((material) => material.quantity <= material.reorderLevel)
        .sort((a, b) => a.quantity - b.quantity),
    [rawMaterials]
  );

  const summary = useMemo(() => {
    const base = {
      totalBatches: filteredBatches.length,
      planned: 0,
      inProgress: 0,
      qualityCheck: 0,
      completed: 0,
      cancelled: 0,
      plannedQty: 0,
      producedQty: 0,
      wastageQty: 0,
      materialCost: 0,
      laborCost: 0,
      expenseCost: 0,
      totalCost: 0,
      outputValue: 0,
    };

    filteredBatches.forEach((batch) => {
      const status = String(batch.status || "planned");
      if (status === "planned") base.planned += 1;
      if (status === "in_progress") base.inProgress += 1;
      if (status === "quality_check") base.qualityCheck += 1;
      if (status === "completed") base.completed += 1;
      if (status === "cancelled") base.cancelled += 1;

      const produced = toNumber(batch.costing?.outputQuantity || batch.quantityProduced);
      const product = productMap.get(String(batch.productId));
      const retailPrice = toNumber(product?.itemLeastPrice);

      base.plannedQty += toNumber(batch.quantityPlanned);
      base.producedQty += produced;
      base.wastageQty += toNumber(batch.costing?.wastageQuantity || batch.wastageQuantity);
      base.materialCost += toNumber(batch.costing?.materialCost);
      base.laborCost += toNumber(batch.costing?.laborCost);
      base.expenseCost += toNumber(batch.costing?.expenseCost);
      base.totalCost += toNumber(batch.costing?.totalCost);
      base.outputValue += produced * retailPrice;
    });

    base.estimatedMargin = base.outputValue - base.totalCost;
    base.efficiency = percent(base.producedQty, base.plannedQty);
    base.wastageRate = percent(base.wastageQty, base.producedQty + base.wastageQty);

    return base;
  }, [filteredBatches, productMap]);

  const trendData = useMemo(() => {
    const grouped = new Map();

    filteredBatches.forEach((batch) => {
      const dateKey = toDateKey(batch.startDate || batch.createdAt) || "Unscheduled";
      const current = grouped.get(dateKey) || { date: dateKey, produced: 0, cost: 0 };
      current.produced += toNumber(batch.costing?.outputQuantity || batch.quantityProduced);
      current.cost += toNumber(batch.costing?.totalCost);
      grouped.set(dateKey, current);
    });

    return Array.from(grouped.values())
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .slice(-7);
  }, [filteredBatches]);

  const topProducts = useMemo(() => {
    const grouped = new Map();

    filteredBatches.forEach((batch) => {
      const productId = String(batch.productId || "");
      const product = productMap.get(productId);
      const name = batch.productName || product?.itemName || "Unassigned product";
      const current = grouped.get(productId || name) || { name, produced: 0, cost: 0 };
      current.produced += toNumber(batch.costing?.outputQuantity || batch.quantityProduced);
      current.cost += toNumber(batch.costing?.totalCost);
      grouped.set(productId || name, current);
    });

    return Array.from(grouped.values())
      .sort((a, b) => b.produced - a.produced)
      .slice(0, 5);
  }, [filteredBatches, productMap]);

  const costBreakdown = [
    { label: "Materials", value: summary.materialCost, color: palette.green },
    { label: "Labor", value: summary.laborCost, color: palette.blue },
    { label: "Expenses", value: summary.expenseCost, color: palette.amber },
  ];

  const money = (value) =>
    `${currency} ${Number(value || 0).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;

  const number = (value) =>
    Number(value || 0).toLocaleString(undefined, {
      maximumFractionDigits: 3,
    });

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: "all",
      branchId: "all",
      productId: "all",
      startDate: "",
      endDate: "",
    });
  };

  const openQuickOutput = (batch) => {
    const planned = toNumber(batch.quantityPlanned);
    const produced = toNumber(batch.costing?.outputQuantity || batch.quantityProduced);
    const remaining = Math.max(planned - produced, 0);

    setQuickOutput({
      show: true,
      batch,
      quantity: remaining > 0 ? String(remaining) : "",
      wastageQuantity: "",
    });
  };

  const closeQuickOutput = () => {
    setQuickOutput({
      show: false,
      batch: null,
      quantity: "",
      wastageQuantity: "",
    });
  };

  const handleQuickOutputSubmit = async (event) => {
    event.preventDefault();

    const batch = quickOutput.batch;
    const quantity = toNumber(quickOutput.quantity);
    const productId = batch?.productId;

    if (!batch?.batchId || !productId) {
      toast.error("This batch needs a finished product before output can be posted.");
      return;
    }

    if (quantity <= 0) {
      toast.error("Produced quantity must be greater than zero.");
      return;
    }

    try {
      await postOutput({
        batchId: batch.batchId,
        productId,
        quantity,
        wastageQuantity: toNumber(quickOutput.wastageQuantity),
      }).unwrap();
      toast.success("Produced quantity added to the batch.");
      closeQuickOutput();
    } catch (err) {
      toast.error(err?.data?.message || err?.error || "Produced quantity could not be added.");
    }
  };

  const exportCsv = () => {
    const headers = ["Batch", "Product", "Branch", "Status", "Progress", "Produced", "Wastage", "Total Cost", "Unit Cost"];
    const rows = filteredBatches.map((batch) => batchExportRow(batch, productMap, branchMap, money));
    const escapeCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
    const link = document.createElement("a");
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = `production-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.text("Production Summary", 14, 16);
    doc.setFontSize(10);
    doc.text(`Batches: ${summary.totalBatches}`, 14, 24);
    doc.text(`Produced: ${number(summary.producedQty)} / Planned: ${number(summary.plannedQty)}`, 14, 30);
    doc.text(`Total Cost: ${money(summary.totalCost)}`, 14, 36);
    doc.autoTable({
      startY: 44,
      head: [["Batch", "Product", "Branch", "Status", "Progress", "Produced", "Wastage", "Total Cost", "Unit Cost"]],
      body: filteredBatches.map((batch) => batchExportRow(batch, productMap, branchMap, money)),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [47, 143, 87] },
    });
    doc.save(`production-summary-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (isError) {
    return (
      <Alert variant="danger" className="mb-0 production-safe-alert">
        {error?.data?.message || error?.error || "Production summary could not be loaded."}
      </Alert>
    );
  }

  return (
    <div className="production-summary-stack">
      {isLoadingBatches ? (
        <div className="production-summary-loading">
          <ProgressBar animated now={100} />
        </div>
      ) : null}

      <Row className="g-3">
        <Col md={6} xl={3}>
          <SummaryMetric
            icon={<GearWideConnected />}
            title="Batches"
            value={summary.totalBatches}
            note={`${summary.inProgress} active, ${summary.completed} completed`}
            accent={palette.greenSoft}
            color={palette.green}
          />
        </Col>
        <Col md={6} xl={3}>
          <SummaryMetric
            icon={<ClipboardCheck />}
            title="Output Efficiency"
            value={`${summary.efficiency}%`}
            note={`${number(summary.producedQty)} of ${number(summary.plannedQty)} planned`}
            accent={palette.blueSoft}
            color={palette.blue}
          />
        </Col>
        <Col md={6} xl={3}>
          <SummaryMetric
            icon={<CashCoin />}
            title="Production Cost"
            value={money(summary.totalCost)}
            note={`Unit average ${money(summary.producedQty > 0 ? summary.totalCost / summary.producedQty : 0)}`}
            accent={palette.amberSoft}
            color={palette.amber}
          />
        </Col>
        <Col md={6} xl={3}>
          <SummaryMetric
            icon={<GraphUpArrow />}
            title="Estimated Margin"
            value={money(summary.estimatedMargin)}
            note={`${summary.wastageRate}% wastage rate`}
            accent={summary.estimatedMargin >= 0 ? palette.greenSoft : palette.redSoft}
            color={summary.estimatedMargin >= 0 ? palette.green : palette.red}
          />
        </Col>
      </Row>

      <section className="production-summary-panel">
        <div className="production-summary-panel-head">
          <div>
            <h4 className="workspace-section-title">Production Filters</h4>
            <p className="workspace-section-copy">Review production by status, branch, product, and date.</p>
          </div>
          <div className="production-summary-actions">
            <Button variant="light" onClick={clearFilters}>Clear</Button>
            <Button variant="outline-success" onClick={exportCsv} disabled={!filteredBatches.length}>
              <Download className="me-2" /> CSV
            </Button>
            <Button variant="success" onClick={exportPdf} disabled={!filteredBatches.length}>
              <Download className="me-2" /> PDF
            </Button>
          </div>
        </div>

        <div className="production-summary-filter-grid">
          <Form.Group>
            <Form.Label>Status</Form.Label>
            <Form.Select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
              <option value="all">All statuses</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label>Branch</Form.Label>
            <Form.Select value={filters.branchId} onChange={(event) => updateFilter("branchId", event.target.value)}>
              <option value="all">All branches</option>
              {branches.map((branch) => (
                <option key={branch.branchId} value={branch.branchId}>{branch.branchName}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label>Product</Form.Label>
            <Form.Select value={filters.productId} onChange={(event) => updateFilter("productId", event.target.value)}>
              <option value="all">All products</option>
              {products.map((product) => (
                <option key={product.itemId} value={product.itemId}>{product.itemName}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label>Start Date</Form.Label>
            <Form.Control type="date" value={filters.startDate} onChange={(event) => updateFilter("startDate", event.target.value)} />
          </Form.Group>
          <Form.Group>
            <Form.Label>End Date</Form.Label>
            <Form.Control type="date" value={filters.endDate} onChange={(event) => updateFilter("endDate", event.target.value)} />
          </Form.Group>
        </div>
      </section>

      <Row className="g-3">
        <Col xl={4}>
          <section className="production-summary-panel h-100">
            <h4 className="workspace-section-title">Status Mix</h4>
            <div className="production-summary-status-list">
              <StatusBar label="Planned" value={summary.planned} total={summary.totalBatches} color={palette.muted} />
              <StatusBar label="In Progress" value={summary.inProgress} total={summary.totalBatches} color={palette.blue} />
              <StatusBar label="Quality Check" value={summary.qualityCheck} total={summary.totalBatches} color={palette.amber} />
              <StatusBar label="Completed" value={summary.completed} total={summary.totalBatches} color={palette.green} />
              <StatusBar label="Cancelled" value={summary.cancelled} total={summary.totalBatches} color={palette.red} />
            </div>
          </section>
        </Col>
        <Col xl={4}>
          <section className="production-summary-panel h-100">
            <h4 className="workspace-section-title">Cost Breakdown</h4>
            <div className="production-summary-cost-list">
              {costBreakdown.map((item) => (
                <StatusBar
                  key={item.label}
                  label={item.label}
                  value={money(item.value)}
                  totalLabel={`${percent(item.value, summary.totalCost)}%`}
                  barValue={percent(item.value, summary.totalCost)}
                  color={item.color}
                />
              ))}
            </div>
          </section>
        </Col>
        <Col xl={4}>
          <section className="production-summary-panel h-100">
            <div className="production-summary-risk-head">
              <h4 className="workspace-section-title">Material Readiness</h4>
              {lowMaterials.length ? (
                <Badge bg="warning" text="dark">{lowMaterials.length} low</Badge>
              ) : (
                <Badge bg="success">Ready</Badge>
              )}
            </div>
            <div className="production-summary-risk-list">
              {lowMaterials.slice(0, 5).map((material) => (
                <div key={material.materialId} className="production-summary-risk-item">
                  <div>
                    <strong>{material.name || material.materialName || "Raw material"}</strong>
                    <span>{number(material.quantity)} available | reorder at {number(material.reorderLevel)}</span>
                  </div>
                  <ExclamationTriangleFill />
                </div>
              ))}
              {!lowMaterials.length ? (
                <div className="production-summary-empty">Raw materials are above their reorder levels.</div>
              ) : null}
            </div>
          </section>
        </Col>
      </Row>

      <Row className="g-3">
        <Col xl={7}>
          <section className="production-summary-panel h-100">
            <div className="production-summary-panel-head">
              <div>
                <h4 className="workspace-section-title">Production Trend</h4>
                <p className="workspace-section-copy">Last recorded production dates in the current filter.</p>
              </div>
              <BarChartLine className="text-success" />
            </div>
            <div className="production-summary-chart">
              {trendData.map((day) => (
                <div key={day.date} className="production-summary-chart-row">
                  <span>{day.date}</span>
                  <div className="production-summary-chart-track">
                    <div
                      className="production-summary-chart-bar"
                      style={{ width: `${percent(day.produced, Math.max(...trendData.map((item) => item.produced), 1))}%` }}
                    />
                  </div>
                  <strong>{number(day.produced)}</strong>
                </div>
              ))}
              {!trendData.length ? <div className="production-summary-empty">No batch output in this range.</div> : null}
            </div>
          </section>
        </Col>
        <Col xl={5}>
          <section className="production-summary-panel h-100">
            <h4 className="workspace-section-title">Top Produced Products</h4>
            <div className="production-summary-product-list">
              {topProducts.map((product) => (
                <div key={product.name} className="production-summary-product-row">
                  <Boxes />
                  <div>
                    <strong>{product.name}</strong>
                    <span>{number(product.produced)} produced | {money(product.cost)} cost</span>
                  </div>
                </div>
              ))}
              {!topProducts.length ? <div className="production-summary-empty">No produced products yet.</div> : null}
            </div>
          </section>
        </Col>
      </Row>

      <section className="production-summary-panel">
        <div className="production-summary-panel-head">
          <div>
            <h4 className="workspace-section-title">Batch Summary</h4>
            <p className="workspace-section-copy">{filteredBatches.length} batch records in the current view.</p>
          </div>
        </div>
        <div className="production-table-scroll">
          <Table hover responsive className="production-modern-table align-middle mb-0">
            <thead>
              <tr>
                <th>Batch</th>
                <th>Product</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Cost</th>
                <th>QC</th>
                <th>Quick Add</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.slice(0, 20).map((batch) => {
                const planned = toNumber(batch.quantityPlanned);
                const produced = toNumber(batch.costing?.outputQuantity || batch.quantityProduced);
                const progress = percent(produced, planned);

                return (
                  <tr key={batch.batchId}>
                    <td>
                      <strong>{batch.batchNo}</strong>
                      <small className="d-block text-muted">{toDateKey(batch.startDate || batch.createdAt) || "No date"}</small>
                    </td>
                    <td>{batch.productName || productMap.get(String(batch.productId))?.itemName || "Unassigned product"}</td>
                    <td>{branchMap.get(String(batch.branchId)) || "Unassigned"}</td>
                    <td><StatusBadge status={batch.status} /></td>
                    <td>
                      <div className="production-summary-progress-copy">{number(produced)} / {number(planned)}</div>
                      <ProgressBar now={progress} />
                    </td>
                    <td>
                      <strong>{money(batch.costing?.totalCost)}</strong>
                      <small className="d-block text-muted">Unit {money(batch.costing?.costPerUnit)}</small>
                    </td>
                    <td>
                      <Badge bg={batch.qualityStatus === "approved" ? "success" : "warning"} text={batch.qualityStatus === "approved" ? undefined : "dark"}>
                        {batch.qualityStatus || "pending"}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="success"
                        className="production-summary-output-button"
                        disabled={String(batch.status || "") === "cancelled" || !batch.productId}
                        onClick={() => openQuickOutput(batch)}
                      >
                        <SendCheck className="me-1" />
                        Add Qty
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
        {!filteredBatches.length ? (
          <div className="production-summary-empty production-summary-empty-tall">
            No production batches match the current filters.
          </div>
        ) : null}
      </section>

      <Modal
        show={quickOutput.show}
        onHide={closeQuickOutput}
        centered
        dialogClassName="production-modal-shell production-summary-output-modal"
      >
        <Form onSubmit={handleQuickOutputSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>
              <SendCheck className="me-2" />
              Add Produced Quantity
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="production-summary-output-context">
              <strong>{quickOutput.batch?.batchNo || "Production batch"}</strong>
              <span>
                {quickOutput.batch?.productName ||
                  productMap.get(String(quickOutput.batch?.productId))?.itemName ||
                  "Finished product"}
              </span>
              <small>
                Current progress:{" "}
                {number(toNumber(quickOutput.batch?.costing?.outputQuantity || quickOutput.batch?.quantityProduced))} /{" "}
                {number(quickOutput.batch?.quantityPlanned)}
              </small>
            </div>

            {!quickOutput.batch?.productId ? (
              <Alert variant="warning" className="production-safe-alert">
                Select a finished product on this batch before posting output.
              </Alert>
            ) : null}

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Produced Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={quickOutput.quantity}
                    onChange={(event) =>
                      setQuickOutput((current) => ({ ...current, quantity: event.target.value }))
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Wastage Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.001"
                    value={quickOutput.wastageQuantity}
                    onChange={(event) =>
                      setQuickOutput((current) => ({ ...current, wastageQuantity: event.target.value }))
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={closeQuickOutput}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              disabled={isPostingOutput || !quickOutput.batch?.productId}
            >
              {isPostingOutput ? "Posting..." : "Add Produced Qty"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

function SummaryMetric({ icon, title, value, note, accent, color }) {
  return (
    <div className="production-summary-metric">
      <span className="production-summary-metric-icon" style={{ backgroundColor: accent, color }}>{icon}</span>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </div>
  );
}

function StatusBar({ label, value, total, color, totalLabel, barValue }) {
  const width = barValue ?? percent(value, total);

  return (
    <div className="production-summary-status-row">
      <div className="production-summary-status-copy">
        <span>{label}</span>
        <strong>{totalLabel || value}</strong>
      </div>
      <div className="production-summary-status-track">
        <div className="production-summary-status-fill" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "planned");
  const variants = {
    planned: "secondary",
    in_progress: "primary",
    quality_check: "warning",
    completed: "success",
    cancelled: "danger",
  };

  return (
    <Badge bg={variants[normalized] || "secondary"} text={normalized === "quality_check" ? "dark" : undefined}>
      {statusLabels[normalized] || normalized}
    </Badge>
  );
}

function batchExportRow(batch, productMap, branchMap, money) {
  const planned = toNumber(batch.quantityPlanned);
  const produced = toNumber(batch.costing?.outputQuantity || batch.quantityProduced);

  return [
    batch.batchNo,
    batch.productName || productMap.get(String(batch.productId))?.itemName || "Unassigned product",
    branchMap.get(String(batch.branchId)) || "Unassigned",
    statusLabels[batch.status] || batch.status || "Planned",
    `${percent(produced, planned)}%`,
    produced,
    toNumber(batch.costing?.wastageQuantity || batch.wastageQuantity),
    money(batch.costing?.totalCost),
    money(batch.costing?.costPerUnit),
  ];
}
