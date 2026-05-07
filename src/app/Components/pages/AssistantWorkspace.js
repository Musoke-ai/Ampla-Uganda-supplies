import React, { useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Stack,
  Table,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BoxSeam,
  CashStack,
  CheckCircle,
  ClipboardData,
  Cpu,
  Database,
  LightningCharge,
  People,
  PlayCircle,
  Search,
  Stars,
  Tools,
  XCircle,
} from "react-bootstrap-icons";

import {
  useCancelAgentDraftMutation,
  useConfirmAgentDraftMutation,
  useExecuteAgentDraftMutation,
  useGetAgentBriefingQuery,
  useGetAgentToolsQuery,
  useListAgentDraftsQuery,
  useSendAgentMessageMutation,
} from "../../features/api/agentSlice";
import TypewriterResponse from "../misc/TypewriterResponse";
import "../misc/agentTypewriter.css";
import "./WorkspacePages.css";

const AGENT_NAME = "Ampla Copilot";

const palette = {
  green: "#2f8f57",
  greenSoft: "#e8f5ec",
  blue: "#2f80ed",
  blueSoft: "#e8f1ff",
  amberSoft: "#fff4df",
};

const quickPrompts = [
  "Which items are low in stock right now?",
  "What is our total inventory value?",
  "Check stock for cement",
  "Show me products that need restocking first",
  "Who are our top customers by sales?",
  "Give me today's sales summary",
  "What is the current production overview?",
  "Which raw materials are running low?",
  "Draft a reorder list",
  "Draft stock adjustment product: cement to 20",
];

const starterSessions = [
  { title: "Low Stock Review", subtitle: "Inventory focus" },
  { title: "Stock Value Check", subtitle: "Daily overview" },
  { title: "Product Search", subtitle: "Find a specific item fast" },
  { title: "Sales Snapshot", subtitle: "Check today's revenue and volume" },
  { title: "Production Pulse", subtitle: "Orders and raw materials status" },
];

const toolCategoryLabels = {
  inventory: "Inventory",
  customers: "Customers",
  sales: "Sales",
  production: "Production",
  reports: "Reports",
  draft_actions: "Draft Actions",
};

const initialAssistantMessage = {
  id: "assistant-welcome",
  role: "assistant",
  text:
    "I can help with inventory, customers, sales, production orders, and raw materials. Ask a business question and I will answer from live system data.",
  payload: null,
};

const formatCurrency = (value) => {
  const numericValue = Number(value ?? 0);
  if (!Number.isFinite(numericValue)) return "UGX 0";

  return `UGX ${numericValue.toLocaleString()}`;
};

const formatNumber = (value) => {
  const numericValue = Number(value ?? 0);
  if (!Number.isFinite(numericValue)) return "0";

  return numericValue.toLocaleString();
};

