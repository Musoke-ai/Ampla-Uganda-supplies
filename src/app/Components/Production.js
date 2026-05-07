import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Container,
  Dropdown,
} from "react-bootstrap";
import {
  Boxes,
  CashCoin,
  ClipboardData,
  Download,
  ExclamationTriangleFill,
  FileEarmarkPdfFill,
  FileEarmarkSpreadsheetFill,
  GearWideConnected,
  List,
  PeopleFill,
  Printer,
  ShieldCheck,
  TagsFill,
  UiChecksGrid,
} from "react-bootstrap-icons";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

import { selectRoles } from "../auth/authSlice";
import { selectEmployees } from "../features/api/employeesSlice";
import { selectExpenses } from "../features/api/ExpensesSlice";
import { selectOrders } from "../features/api/orderSlice";
import { selectRawMaterials } from "../features/api/rawmaterialsSlice";
import { useSettings } from "./Settings";
import CategoryManagement from "./production/CategoryManagement";
import EmployeeManagement from "./production/EmployeeManagement";
import FactoryExpenses from "./production/Expenses";
import OrderManagement from "./production/OrderManagement";
import ProductionBatches from "./production/ProductionBatches";
import ProductionSummary from "./production/ProductionSummary";
import RawMaterialsTable from "./production/RawmaterialsManagement";
import "./pages/WorkspacePages.css";

const palette = {
  surface: "#ffffff",
  border: "#e7efe9",
  text: "#15202b",
  muted: "#6f7d8c",
  green: "#2f8f57",
  greenSoft: "#e8f5ec",
  blue: "#2f80ed",
  blueSoft: "#e8f1ff",
  amber: "#f59e0b",
  amberSoft: "#fff4df",
  red: "#ef4444",
  redSoft: "#ffebeb",
  shadow: "0 12px 32px rgba(15, 23, 42, 0.05)",
};

const sectionCardStyle = {
  borderRadius: 28,
  backgroundColor: palette.surface,
  boxShadow: palette.shadow,
  border: `1px solid ${palette.border}`,
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

const TAB_DEFINITIONS = [
  {
    key: "Summary",
    label: "Production Summary",
    description: "Review production output, costing, batch progress, and raw material readiness.",
    roles: [
      "admin",
      "employees",
      "rawmaterials",
      "expenses",
      "orders",
      "batches",
      "productionmanager",
      "productionmanger",
    ],
    Icon: ClipboardData,
    accent: palette.greenSoft,
    color: palette.green,
    Component: ProductionSummary,
  },
  {
    key: "Employees",
    label: "Employees",
    description: "Manage workers, salaries, assignments, and daily lists.",
    roles: ["admin", "employees"],
    Icon: PeopleFill,
    accent: palette.greenSoft,
    color: palette.green,
    Component: EmployeeManagement,
  },
  {
    key: "RawMaterials",
    label: "Raw Materials",
    description: "Track material stock, intake, suppliers, and pricing.",
    roles: ["admin", "rawmaterials"],
    Icon: Boxes,
    accent: palette.blueSoft,
    color: palette.blue,
    Component: RawMaterialsTable,
  },
  {
    key: "Expenses",
    label: "Expenses",
    description: "Review operational costs and keep factory spending visible.",
    roles: ["admin", "expenses"],
    Icon: CashCoin,
    accent: palette.amberSoft,
    color: palette.amber,
    Component: FactoryExpenses,
  },
  {
    key: "Orders",
    label: "Orders",
    description: "Monitor custom and standard production orders from one queue.",
    roles: ["admin", "orders"],
    Icon: List,
    accent: palette.redSoft,
    color: palette.red,
    Component: OrderManagement,
  },
  {
    key: "Batches",
    label: "Batches",
    description: "Plan batches, consume materials, post finished goods, and review costing.",
    roles: ["admin", "batches", "productionmanager"],
    Icon: UiChecksGrid,
    accent: palette.greenSoft,
    color: palette.green,
    Component: ProductionBatches,
  },
  {
    key: "Categories",
    label: "Categories",
    description: "Create and maintain categories shared by products and production.",
    roles: ["admin"],
    Icon: TagsFill,
    accent: palette.blueSoft,
    color: palette.blue,
    Component: () => <CategoryManagement context="production" />,
  },
];

const safeArray = (value) => (Array.isArray(value) ? value : []);
const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
const canAccess = (requiredRoles = [], currentRoles = []) =>
  requiredRoles
    .map(normalizeRole)
    .some((role) => currentRoles.map(normalizeRole).includes(role));

function MetricCard({ icon, title, value, note, accent, color }) {
  return (
    <div className="workspace-metric-card" style={sectionCardStyle}>
      <div className="workspace-metric-icon" style={{ backgroundColor: accent, color }}>
        {icon}
      </div>
      <div className="workspace-metric-body">
        <div className="workspace-metric-title">{title}</div>
        <div className="workspace-metric-value">{value}</div>
        <div className="workspace-metric-note">{note}</div>
      </div>
    </div>
  );
}

class ProductionSectionBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Production section render failed", error, info);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="warning" className="mb-0 production-safe-alert">
          This production section could not render safely. Switch tabs or refresh the data source and try again.
        </Alert>
      );
    }

    return this.props.children;
  }
}

