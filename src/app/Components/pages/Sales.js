import React, { useMemo, useState } from "react";
import {
  Button,
  Card,
  Container,
  Dropdown,
  Form,
  InputGroup,
  Pagination,
  Table,
} from "react-bootstrap";
import {
  ArrowUpRight,
  BoxSeam,
  CartFill,
  Download,
  PeopleFill,
  Printer,
  ArrowClockwise,
  Search,
} from "react-bootstrap-icons";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useSelector } from "react-redux";

import { selectCustomers, useGetCustomersQuery } from "../../features/api/customers";
import { selectSales, useGetSalesQuery } from "../../features/api/salesSlice";
import { selectStock, useGetStockQuery } from "../../features/stock/stockSlice";
import PermissionWrapper from "../../auth/PermissionWrapper";
import { useSettings } from "../Settings";
import { formatCurrency } from "../../utils/currency";
import "./WorkspacePages.css";

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
  backgroundColor: palette.surface,
  color: palette.text,
  fontWeight: 700,
  boxShadow: "none",
};

const controlInputStyle = {
  minHeight: 46,
  borderRadius: 16,
  borderColor: palette.border,
};

const headerCellStyle = {
  color: palette.text,
  fontWeight: 800,
  fontSize: 14,
  whiteSpace: "nowrap",
  backgroundColor: palette.surface,
  paddingTop: 18,
  paddingBottom: 18,
};

const bodyCellStyle = {
  color: palette.text,
  fontSize: 14,
  paddingTop: 18,
  paddingBottom: 18,
  verticalAlign: "middle",
};

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

function PagePagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).slice(
    Math.max(0, currentPage - 3),
    Math.max(0, currentPage - 3) + 5
  );

  return (
    <Pagination className="mb-0">
      <Pagination.Prev
        disabled={currentPage === 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
      />
      {pages.map((pageNumber) => (
        <Pagination.Item
          key={pageNumber}
          active={pageNumber === currentPage}
          onClick={() => onPageChange(pageNumber)}
        >
          {pageNumber}
        </Pagination.Item>
      ))}
      <Pagination.Next
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
      />
    </Pagination>
  );
}