const formatDateTime = (value) => {
  if (!value) return "No date available";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return String(value);

  return parsedDate.toLocaleString("en-UG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getToolConfig = (tool) => {
  switch (tool) {
    case "get_low_stock_products":
      return {
        title: "Low Stock Products",
        copy: "Products at or below the active restock threshold.",
        route: "/home/inventory",
        routeLabel: "Open inventory",
        scope: ["Inventory", "Restocking"],
      };
    case "search_product_stock":
      return {
        title: "Product Stock Search",
        copy: "Live inventory matches for the product you asked about.",
        route: "/home/inventory",
        routeLabel: "Review products",
        scope: ["Inventory", "Product lookup"],
      };
    case "get_inventory_value":
      return {
        title: "Inventory Value",
        copy: "A cost and selling value view across the current product catalog.",
        route: "/home/inventory",
        routeLabel: "Open inventory",
        scope: ["Inventory", "Stock value"],
      };
    case "search_customers":
      return {
        title: "Customer Matches",
        copy: "Matched customers from the current customer records.",
        route: "/home/customers",
        routeLabel: "Open customers",
        scope: ["Customers", "Contact search"],
      };
    case "get_top_customers_by_sales":
      return {
        title: "Top Customers By Sales",
        copy: "Highest-value customers based on recorded sales history.",
        route: "/home/customers",
        routeLabel: "Review customers",
        scope: ["Customers", "Sales"],
      };
    case "get_sales_summary":
      return {
        title: "Sales Summary",
        copy: "A sales snapshot from live transactions in the current period.",
        route: "/home/sales",
        routeLabel: "Open sales",
        scope: ["Sales", "Revenue"],
      };
    case "search_sales_by_product":
      return {
        title: "Sales By Product",
        copy: "Recent sales lines tied to the requested product.",
        route: "/home/sales",
        routeLabel: "Open sales",
        scope: ["Sales", "Product performance"],
      };
    case "get_production_overview":
      return {
        title: "Production Overview",
        copy: "A combined view of production orders and raw material readiness.",
        route: "/home/production",
        routeLabel: "Open production",
        scope: ["Production", "Operations"],
      };
    case "search_production_orders":
      return {
        title: "Production Orders",
        copy: "Production orders that match the requested product, customer, or note.",
        route: "/home/production",
        routeLabel: "Review production",
        scope: ["Production", "Orders"],
      };
    case "get_low_stock_raw_materials":
      return {
        title: "Low Stock Raw Materials",
        copy: "Materials that need attention before they block production.",
        route: "/home/production",
        routeLabel: "Open production",
        scope: ["Production", "Raw materials"],
      };
    case "draft_reorder_list":
      return {
        title: "Draft Reorder List",
        copy: "A reviewable reorder list prepared by Copilot.",
        route: "/home/inventory",
        routeLabel: "Open inventory",
        scope: ["Draft", "Inventory"],
      };
    case "draft_stock_adjustment":
      return {
        title: "Draft Stock Adjustment",
        copy: "A proposed stock change that must be confirmed before execution.",
        route: "/home/inventory",
        routeLabel: "Review products",
        scope: ["Draft", "Inventory"],
      };
    case "draft_invoice":
      return {
        title: "Draft Invoice",
        copy: "A proposed invoice draft. No sale has been posted.",
        route: "/home/sales",
        routeLabel: "Open sales",
        scope: ["Draft", "Sales"],
      };
    case "draft_customer_follow_up":
      return {
        title: "Draft Customer Follow-Up",
        copy: "A proposed follow-up note. No message has been sent.",
        route: "/home/customers",
        routeLabel: "Open customers",
        scope: ["Draft", "Customers"],
      };
    default:
      return {
        title: "Latest Tool Result",
        copy: "Returned records from the live workspace tool layer.",
        route: "/home/assistant",
        routeLabel: "Stay in assistant",
        scope: ["Workspace"],
      };
  }
};

const MessageCard = ({ message, animate = false }) => {
  const isUser = message.role === "user";

  return (
    <div
      className={`assistant-message-card ${
        isUser ? "assistant-message-user" : "assistant-message-agent"
      }`}
    >
      <div className="assistant-message-meta">
        <Badge bg={isUser ? "light" : "success"} text={isUser ? "dark" : undefined} pill>
          {isUser ? "You" : AGENT_NAME}
        </Badge>
      </div>
      <div className="assistant-message-copy">
        {isUser ? (
          message.text
        ) : (
          <TypewriterResponse
            answer={message.text}
            speed={16}
            animate={animate}
            className="assistant-typewriter"
          />
        )}
      </div>
    </div>
  );
};

const RecordsPreview = ({ records = [] }) => {
  const safeRecords = Array.isArray(records) ? records : [];

  if (!safeRecords.length) {
    return (
      <div className="assistant-empty-state">
        <Database size={18} />
        <span>No records returned for the latest request.</span>
      </div>
    );
  }

  const columns = Object.keys(safeRecords[0] || {}).slice(0, 5);

  return (
    <div className="workspace-table-wrap mt-0">
      <Table responsive hover className="workspace-modern-table assistant-records-table mb-0">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {safeRecords.slice(0, 5).map((record, index) => (
            <tr key={`${index}-${record?.id ?? "row"}`}>
              {columns.map((column) => (
                <td key={column}>{String(record?.[column] ?? "-")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

const InsightMetricGrid = ({ metrics = [] }) => {
  const safeMetrics = metrics.filter((metric) => metric?.label);

  if (!safeMetrics.length) return null;

  return (
    <div className="assistant-metric-grid">
      {safeMetrics.map((metric) => (
        <div key={metric.label} className="assistant-insight-card">
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          {metric.note ? <small>{metric.note}</small> : null}
        </div>
      ))}
    </div>
  );
};

const ProductResultList = ({ records = [], mode = "stock" }) => (
  <div className="assistant-result-list">
    {records.slice(0, 6).map((record) => {
      const quantity = Number(record?.ItemQuantity ?? 0);
      const danger = quantity <= 5;
      const low = quantity > 5 && quantity <= 11;

      return (
        <div key={`product-${record?.itemId ?? record?.itemName}`} className="assistant-insight-card">
          <div className="assistant-insight-head">
            <div>
              <strong>{record?.itemName || "Unnamed product"}</strong>
              <span>{record?.itemId ? `Product ID ${record.itemId}` : "Inventory item"}</span>
            </div>
            <Badge
              pill
              bg={danger ? "danger" : low ? "warning" : "success"}
              text={low ? "dark" : undefined}
            >
              {mode === "low-stock"
                ? `${formatNumber(quantity)} left`
                : `Qty ${formatNumber(quantity)}`}
            </Badge>
          </div>
          <div className="assistant-insight-meta">
            <span>Cost {formatCurrency(record?.itemStockPrice)}</span>
            <span>Least price {formatCurrency(record?.itemLeastPrice)}</span>
          </div>
        </div>
      );
    })}
  </div>
);

const InventoryValuePreview = ({ records = [] }) => {
  const safeRecords = Array.isArray(records) ? records : [];
  const totalCost = safeRecords.reduce(
    (sum, item) => sum + Number(item?.cost_value ?? 0),
    0
  );
  const totalSelling = safeRecords.reduce(
    (sum, item) => sum + Number(item?.selling_value ?? 0),
    0
  );

  return (
    <>
      <InsightMetricGrid
        metrics={[
          { label: "Products counted", value: formatNumber(safeRecords.length) },
          { label: "Cost value", value: formatCurrency(totalCost) },
          { label: "Selling value", value: formatCurrency(totalSelling) },
        ]}
      />
      <ProductResultList records={safeRecords} />
    </>
  );
};

const CustomerResultList = ({ records = [], showSales = false }) => (
  <div className="assistant-result-list">
    {records.slice(0, 6).map((record) => (
      <div key={`customer-${record?.custId ?? record?.custName}`} className="assistant-insight-card">
        <div className="assistant-insight-head">
          <div>
            <strong>{record?.custName || "Unnamed customer"}</strong>
            <span>{record?.custId ? `Customer ID ${record.custId}` : "Customer"}</span>
          </div>
          <Badge pill bg="success-subtle" text="success">
            Customer
          </Badge>
        </div>
        <div className="assistant-insight-meta">
          <span>{record?.custContact || "No contact"}</span>
          <span>{record?.custEmail || "No email"}</span>
          {record?.custLocation ? <span>{record.custLocation}</span> : null}
          {showSales ? (
            <>
              <span>{formatNumber(record?.sale_count)} sales</span>
              <span>{formatNumber(record?.units_bought)} units</span>
              <span>{formatCurrency(record?.total_spent)}</span>
            </>
          ) : null}
        </div>
      </div>
    ))}
  </div>
);

const SalesSummaryPreview = ({ records = [] }) => {
  const summary = Array.isArray(records) ? records[0] : null;
  if (!summary) return <RecordsPreview records={records} />;

  return (
    <InsightMetricGrid
      metrics={[
        { label: "Sales recorded", value: formatNumber(summary?.sale_count) },
        { label: "Units sold", value: formatNumber(summary?.total_units_sold) },
        { label: "Sales value", value: formatCurrency(summary?.total_sales_value) },
        {
          label: "Latest activity",
          value: formatDateTime(summary?.last_sale_at),
          note: summary?.first_sale_at
            ? `First sale ${formatDateTime(summary.first_sale_at)}`
            : undefined,
        },
      ]}
    />
  );
};

const SalesByProductPreview = ({ records = [] }) => {
  const safeRecords = Array.isArray(records) ? records : [];
  const totalUnits = safeRecords.reduce(
    (sum, item) => sum + Number(item?.saleQuantity ?? 0),
    0
  );
  const totalValue = safeRecords.reduce(
    (sum, item) => sum + Number(item?.line_total ?? 0),
    0
  );

  return (
    <>
      <InsightMetricGrid
        metrics={[
          { label: "Matching sale lines", value: formatNumber(safeRecords.length) },
          { label: "Units sold", value: formatNumber(totalUnits) },
          { label: "Sales value", value: formatCurrency(totalValue) },
        ]}
      />
      <div className="assistant-result-list">
        {safeRecords.slice(0, 6).map((record) => (
          <div key={`sale-${record?.saleId}`} className="assistant-insight-card">
            <div className="assistant-insight-head">
              <div>
                <strong>{record?.itemName || "Unknown product"}</strong>
                <span>{record?.itemModel || `Sale #${record?.saleId ?? "-"}`}</span>
              </div>
              <Badge pill bg="primary">
                {formatCurrency(record?.line_total)}
              </Badge>
            </div>
            <div className="assistant-insight-meta">
              <span>Qty {formatNumber(record?.saleQuantity)}</span>
              <span>Unit price {formatCurrency(record?.salePrice)}</span>
              <span>{formatDateTime(record?.saleDateCreated)}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

const ProductionOverviewPreview = ({ records = [] }) => {
  const summary = Array.isArray(records) ? records[0] : null;
  if (!summary) return <RecordsPreview records={records} />;

  const balance = Number(summary?.total_order_value ?? 0) - Number(summary?.total_amount_paid ?? 0);

  return (
    <InsightMetricGrid
      metrics={[
        { label: "Total orders", value: formatNumber(summary?.total_orders) },
        { label: "Orders in progress", value: formatNumber(summary?.orders_in_progress) },
        { label: "Qty produced", value: formatNumber(summary?.total_quantity_produced) },
        { label: "Order value", value: formatCurrency(summary?.total_order_value) },
        { label: "Amount paid", value: formatCurrency(summary?.total_amount_paid) },
        { label: "Outstanding balance", value: formatCurrency(balance) },
        { label: "Raw materials", value: formatNumber(summary?.total_raw_materials) },
        {
          label: "Low raw materials",
          value: formatNumber(summary?.low_stock_raw_materials),
          note: `Stock value ${formatCurrency(summary?.raw_material_stock_value)}`,
        },
      ]}
    />
  );
};

const ProductionOrdersPreview = ({ records = [] }) => (
  <div className="assistant-result-list">
    {records.slice(0, 6).map((record) => {
      const produced = Number(record?.quantityProduced ?? 0);
      const ordered = Number(record?.quantity ?? 0);
      const completion = ordered > 0 ? Math.min(100, Math.round((produced / ordered) * 100)) : 0;

      return (
        <div key={`order-${record?.orderId}`} className="assistant-insight-card">
          <div className="assistant-insight-head">
            <div>
              <strong>{record?.itemName || "Unnamed order product"}</strong>
              <span>{record?.custName || `Order #${record?.orderId ?? "-"}`}</span>
            </div>
            <Badge pill bg={completion >= 100 ? "success" : "warning"} text={completion >= 100 ? undefined : "dark"}>
              {completion}% complete
            </Badge>
          </div>
          <div className="assistant-insight-meta">
            <span>Ordered {formatNumber(ordered)}</span>
            <span>Produced {formatNumber(produced)}</span>
            <span>Value {formatCurrency(record?.totalCost)}</span>
            <span>Paid {formatCurrency(record?.amountPaid)}</span>
            <span>{record?.status || "Status unavailable"}</span>
          </div>
        </div>
      );
    })}
  </div>
);

const RawMaterialsPreview = ({ records = [] }) => (
  <div className="assistant-result-list">
    {records.slice(0, 6).map((record) => {
      const quantity = Number(record?.Quantity ?? 0);
      const reorderLevel = Number(record?.reorderLevel ?? 0);
      const unit = record?.unitOfMeasure || "";

      return (
        <div key={`material-${record?.materialId}`} className="assistant-insight-card assistant-insight-card-alert">
          <div className="assistant-insight-head">
            <div>
              <strong>{record?.name || "Unnamed material"}</strong>
              <span>{record?.materialCode || record?.category || record?.size || "Raw material"}</span>
            </div>
            <Badge pill bg={quantity <= 5 ? "danger" : "warning"} text="dark">
              {formatNumber(quantity)} {unit} left
            </Badge>
          </div>
          <div className="assistant-insight-meta">
            <span>Unit price {formatCurrency(record?.unitPrice)}</span>
            <span>Reorder {formatNumber(reorderLevel)} {unit}</span>
            <span>{record?.supplier || "Supplier not set"}</span>
            <span>{record?.storageLocation || "Location not set"}</span>
            <span>{record?.expiry ? `Expiry ${formatDateTime(record.expiry)}` : "No expiry date"}</span>
          </div>
        </div>
      );
    })}
  </div>
);

const getDraftChangePreview = (draft) => {
  const payload = draft?.payload || {};
  const actionType = draft?.action_type;

  if (actionType === "stock_adjustment") {
    const currentQuantity = Number(payload?.current_quantity ?? 0);
    const targetQuantity = Number(payload?.target_quantity ?? 0);
    const difference = Number(payload?.quantity_difference ?? targetQuantity - currentQuantity);

    return {
      heading: "Stock quantity change",
      explanation:
        "Executing this confirmed draft will update the product quantity and record a stock movement.",
      rows: [
        { label: "Product", before: payload?.product || "Selected product", after: payload?.product || "Selected product" },
        { label: "Quantity", before: formatNumber(currentQuantity), after: formatNumber(targetQuantity) },
        {
          label: "Movement",
          before: "No posted adjustment",
          after:
            difference === 0
              ? "No quantity difference"
              : `${difference > 0 ? "+" : ""}${formatNumber(difference)} units`,
        },
        {
          label: "Reason",
          before: "No reason recorded",
          after: payload?.reason || "No reason provided",
        },
      ],
    };
  }

  if (actionType === "reorder_list") {
    const items = Array.isArray(payload?.items) ? payload.items : [];
    const totalSuggested = items.reduce(
      (sum, item) => sum + Number(item?.suggested_quantity ?? 0),
      0
    );

    return {
      heading: "Reorder list draft",
      explanation:
        "Confirming this approves the list for review. It does not add stock or create a supplier purchase yet.",
      rows: [
        { label: "Products", before: "No purchase document", after: `${formatNumber(items.length)} product(s) listed` },
        { label: "Suggested order qty", before: "0", after: formatNumber(totalSuggested) },
        { label: "Inventory stock", before: "Unchanged", after: "Unchanged" },
      ],
    };
  }

  if (actionType === "invoice") {
    const item = Array.isArray(payload?.items) ? payload.items[0] : null;

    return {
      heading: "Invoice draft",
      explanation:
        "Confirming this approves the invoice draft. It does not post a sale, debt, receipt, or stock movement yet.",
      rows: [
        { label: "Customer", before: "No invoice selected", after: payload?.customer?.name || "Selected customer" },
        { label: "Product", before: "No invoice line", after: item?.product || "Selected product" },
        { label: "Quantity", before: "0", after: formatNumber(item?.quantity) },
        { label: "Total", before: "UGX 0", after: formatCurrency(payload?.total) },
        { label: "Inventory stock", before: "Unchanged", after: "Unchanged" },
      ],
    };
  }

  if (actionType === "customer_follow_up") {
    return {
      heading: "Customer follow-up draft",
      explanation:
        "Confirming this keeps the follow-up approved for action. It does not send an SMS, email, or notification yet.",
      rows: [
        { label: "Customer", before: "No follow-up selected", after: payload?.customer || "Selected customer" },
        { label: "Message", before: "No message queued", after: payload?.message || "Prepared follow-up message" },
        { label: "Sending status", before: "Not sent", after: "Not sent" },
      ],
    };
  }

  return {
    heading: "Draft change preview",
    explanation: "Review this proposed action before confirming.",
    rows: [],
  };
};

const DraftChangePreview = ({ draft }) => {
  const preview = getDraftChangePreview(draft);

  if (!preview?.rows?.length) return null;

  return (
    <div className="assistant-draft-change-preview">
      <div>
        <strong>{preview.heading}</strong>
        <p>{preview.explanation}</p>
      </div>
      <div className="assistant-draft-change-list">
        {preview.rows.map((row) => (
          <div key={row.label} className="assistant-draft-change-row">
            <span>{row.label}</span>
            <div>
              <small>Before</small>
              <strong>{row.before}</strong>
            </div>
            <div>
              <small>After</small>
              <strong>{row.after}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DraftPayloadPreview = ({ draft }) => {
  const payload = draft?.payload || {};
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const singleFields = Object.entries(payload).filter(([, value]) => {
    return value === null || ["string", "number", "boolean"].includes(typeof value);
  });

  if (items.length) {
    const columns = Object.keys(items[0] || {}).slice(0, 5);

    return (
      <div className="workspace-table-wrap mt-2">
        <Table responsive hover className="workspace-modern-table assistant-records-table mb-0">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.slice(0, 5).map((item, index) => (
              <tr key={`${draft?.draft_key || "draft"}-${index}`}>
                {columns.map((column) => (
                  <td key={column}>{String(item?.[column] ?? "-")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  }

  if (!singleFields.length) return null;

  return (
    <div className="assistant-draft-fields">
      {singleFields.slice(0, 8).map(([key, value]) => (
        <div key={key}>
          <span>{key.replace(/_/g, " ")}</span>
          <strong>{String(value ?? "-")}</strong>
        </div>
      ))}
    </div>
  );
};

const DraftReviewPanel = ({
  draft,
  isBusy,
  onConfirm,
  onCancel,
  onExecute,
  statusMessage,
  errorMessage,
}) => {
  if (!draft?.draft_key) {
    return (
      <Alert variant="light" className="mb-0 border">
        Draft actions from Copilot will appear here for review.
      </Alert>
    );
  }

  const canConfirm = draft.status === "draft";
  const canExecute = draft.status === "confirmed";
  const canCancel = draft.status === "draft" || draft.status === "confirmed";
  const executionStatus = draft?.execution?.status || draft?.execution?.result?.status;

  return (
    <div className="assistant-result-card assistant-draft-panel">
      <div className="assistant-tool-summary-head">
        <div>
          <strong>{draft.title || "Copilot Draft"}</strong>
          <p>{draft.summary || "Review this draft before taking action."}</p>
        </div>
        <Badge bg={draft.status === "executed" ? "success" : draft.status === "cancelled" ? "secondary" : "warning"} text={draft.status === "draft" ? "dark" : undefined} pill>
          {draft.status}
        </Badge>
      </div>

      <div className="assistant-draft-meta">
        <span>{draft.action_type || "draft"}</span>
        <span>{draft.draft_key}</span>
        {draft.expires_at ? <span>Expires {formatDateTime(draft.expires_at)}</span> : null}
        {executionStatus ? <span>Execution: {executionStatus}</span> : null}
      </div>

      <DraftChangePreview draft={draft} />

      <DraftPayloadPreview draft={draft} />

      {statusMessage ? (
        <Alert variant="success" className="py-2 mb-2">
          {statusMessage}
        </Alert>
      ) : null}
      {errorMessage ? (
        <Alert variant="danger" className="py-2 mb-2">
          {errorMessage}
        </Alert>
      ) : null}

      <div className="assistant-draft-actions">
        <Button variant="success" size="sm" disabled={!canConfirm || isBusy} onClick={onConfirm}>
          <CheckCircle className="me-2" />
          Confirm
        </Button>
        <Button variant="outline-secondary" size="sm" disabled={!canCancel || isBusy} onClick={onCancel}>
          <XCircle className="me-2" />
          Cancel
        </Button>
        <Button variant="primary" size="sm" disabled={!canExecute || isBusy} onClick={onExecute}>
          <PlayCircle className="me-2" />
          Execute
        </Button>
      </div>
    </div>
  );
};

const DraftHistoryList = ({ drafts = [], activeDraftKey, isLoading, onSelect }) => {
  if (isLoading) {
    return (
      <div className="assistant-empty-state">
        <Spinner animation="border" size="sm" />
        <span>Loading earlier drafts...</span>
      </div>
    );
  }

  if (!drafts.length) {
    return (
      <Alert variant="light" className="mb-0 border">
        No earlier Copilot drafts found for this user.
      </Alert>
    );
  }

  return (
    <div className="assistant-draft-history-list">
      {drafts.slice(0, 8).map((draft) => (
        <button
          type="button"
          key={draft.draft_key}
          className={`assistant-draft-history-item ${
            activeDraftKey === draft.draft_key ? "assistant-draft-history-item-active" : ""
          }`}
          onClick={() => onSelect(draft)}
        >
          <span>
            <strong>{draft.title || "Copilot Draft"}</strong>
            <small>{draft.summary || draft.action_type || draft.draft_key}</small>
          </span>
          <Badge
            bg={draft.status === "executed" ? "success" : draft.status === "cancelled" ? "secondary" : "warning"}
            text={draft.status === "draft" ? "dark" : undefined}
            pill
          >
            {draft.status}
          </Badge>
        </button>
      ))}
    </div>
  );
};

const BriefingPanel = ({ briefing, isLoading, onPrompt }) => {
  if (isLoading) {
    return (
      <div className="assistant-empty-state">
        <Spinner animation="border" size="sm" />
        <span>Loading today's briefing...</span>
      </div>
    );
  }

  if (!briefing?.status) {
    return (
      <Alert variant="light" className="mb-0 border">
        Briefing will appear here when reporting data is available.
      </Alert>
    );
  }

  const kpis = Array.isArray(briefing?.kpis) ? briefing.kpis : [];
  const insights = Array.isArray(briefing?.insights) ? briefing.insights : [];
  const activeDrafts = Array.isArray(briefing?.active_drafts) ? briefing.active_drafts : [];

  return (
    <div className="assistant-briefing-panel">
      <div className="assistant-briefing-kpis">
        {kpis.slice(0, 4).map((kpi) => (
          <div key={kpi.key || kpi.label}>
            <span>{kpi.label}</span>
            <strong>
              {kpi.format === "currency" ? formatCurrency(kpi.value) : formatNumber(kpi.value)}
            </strong>
          </div>
        ))}
      </div>

      <div className="assistant-briefing-list">
        {insights.slice(0, 3).map((insight) => (
          <button
            type="button"
            key={insight.id || insight.title || insight.message}
            onClick={() => onPrompt(insight.title || insight.message || "Explain this alert")}
          >
            <Badge
              bg={insight.severity === "critical" ? "danger" : insight.severity === "warning" ? "warning" : "info"}
              text={insight.severity === "warning" ? "dark" : undefined}
            >
              {insight.severity || "info"}
            </Badge>
            <span>{insight.title || insight.message}</span>
          </button>
        ))}
      </div>

      <div className="assistant-briefing-footer">
        <span>{formatNumber(briefing?.summary?.open_alerts)} alert(s)</span>
        <span>{formatNumber(activeDrafts.length)} active draft(s)</span>
      </div>
    </div>
  );
};

const ToolCoveragePanel = ({ tools = [], isLoading }) => {
  if (isLoading) {
    return (
      <div className="assistant-empty-state">
        <Spinner animation="border" size="sm" />
        <span>Loading available tools...</span>
      </div>
    );
  }

  if (!tools.length) {
    return (
      <Alert variant="light" className="mb-0 border">
        Tool coverage will appear here after the briefing loads.
      </Alert>
    );
  }

  const groupedTools = tools.reduce((groups, tool) => {
    const category = tool?.category || "other";
    return {
      ...groups,
      [category]: [...(groups[category] || []), tool],
    };
  }, {});

  const categories = Object.keys(groupedTools).sort((left, right) => {
    const order = ["inventory", "customers", "sales", "production", "reports", "draft_actions"];
    return order.indexOf(left) - order.indexOf(right);
  });

  return (
    <div className="assistant-tool-catalog">
      <div className="assistant-tool-catalog-summary">
        <Database size={16} />
        <strong>{formatNumber(tools.length)} available tools</strong>
      </div>
      {categories.map((category) => (
        <div key={category} className="assistant-tool-category">
          <div className="assistant-tool-category-head">
            <span>{toolCategoryLabels[category] || category}</span>
            <Badge bg="light" text="dark" pill>
              {groupedTools[category].length}
            </Badge>
          </div>
          <div className="assistant-tool-list">
            {groupedTools[category].map((tool) => (
              <div key={tool.name} className="assistant-tool-row">
                <span>{tool.source_label || tool.name.replace(/_/g, " ")}</span>
                <Badge
                  bg={tool.risk === "draft" ? "warning" : "success"}
                  text={tool.risk === "draft" ? "dark" : undefined}
                  pill
                >
                  {tool.risk}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const LatestToolInsight = ({ payload }) => {
  const tool = payload?.tool;
  const records = Array.isArray(payload?.records) ? payload.records : [];
  const config = getToolConfig(tool);

  if (!tool) {
    return (
      <Alert variant="light" className="mb-0 border">
        Ask your first question to see tool usage and returned records here.
      </Alert>
    );
  }

  let preview = <RecordsPreview records={records} />;

  switch (tool) {
    case "get_low_stock_products":
      preview = <ProductResultList records={records} mode="low-stock" />;
      break;
    case "search_product_stock":
      preview = <ProductResultList records={records} />;
      break;
    case "get_inventory_value":
      preview = <InventoryValuePreview records={records} />;
      break;
    case "search_customers":
      preview = <CustomerResultList records={records} />;
      break;
    case "get_top_customers_by_sales":
      preview = <CustomerResultList records={records} showSales />;
      break;
    case "get_sales_summary":
      preview = <SalesSummaryPreview records={records} />;
      break;
    case "search_sales_by_product":
      preview = <SalesByProductPreview records={records} />;
      break;
    case "get_production_overview":
      preview = <ProductionOverviewPreview records={records} />;
      break;
    case "search_production_orders":
      preview = <ProductionOrdersPreview records={records} />;
      break;
    case "get_low_stock_raw_materials":
      preview = <RawMaterialsPreview records={records} />;
      break;
    default:
      break;
  }

  return (
    <Stack gap={3}>
      <div className="assistant-result-card assistant-tool-summary-card">
        <div className="assistant-tool-summary-head">
          <div>
            <strong>{config.title}</strong>
            <p>{config.copy}</p>
          </div>
          <Badge bg="success" pill>
            {tool}
          </Badge>
        </div>
        <div className="assistant-chip-row mt-0">
          {config.scope.map((item) => (
            <span key={item} className="assistant-scope-chip assistant-scope-chip-muted">
              {item}
            </span>
          ))}
        </div>
        <span>
          Arguments:{" "}
          {Object.keys(payload?.arguments || {}).length
            ? JSON.stringify(payload.arguments)
            : "none"}
        </span>
      </div>

      {preview}

      <div className="assistant-links">
        <Button as={Link} to={config.route} variant="outline-secondary">
          {config.routeLabel} <ArrowRight className="ms-2" />
        </Button>
      </div>
    </Stack>
  );
};

const AssistantWorkspace = () => {
  const [sendMessage, { isLoading }] = useSendAgentMessageMutation();
  const [confirmDraft, { isLoading: isConfirmingDraft }] = useConfirmAgentDraftMutation();
  const [cancelDraft, { isLoading: isCancellingDraft }] = useCancelAgentDraftMutation();
  const [executeDraft, { isLoading: isExecutingDraft }] = useExecuteAgentDraftMutation();
  const { data: briefing, isLoading: isLoadingBriefing, refetch: refetchBriefing } =
    useGetAgentBriefingQuery({ period: "today" });
  const { data: toolCatalog, isLoading: isLoadingTools } = useGetAgentToolsQuery();
  const {
    data: draftHistory,
    isLoading: isLoadingDraftHistory,
    refetch: refetchDraftHistory,
  } = useListAgentDraftsQuery({ status: "all", limit: 20 });
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([initialAssistantMessage]);
  const [latestPayload, setLatestPayload] = useState(null);
  const [animatedMessageId, setAnimatedMessageId] = useState(null);
  const [activeDraft, setActiveDraft] = useState(null);
  const [draftStatusMessage, setDraftStatusMessage] = useState("");
  const [draftErrorMessage, setDraftErrorMessage] = useState("");
  const [sessionId] = useState(() => `assistant-${Date.now()}`);

  const isDraftBusy = isConfirmingDraft || isCancellingDraft || isExecutingDraft;
  const earlierDrafts = Array.isArray(draftHistory?.drafts) ? draftHistory.drafts : [];
  const availableTools = Array.isArray(toolCatalog?.tool_catalog)
    ? toolCatalog.tool_catalog
    : Array.isArray(briefing?.tool_catalog)
      ? briefing.tool_catalog
      : [];
  const activeDraftCount = Number(briefing?.summary?.active_drafts ?? 0);

  const messageCount = messages.length;
  const latestToolConfig = useMemo(
    () => getToolConfig(latestPayload?.tool),
    [latestPayload?.tool]
  );

  const scopeChips = useMemo(
    () => [
      { label: "Phase 1", tone: palette.greenSoft, text: palette.green },
      {
        label: "Inventory + Sales + Production",
        tone: palette.blueSoft,
        text: palette.blue,
      },
      { label: "Draft approval workflow", tone: palette.amberSoft, text: "#bc7a11" },
    ],
    []
  );

  const handleSend = async (value = prompt) => {
    const message = value.trim();
    if (!message) return;

    setAnimatedMessageId(null);
    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text: message,
      },
    ]);
    setPrompt("");

    try {
      const response = await sendMessage({ message, session_id: sessionId }).unwrap();
      const nextAssistantId = `assistant-${Date.now()}`;
      setLatestPayload(response);
      setDraftStatusMessage("");
      setDraftErrorMessage("");

      if (response?.needs_confirmation && response?.records?.draft_key) {
        setActiveDraft(response.records);
        refetchDraftHistory();
        refetchBriefing();
      }

      setAnimatedMessageId(nextAssistantId);
      setMessages((current) => [
        ...current,
        {
          id: nextAssistantId,
          role: "assistant",
          text:
            response?.answer ||
            "I received your question, but I could not generate a final answer.",
          payload: response,
        },
      ]);
    } catch (error) {
      const nextAssistantErrorId = `assistant-error-${Date.now()}`;
      setAnimatedMessageId(nextAssistantErrorId);
      setMessages((current) => [
        ...current,
        {
          id: nextAssistantErrorId,
          role: "assistant",
          text:
            error?.data?.message ||
            error?.data?.error ||
            "The assistant could not complete that request right now.",
          payload: null,
        },
      ]);
    }
  };

  const appendAssistantMessage = (text, payload = null) => {
    const nextAssistantId = `assistant-${Date.now()}`;
    setAnimatedMessageId(nextAssistantId);
    setMessages((current) => [
      ...current,
      {
        id: nextAssistantId,
        role: "assistant",
        text,
        payload,
      },
    ]);
  };

  const handleDraftAction = async (action) => {
    if (!activeDraft?.draft_key) return;

    setDraftStatusMessage("");
    setDraftErrorMessage("");

    try {
      const payload = { draft_key: activeDraft.draft_key };
      const response =
        action === "confirm"
          ? await confirmDraft({ ...payload, note: "Confirmed from Assistant Workspace." }).unwrap()
          : action === "cancel"
            ? await cancelDraft({ ...payload, reason: "Cancelled from Assistant Workspace." }).unwrap()
            : await executeDraft(payload).unwrap();

      const nextDraft = response?.draft || activeDraft;
      setActiveDraft(nextDraft);
      setDraftStatusMessage(response?.message || "Draft updated.");
      refetchDraftHistory();
      refetchBriefing();
      appendAssistantMessage(response?.message || "Draft updated.", response);
    } catch (error) {
      const message =
        error?.data?.message ||
        error?.data?.error ||
        "The draft action could not be completed.";
      setDraftErrorMessage(message);
      appendAssistantMessage(message, null);
    }
  };

  return (
    <Container fluid className="workspace-page-shell py-4 px-3 px-lg-4">
      <div className="workspace-page-stack assistant-workspace">
        <section className="workspace-page-hero">
          <div>
            <h1 className="workspace-page-title">{AGENT_NAME}</h1>
            <p className="workspace-page-subtitle">
              Your AI workspace for inventory, customers, sales, production, and operational answers.
            </p>
          </div>
          <div className="workspace-page-actions">
            <Button as={Link} to="/home/inventory" variant="light" className="assistant-toolbar-btn">
              <BoxSeam className="me-2" />
              Open Inventory
            </Button>
            <Button as={Link} to="/home/reports" variant="success" className="assistant-primary-btn">
              <ClipboardData className="me-2" />
              Go To Reports
            </Button>
          </div>
        </section>

        <section className="assistant-hero-card">
          <div className="assistant-hero-copy">
            <div className="assistant-hero-badge">
              <Stars size={16} />
              <span>New AI Workspace</span>
            </div>
            <h2>Ask live business questions from one focused place.</h2>
            <p>
              The assistant is connected to inventory, customers, sales, production orders, raw
              materials, and draft actions that require review before execution.
            </p>
            <div className="assistant-chip-row">
              {scopeChips.map((chip) => (
                <span
                  key={chip.label}
                  className="assistant-scope-chip"
                  style={{ backgroundColor: chip.tone, color: chip.text }}
                >
                  {chip.label}
                </span>
              ))}
            </div>
          </div>

          <div className="assistant-hero-stats">
            <div className="assistant-stat-card">
              <Cpu size={18} />
              <strong>{AGENT_NAME}</strong>
              <span>Operations assistant mode</span>
            </div>
            <div className="assistant-stat-card">
              <LightningCharge size={18} />
              <strong>{messageCount}</strong>
              <span>Messages in this session</span>
            </div>
            <div className="assistant-stat-card">
              <Database size={18} />
              <strong>{formatNumber(availableTools.length)}</strong>
              <span>Available backend tools</span>
            </div>
            <div className="assistant-stat-card">
              <ClipboardData size={18} />
              <strong>{formatNumber(activeDraftCount)}</strong>
              <span>Active draft actions</span>
            </div>
          </div>
        </section>

        <Row className="g-3">
          <Col xl={3}>
            <Card className="assistant-panel-card border-0">
              <Card.Body>
                <div className="workspace-section-head mb-3">
                  <div>
                    <h3 className="workspace-section-title">Sessions</h3>
                    <p className="workspace-section-copy">
                      Phase 1 keeps a lightweight local session for the current browser tab.
                    </p>
                  </div>
                </div>

                <div className="assistant-session-list">
                  <div className="assistant-session-item assistant-session-item-active">
                    <strong>Current Session</strong>
                    <span>Live conversation</span>
                  </div>
                  {starterSessions.map((session) => (
                    <div key={session.title} className="assistant-session-item">
                      <strong>{session.title}</strong>
                      <span>{session.subtitle}</span>
                    </div>
                  ))}
                </div>

                <div className="assistant-side-block">
                  <h4>Today's Briefing</h4>
                  <BriefingPanel
                    briefing={briefing}
                    isLoading={isLoadingBriefing}
                    onPrompt={(nextPrompt) => handleSend(nextPrompt)}
                  />
                </div>

                <div className="assistant-side-block">
                  <h4>Try asking</h4>
                  <div className="assistant-prompt-list">
                    {quickPrompts.map((item) => (
                      <Button
                        key={item}
                        variant="light"
                        className="assistant-prompt-chip"
                        onClick={() => handleSend(item)}
                        disabled={isLoading}
                      >
                        <Search className="me-2" />
                        {item}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={6}>
            <Card className="assistant-panel-card border-0">
              <Card.Body className="d-flex flex-column">
                <div className="workspace-section-head mb-3">
                  <div>
                    <h3 className="workspace-section-title">Conversation</h3>
                    <p className="workspace-section-copy">
                      The assistant uses the backend tool router and answers from live system data only.
                    </p>
                  </div>
                </div>

                <div className="assistant-thread">
                  {messages.map((message) => (
                    <MessageCard
                      key={message.id}
                      message={message}
                      animate={message.role === "assistant" && message.id === animatedMessageId}
                    />
                  ))}

                  {isLoading ? (
                    <div className="assistant-loading-card">
                      <Spinner animation="border" size="sm" />
                      <span>{AGENT_NAME} is checking the live workspace data...</span>
                    </div>
                  ) : null}
                </div>

                <Form
                  className="assistant-composer"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSend();
                  }}
                >
                  <Form.Group>
                    <Form.Label className="mb-2 fw-semibold">Ask {AGENT_NAME}</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      placeholder="Example: Who are our top customers by sales this period?"
                    />
                  </Form.Group>
                  <div className="assistant-composer-actions">
                    <small>
                      Current scope: inventory, customers, sales, production, and raw materials.
                    </small>
                    <Button
                      type="submit"
                      disabled={isLoading || !prompt.trim()}
                      className="assistant-primary-btn"
                    >
                      {isLoading ? "Thinking..." : `Ask ${AGENT_NAME}`}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={3}>
            <Card className="assistant-panel-card border-0">
              <Card.Body>
                <div className="workspace-section-head mb-3">
                  <div>
                    <h3 className="workspace-section-title">Context & Results</h3>
                    <p className="workspace-section-copy">
                      See what the assistant used and what came back from the tool layer.
                    </p>
                  </div>
                </div>

                <div className="assistant-side-block">
                  <h4>Current Scope</h4>
                  <div className="assistant-chip-row">
                    {latestToolConfig.scope.map((scope) => (
                      <span
                        key={scope}
                        className="assistant-scope-chip"
                        style={{
                          backgroundColor:
                            scope === "Inventory" || scope === "Restocking" || scope === "Product lookup"
                              ? palette.greenSoft
                              : scope === "Customers" ||
                                  scope === "Sales" ||
                                  scope === "Revenue" ||
                                  scope === "Contact search"
                                ? palette.blueSoft
                                : palette.amberSoft,
                          color:
                            scope === "Inventory" || scope === "Restocking" || scope === "Product lookup"
                              ? palette.green
                              : scope === "Customers" ||
                                  scope === "Sales" ||
                                  scope === "Revenue" ||
                                  scope === "Contact search"
                                ? palette.blue
                                : "#bc7a11",
                        }}
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="assistant-side-block">
                  <h4>Latest Tool</h4>
                  <LatestToolInsight payload={latestPayload} />
                </div>

                <div className="assistant-side-block">
                  <h4>Available Copilot Tools</h4>
                  <ToolCoveragePanel tools={availableTools} isLoading={isLoadingTools} />
                </div>

                <div className="assistant-side-block">
                  <h4>Draft Review</h4>
                  <DraftReviewPanel
                    draft={activeDraft}
                    isBusy={isDraftBusy}
                    onConfirm={() => handleDraftAction("confirm")}
                    onCancel={() => handleDraftAction("cancel")}
                    onExecute={() => handleDraftAction("execute")}
                    statusMessage={draftStatusMessage}
                    errorMessage={draftErrorMessage}
                  />
                </div>

                <div className="assistant-side-block">
                  <h4>Earlier Drafts</h4>
                  <DraftHistoryList
                    drafts={earlierDrafts}
                    activeDraftKey={activeDraft?.draft_key}
                    isLoading={isLoadingDraftHistory}
                    onSelect={(draft) => {
                      setActiveDraft(draft);
                      setDraftStatusMessage("");
                      setDraftErrorMessage("");
                    }}
                  />
                </div>

                <div className="assistant-side-block">
                  <h4>Recommended Next</h4>
                  <div className="assistant-links">
                    <Button as={Link} to="/home/inventory" variant="outline-secondary">
                      <BoxSeam className="me-2" />
                      Review products
                    </Button>
                    <Button as={Link} to="/home/customers" variant="outline-secondary">
                      <People className="me-2" />
                      Open customers
                    </Button>
                    <Button as={Link} to="/home/sales" variant="outline-secondary">
                      <CashStack className="me-2" />
                      Open sales
                    </Button>
                    <Button as={Link} to="/home/production" variant="outline-secondary">
                      <Tools className="me-2" />
                      Open production
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </Container>
  );
};

export default AssistantWorkspace;