const Production = () => {
  const { settings } = useSettings();
  const currency = settings?.currency !== "none" ? settings?.currency : "UGX";
  const [searchParams, setSearchParams] = useSearchParams();

  const rolesState = useSelector(selectRoles);
  const employeesState = useSelector(selectEmployees);
  const rawMaterialsState = useSelector(selectRawMaterials);
  const expensesState = useSelector(selectExpenses);
  const ordersState = useSelector(selectOrders);

  const roles = safeArray(rolesState);
  const employees = safeArray(employeesState);
  const rawMaterials = safeArray(rawMaterialsState);
  const expenses = safeArray(expensesState);
  const orders = safeArray(ordersState);

  const visibleTabs = useMemo(
    () => TAB_DEFINITIONS.filter((tab) => canAccess(tab.roles, roles)),
    [roles]
  );

  const requestedTab = searchParams.get("tab");
  const previousRequestedTab = useRef(requestedTab);
  const [activeTab, setActiveTab] = useState(() => {
    const matched = visibleTabs.find((tab) => tab.key === requestedTab);
    return matched?.key || visibleTabs[0]?.key || "";
  });
  const [runtimeMessage, setRuntimeMessage] = useState("");

  useEffect(() => {
    if (!visibleTabs.length) {
      setActiveTab("");
      return;
    }

    const validActive = visibleTabs.some((tab) => tab.key === activeTab);
    const validRequested = visibleTabs.some((tab) => tab.key === requestedTab);
    const requestedChanged = previousRequestedTab.current !== requestedTab;
    previousRequestedTab.current = requestedTab;

    if (requestedChanged && validRequested) {
      if (requestedTab !== activeTab) {
        setActiveTab(requestedTab);
      }
      return;
    }

    if (!validActive) {
      setActiveTab(visibleTabs[0].key);
    }
  }, [activeTab, requestedTab, visibleTabs]);

  useEffect(() => {
    if (!activeTab) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", activeTab);
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  useEffect(() => {
    document.body.classList.add("production-workspace-active");
    return () => {
      document.body.classList.remove("production-workspace-active");
    };
  }, []);

  const formatMoney = useCallback(
    (value) =>
      `${currency} ${Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`,
    [currency]
  );

  const currentTab = visibleTabs.find((tab) => tab.key === activeTab) || visibleTabs[0];

  const totals = useMemo(() => {
    const activeEmployees = employees.filter(
      (employee) => Number(employee?.empStatus ?? 0) === 1
    ).length;

    const payroll = employees.reduce(
      (sum, employee) => sum + (Number(employee?.empSalary) || 0),
      0
    );

    const materialsValue = rawMaterials.reduce((sum, material) => {
      const quantity = Number(material?.quantity ?? material?.Quantity) || 0;
      const unitPrice = Number(material?.unitPrice) || 0;
      return sum + quantity * unitPrice;
    }, 0);

    const expenseTotal = expenses.reduce(
      (sum, expense) => sum + (Number(expense?.amount) || 0),
      0
    );

    const openOrders = orders.filter((order) => {
      const produced = Number(order?.quantityProduced) || 0;
      const quantity = Number(order?.quantity) || 0;
      return produced < quantity;
    }).length;

    const outstandingOrderBalance = orders.reduce((sum, order) => {
      const totalCost = Number(order?.totalCost) || 0;
      const paid = Number(order?.amountPaid) || 0;
      return sum + Math.max(totalCost - paid, 0);
    }, 0);

    return {
      activeEmployees,
      payroll,
      materialsValue,
      expenseTotal,
      openOrders,
      outstandingOrderBalance,
    };
  }, [employees, expenses, orders, rawMaterials]);

  const workspaceMetrics = [
    {
      title: "Active Sections",
      value: visibleTabs.length,
      note: "Production modules available for your role",
      accent: palette.greenSoft,
      color: palette.green,
      icon: <ShieldCheck size={18} />,
    },
    {
      title: "Active Workers",
      value: totals.activeEmployees,
      note: `${employees.length} total worker records in the system`,
      accent: palette.blueSoft,
      color: palette.blue,
      icon: <PeopleFill size={18} />,
    },
    {
      title: "Open Orders",
      value: totals.openOrders,
      note: `${formatMoney(totals.outstandingOrderBalance)} still outstanding`,
      accent: palette.amberSoft,
      color: palette.amber,
      icon: <GearWideConnected size={18} />,
    },
    {
      title: "Tracked Spend",
      value: formatMoney(totals.expenseTotal),
      note: `${formatMoney(totals.materialsValue)} raw material value on record`,
      accent: palette.redSoft,
      color: palette.red,
      icon: <CashCoin size={18} />,
    },
  ];

  const exportRows = useMemo(
    () =>
      visibleTabs.map((tab) => {
        if (tab.key === "Employees") {
          return [
            tab.label,
            employees.length,
            `${totals.activeEmployees} active`,
            formatMoney(totals.payroll),
          ];
        }
        if (tab.key === "RawMaterials") {
          const quantity = rawMaterials.reduce(
            (sum, material) => sum + (Number(material?.quantity ?? material?.Quantity) || 0),
            0
          );
          return [
            tab.label,
            rawMaterials.length,
            `${quantity} units tracked`,
            formatMoney(totals.materialsValue),
          ];
        }
        if (tab.key === "Expenses") {
          return [
            tab.label,
            expenses.length,
            "Factory spend tracked",
            formatMoney(totals.expenseTotal),
          ];
        }
        if (tab.key === "Orders") {
          return [
            tab.label,
            orders.length,
            `${totals.openOrders} still open`,
            formatMoney(totals.outstandingOrderBalance),
          ];
        }
        return [tab.label, 1, "Admin controls available", "Protected"];
      }),
    [
      employees.length,
      expenses.length,
      formatMoney,
      orders.length,
      rawMaterials,
      totals.activeEmployees,
      totals.expenseTotal,
      totals.materialsValue,
      totals.openOrders,
      totals.outstandingOrderBalance,
      totals.payroll,
      visibleTabs,
    ]
  );

  const handlePrint = () => {
    try {
      window.print();
      setRuntimeMessage("");
    } catch (error) {
      console.error("Production print failed", error);
      setRuntimeMessage("Printing could not be started for the production workspace.");
    }
  };

  const exportToCsv = () => {
    try {
      if (!exportRows.length) {
        setRuntimeMessage("There is no production summary data available to export yet.");
        return;
      }

      const headers = ["Section", "Records", "Status", "Value"];
      const escapeCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
      const csvContent = [
        headers.map(escapeCell).join(","),
        ...exportRows.map((row) => row.map(escapeCell).join(",")),
      ].join("\r\n");

      const link = document.createElement("a");
      link.setAttribute(
        "href",
        `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`
      );
      link.setAttribute(
        "download",
        `production_workspace_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setRuntimeMessage("");
    } catch (error) {
      console.error("Production CSV export failed", error);
      setRuntimeMessage("The production CSV export could not be completed.");
    }
  };

  const exportToPdf = () => {
    try {
      if (!exportRows.length) {
        setRuntimeMessage("There is no production summary data available to export yet.");
        return;
      }

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Production Workspace Summary", 14, 18);
      doc.setFontSize(10);
      doc.text(new Date().toLocaleDateString(), 14, 25);

      doc.autoTable({
        startY: 32,
        head: [["Section", "Records", "Status", "Value"]],
        body: exportRows,
        styles: { fontSize: 10, cellPadding: 3.5 },
        headStyles: { fillColor: [47, 143, 87] },
      });

      doc.save(`production_workspace_${new Date().toISOString().slice(0, 10)}.pdf`);
      setRuntimeMessage("");
    } catch (error) {
      console.error("Production PDF export failed", error);
      setRuntimeMessage("The production PDF export could not be completed.");
    }
  };

  if (!visibleTabs.length) {
    return (
      <Container fluid className="workspace-page-shell">
        <Alert variant="warning" className="mb-0 production-safe-alert">
          No production sections are available for this account right now.
        </Alert>
      </Container>
    );
  }

  const ActiveComponent = currentTab?.Component;

  return (
    <Container fluid className="workspace-page-shell">
      <div className="workspace-page-stack">
        <header className="workspace-page-hero">
          <div>
            <h2 className="workspace-page-title">Production Workspace</h2>
            <p className="workspace-page-subtitle">
              Manage employees, materials, expenses, orders, and admin controls from one safer production shell.
            </p>
          </div>
          <div className="workspace-page-actions">
            <Button variant="light" style={toolbarButtonStyle} onClick={handlePrint}>
              <Printer className="me-2" /> Print
            </Button>
            <Dropdown align="end">
              <Dropdown.Toggle
                variant="light"
                style={toolbarButtonStyle}
                id="production-export-dropdown"
              >
                <Download className="me-2" /> Export
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow-sm border-0">
                <Dropdown.Item onClick={exportToPdf}>
                  <FileEarmarkPdfFill className="me-2 text-danger" />
                  Export Summary PDF
                </Dropdown.Item>
                <Dropdown.Item onClick={exportToCsv}>
                  <FileEarmarkSpreadsheetFill className="me-2 text-success" />
                  Export Summary CSV
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </header>

        <div className="workspace-metric-grid">
          {workspaceMetrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>

        <section style={sectionCardStyle} className="production-switcher-shell">
          <div className="production-switcher-head">
            <div>
              <h3 className="workspace-section-title">Sections</h3>
              <p className="workspace-section-copy">Jump between production work areas.</p>
            </div>
            <span className="reports-table-pill">{currentTab?.label}</span>
          </div>

          <div className="production-section-switcher" role="tablist" aria-label="Production sections">
            {visibleTabs.map((tab) => {
              const isActive = tab.key === activeTab;
              const Icon = tab.Icon;

              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`production-section-pill ${isActive ? "production-section-pill-active" : ""}`}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setRuntimeMessage("");
                  }}
                >
                  <span
                    className="production-section-pill-icon"
                    style={{ backgroundColor: isActive ? tab.accent : "#ffffff", color: tab.color }}
                  >
                    <Icon size={16} />
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section style={sectionCardStyle} className="production-shell-card">
          <div className="workspace-section-head">
            <div>
              <h3 className="workspace-section-title">{currentTab?.label}</h3>
              <p className="workspace-section-copy">{currentTab?.description}</p>
            </div>
            <div className="reports-table-meta">
              <span className="reports-table-pill">{visibleTabs.length} sections</span>
              <span className="reports-table-pill">{currentTab?.key || "Production"}</span>
            </div>
          </div>

          {runtimeMessage ? (
            <Alert variant="light" className="mb-3 production-safe-alert">
              <ExclamationTriangleFill className="me-2 text-warning" />
              {runtimeMessage}
            </Alert>
          ) : null}

          <ProductionSectionBoundary resetKey={activeTab}>
            <div className="production-content-wrap">
              {ActiveComponent ? <ActiveComponent /> : null}
            </div>
          </ProductionSectionBoundary>
        </section>
      </div>
    </Container>
  );
};

export default Production;