const SalesPage = () => {
  const { settings } = useSettings();
  const currency = settings?.currency !== "none" ? settings?.currency : "";

  const customers = useSelector(selectCustomers) ?? EMPTY_ARRAY;
  const sales = useSelector(selectSales) ?? EMPTY_ARRAY;
  const inventory = useSelector(selectStock) ?? EMPTY_ARRAY;
  const { refetch: refetchSales, isFetching: isSalesFetching } = useGetSalesQuery();
  const { refetch: refetchCustomers } = useGetCustomersQuery();
  const { refetch: refetchStock } = useGetStockQuery();

  const [filter, setFilter] = useState("");
  const [viewBy, setViewBy] = useState("product");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [aggregatePage, setAggregatePage] = useState(1);
  const [dailyPage, setDailyPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  const formatMoney = (value) => formatCurrency(value, currency || "UGX");

  const refreshSalesData = async () => {
    await Promise.all([refetchSales(), refetchCustomers(), refetchStock()]);
  };

  const processedData = useMemo(
    () =>
      sales.map((sale) => {
        const customer = customers.find((item) => String(item.custId) === String(sale.custId));
        const product = inventory.find((item) => String(item.itemId) === String(sale.saleItemId));
        const quantity = Number(sale.saleQuantity) || 0;
        const price = Number(sale.salePrice) || 0;

        return {
          ...sale,
          customerName: customer?.custName || "Unknown",
          productName: product?.itemName || "Unknown",
          quantity,
          price,
          totalSale: quantity * price,
        };
      }),
    [customers, inventory, sales]
  );

  const filteredData = useMemo(
    () =>
      processedData.filter((item) => {
        const itemDate = new Date(item.saleDateCreated);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);

        const isDateInRange = (!start || itemDate >= start) && (!end || itemDate <= end);
        const normalizedFilter = filter.toLowerCase();
        const isTextMatch =
          item.productName.toLowerCase().includes(normalizedFilter) ||
          item.customerName.toLowerCase().includes(normalizedFilter);

        return isDateInRange && isTextMatch;
      }),
    [processedData, filter, startDate, endDate]
  );

  const aggregatedViewData = useMemo(() => {
    const aggregation = filteredData.reduce((acc, item) => {
      const key = viewBy === "product" ? item.productName : item.customerName;
      if (!acc[key]) {
        acc[key] = { totalQuantity: 0, totalRevenue: 0, salesCount: 0 };
      }
      acc[key].totalQuantity += item.quantity;
      acc[key].totalRevenue += item.totalSale;
      acc[key].salesCount += 1;
      return acc;
    }, {});

    return Object.entries(aggregation)
      .map(([name, values]) => ({ name, ...values }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredData, viewBy]);

  const groupedData = useMemo(() => {
    const groups = filteredData.reduce((acc, item) => {
      const key = item.saleDateCreated?.split(" ")[0] || item.saleDateCreated;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    return Object.entries(groups).sort(([a], [b]) => new Date(b) - new Date(a));
  }, [filteredData]);

  const totalQuantitySold = useMemo(
    () => filteredData.reduce((sum, item) => sum + item.quantity, 0),
    [filteredData]
  );
  const totalRevenue = useMemo(
    () => filteredData.reduce((sum, item) => sum + item.totalSale, 0),
    [filteredData]
  );
  const totalCustomers = useMemo(
    () => new Set(filteredData.map((item) => item.custId)).size,
    [filteredData]
  );

  const topProduct = useMemo(() => aggregatedViewData[0], [aggregatedViewData]);
  const totalTransactions = filteredData.length;

  const aggregateTotalPages = Math.max(1, Math.ceil(aggregatedViewData.length / rowsPerPage));
  const paginatedAggregateData = aggregatedViewData.slice(
    (aggregatePage - 1) * rowsPerPage,
    aggregatePage * rowsPerPage
  );

  const dailyTotalPages = Math.max(1, Math.ceil(groupedData.length / rowsPerPage));
  const paginatedGroupedData = groupedData.slice(
    (dailyPage - 1) * rowsPerPage,
    dailyPage * rowsPerPage
  );

  const exportToPDF = (data, title) => {
    const doc = new jsPDF();
    doc.text(title, 14, 16);

    doc.autoTable({
      startY: 22,
      head: [["Date", "Customer", "Product", "Quantity", "Price", "Total"]],
      body: data.map((item) => [
        item.saleDateCreated,
        item.customerName,
        item.productName,
        item.quantity,
        formatMoney(item.price),
        formatMoney(item.totalSale),
      ]),
      headStyles: {
        fillColor: [47, 143, 87],
      },
    });

    doc.save(`${title.replace(/\s/g, "_")}.pdf`);
  };

  const exportAggregateToPDF = () => {
    const doc = new jsPDF();
    doc.text(viewBy === "product" ? "Product-wise Sales" : "Customer-wise Sales", 14, 16);

    doc.autoTable({
      startY: 22,
      head: [[viewBy === "product" ? "Product Name" : "Customer Name", "Total Quantity", "Total Revenue", "Sales Count"]],
      body: aggregatedViewData.map((item) => [
        item.name,
        item.totalQuantity,
        formatMoney(item.totalRevenue),
        item.salesCount,
      ]),
      headStyles: {
        fillColor: [47, 143, 87],
      },
    });

    doc.save(`${viewBy}-sales-summary.pdf`);
  };

  const printData = () => window.print();

  const handleViewChange = (event) => {
    setViewBy(event.target.value);
    setAggregatePage(1);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(Number(event.target.value));
    setAggregatePage(1);
    setDailyPage(1);
  };

  React.useEffect(() => {
    setAggregatePage(1);
    setDailyPage(1);
  }, [filter, startDate, endDate, viewBy]);

  return (
    <Container fluid className="workspace-page-shell">
      <div className="workspace-page-stack">
        <header className="workspace-page-hero">
          <div>
            <h2 className="workspace-page-title">Sales Workspace</h2>
            <p className="workspace-page-subtitle">
              Monitor revenue, compare customer and product performance, and review daily sales from one place.
            </p>
          </div>
          <div className="workspace-page-actions">
            <Button
              variant="light"
              onClick={refreshSalesData}
              disabled={isSalesFetching}
              style={toolbarButtonStyle}
            >
              <ArrowClockwise className="me-2" />
              {isSalesFetching ? "Refreshing..." : "Refresh"}
            </Button>
            <Button variant="light" onClick={printData} style={toolbarButtonStyle}>
              <Printer className="me-2" />
              Print
            </Button>
            <Dropdown>
              <Dropdown.Toggle variant="light" id="sales-export" style={toolbarButtonStyle}>
                <Download className="me-2" />
                Export
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => exportToPDF(filteredData, "Filtered Sales Data")}>
                  Export filtered sales
                </Dropdown.Item>
                <Dropdown.Item onClick={exportAggregateToPDF}>
                  Export summary view
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <PermissionWrapper
              required={["salesdesk", "admin"]}
              children={
                <Button variant="light" style={{ ...toolbarButtonStyle, borderColor: `${palette.green}33`, color: palette.green }}>
                  Open Sales Desk
                </Button>
              }
            />
          </div>
        </header>

        <div className="workspace-metric-grid">
          <MetricCard
            icon={<CartFill size={18} />}
            title="Quantity Sold"
            value={totalQuantitySold}
            note="Units sold in the current filter"
            accent={palette.greenSoft}
            color={palette.green}
          />
          <MetricCard
            icon={<ArrowUpRight size={18} />}
            title="Revenue"
            value={formatMoney(totalRevenue)}
            note="Total sales value in view"
            accent={palette.blueSoft}
            color={palette.blue}
          />
          <MetricCard
            icon={<PeopleFill size={18} />}
            title="Customers Reached"
            value={totalCustomers}
            note="Unique customers in filtered sales"
            accent={palette.amberSoft}
            color={palette.amber}
          />
          <MetricCard
            icon={<BoxSeam size={18} />}
            title="Transactions"
            value={totalTransactions}
            note={topProduct ? `Top ${viewBy}: ${topProduct.name}` : "No sales available"}
            accent={palette.greenSoft}
            color={palette.green}
          />
        </div>

        <Card style={sectionCardStyle}>
          <Card.Body className="p-3 p-lg-4">
            <div className="workspace-toolbar-grid">
              <InputGroup className="workspace-search-group">
                <InputGroup.Text className="workspace-search-adornment">
                  <Search />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Filter by product or customer..."
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className="workspace-search-input"
                />
              </InputGroup>

              <Form.Select value={viewBy} onChange={handleViewChange} style={controlInputStyle}>
                <option value="product">Product View</option>
                <option value="customer">Customer View</option>
                <option value="daily">Daily Sales</option>
              </Form.Select>

              <Form.Control
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                style={controlInputStyle}
              />

              <Form.Control
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                style={controlInputStyle}
              />

              <Form.Select value={rowsPerPage} onChange={handleRowsPerPageChange} style={controlInputStyle}>
                <option value="5">5 rows</option>
                <option value="8">8 rows</option>
                <option value="10">10 rows</option>
                <option value="20">20 rows</option>
              </Form.Select>
            </div>
          </Card.Body>
        </Card>

        {viewBy === "product" || viewBy === "customer" ? (
          <Card style={sectionCardStyle}>
            <Card.Body className="p-3 p-lg-4">
              <div className="workspace-section-head">
                <div>
                  <h3 className="workspace-section-title">
                    {viewBy === "product" ? "Product-wise Sales" : "Customer-wise Sales"}
                  </h3>
                  <p className="workspace-section-copy">
                    Compare grouped sales performance by {viewBy === "product" ? "product" : "customer"}.
                  </p>
                </div>
                <Button variant="light" onClick={exportAggregateToPDF} style={toolbarButtonStyle}>
                  <Download className="me-2" />
                  Export Summary
                </Button>
              </div>

              <div className="workspace-table-wrap">
                <Table hover className="align-middle mb-0 workspace-modern-table">
                  <thead>
                    <tr>
                      <th style={headerCellStyle}>{viewBy === "product" ? "Product Name" : "Customer Name"}</th>
                      <th style={headerCellStyle}>Total Quantity Sold</th>
                      <th style={headerCellStyle}>Total Revenue</th>
                      <th style={headerCellStyle}>Number of Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAggregateData.map((item, index) => (
                      <tr key={`${item.name}-${index}`}>
                        <td style={bodyCellStyle}>{item.name}</td>
                        <td style={bodyCellStyle}>{item.totalQuantity}</td>
                        <td style={bodyCellStyle}>{formatMoney(item.totalRevenue)}</td>
                        <td style={bodyCellStyle}>{item.salesCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              <div className="workspace-table-footer">
                <div className="workspace-table-summary">
                  Quantity total: <strong>{aggregatedViewData.reduce((sum, item) => sum + item.totalQuantity, 0)}</strong>
                  <span className="workspace-summary-spacer" />
                  Revenue total: <strong>{formatMoney(aggregatedViewData.reduce((sum, item) => sum + item.totalRevenue, 0))}</strong>
                </div>
                <PagePagination
                  currentPage={aggregatePage}
                  totalPages={aggregateTotalPages}
                  onPageChange={setAggregatePage}
                />
              </div>
            </Card.Body>
          </Card>
        ) : (
          <div className="workspace-day-list">
            {paginatedGroupedData.map(([group, items]) => (
              <Card key={group} style={sectionCardStyle}>
                <Card.Body className="p-3 p-lg-4">
                  <div className="workspace-section-head">
                    <div>
                      <h3 className="workspace-section-title">{new Date(group).toDateString()}</h3>
                      <p className="workspace-section-copy">
                        {items.length} sale record{items.length === 1 ? "" : "s"} captured on this day.
                      </p>
                    </div>
                    <Button
                      variant="light"
                      onClick={() => exportToPDF(items, `Sales_on_${group}`)}
                      style={toolbarButtonStyle}
                    >
                      <Download className="me-2" />
                      Export This Day
                    </Button>
                  </div>

                  <div className="workspace-table-wrap">
                    <Table hover className="align-middle mb-0 workspace-modern-table">
                      <thead>
                        <tr>
                          <th style={headerCellStyle}>Sale ID</th>
                          <th style={headerCellStyle}>Customer</th>
                          <th style={headerCellStyle}>Product</th>
                          <th style={headerCellStyle}>Quantity</th>
                          <th style={headerCellStyle}>Price</th>
                          <th style={headerCellStyle}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((sale) => (
                          <tr key={sale.saleId}>
                            <td style={bodyCellStyle}>{sale.saleId}</td>
                            <td style={bodyCellStyle}>{sale.customerName}</td>
                            <td style={bodyCellStyle}>{sale.productName}</td>
                            <td style={bodyCellStyle}>{sale.quantity}</td>
                            <td style={bodyCellStyle}>{formatMoney(sale.price)}</td>
                            <td style={bodyCellStyle}>{formatMoney(sale.totalSale)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  <div className="workspace-table-footer">
                    <div className="workspace-table-summary">
                      Quantity: <strong>{items.reduce((sum, item) => sum + item.quantity, 0)}</strong>
                      <span className="workspace-summary-spacer" />
                      Total: <strong>{formatMoney(items.reduce((sum, item) => sum + item.totalSale, 0))}</strong>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))}

            <div className="workspace-pagination-row">
              <PagePagination
                currentPage={dailyPage}
                totalPages={dailyTotalPages}
                onPageChange={setDailyPage}
              />
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export default SalesPage;
