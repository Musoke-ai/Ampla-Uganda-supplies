// Final enhanced ReportsPage with dropdown selectors for customers and products
import React, { useEffect, useState } from "react";
import {
  Container, Row, Col, Form, Button, Table, Dropdown, ButtonGroup, Pagination, Card
} from "react-bootstrap";
import { useSelector } from "react-redux";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { FaPrint, FaFilePdf, FaFileExcel } from "react-icons/fa";

import { selectStock } from "../../features/stock/stockSlice";
import { selectSales } from "../../features/api/salesSlice";
import { selectEmployees } from "../../features/api/employeesSlice";
import { selectExpenses } from "../../features/api/ExpensesSlice";
import { selectOrders } from "../../features/api/orderSlice";
import { selectRawMaterials } from "../../features/api/rawmaterialsSlice";
import { selectCategories } from "../../features/api/categorySlice";
import { selectCustomers } from "../../features/api/customers";

import PermissionWrapper from "../../auth/PermissionWrapper";

const ReportsPage = () => {
  const stock = useSelector(selectStock);
  const purchases = [];
  const sales = useSelector(selectSales);
  const customers = useSelector(selectCustomers);
  const suppliers = [];
  const employees = useSelector(selectEmployees);
  const expenses = useSelector(selectExpenses);
  const orders = useSelector(selectOrders);
  const rawMaterials = useSelector(selectRawMaterials);
  const categories = useSelector(selectCategories);
  const business = [];

  const [reportType, setReportType] = useState("Inventory Levels");
  const [reportData, setReportData] = useState([]);
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", product: "", customer: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const getCategory = (id) => categories.find((cat) => cat.categoryId === id)?.categoryName || "Unknown";
  const getProduct = (id) => stock.find((s) => s.itemId === id)?.itemName || "Unknown";

  const applyFilters = (data, fieldDate, fieldProd, fieldCust) => {
    return data.filter(item => {
      const matchDate = (!filters.dateFrom || new Date(item[fieldDate]) >= new Date(filters.dateFrom)) &&
                         (!filters.dateTo || new Date(item[fieldDate]) <= new Date(filters.dateTo));
      const matchProd = !filters.product || item[fieldProd]?.toLowerCase().includes(filters.product.toLowerCase());
      const matchCust = !filters.customer || item[fieldCust]?.toLowerCase().includes(filters.customer.toLowerCase());
      return matchDate && matchProd && matchCust;
    });
  };

  useEffect(() => {
    let data = [];
    switch (reportType) {
      case "Inventory Levels":
        data = stock.map(s => ({
          Product: s.itemName,
          Category: getCategory(s.itemCategoryId),
          Quantity: s.itemQuantity,
          Model: s.itemModel
        }));
        break;
      case "Sales":
        data = sales.map(s => ({
          SaleID: s.saleId,
          Product: getProduct(s.saleItemId),
          Category: getCategory(stock.find(item => item.itemId === s.saleItemId)?.itemCategoryId),
          Quantity: s.saleQuantity,
          Price: s.salePrice,
          Total: s.saleQuantity * s.salePrice,
          Date: s.saleDateCreated
        }));
        data = applyFilters(data, 'Date', 'Product', '');
        break;
      case "Orders & Fulfillment":
        data = orders.map(o => ({
          Customer: customers.find(c => c.custId === o.custId)?.custName,
          Product: getProduct(o.prodId),
          OrderedQty: o.quantity,
          ProducedQty: o.quantityProduced,
          Paid: o.amountPaid,
          Total: o.totalCost,
          Status: o.status,
          Date: o.orderDateCreated
        }));
        data = applyFilters(data, 'Date', 'Product', 'Customer');
        break;
      case "Expenses":
        data = expenses.map(e => ({
          Category: e.category,
          Description: e.description,
          Amount: e.amount,
          Date: e.expenseDateCreated
        }));
        data = applyFilters(data, 'Date', '', '');
        break;
      case "Purchases":
        data = purchases.map(p => ({
          Product: getProduct(p.stockItem),
          Quantity: p.stockItemQuantity,
          Cost: p.stockItemPrice,
          Total: p.stockItemPrice * p.stockItemQuantity,
          Date: p.stockCreated
        }));
        data = applyFilters(data, 'Date', 'Product', '');
        break;
      default:
        data = [];
    }
    setCurrentPage(1);
    setReportData(data);
  }, [reportType, filters, stock, sales, orders, customers, purchases, expenses]);

  const generatePDF = () => {
    const doc = new jsPDF();
    const title = `${reportType} Report`;
    const date = new Date().toLocaleDateString();
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(12);
    doc.text(`Business: ${business.busName}`, 14, 30);
    doc.text(`Date: ${date}`, 14, 40);
    const headers = [Object.keys(reportData[0] || {})];
    const rows = reportData.map(r => Object.values(r));
    doc.autoTable({ startY: 50, head: headers, body: rows });
    doc.save(`${title}.pdf`);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${reportType}.xlsx`);
  };

  const summary = () => {
    if (reportType === "Sales") {
      const total = reportData.reduce((sum, row) => sum + (row.Total || 0), 0);
      return <Card className="p-2 mb-2">Total Sales: UGX {total.toLocaleString()}</Card>;
    }
    if (reportType === "Expenses") {
      const total = reportData.reduce((sum, row) => sum + (row.Amount || 0), 0);
      return <Card className="p-2 mb-2">Total Expenses: UGX {total.toLocaleString()}</Card>;
    }
    return null;
  };

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = reportData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(reportData.length / rowsPerPage);

  return (
    <Container fluid className="p-2">
     <div
  className="d-flex justify-content-between align-items-center flex-wrap border p-2 rounded mb-2 shadow-sm"
  style={{
    fontSize: '0.85rem',
    background: 'linear-gradient(90deg, #2e7d32, #66bb6a)',
    color: 'white'
  }}
>
  <Form.Select
    size="sm"
    value={reportType}
    onChange={(e) => setReportType(e.target.value)}
    className="w-auto me-2"
    style={{ height: '30px' }}
  >
    <option>Inventory Levels</option>
    <option>Sales</option>
    <option>Orders & Fulfillment</option>
    <option>Expenses</option>
    <option>Purchases</option>
  </Form.Select>

  <Form.Control
    size="sm"
    type="date"
    className="w-auto me-2"
    value={filters.dateFrom}
    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
  />
  <Form.Control
    size="sm"
    type="date"
    className="w-auto me-2"
    value={filters.dateTo}
    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
  />
  <Form.Select
    size="sm"
    className="w-auto me-2"
    value={filters.product}
    onChange={(e) => setFilters(prev => ({ ...prev, product: e.target.value }))}
    style={{ height: '30px' }}
  >
    <option value="">All Products</option>
    {stock.map((item) => (
      <option key={item.itemId} value={item.itemName}>{item.itemName}</option>
    ))}
  </Form.Select>

  <Form.Select
    size="sm"
    className="w-auto me-2"
    value={filters.customer}
    onChange={(e) => setFilters(prev => ({ ...prev, customer: e.target.value }))}
    style={{ height: '30px' }}
  >
    <option value="">All Customers</option>
    {customers.map((cust) => (
      <option key={cust.custId} value={cust.custName}>{cust.custName}</option>
    ))}
  </Form.Select>

  <PermissionWrapper required={['export']} children={
    <>
      <Dropdown as={ButtonGroup}>
        <Button size="sm" variant="light" className="text-dark">Export</Button>
        <Dropdown.Toggle split variant="light" id="dropdown-split-basic" size="sm" className="text-dark" />
        <Dropdown.Menu>
          <Dropdown.Item onClick={generatePDF}><FaFilePdf /> PDF</Dropdown.Item>
          <Dropdown.Item onClick={exportExcel}><FaFileExcel /> Excel</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
      <Button size="sm" variant="light" onClick={() => window.print()} title="Print" className="text-dark">
        <FaPrint />
      </Button>
    </>
  } />
</div>


      {summary()}

      <div className="table-responsive">
        {currentRows.length > 0 ? (
          <Table bordered hover size="sm">
            <thead className="bg-dark text-light">
              <tr>
                <th>#</th>
                {Object.keys(currentRows[0]).map((col, i) => <th key={i}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {currentRows.map((row, i) => (
                <tr key={i}>
                  <td>{indexOfFirst + i + 1}</td>
                  {Object.values(row).map((val, j) => <td key={j}>{val}</td>)}
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <p className="text-muted">No data available for this report.</p>}
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-2">
          {[...Array(totalPages)].map((_, idx) => (
            <Pagination.Item key={idx} active={idx + 1 === currentPage} onClick={() => setCurrentPage(idx + 1)}>
              {idx + 1}
            </Pagination.Item>
          ))}
        </Pagination>
      )}
    </Container>
  );
};

export default ReportsPage;
