import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { BarChart, LineChart } from "@mui/x-charts";
import {
  ArrowLeftRight,
  Bell,
  Boxes,
  CashCoin,
  ClipboardData,
  Download,
  ExclamationTriangle,
  GraphUpArrow,
  Hammer,
  People,
  PersonBadge,
  Receipt,
  Truck,
} from "react-bootstrap-icons";

import {
  useGetAlertsReportQuery,
  useGetCustomerReportQuery,
  useGetExpenseReportQuery,
  useGetInventoryReportQuery,
  useGetProductionReportQuery,
  useGetPurchaseReportQuery,
  useGetRawMaterialReportQuery,
  useGetReportsCatalogQuery,
  useGetReportsDashboardQuery,
  useGetSalesPaidVsCreditReportQuery,
  useGetSalesProductProfitReportQuery,
  useGetSalesReportQuery,
  useGetStaffReportQuery,
  useGetStockMovementsReportQuery,
  useGetSupplierReportQuery,
} from "../../features/api/reportApiSlice";
import "./WorkspacePages.css";

const periods = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This week" },
  { value: "last_week", label: "Last week" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_year", label: "This year" },
  { value: "custom", label: "Custom" },
];

const reportTabs = [
  { key: "dashboard", label: "Dashboard", icon: GraphUpArrow },
  { key: "sales", label: "Sales", icon: Receipt },
  { key: "productProfit", label: "Product Profit", icon: GraphUpArrow },
  { key: "paidVsCredit", label: "Paid vs Credit", icon: CashCoin },
  { key: "inventory", label: "Inventory", icon: Boxes },
  { key: "stockMovements", label: "Stock Movements", icon: ArrowLeftRight },
  { key: "purchases", label: "Purchases", icon: Truck },
  { key: "suppliers", label: "Suppliers", icon: ClipboardData },
  { key: "rawMaterials", label: "Raw Materials", icon: Hammer },
  { key: "production", label: "Production", icon: ClipboardData },
  { key: "expenses", label: "Expenses", icon: CashCoin },
  { key: "customers", label: "Customers", icon: People },
  { key: "staff", label: "Staff", icon: PersonBadge },
  { key: "alerts", label: "Alerts", icon: Bell },
];

const currency = (value) => `UGX ${Number(value || 0).toLocaleString()}`;
const number = (value) => Number(value || 0).toLocaleString();

const valueFormatter = (item) => {
  if (item?.format === "currency") return currency(item.value);
  return number(item?.value);
};

