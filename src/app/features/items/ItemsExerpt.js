import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Box, Button, Chip, LinearProgress, Stack, Tab, TextField } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { CalendarMonth, Download, Inventory2, Print, QueryStats } from "@mui/icons-material";
import format from "date-fns/format";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { useGetStokQuery, selectStok } from "../api/stockSlice";
import { selectStock } from "../stock/stockSlice";
import { selectBranches, useGetBranchesQuery } from "../api/branchesSlice";
import StockEntry from "../../Components/StockEntry";
import PermissionWrapper from "../../auth/PermissionWrapper";
import "../../Components/StockWorkspace.css";

const EMPTY_ARRAY = [];

const palette = {
  bg: "var(--ampla-app-bg, #f8fbf8)",
  surface: "var(--ampla-surface-bg, #ffffff)",
  border: "var(--ampla-border-color, #e7efe9)",
  text: "var(--ampla-text-color, #15202b)",
  muted: "var(--ampla-muted-color, #6f7d8c)",
  green: "var(--ampla-accent-color, #2f8f57)",
  greenSoft: "var(--ampla-accent-soft, #e8f5ec)",
  blue: "#2f80ed",
  blueSoft: "#e8f1ff",
  amber: "#f59e0b",
  amberSoft: "#fff4df",
  shadow: "0 12px 32px rgba(15, 23, 42, 0.05)",
};

function MetricCard({ icon, title, value, note, accent, color }) {
  return (
    <div
      className="stock-metric-card"
      style={{
        backgroundColor: palette.surface,
        border: `1px solid ${palette.border}`,
        boxShadow: palette.shadow,
      }}
    >
      <div className="stock-metric-icon" style={{ backgroundColor: accent, color }}>
        {icon}
      </div>
      <div>
        <div className="stock-metric-title">{title}</div>
        <div className="stock-metric-value">{value}</div>
        <div className="stock-metric-note">{note}</div>
      </div>
    </div>
  );
}