function ReportsSample() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [period, setPeriod] = useState("this_month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");

  const params = useMemo(
    () => ({
      period,
      ...(period === "custom" && from ? { from } : {}),
      ...(period === "custom" && to ? { to } : {}),
      ...(search ? { search } : {}),
    }),
    [period, from, to, search]
  );

  const catalogQuery = useGetReportsCatalogQuery();
  const dashboardQuery = useGetReportsDashboardQuery(params);
  const salesQuery = useGetSalesReportQuery(params, { skip: activeTab !== "sales" });
  const productProfitQuery = useGetSalesProductProfitReportQuery(params, { skip: activeTab !== "productProfit" });
  const paidVsCreditQuery = useGetSalesPaidVsCreditReportQuery(params, { skip: activeTab !== "paidVsCredit" });
  const inventoryQuery = useGetInventoryReportQuery(params, { skip: activeTab !== "inventory" });
  const stockMovementsQuery = useGetStockMovementsReportQuery(params, { skip: activeTab !== "stockMovements" });
  const purchaseQuery = useGetPurchaseReportQuery(params, { skip: activeTab !== "purchases" });
  const supplierQuery = useGetSupplierReportQuery(params, { skip: activeTab !== "suppliers" });
  const rawMaterialQuery = useGetRawMaterialReportQuery(params, { skip: activeTab !== "rawMaterials" });
  const productionQuery = useGetProductionReportQuery(params, { skip: activeTab !== "production" });
  const expenseQuery = useGetExpenseReportQuery(params, { skip: activeTab !== "expenses" });
  const customerQuery = useGetCustomerReportQuery(params, { skip: activeTab !== "customers" });
  const staffQuery = useGetStaffReportQuery(params, { skip: activeTab !== "staff" });
  const alertsQuery = useGetAlertsReportQuery(params, { skip: activeTab !== "alerts" });

  const activeQuery = {
    dashboard: dashboardQuery,
    sales: salesQuery,
    productProfit: productProfitQuery,
    paidVsCredit: paidVsCreditQuery,
    inventory: inventoryQuery,
    stockMovements: stockMovementsQuery,
    purchases: purchaseQuery,
    suppliers: supplierQuery,
    rawMaterials: rawMaterialQuery,
    production: productionQuery,
    expenses: expenseQuery,
    customers: customerQuery,
    staff: staffQuery,
    alerts: alertsQuery,
  }[activeTab];

  const dashboard = dashboardQuery.data?.data || {};
  const activeData = activeQuery?.data?.data || {};
  const accuracyNotes = activeQuery?.data?.meta?.accuracyNotes || dashboardQuery.data?.meta?.accuracyNotes || [];
  const activeTable = activeData.table || activeQuery?.data?.table || {};
  const activeTitle = activeQuery?.data?.report?.title || `${formatLabel(activeTab)} report`;
  const canExport = activeTab !== "dashboard" && activeTab !== "alerts" && (activeTable.rows || []).length > 0;

  const handleExportCsv = () => {
    exportTableToCsv(activeTitle, activeTable);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box className="workspace-page" sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f7faf8", minHeight: "100vh" }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#14213d" }}>
            Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Backend-calculated analytics for sales, stock, expenses, customers, audit risk, and alerts.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" startIcon={<Download />} disabled={!canExport} onClick={handleExportCsv}>
            Export CSV
          </Button>
          <Button variant="outlined" disabled={activeTab === "alerts"} onClick={handlePrint}>
            Print
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: "1px solid #e6ece8" }} elevation={0}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems={{ xs: "stretch", lg: "center" }}>
          <TextField
            select
            size="small"
            label="Period"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            sx={{ minWidth: 170 }}
          >
            {periods.map((item) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </TextField>
          {period === "custom" && (
            <>
              <TextField
                size="small"
                type="date"
                label="From"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                size="small"
                type="date"
                label="To"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}
          <TextField
            size="small"
            label="Search report rows"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ minWidth: { xs: "100%", md: 260 } }}
          />
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={3} lg={2.5}>
          <Paper sx={{ p: 1, borderRadius: 2, border: "1px solid #e6ece8" }} elevation={0}>
            {reportTabs.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                fullWidth
                onClick={() => setActiveTab(key)}
                startIcon={<Icon />}
                sx={{
                  justifyContent: "flex-start",
                  mb: 0.5,
                  color: activeTab === key ? "#0f6b3f" : "#344054",
                  bgcolor: activeTab === key ? "#e8f5ec" : "transparent",
                }}
              >
                {label}
              </Button>
            ))}
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
              {catalogQuery.data?.data?.length || 0} catalog reports discovered
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={9} lg={9.5}>
          {dashboardQuery.isLoading ? (
            <LoadingPanel />
          ) : dashboardQuery.error ? (
            <ErrorPanel error={dashboardQuery.error} />
          ) : (
            <Stack spacing={2}>
              <KpiGrid kpis={dashboard.kpis || []} />
              {activeQuery?.isFetching && activeTab !== "dashboard" ? <LoadingPanel compact /> : null}
              {activeQuery?.error ? <ErrorPanel error={activeQuery.error} /> : null}
              {activeTab === "dashboard" ? (
                <DashboardCharts charts={dashboard.charts || []} insights={dashboard.insights || []} />
              ) : (
                <ReportDetail activeTab={activeTab} data={activeData} />
              )}
              <AccuracyNotes notes={accuracyNotes} />
            </Stack>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

function KpiGrid({ kpis }) {
  const icons = {
    total_sales: Receipt,
    cash_received: CashCoin,
    stock_value: Boxes,
    customer_debt: People,
    low_stock_products: ExclamationTriangle,
    alerts: Bell,
  };

  return (
    <Grid container spacing={2}>
      {kpis.map((item) => {
        const Icon = icons[item.key] || GraphUpArrow;

        return (
          <Grid item xs={12} sm={6} lg={3} key={item.key}>
            <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid #e6ece8", height: "100%" }} elevation={0}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  {item.label}
                </Typography>
                <Icon color="#0f6b3f" />
              </Stack>
              <Typography variant="h5" sx={{ mt: 1, fontWeight: 800 }}>
                {valueFormatter(item)}
              </Typography>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
}

function DashboardCharts({ charts, insights }) {
  const salesTrend = charts.find((chart) => chart.key === "sales_trend")?.data || [];
  const expenseTrend = charts.find((chart) => chart.key === "expense_trend")?.data || [];
  const topProducts = charts.find((chart) => chart.key === "top_products")?.data || [];
  const trend = mergeTrendSeries(salesTrend, expenseTrend);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={7}>
        <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid #e6ece8" }} elevation={0}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Sales and Expenses Trend
          </Typography>
          {trend.labels.length ? (
            <LineChart
              height={300}
              xAxis={[{ scaleType: "point", data: trend.labels }]}
              series={[
                { label: "Sales", data: trend.sales, color: "#0f6b3f" },
                { label: "Expenses", data: trend.expenses, color: "#d97706" },
              ]}
            />
          ) : (
            <EmptyChart />
          )}
        </Paper>
      </Grid>
      <Grid item xs={12} lg={5}>
        <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid #e6ece8" }} elevation={0}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Top Selling Products
          </Typography>
          {topProducts.length ? (
            <BarChart
              height={300}
              xAxis={[{ scaleType: "band", data: topProducts.map((row) => row.productName || "Unknown") }]}
              series={[{ data: topProducts.map((row) => Number(row.quantitySold || 0)), color: "#2563eb" }]}
            />
          ) : (
            <EmptyChart />
          )}
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <InsightsList items={insights} />
      </Grid>
    </Grid>
  );
}

function mergeTrendSeries(salesTrend, expenseTrend) {
  const labels = Array.from(
    new Set([
      ...salesTrend.map((row) => row?.label).filter(Boolean),
      ...expenseTrend.map((row) => row?.label).filter(Boolean),
    ])
  ).sort();

  const salesMap = new Map(salesTrend.map((row) => [row?.label, Number(row?.value || 0)]));
  const expenseMap = new Map(expenseTrend.map((row) => [row?.label, Number(row?.value || 0)]));

  return {
    labels,
    sales: labels.map((label) => salesMap.get(label) || 0),
    expenses: labels.map((label) => expenseMap.get(label) || 0),
  };
}

function EmptyChart() {
  return (
    <Box sx={{ height: 300, display: "grid", placeItems: "center", color: "text.secondary" }}>
      No chart data found for the selected filters.
    </Box>
  );
}

function ReportDetail({ activeTab, data }) {
  if (activeTab === "alerts") {
    return <InsightsList items={data.items || []} />;
  }

  return (
    <Stack spacing={2}>
      <SummaryPanel title={`${formatLabel(activeTab)} summary`} summary={data.summary || {}} />
      <ReportChartPanel chart={data.chart} />
      <RelatedCollections data={data} />
      <InsightsList items={data.insights || []} />
      <ReportTable table={data.table} />
    </Stack>
  );
}

function RelatedCollections({ data }) {
  const sections = [
    { key: "usage", title: "Usage Snapshot" },
    { key: "outputs", title: "Output Snapshot" },
    { key: "employees", title: "Employee Snapshot" },
    { key: "movements", title: "Recent Movements" },
    { key: "lowStock", title: "Low Stock Watch" },
    { key: "topProducts", title: "Top Products" },
    { key: "paymentMethods", title: "Payment Methods" },
  ].filter((section) => Array.isArray(data?.[section.key]) && data[section.key].length > 0);

  if (!sections.length) return null;

  return (
    <Grid container spacing={2}>
      {sections.slice(0, 2).map((section) => (
        <Grid item xs={12} lg={6} key={section.key}>
          <MiniRows title={section.title} rows={data[section.key]} />
        </Grid>
      ))}
    </Grid>
  );
}

function MiniRows({ title, rows }) {
  const visibleRows = rows.slice(0, 6);
  const columns = Object.keys(visibleRows[0] || {}).slice(0, 4);

  return (
    <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid #e6ece8", height: "100%" }} elevation={0}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        {title}
      </Typography>
      <Stack spacing={1}>
        {visibleRows.map((row, index) => (
          <Box key={row.id || row.product_id || row.material_id || row.employee_id || index} sx={{ p: 1, borderRadius: 1, bgcolor: "#f8faf9" }}>
            {columns.map((column) => (
              <Typography key={column} variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                <strong>{formatLabel(column)}:</strong> {String(row[column] ?? "")}
              </Typography>
            ))}
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

function ReportChartPanel({ chart }) {
  if (!chart?.type) return null;

  const labels = chart.labels || [];
  const datasets = chart.datasets || [];

  if (!labels.length || !datasets.length) {
    return null;
  }

  return (
    <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid #e6ece8" }} elevation={0}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        Chart
      </Typography>
      {chart.type === "bar" ? (
        <BarChart
          height={320}
          xAxis={[{ scaleType: "band", data: labels }]}
          series={datasets.map((dataset, index) => ({
            label: dataset.label,
            data: dataset.data?.map((value) => Number(value || 0)) || [],
            color: index === 0 ? "#0f6b3f" : "#2563eb",
          }))}
        />
      ) : chart.type === "line" ? (
        <LineChart
          height={320}
          xAxis={[{ scaleType: "point", data: labels }]}
          series={datasets.map((dataset, index) => ({
            label: dataset.label,
            data: dataset.data?.map((value) => Number(value || 0)) || [],
            color: index === 0 ? "#0f6b3f" : "#2563eb",
          }))}
        />
      ) : (
        <EmptyChart />
      )}
    </Paper>
  );
}

function SummaryPanel({ title, summary }) {
  return (
    <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid #e6ece8" }} elevation={0}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        {title}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {Object.entries(summary).map(([key, value]) => (
          <Chip
            key={key}
            label={`${formatLabel(key)}: ${formatSummaryValue(key, value)}`}
            sx={{ bgcolor: "#f1f5f9" }}
          />
        ))}
      </Stack>
    </Paper>
  );
}

function ReportTable({ table }) {
  const rows = table?.rows || [];

  return (
    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: "1px solid #e6ece8" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {(table?.columns || Object.keys(rows[0] || {})).map((column) => (
              <TableCell key={column} sx={{ fontWeight: 700 }}>
                {column}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={table?.columns?.length || 1}>
                <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                  No records found for the selected filters.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={row.id || row.saleId || row.itemId || row.customerId || index}>
                {(table?.columns || Object.keys(row)).map((column) => (
                  <TableCell key={column}>{String(row[column] ?? "")}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function InsightsList({ items }) {
  return (
    <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid #e6ece8" }} elevation={0}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        Alerts and Insights
      </Typography>
      <Stack spacing={1}>
        {items?.length ? (
          items.map((item, index) => (
            <Alert
              key={item.id || item.message || index}
              severity={item.severity === "critical" ? "error" : item.severity === "warning" ? "warning" : "info"}
            >
              {item.title ? <strong>{item.title}</strong> : null} {item.explanation || item.message}{" "}
              {item.suggestedAction || item.suggested_action}
            </Alert>
          ))
        ) : (
          <Typography color="text.secondary">No alerts found for the selected filters.</Typography>
        )}
      </Stack>
    </Paper>
  );
}

function formatLabel(value) {
  return String(value || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatSummaryValue(key, value) {
  const numericValue = Number(value || 0);

  if (key.toLowerCase().includes("percent")) {
    return `${numericValue.toLocaleString()}%`;
  }

  if (
    key.toLowerCase().includes("sales") ||
    key.toLowerCase().includes("cost") ||
    key.toLowerCase().includes("profit") ||
    key.toLowerCase().includes("amount") ||
    key.toLowerCase().includes("balance") ||
    key.toLowerCase().includes("expense") ||
    key.toLowerCase().includes("salary") ||
    key.toLowerCase().includes("value") ||
    key.toLowerCase().includes("margin") ||
    key.toLowerCase().includes("discount") ||
    key.toLowerCase().includes("credit") ||
    key.toLowerCase().includes("collected") ||
    key.toLowerCase().includes("paid")
  ) {
    return currency(value);
  }

  return typeof value === "number" ? number(value) : value;
}

function AccuracyNotes({ notes }) {
  if (!notes?.length) return null;

  return (
    <Alert severity="info">
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        Accuracy notes
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2 }}>
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </Box>
    </Alert>
  );
}

function LoadingPanel({ compact = false }) {
  return (
    <Paper sx={{ p: compact ? 2 : 4, borderRadius: 2, textAlign: "center" }} elevation={0}>
      <CircularProgress size={compact ? 24 : 36} />
    </Paper>
  );
}

function ErrorPanel({ error }) {
  const message = error?.data?.message || error?.error || "The report could not be loaded.";

  return <Alert severity="error">{message}</Alert>;
}

function exportTableToCsv(title, table) {
  const rows = table?.rows || [];
  const columns = table?.columns || Object.keys(rows[0] || {});

  if (!rows.length || !columns.length) return;

  const escapeCell = (value) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [
    columns.map(escapeCell).join(","),
    ...rows.map((row) => columns.map((column) => escapeCell(row[column])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${String(title || "report").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default ReportsSample;