const ItemsExcerpt = () => {
  useGetBranchesQuery();
  const { isLoading: isStockQueryLoading } = useGetStokQuery();
  const [value, setValue] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const stock = useSelector(selectStok) ?? EMPTY_ARRAY;
  const items = useSelector(selectStock) ?? EMPTY_ARRAY;
  const branches = useSelector(selectBranches) ?? EMPTY_ARRAY;

  const itemsMap = useMemo(
    () => new Map(items.map((item) => [Number(item.itemId), item.itemName])),
    [items]
  );

  const branchMap = useMemo(
    () => new Map(branches.map((branch) => [Number(branch.branchId), branch.branchName])),
    [branches]
  );

  const stockDates = useMemo(
    () =>
      [...new Set(stock.map((item) => item?.stockCreated?.split(" ")[0]).filter(Boolean))].sort(
        (a, b) => new Date(b) - new Date(a)
      ),
    [stock]
  );

  const filteredStockDates = useMemo(
    () =>
      stockDates.filter((date) => {
        if (startDate && new Date(date) < new Date(startDate)) return false;
        if (endDate && new Date(date) > new Date(endDate)) return false;
        return true;
      }),
    [endDate, startDate, stockDates]
  );

  const groupedStock = useMemo(
    () =>
      filteredStockDates.map((date) => {
        const entries = stock.filter((item) => item?.stockCreated?.split(" ")[0] === date);
        const totalQuantity = entries.reduce(
          (sum, item) => sum + (Number(item.stockItemQuantity) || 0),
          0
        );

        return {
          date,
          entries,
          totalQuantity,
        };
      }),
    [filteredStockDates, stock]
  );

  const totals = useMemo(
    () => ({
      productionDays: stockDates.length,
      filteredDays: filteredStockDates.length,
      entries: stock.length,
      quantity: stock.reduce((sum, item) => sum + (Number(item.stockItemQuantity) || 0), 0),
    }),
    [filteredStockDates.length, stock, stockDates.length]
  );

  const handlePrintOrExport = (action, stockDate = null) => {
    const selectedDates = stockDate ? [stockDate] : filteredStockDates;
    const dataToProcess = stock.filter((item) =>
      selectedDates.includes(item?.stockCreated?.split(" ")[0])
    );

    if (!dataToProcess.length) return;

    const doc = new jsPDF();
    const tableHeaders = [["#", "Item", "Branch", "Previous Stock", "Reordered Qty", "Recorded On"]];
    const tableData = dataToProcess.map((stockItem, index) => [
      index + 1,
      itemsMap.get(Number(stockItem?.stockItem)) || "N/A",
      branchMap.get(Number(stockItem?.branchId)) || "Unassigned",
      stockItem?.oldStock ?? 0,
      stockItem?.stockItemQuantity ?? 0,
      stockItem?.stockCreated ?? "N/A",
    ]);

    const title = stockDate
      ? `Stock/Reorder Summary for ${format(new Date(stockDate), "EEE, dd MMM yyyy")}`
      : "Stock/Reorder Summary Report";

    doc.text(title, 14, 15);
    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: 22,
      styles: {
        fontSize: 10,
      },
      headStyles: {
        fillColor: [47, 143, 87],
      },
    });

    if (action === "print") {
      doc.autoPrint();
      window.open(doc.output("bloburl"), "_blank");
      return;
    }

    const fileName = stockDate
      ? `stock-reorder-summary-${stockDate}.pdf`
      : "stock-reorder-summary-report.pdf";
    doc.save(fileName);
  };

  return (
    <div className="stock-workspace" style={{ backgroundColor: palette.bg, minHeight: "100vh" }}>
      <div className="stock-shell">
        <header className="stock-header">
          <div>
            <h2 className="stock-title">Stock/Reorder Workspace</h2>
            <p className="stock-subtitle">
              Review stock reorder history and add new stock intake entries from one clean workspace.
            </p>
          </div>
        </header>

        <div className="stock-metrics-grid">
          <MetricCard
            icon={<CalendarMonth fontSize="small" />}
            title="Reorder Days"
            value={totals.productionDays}
            note="All recorded stock intake dates"
            accent={palette.greenSoft}
            color={palette.green}
          />
          <MetricCard
            icon={<QueryStats fontSize="small" />}
            title="Filtered Days"
            value={totals.filteredDays}
            note="Visible in the current date range"
            accent={palette.blueSoft}
            color={palette.blue}
          />
          <MetricCard
            icon={<Inventory2 fontSize="small" />}
            title="Stock Entries"
            value={totals.entries}
            note="Saved stock reorder records"
            accent={palette.amberSoft}
            color={palette.amber}
          />
          <MetricCard
            icon={<Download fontSize="small" />}
            title="Total Reordered Qty"
            value={totals.quantity}
            note="Quantity added across all reorder records"
            accent={palette.greenSoft}
            color={palette.green}
          />
        </div>

        <TabContext value={value}>
          <Box className="stock-tabs-shell">
            <TabList
              onChange={(_, nextValue) => setValue(nextValue)}
              aria-label="stock tabs"
              sx={{
                minHeight: 56,
                px: 1,
                "& .MuiTabs-indicator": {
                  display: "none",
                },
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: "14px",
                  minHeight: 44,
                  color: palette.muted,
                  mx: 0.5,
                  my: 0.75,
                },
                "& .Mui-selected": {
                  color: `${palette.green} !important`,
                  backgroundColor: palette.greenSoft,
                },
              }}
            >
              <Tab label="Stock/Reorder Summary" value="1" />
              <Tab label="New Stock Reorder" value="2" />
            </TabList>
          </Box>

          <TabPanel value="1" sx={{ px: 0, pt: 3 }}>
            {isStockQueryLoading && (
              <div className="stock-progress-shell">
                <LinearProgress />
              </div>
            )}

            <div className="stock-filter-card">
              <div>
                <h3 className="stock-section-title">Filter and Export</h3>
                <p className="stock-section-copy">
                  Narrow the production history by date, then print or export the exact range you need.
                </p>
              </div>

              <div className="stock-filter-grid">
                <TextField
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} className="stock-filter-actions">
                  <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={() => handlePrintOrExport("print")}
                    disabled={!groupedStock.length}
                    sx={stockGhostButtonStyle}
                  >
                    Print Filtered
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={() => handlePrintOrExport("export")}
                    disabled={!groupedStock.length}
                    sx={stockPrimaryButtonStyle}
                  >
                    Export Filtered
                  </Button>
                </Stack>
              </div>
            </div>

            {!stock.length && !isStockQueryLoading ? (
              <div className="stock-empty-card">
                <h3>No Reorder History Available</h3>
                <p>Stock reorder history will appear here after the first saved stock entry.</p>
              </div>
            ) : groupedStock.length ? (
              <div className="stock-summary-list">
                {groupedStock.map(({ date, entries, totalQuantity }) => (
                  <article key={date} className="stock-date-card">
                    <div className="stock-date-card-header">
                      <div>
                        <h3 className="stock-date-title">
                          {format(new Date(date), "EEE, dd MMM yyyy")}
                        </h3>
                        <p className="stock-date-copy">
                          Review all stock intake recorded for this day.
                        </p>
                      </div>
                      <div className="stock-date-actions">
                        <Chip
                          label={`${entries.length} item${entries.length === 1 ? "" : "s"}`}
                          sx={stockChipStyle(palette.greenSoft, palette.green)}
                        />
                        <Chip
                          label={`Qty ${totalQuantity}`}
                          sx={stockChipStyle(palette.blueSoft, palette.blue)}
                        />
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handlePrintOrExport("print", date)}
                          sx={stockIconButtonStyle}
                        >
                          <Print fontSize="small" />
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handlePrintOrExport("export", date)}
                          sx={stockIconButtonStyle}
                        >
                          <Download fontSize="small" />
                        </Button>
                      </div>
                    </div>

                    <div className="stock-table-wrap">
                      <table className="stock-modern-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Item</th>
                            <th>Branch</th>
                            <th>Previous Stock</th>
                            <th>Reordered Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map((entry, index) => (
                            <tr key={entry.stockId || `${date}-${index}`}>
                              <td>{index + 1}</td>
                              <td>{itemsMap.get(Number(entry.stockItem)) || "N/A"}</td>
                              <td>{branchMap.get(Number(entry.branchId)) || "Unassigned"}</td>
                              <td>{entry.oldStock ?? 0}</td>
                              <td>{entry.stockItemQuantity ?? 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="stock-date-footer">
                      <strong>Total Reordered Qty:</strong> {totalQuantity}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="stock-empty-card">
                <h3>No stock data in this range</h3>
                <p>Try adjusting the date filter to see saved stock reorder records.</p>
              </div>
            )}
          </TabPanel>

          <PermissionWrapper
            required={["stockcreate"]}
            children={
              <TabPanel value="2" sx={{ px: 0, pt: 3 }}>
                <StockEntry />
              </TabPanel>
            }
          />
        </TabContext>
      </div>
    </div>
  );
};

const stockPrimaryButtonStyle = {
  minHeight: 46,
  borderRadius: "14px",
  px: 2.25,
  textTransform: "none",
  fontWeight: 700,
  backgroundColor: palette.green,
  boxShadow: "0 12px 24px rgba(47, 143, 87, 0.18)",
  "&:hover": {
    backgroundColor: palette.green,
    boxShadow: "0 14px 28px rgba(47, 143, 87, 0.24)",
  },
};

const stockGhostButtonStyle = {
  minHeight: 46,
  borderRadius: "14px",
  px: 2.25,
  textTransform: "none",
  fontWeight: 700,
  borderColor: palette.border,
  color: palette.text,
  backgroundColor: palette.surface,
  "&:hover": {
    borderColor: palette.green,
    backgroundColor: palette.greenSoft,
  },
};

const stockIconButtonStyle = {
  minWidth: 42,
  width: 42,
  height: 42,
  borderRadius: "12px",
  borderColor: palette.border,
  color: palette.text,
  backgroundColor: palette.surface,
  "&:hover": {
    borderColor: palette.green,
    backgroundColor: palette.greenSoft,
  },
};

const stockChipStyle = (backgroundColor, color) => ({
  height: 32,
  borderRadius: "999px",
  backgroundColor,
  color,
  fontWeight: 700,
});

export default ItemsExcerpt;
