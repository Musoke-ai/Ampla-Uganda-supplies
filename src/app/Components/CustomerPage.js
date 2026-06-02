import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
// Note: You must have react-bootstrap and react-bootstrap-icons installed in your project
// npm install react-bootstrap bootstrap react-bootstrap-icons jspdf jspdf-autotable react-redux
import {
  Container,
  Row,
  Col,
  Form,
  Table,
  Button,
  Modal,
  Tabs,
  Tab,
  Pagination,
  InputGroup,
  Badge,
  Alert,
  Dropdown,
} from "react-bootstrap";
import {
  Eye,
  Pencil,
  Trash,
  ArrowLeft,
  Download,
  Printer,
  Person,
  Search,
} from "react-bootstrap-icons";
import jsPDF from "jspdf";
import "jspdf-autotable";
import PermissionWrapper from "../auth/PermissionWrapper";
import { useUpdateOrderMutation } from "../features/api/orderSlice";
import { toast } from "react-toastify";

import { useSettings } from "./Settings";

// --- Import your Redux selectors ---
import { selectSales, useGetSalesQuery } from "../features/api/salesSlice";
import { selectStock, useGetStockQuery } from "../features/stock/stockSlice";
import { selectOrders, useGetOrdersQuery } from "../features/api/orderSlice";
import { selectDebt, useGetDebtsQuery, usePayDebtMutation } from "../features/api/debtSlice";
import { selectBranches, useGetBranchesQuery } from "../features/api/branchesSlice";
import {
  selectCustomers as selectRawCustomers,
  useDeleteCustomerMutation,
  useGetCustomersQuery,
  useUpdateCustomerMutation,
} from "../features/api/customers";

import AddCustomer from "./Models/AddCustomer";
import "./CustomerPage.css";

const palette = {
  bg: "#f8fbf8",
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

// --- Helper Functions ---
const calculateCustomerDues = (customerId, details) => {
  const customerDetails = details[customerId];
  if (!customerDetails) return 0;
  const orderDues = customerDetails.orders.reduce(
    (acc, order) => acc + (Number(order.totalAmount) - Number(order.depositedAmount)),
    0
  );
  const salesDues = customerDetails.dues.reduce(
    (acc, due) => acc + (Number(due.totalAmount) - Number(due.paidAmount)),
    0
  );
  return orderDues + salesDues;
};

const calculateCustomerTotals = (customerId, details) => {
  const customerDetails = details[customerId];
  if (!customerDetails) return { totalSales: 0, totalOrders: 0 };
  const totalSales = customerDetails.sales.reduce(
    (acc, sale) => acc + Number(sale.salePrice) * Number(sale.saleQuantity),
    0
  );
  const totalOrders = customerDetails.orders.length;
  return { totalSales, totalOrders };
};

// --- Export Utilities ---
const exportToCsv = (filename, rows) => {
  const processRow = (row) => {
    let finalVal = "";
    for (let j = 0; j < row.length; j++) {
      let innerValue =
        row[j] === null || row[j] === undefined ? "" : row[j].toString();
      if (row[j] instanceof Date) {
        innerValue = row[j].toLocaleString();
      }
      let result = innerValue.replace(/"/g, '""');
      if (result.search(/("|,|\n)/g) >= 0) result = '"' + result + '"';
      if (j > 0) finalVal += ",";
      finalVal += result;
    }
    return finalVal + "\n";
  };

  let csvFile = "";
  for (let i = 0; i < rows.length; i++) {
    csvFile += processRow(rows[i]);
  }

  const blob = new Blob([csvFile], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
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

const primaryButtonStyle = {
  minHeight: 44,
  padding: "0.65rem 1.15rem",
  borderRadius: 16,
  border: "none",
  backgroundColor: palette.green,
  color: "#ffffff",
  fontWeight: 800,
  boxShadow: "0 12px 24px rgba(47, 143, 87, 0.18)",
};

const sectionCardStyle = {
  borderRadius: 28,
  backgroundColor: palette.surface,
  boxShadow: palette.shadow,
  border: `1px solid ${palette.border}`,
};

const searchGroupStyle = {
  borderRadius: 18,
  overflow: "hidden",
  border: `1px solid ${palette.border}`,
  backgroundColor: "#ffffff",
};

const searchAdornmentStyle = {
  backgroundColor: "#ffffff",
  border: "none",
  color: palette.muted,
};

const searchInputStyle = {
  border: "none",
  boxShadow: "none",
  minHeight: 46,
};

const headerCellStyle = {
  color: palette.text,
  fontWeight: 800,
  fontSize: 14,
  whiteSpace: "nowrap",
  backgroundColor: "#ffffff",
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

const actionIconButtonStyle = (color) => ({
  width: 38,
  height: 38,
  padding: 0,
  borderRadius: 12,
  border: `1px solid ${palette.border}`,
  color,
  backgroundColor: "#ffffff",
});

function CustomerMetricCard({ icon, title, value, note, accent, color }) {
  return (
    <div
      className="customer-metric-card"
      style={{
        backgroundColor: palette.surface,
        border: `1px solid ${palette.border}`,
        boxShadow: palette.shadow,
      }}
    >
      <div className="customer-metric-icon" style={{ backgroundColor: accent, color }}>
        {icon}
      </div>
      <div>
        <div className="customer-metric-title">{title}</div>
        <div className="customer-metric-value">{value}</div>
        <div className="customer-metric-note">{note}</div>
      </div>
    </div>
  );
}

function CustomerPagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
    .slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5);

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

// --- Sub-Components ---

const ToastMessage = ({ show, message, variant, onClose }) => {
  if (!show) return null;
  return (
    <Alert
      variant={variant}
      onClose={onClose}
      dismissible
      style={{ position: "fixed", top: 20, right: 20, zIndex: 9999 }}
    >
      {message}
    </Alert>
  );
};

const SaleDetailModal = ({ show, onHide, saleGroup, customerName }) => {
  const { settings } = useSettings();
  const currency = settings.currency !== "none" ? settings.currency : "";
  if (!saleGroup) return null;

  const receiptId = saleGroup.SR_ID;
  const items = saleGroup.items;
  const total = items.reduce(
    (sum, item) =>
      sum + (Number(item.salePrice) || 0) * (Number(item.saleQuantity) || 0),
    0
  );

  const handlePrint = () => {
    const printContent = document.getElementById(
      `printable-sale-details-${receiptId}`
    ).innerHTML;
    const printWindow = window.open("", "_blank");
    printWindow.document.write("<html><head><title>Print Sale Receipt</title>");
    printWindow.document.write(
      "<style>body{font-family:sans-serif} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ddd;padding:8px} th{background-color:#f2f2f2}</style>"
    );
    printWindow.document.write("</head><body>");
    printWindow.document.write(printContent);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Sale Receipt: ${receiptId}`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Customer: ${customerName}`, 14, 30);

    doc.autoTable({
      startY: 40,
      head: [["#", "Product", "Price", "Quantity", "Subtotal"]],
      body: items.map((item, index) => [
        index + 1,
        item.productName,
        `${currency}${item.salePrice.toFixed(2)}`,
        item.saleQuantity,
        `${currency}${(item.salePrice * item.saleQuantity).toFixed(2)}`,
      ]),
      foot: [["", "", "", "Total", `${currency}${total.toFixed(2)}`]],
      footStyles: { fontStyle: "bold" },
    });
    doc.save(`Sale-Receipt-${receiptId}.pdf`);
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      className="customer-page-modal"
      dialogClassName="customer-modal-dialog"
      contentClassName="customer-modal-content"
      backdropClassName="customer-page-backdrop"
    >
      <Modal.Header closeButton>
        <Modal.Title>Sale Details (SR_ID: {receiptId})</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div id={`printable-sale-details-${receiptId}`}>
          <h4>Customer: {customerName}</h4>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.saleId}>
                  <td>{index + 1}</td>
                  <td>{item.productName}</td>
                  <td>
                    {currency}
                    {item.salePrice.toFixed(2)}
                  </td>
                  <td>{item.saleQuantity}</td>
                  <td>
                    {currency}
                    {(item.salePrice * item.saleQuantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan="4" className="text-end">
                  Total
                </th>
                <th>
                  {currency}
                  {total.toFixed(2)}
                </th>
              </tr>
            </tfoot>
          </Table>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handlePrint}>
          <Printer className="me-2" />
          Print
        </Button>
        <Button variant="primary" onClick={handleExportPDF}>
          <Download className="me-2" />
          Export PDF
        </Button>
        <Button variant="outline-secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const OrderDetailModal = ({ show, onHide, order, customerName }) => {
  const { settings } = useSettings();
  const currency = settings.currency !== "none" ? settings.currency : "";
  if (!order) return null;

  const handlePrint = () => {
    const printContent = document.getElementById(
      `printable-order-details-${order.id}`
    ).innerHTML;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(
      "<html><head><title>Print Order Details</title>"
    );
    printWindow.document.write(
      "<style>body{font-family:sans-serif; margin: 20px;} h4,h5{margin-bottom: 10px;}</style>"
    );
    printWindow.document.write("</head><body>");
    printWindow.document.write(printContent);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Order Details: ${order.id}`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Customer: ${customerName}`, 14, 30);
    doc.text(`Date: ${order.date}`, 14, 36);
    doc.autoTable({
      startY: 45,
      body: [
        ["Product", order.productName],
        ["Custom Size", order.customSize || "N/A"],
        ["Layers", order.layers],
        ["Quantity", order.quantity],
        ["Total Cost", `${currency}${order.totalAmount.toFixed(2)}`],
        ["Amount Paid", `${currency}${order.depositedAmount.toFixed(2)}`],
        [
          "Balance",
          `${currency}${(order.totalAmount - order.depositedAmount).toFixed(
            2
          )}`,
        ],
      ],
    });
    doc.save(`Order-Details-${order.id}.pdf`);
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      className="customer-page-modal"
      dialogClassName="customer-modal-dialog"
      contentClassName="customer-modal-content"
      backdropClassName="customer-page-backdrop"
    >
      <Modal.Header closeButton>
        <Modal.Title>Order Details (ID: {order.id})</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div id={`printable-order-details-${order.id}`}>
          <h4>Customer: {customerName}</h4>
          <h5>Date: {order.date}</h5>
          <p>
            <strong>Product:</strong> {order.productName}
          </p>
          <p>
            <strong>Custom Size:</strong> {order.customSize || "N/A"}
          </p>
          <p>
            <strong>Layers:</strong> {order.layers}
          </p>
          <p>
            <strong>Quantity:</strong> {order.quantity}
          </p>
          <hr />
          <p>
            <strong>Total Cost:</strong> {currency}
            {order.totalAmount.toFixed(2)}
          </p>
          <p>
            <strong>Amount Paid:</strong> {currency}
            {order.depositedAmount.toFixed(2)}
          </p>
          <p>
            <strong>Balance:</strong> {currency}
            {(order.totalAmount - order.depositedAmount).toFixed(2)}
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handlePrint}>
          <Printer className="me-2" />
          Print
        </Button>
        <Button variant="primary" onClick={handleExportPDF}>
          <Download className="me-2" />
          Export PDF
        </Button>
        <Button variant="outline-secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const PaymentModal = ({ show, onHide, paymentInfo, onMakePayment }) => {
  const { settings } = useSettings();
  const currency = settings.currency !== "none" ? settings.currency : "";

  const [paying, { isLoading, isSuccess }] = usePayDebtMutation();
  const [
    payOrder,
    { isLoading: isPayOrderLoading, isSuccess: isPayOrderSuccess },
  ] = useUpdateOrderMutation();

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    if (show) {
      setPaymentAmount("");
      setPaymentDate(new Date().toISOString().split("T")[0]);
    }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0 || amount > paymentInfo.remainingDue) {
      alert("Invalid payment amount.");
      return;
    }
    if (paymentInfo.type === "order") {
      try {
        const data = await payOrder({
          ...paymentInfo,
          amountPaid: amount,
        }).unwrap();
        onHide();
        toast.success("Payment Seccessfull");
      } catch (err) {
        toast.error("An error occured");
        console.log("error: ", err);
      }
    } else {
      try {
        const data = await paying({
          ...paymentInfo,
          amountPaid: amount,
        }).unwrap();
        onHide();
        toast.success("Payment Seccessfull");
      } catch (err) {
        toast.error("An error occured");
        console.log("error: ", err);
      }
    }
    // await onMakePayment(paymentInfo, amount, paymentDate);
    // onHide();
  };

  if (!paymentInfo) return null;

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      className="customer-page-modal"
      dialogClassName="customer-modal-dialog"
      contentClassName="customer-modal-content"
      backdropClassName="customer-page-backdrop"
    >
      <Modal.Header closeButton>
        <Modal.Title>{paymentInfo.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          <strong>Transaction ID:</strong> {paymentInfo.transactionId}
        </p>
        <p>
          <strong>Remaining Due:</strong> {currency}
          {paymentInfo.remainingDue?.toFixed(2)}
        </p>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Payment Date</Form.Label>
            <Form.Control
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Payment Amount</Form.Label>
            <Form.Control
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              step="0.01"
              min="0.01"
              max={paymentInfo.remainingDue}
              required
            />
          </Form.Group>
          <Button
            variant="success"
            type="submit"
            className="w-100"
            disabled={isLoading || isPayOrderLoading}
          >
            {isLoading || isPayOrderLoading
              ? "Processing Payment"
              : "Process Payment"}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

const EditCustomerModal = ({ show, onHide, customer, onSave }) => {
  useGetBranchesQuery();
  const branches = useSelector(selectBranches) ?? [];
  const [upDateCustomer, { data, isLoading, isSuccess, isError, error }] =
    useUpdateCustomerMutation();
  const [formData, setFormData] = useState(customer);
  useEffect(() => {
    setFormData(customer);
  }, [customer]);
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateCustomer = async () => {
    try {
      await upDateCustomer({
        cust_id: formData.id,
        branch_id: formData.branchId,
        cust_name: formData.name,
        cust_contact: formData.phone,
        cust_email: formData.email,
        cust_location: formData.address,
      }).unwrap();
      onHide();
    } catch (err) {
      console.log("Error: " + err);
    } finally {
      // setMessage(data);
    }
  };
  // const handleSubmit = async (e) => { e.preventDefault(); await onSave(formData); onHide(); };
  if (!customer) return null;
  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      className="customer-page-modal"
      dialogClassName="customer-modal-dialog"
      contentClassName="customer-modal-content"
      backdropClassName="customer-page-backdrop"
    >
      <Modal.Header closeButton>
        <Modal.Title>Edit Customer</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Branch</Form.Label>
            <Form.Select
              name="branchId"
              value={formData?.branchId || ""}
              onChange={handleChange}
            >
              <option value="">Select branch</option>
              {branches.map((branch) => (
                <option key={branch.branchId} value={branch.branchId}>
                  {branch.branchName}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          {/* <Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control type="text" name="id" value={formData?.id || ''} onChange={handleChange} required /></Form.Group> */}
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData?.name || ""}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData?.email || ""}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Phone</Form.Label>
            <Form.Control
              type="tel"
              name="phone"
              value={formData?.phone || ""}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control
              type="text"
              name="address"
              value={formData?.address || ""}
              onChange={handleChange}
              required
            />
          </Form.Group>
          {isLoading ? (
            <Button variant="primary" className="w-100">
              Saving Changes...
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleUpdateCustomer}
              className="w-100"
            >
              Save Changes
            </Button>
          )}
        </Form>
      </Modal.Body>
    </Modal>
  );
};

const DeleteCustomerModal = ({
  show,
  onHide,
  customer,
  onDelete,
  setDeletingCustomer,
}) => {
  const [
    DeleteCustomer,
    {
      data: deleteData,
      isLoading: isDeleteLoading,
      isSuccess: isDeleteSuccess,
      isError: isDeleteError,
    },
  ] = useDeleteCustomerMutation();

  const [toast, setToast] = useState({
    show: false,
    message: "",
    variant: "light",
  });

  const showToast = (message, variant = "success") => {
    setToast({ show: true, message, variant });
    setTimeout(
      () => setToast({ show: false, message: "", variant: "light" }),
      3000
    );
  };

  const handleDeleteCustomer = async (customerId) => {
    // window.alert("Hi");
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      const deleteCust = await DeleteCustomer({ cust_id: customerId }).unwrap();
      setDeletingCustomer(null);
      showToast("Customer deleted successfully.", "warning");
      // setCustomers(prev => prev.filter(c => c.id !== customerId));
      // setCustomerDetails(prev => { const newDetails = { ...prev }; delete newDetails[customerId]; return newDetails; });
    } catch (error) {
      showToast("Failed to delete customer.", "danger");
    }
  };
  // const handleDelete = async () => { await onDelete(customer.id); onHide(); };
  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      className="customer-page-modal"
      dialogClassName="customer-modal-dialog"
      contentClassName="customer-modal-content"
      backdropClassName="customer-page-backdrop"
    >
      <Modal.Header closeButton>
        <Modal.Title>Confirm Deletion</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Are you sure you want to delete{" "}
          <strong>{customer?.name + customer?.id}</strong>? This action cannot
          be undone.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        {isDeleteLoading ? (
          <Button variant="danger">Deleting...</Button>
        ) : (
          <Button
            variant="danger"
            onClick={() => {
              handleDeleteCustomer(customer?.id);
            }}
          >
            Delete
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

const CustomerDetailPage = ({ customer, details, onBack, onMakePayment }) => {
  const { settings } = useSettings();
  const currency = settings.currency !== "none" ? settings.currency : "";
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [showSaleDetail, setShowSaleDetail] = useState(false);
  const [selectedSaleGroup, setSelectedSaleGroup] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("sales");
  const [salesPage, setSalesPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [duesPage, setDuesPage] = useState(1);

  const detailRowsPerPage = 6;

  const groupedSales = useMemo(() => {
    const groups = details.sales.reduce((acc, sale) => {
      acc[sale.SR_ID] = acc[sale.SR_ID] || [];
      acc[sale.SR_ID].push(sale);
      return acc;
    }, {});
    return Object.entries(groups).map(([srId, items]) => ({
      SR_ID: srId,
      items,
      totalAmount: items.reduce(
        (sum, item) =>
          sum + (Number(item?.salePrice) || 0) * (Number(item?.saleQuantity) || 0),
        0
      ),
      status: items[0].status,
      date: items[0].saleDateCreated,
    }));
  }, [details.sales]);

  const filteredGroupedSales = useMemo(() => {
    if (!searchTerm) return groupedSales;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return groupedSales.filter(
      (group) =>
        group.SR_ID.toString().toLowerCase().includes(lowerCaseSearchTerm) ||
        group.date.toLowerCase().includes(lowerCaseSearchTerm) ||
        group.status.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [groupedSales, searchTerm]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return details.orders;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return details.orders.filter(
      (order) =>
        order.id.toString().includes(searchTerm) ||
        order.date.toLowerCase().includes(lowerCaseSearchTerm) ||
        order.productName.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [details.orders, searchTerm]);

  const filteredDues = useMemo(() => {
    if (!searchTerm) return details.dues;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return details.dues.filter(
      (due) =>
        due.SR_ID.toString().toLowerCase().includes(lowerCaseSearchTerm) ||
        due.date.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [details.dues, searchTerm]);

  const salesTotal = useMemo(
    () =>
      filteredGroupedSales.reduce((sum, group) => sum + group.totalAmount, 0),
    [filteredGroupedSales]
  );

  const { totalOrdersAmount, totalOrdersBalance } = useMemo(
    () =>
      filteredOrders.reduce(
        (totals, order) => {
          totals.totalOrdersAmount += order.totalAmount;
          totals.totalOrdersBalance +=
            order.totalAmount - order.depositedAmount;
          return totals;
        },
        { totalOrdersAmount: 0, totalOrdersBalance: 0 }
      ),
    [filteredOrders]
  );

  const duesTotals = useMemo(
    () =>
      filteredDues.reduce(
        (acc, due) => {
          acc.totalAmount += due.totalAmount;
          acc.paidAmount += due.paidAmount;
          acc.balance += due.totalAmount - due.paidAmount;
          return acc;
        },
        { totalAmount: 0, paidAmount: 0, balance: 0 }
      ),
    [filteredDues]
  );

  const totalSales = groupedSales.reduce(
    (prev, curr) => prev + curr.totalAmount,
    0
  );
  const totalOrders = details.orders.reduce(
    (prev, curr) => prev + curr.totalAmount,
    0
  );
  //Total dues include balances from the orders and dues or sales
  const totalDues =
    details.orders.reduce(
      (prev, curr) => prev + (curr.totalAmount - curr.depositedAmount),
      0
    ) +
    details.dues.reduce(
      (prev, curr) => prev + (curr.totalAmount - curr.paidAmount),
      0
    );

  const openPaymentModal = (transactionId, type) => {
    let info = {};
    if (type === "order") {
      const order = details.orders.find((o) => o.id === transactionId);
      info = {
        title: "Make Order Installment",
        remainingDue: order.totalAmount - order.depositedAmount,
        transactionId,
      };
    } else {
      const due = details.dues.find((d) => d.id === transactionId);
      info = {
        title: "Pay Sales Due",
        remainingDue: due.totalAmount - due.paidAmount,
        type,
      };
    }
    setPaymentInfo({ ...info, customerId: customer.id, transactionId, type });
  };

  const handleViewSale = (saleGroup) => {
    setSelectedSaleGroup(saleGroup);
    setShowSaleDetail(true);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  useEffect(() => {
    setSalesPage(1);
    setOrdersPage(1);
    setDuesPage(1);
  }, [searchTerm]);

  const salesTotalPages = Math.max(1, Math.ceil(filteredGroupedSales.length / detailRowsPerPage));
  const ordersTotalPages = Math.max(1, Math.ceil(filteredOrders.length / detailRowsPerPage));
  const duesTotalPages = Math.max(1, Math.ceil(filteredDues.length / detailRowsPerPage));

  const paginatedGroupedSales = filteredGroupedSales.slice(
    (salesPage - 1) * detailRowsPerPage,
    salesPage * detailRowsPerPage
  );
  const paginatedOrders = filteredOrders.slice(
    (ordersPage - 1) * detailRowsPerPage,
    ordersPage * detailRowsPerPage
  );
  const paginatedDues = filteredDues.slice(
    (duesPage - 1) * detailRowsPerPage,
    duesPage * detailRowsPerPage
  );

  return (
    <>
      <Container fluid className="customer-page-shell">
        <div className="customer-page-stack">
          <div className="customer-back-row">
            <Button variant="link" onClick={onBack} className="customer-back-link">
              <ArrowLeft size={16} className="me-2" />
              Back to Customer List
            </Button>
          </div>

          <div className="customer-hero-card" style={sectionCardStyle}>
            <div>
              <h2 className="customer-page-title">{customer.name}</h2>
              <p className="customer-page-subtitle">
                {customer.email} {customer.phone ? `• ${customer.phone}` : ""}
              </p>
            </div>
            <div className="customer-hero-meta">
              <span>{customer.address}</span>
            </div>
          </div>

          <div className="customer-metrics-grid">
            <CustomerMetricCard
              icon={<Download size={18} />}
              title="Total Sales"
              value={`${currency}${totalSales.toFixed(2)}`}
              note="All grouped sales for this customer"
              accent={palette.greenSoft}
              color={palette.green}
            />
            <CustomerMetricCard
              icon={<Person size={18} />}
              title="Total Orders"
              value={`${currency}${totalOrders.toFixed(2)}`}
              note="Combined order value"
              accent={palette.blueSoft}
              color={palette.blue}
            />
            <CustomerMetricCard
              icon={<Trash size={18} />}
              title="Outstanding Dues"
              value={`${currency}${totalDues.toFixed(2)}`}
              note="Orders and sales balances still unpaid"
              accent={palette.redSoft}
              color={palette.red}
            />
          </div>

          <div className="customer-toolbar-card" style={sectionCardStyle}>
            <div className="customer-toolbar-copy">
              <h3 className="customer-section-title">Customer Activity</h3>
              <p className="customer-section-subtitle">
                Search across sales, orders, and dues for this customer.
              </p>
            </div>
            <div className="customer-toolbar-search">
              <InputGroup style={searchGroupStyle}>
                <InputGroup.Text style={searchAdornmentStyle}>
                  <Search />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by invoice, order ID, date, status, or product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={searchInputStyle}
                />
              </InputGroup>
            </div>
          </div>

          <div className="customer-detail-panel" style={sectionCardStyle}>
            <Tabs
              activeKey={activeTab}
              onSelect={(key) => setActiveTab(key || "sales")}
              id="customer-details-tabs"
              className="customer-modern-tabs"
            >
              <Tab eventKey="sales" title={`Sales (${filteredGroupedSales.length})`}>
                <div className="customer-table-wrap">
                  <Table hover className="align-middle mb-0 customer-modern-table">
                    <thead>
                      <tr>
                        <th style={headerCellStyle}>#</th>
                        <th style={headerCellStyle}>Invoice ID</th>
                        <th style={headerCellStyle}>Date</th>
                        <th style={headerCellStyle}>Total Amount</th>
                        <th style={headerCellStyle}>Status</th>
                        <th style={{ ...headerCellStyle, textAlign: "center" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedGroupedSales.map((group, index) => (
                        <tr key={group.SR_ID}>
                          <td style={bodyCellStyle}>{(salesPage - 1) * detailRowsPerPage + index + 1}</td>
                          <td style={bodyCellStyle}>{group.SR_ID}</td>
                          <td style={bodyCellStyle}>{group.date}</td>
                          <td style={bodyCellStyle}>{currency}{group.totalAmount.toFixed(2)}</td>
                          <td style={bodyCellStyle}>
                            <span className={group.status === "paid" ? "customer-badge customer-badge-solid-green" : "customer-badge customer-badge-solid-red"}>
                              {group.status}
                            </span>
                          </td>
                          <td style={{ ...bodyCellStyle, textAlign: "center" }}>
                            <Button
                              variant="light"
                              style={actionIconButtonStyle(palette.blue)}
                              onClick={() => handleViewSale(group)}
                            >
                              <Eye />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                <div className="customer-table-footer">
                  <div className="customer-table-summary">
                    Filtered sales total: <strong>{currency}{salesTotal.toFixed(2)}</strong>
                  </div>
                  <CustomerPagination
                    currentPage={salesPage}
                    totalPages={salesTotalPages}
                    onPageChange={setSalesPage}
                  />
                </div>
              </Tab>

              <Tab eventKey="orders" title={`Orders (${filteredOrders.length})`}>
                <div className="customer-table-wrap">
                  <Table hover className="align-middle mb-0 customer-modern-table">
                    <thead>
                      <tr>
                        <th style={headerCellStyle}>#</th>
                        <th style={headerCellStyle}>Order ID</th>
                        <th style={headerCellStyle}>Date</th>
                        <th style={headerCellStyle}>Total</th>
                        <th style={headerCellStyle}>Balance</th>
                        <th style={{ ...headerCellStyle, textAlign: "center" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedOrders.map((o, index) => {
                        const balance = o.totalAmount - o.depositedAmount;
                        return (
                          <tr key={o.id}>
                            <td style={bodyCellStyle}>{(ordersPage - 1) * detailRowsPerPage + index + 1}</td>
                            <td style={bodyCellStyle}>{o.id}</td>
                            <td style={bodyCellStyle}>{o.date}</td>
                            <td style={bodyCellStyle}>{currency}{o.totalAmount.toFixed(2)}</td>
                            <td style={bodyCellStyle}>{currency}{balance.toFixed(2)}</td>
                            <td style={{ ...bodyCellStyle, textAlign: "center" }}>
                              <div className="customer-action-row">
                                <Button
                                  variant="light"
                                  style={actionIconButtonStyle(palette.blue)}
                                  onClick={() => handleViewOrder(o)}
                                >
                                  <Eye />
                                </Button>
                                {balance > 0 && (
                                  <Button
                                    variant="light"
                                    style={actionIconButtonStyle(palette.green)}
                                    onClick={() => openPaymentModal(o.id, "order")}
                                  >
                                    Pay
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
                <div className="customer-table-footer">
                  <div className="customer-table-summary">
                    Orders total: <strong>{currency}{totalOrdersAmount.toFixed(2)}</strong>
                    <span className="customer-summary-spacer" />
                    Balance: <strong>{currency}{totalOrdersBalance.toFixed(2)}</strong>
                  </div>
                  <CustomerPagination
                    currentPage={ordersPage}
                    totalPages={ordersTotalPages}
                    onPageChange={setOrdersPage}
                  />
                </div>
              </Tab>

              <Tab eventKey="dues" title={`Dues (${filteredDues.length})`}>
                <div className="customer-table-wrap">
                  <Table hover className="align-middle mb-0 customer-modern-table">
                    <thead>
                      <tr>
                        <th style={headerCellStyle}>#</th>
                        <th style={headerCellStyle}>Invoice ID</th>
                        <th style={headerCellStyle}>Date</th>
                        <th style={headerCellStyle}>Total Amount</th>
                        <th style={headerCellStyle}>Amount Paid</th>
                        <th style={headerCellStyle}>Balance</th>
                        <th style={{ ...headerCellStyle, textAlign: "center" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedDues.map((d, index) => {
                        const balance = d.totalAmount - d.paidAmount;
                        return (
                          <tr key={d.id}>
                            <td style={bodyCellStyle}>{(duesPage - 1) * detailRowsPerPage + index + 1}</td>
                            <td style={bodyCellStyle}>{d.SR_ID}</td>
                            <td style={bodyCellStyle}>{d.date}</td>
                            <td style={bodyCellStyle}>{currency}{d.totalAmount.toFixed(2)}</td>
                            <td style={bodyCellStyle}>{currency}{d.paidAmount.toFixed(2)}</td>
                            <td style={bodyCellStyle}>{currency}{balance.toFixed(2)}</td>
                            <td style={{ ...bodyCellStyle, textAlign: "center" }}>
                              {balance > 0 ? (
                                <Button
                                  variant="light"
                                  style={actionIconButtonStyle(palette.green)}
                                  onClick={() => openPaymentModal(d.id, "due")}
                                >
                                  Pay
                                </Button>
                              ) : (
                                <span className="customer-badge customer-badge-green">Cleared</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
                <div className="customer-table-footer">
                  <div className="customer-table-summary">
                    Dues total: <strong>{currency}{duesTotals.totalAmount.toFixed(2)}</strong>
                    <span className="customer-summary-spacer" />
                    Paid: <strong>{currency}{duesTotals.paidAmount.toFixed(2)}</strong>
                    <span className="customer-summary-spacer" />
                    Balance: <strong>{currency}{duesTotals.balance.toFixed(2)}</strong>
                  </div>
                  <CustomerPagination
                    currentPage={duesPage}
                    totalPages={duesTotalPages}
                    onPageChange={setDuesPage}
                  />
                </div>
              </Tab>
            </Tabs>
          </div>
        </div>

        <PaymentModal
          show={!!paymentInfo}
          onHide={() => setPaymentInfo(null)}
          paymentInfo={paymentInfo}
          onMakePayment={onMakePayment}
        />
        <SaleDetailModal
          show={showSaleDetail}
          onHide={() => setShowSaleDetail(false)}
          saleGroup={selectedSaleGroup}
          customerName={customer.name}
        />
        <OrderDetailModal
          show={showOrderDetail}
          onHide={() => setShowOrderDetail(false)}
          order={selectedOrder}
          customerName={customer.name}
        />
      </Container>
    </>
  );
};

const CustomerListPage = ({
  customers,
  customerDetails,
  onSaveCustomer,
  onDeleteCustomer,
  onSelectCustomer,
}) => {
  const { settings } = useSettings();
  const currency = settings.currency !== "none" ? settings.currency : "";

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [showModal, setShowModal] = useState(false);

  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);

  const customersWithDetails = useMemo(() => {
    return customers.map((c) => ({
      ...c,
      ...calculateCustomerTotals(c.id, customerDetails),
      dues: calculateCustomerDues(c.id, customerDetails),
    }));
  }, [customers, customerDetails]);

  const filteredCustomers = useMemo(() => {
    return customersWithDetails.filter((c) => {
      const searchMatch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "paid" && c.dues === 0) ||
        (statusFilter === "due" && c.dues > 0);
      return searchMatch && statusMatch;
    });
  }, [customersWithDetails, searchTerm, statusFilter]);

  const sortedCustomers = useMemo(() => {
    let sortableItems = [...filteredCustomers];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredCustomers, sortConfig]);

  const totalPages =
    rowsPerPage === "all" ? 1 : Math.ceil(sortedCustomers.length / rowsPerPage);
  const paginatedCustomers =
    rowsPerPage === "all"
      ? sortedCustomers
      : sortedCustomers.slice(
          (currentPage - 1) * rowsPerPage,
          currentPage * rowsPerPage
        );

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "ascending" ? "↑" : "↓";
  };

  const handleRowsPerPageChange = (e) => {
    const value = e.target.value;
    setRowsPerPage(value === "all" ? "all" : Number(value));
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleExport = (format) => {
    const headers = [
      "#",
      "Name",
      "Email",
      "Phone",
      "Total Sales",
      "No. of Orders",
      "Dues",
    ];
    const data = sortedCustomers.map((c, i) => [
      i + 1,
      c.name,
      c.email,
      c.phone,
      c.totalSales.toFixed(2),
      c.totalOrders,
      c.dues.toFixed(2),
    ]);

    if (format === "csv") {
      exportToCsv("customers.csv", [headers, ...data]);
    } else if (format === "pdf") {
      const doc = new jsPDF();
      doc.text("Customer List", 14, 16);
      doc.autoTable({ head: [headers], body: data, startY: 20 });
      doc.save("customers.pdf");
    }
  };

  const totals = useMemo(
    () => ({
      totalCustomers: sortedCustomers.length,
      paidUp: sortedCustomers.filter((customer) => customer.dues === 0).length,
      totalSales: sortedCustomers.reduce((sum, customer) => sum + (Number(customer.totalSales) || 0), 0),
      totalDues: sortedCustomers.reduce((sum, customer) => sum + (Number(customer.dues) || 0), 0),
    }),
    [sortedCustomers]
  );

  return (
    <>
      <div className="customer-page-stack">
        <header className="customer-list-hero">
          <div>
            <h2 className="customer-page-title">Customer Management</h2>
            <p className="customer-page-subtitle">
              Track customer relationships, balances, and activity from one organized workspace.
            </p>
          </div>
          <div className="customer-header-actions">
            <Button variant="light" onClick={() => window.print()} style={toolbarButtonStyle}>
              <Printer className="me-2" />
              Print
            </Button>
            <Dropdown>
              <Dropdown.Toggle variant="light" id="customer-export" style={toolbarButtonStyle}>
                <Download className="me-2" />
                Export
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => handleExport("pdf")}>Export as PDF</Dropdown.Item>
                <Dropdown.Item onClick={() => handleExport("csv")}>Export as CSV</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <PermissionWrapper
              required={["customerscreate"]}
              children={
                <Button onClick={() => setShowModal(true)} style={primaryButtonStyle}>
                  <Person className="me-2" />
                  Add Customer
                </Button>
              }
            />
          </div>
        </header>

        <div className="customer-metrics-grid">
          <CustomerMetricCard
            icon={<Person size={18} />}
            title="Visible Customers"
            value={totals.totalCustomers}
            note="Customers matching your current filters"
            accent={palette.greenSoft}
            color={palette.green}
          />
          <CustomerMetricCard
            icon={<Eye size={18} />}
            title="Paid Up"
            value={totals.paidUp}
            note="Customers with no outstanding balance"
            accent={palette.blueSoft}
            color={palette.blue}
          />
          <CustomerMetricCard
            icon={<Download size={18} />}
            title="Total Sales"
            value={`${currency}${totals.totalSales.toFixed(2)}`}
            note="Combined sales across visible customers"
            accent={palette.amberSoft}
            color={palette.amber}
          />
          <CustomerMetricCard
            icon={<Trash size={18} />}
            title="Outstanding Dues"
            value={`${currency}${totals.totalDues.toFixed(2)}`}
            note="Total unpaid balances in view"
            accent={palette.redSoft}
            color={palette.red}
          />
        </div>

        <div className="customer-toolbar-card" style={sectionCardStyle}>
          <div className="customer-toolbar-copy">
            <h3 className="customer-section-title">Filter Customers</h3>
            <p className="customer-section-subtitle">
              Search the list, narrow by balance status, and control table density.
            </p>
          </div>
          <div className="customer-filter-grid">
            <InputGroup style={searchGroupStyle}>
              <InputGroup.Text style={searchAdornmentStyle}>
                <Search />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={searchInputStyle}
              />
            </InputGroup>
            <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="customer-modern-select">
              <option value="all">All Statuses</option>
              <option value="paid">Paid Up</option>
              <option value="due">Has Dues</option>
            </Form.Select>
            <Form.Select value={rowsPerPage} onChange={handleRowsPerPageChange} className="customer-modern-select">
              <option value="5">5 Rows</option>
              <option value="10">10 Rows</option>
              <option value="25">25 Rows</option>
              <option value="all">All Rows</option>
            </Form.Select>
          </div>
        </div>

        <div className="customer-detail-panel" style={sectionCardStyle}>
          <div className="customer-table-wrap">
            <Table hover className="align-middle mb-0 customer-modern-table">
              <thead>
                <tr>
                  <th style={headerCellStyle}>#</th>
                  <th style={{ ...headerCellStyle, cursor: "pointer" }} onClick={() => requestSort("name")}>
                    Name {getSortIcon("name")}
                  </th>
                  <th style={{ ...headerCellStyle, cursor: "pointer" }} onClick={() => requestSort("email")}>
                    Email {getSortIcon("email")}
                  </th>
                  <th style={{ ...headerCellStyle, cursor: "pointer" }} onClick={() => requestSort("branchName")}>
                    Branch {getSortIcon("branchName")}
                  </th>
                  <th style={{ ...headerCellStyle, cursor: "pointer" }} onClick={() => requestSort("address")}>
                    Address {getSortIcon("address")}
                  </th>
                  <th style={{ ...headerCellStyle, cursor: "pointer" }} onClick={() => requestSort("phone")}>
                    Phone {getSortIcon("phone")}
                  </th>
                  <th style={{ ...headerCellStyle, cursor: "pointer" }} onClick={() => requestSort("totalSales")}>
                    Total Sales {getSortIcon("totalSales")}
                  </th>
                  <th style={{ ...headerCellStyle, cursor: "pointer" }} onClick={() => requestSort("totalOrders")}>
                    Orders {getSortIcon("totalOrders")}
                  </th>
                  <th style={{ ...headerCellStyle, cursor: "pointer" }} onClick={() => requestSort("dues")}>
                    Dues {getSortIcon("dues")}
                  </th>
                  <th style={{ ...headerCellStyle, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((c, index) => (
                  <tr key={c.id}>
                    <td style={bodyCellStyle}>
                      {(currentPage - 1) * (rowsPerPage === "all" ? 0 : rowsPerPage) + index + 1}
                    </td>
                    <td style={bodyCellStyle}>
                      <div className="customer-name-cell">
                        <strong>{c.name}</strong>
                      </div>
                    </td>
                    <td style={bodyCellStyle}>{c.email}</td>
                    <td style={bodyCellStyle}>{c.branchName}</td>
                    <td style={bodyCellStyle}>{c.address}</td>
                    <td style={bodyCellStyle}>{c.phone}</td>
                    <td style={bodyCellStyle}>{currency}{c.totalSales.toFixed(2)}</td>
                    <td style={bodyCellStyle}>{c.totalOrders}</td>
                    <td style={bodyCellStyle}>
                      <span className={c.dues > 0 ? "customer-badge customer-badge-red" : "customer-badge customer-badge-green"}>
                        {currency}{c.dues.toFixed(2)}
                      </span>
                    </td>
                    <td style={{ ...bodyCellStyle, textAlign: "center" }}>
                      <div className="customer-action-row">
                        <PermissionWrapper
                          required={["customersview"]}
                          children={
                            <Button
                              variant="light"
                              style={actionIconButtonStyle(palette.blue)}
                              onClick={() => onSelectCustomer(c)}
                            >
                              <Eye />
                            </Button>
                          }
                        />
                        <PermissionWrapper
                          required={["customersupdate"]}
                          children={
                            <Button
                              variant="light"
                              style={actionIconButtonStyle(palette.amber)}
                              onClick={() => setEditingCustomer(c)}
                            >
                              <Pencil />
                            </Button>
                          }
                        />
                        <PermissionWrapper
                          required={["customersdelete"]}
                          children={
                            <Button
                              variant="light"
                              style={actionIconButtonStyle(palette.red)}
                              onClick={() => setDeletingCustomer(c)}
                            >
                              <Trash />
                            </Button>
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <div className="customer-table-footer">
            <div className="customer-table-summary">
              Sales total: <strong>{currency}{totals.totalSales.toFixed(2)}</strong>
              <span className="customer-summary-spacer" />
              Dues total: <strong>{currency}{totals.totalDues.toFixed(2)}</strong>
            </div>
            {rowsPerPage !== "all" && (
              <CustomerPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </div>
      </div>

      <AddCustomer showModal={showModal} handleModalToggle={setShowModal} />
      <EditCustomerModal
        show={!!editingCustomer}
        onHide={() => setEditingCustomer(null)}
        customer={editingCustomer}
        onSave={onSaveCustomer}
      />
      <DeleteCustomerModal
        show={!!deletingCustomer}
        onHide={() => setDeletingCustomer(null)}
        setDeletingCustomer={setDeletingCustomer}
        customer={deletingCustomer}
        onDelete={onDeleteCustomer}
      />
    </>
  );
};

// --- Main Exported Component ---
export default function CustomerPage() {
  useGetBranchesQuery();
  useGetCustomersQuery();
  useGetSalesQuery();
  useGetOrdersQuery();
  useGetDebtsQuery();
  useGetStockQuery();
  // Get raw data from Redux store
  const branches = useSelector(selectBranches) ?? [];
  const rawCustomersData = useSelector(selectRawCustomers);
  const rawSalesData = useSelector(selectSales);
  const rawOrdersData = useSelector(selectOrders);
  const rawDuesData = useSelector(selectDebt);
  const rawInventoryData = useSelector(selectStock);

  const [
    upDateCustomer,
    {
      data,
      isLoading,
      isLoading: isUpdateLoading,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
    },
  ] = useUpdateCustomerMutation();

  const [showAddModal, setShowAddModal] = useState(false);

  // Local state for UI
  const [customers, setCustomers] = useState([]);
  const [customerDetails, setCustomerDetails] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    variant: "light",
  });

  // Process data from Redux store when it changes
  useEffect(() => {
    const branchMap = new Map(
      (branches || []).map((branch) => [parseInt(branch.branchId, 10), branch.branchName])
    );

    // Ensure data is an array before mapping to prevent errors
    const inventoryMap = new Map(
      (rawInventoryData || []).map((item) => [
        parseInt(item.itemId, 10),
        item.itemName,
      ])
    );

    const processedCustomers = (rawCustomersData || []).map((c) => ({
      id: parseInt(c.custId, 10),
      branchId: c.branchId ? parseInt(c.branchId, 10) : "",
      branchName: branchMap.get(parseInt(c.branchId, 10)) || "Unassigned",
      name: c.custName,
      email: c.custEmail,
      phone: c.custContact,
      address: c.custLocation,
    }));

    const processedDetails = {};
    processedCustomers.forEach((c) => {
      const custId = c.id;
      processedDetails[custId] = {
        sales: (rawSalesData || [])
          .filter((s) => parseInt(s.custId, 10) === custId)
          .map((s) => ({
            ...s,
            saleId: parseInt(s.saleId, 10),
            SR_ID: parseInt(s.SR_ID, 10),
            salePrice: parseFloat(s.salePrice),
            saleQuantity: parseInt(s.saleQuantity, 10),
            saleItemId: parseInt(s.saleItemId, 10),
            status: "paid",
            productName:
              inventoryMap.get(parseInt(s.saleItemId, 10)) || "Unknown Product",
          })),
        orders: (rawOrdersData || [])
          .filter((o) => parseInt(o.custId, 10) === custId)
          .map((o) => ({
            id: parseInt(o.orderId, 10),
            date: o.orderDateCreated,
            totalAmount: parseFloat(o.totalCost),
            depositedAmount: parseFloat(o.amountPaid),
            productName:
              inventoryMap.get(parseInt(o.prodId, 10)) || "Custom Item",
            customSize: o.customSize,
            layers: parseInt(o.layers, 10),
            quantity: parseInt(o.quantity, 10),
          })),
        dues: (rawDuesData || [])
          .filter((d) => parseInt(d.custId, 10) === custId)
          .map((d) => ({
            id: parseInt(d.indebtId, 10),
            SR_ID: parseInt(d.SR_ID, 10),
            date: d.indebtDateCreated,
            totalAmount: parseFloat(d.totalAmount),
            paidAmount: parseFloat(d.initialDeposit),
          })),
        installmentHistory: [],
        duesPaymentHistory: [],
      };
    });

    Object.values(processedDetails).forEach((detail) => {
      const dueSrIds = new Set(detail.dues.map((d) => d.SR_ID));
      detail.sales.forEach((sale) => {
        if (dueSrIds.has(sale.SR_ID)) {
          sale.status = "unpaid";
        }
      });
    });

    setCustomers(processedCustomers);
    setCustomerDetails(processedDetails);
  }, [
    branches,
    rawCustomersData,
    rawSalesData,
    rawOrdersData,
    rawDuesData,
    rawInventoryData,
  ]);

  const showToast = (message, variant = "success") => {
    setToast({ show: true, message, variant });
    setTimeout(
      () => setToast({ show: false, message: "", variant: "light" }),
      3000
    );
  };

  const handleDeleteCustomer = async (customerId) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      // e.g., dispatch(deleteCustomer(customerId));
      // console.log("Dispatching delete for customer ID:", customerId);
      //   await DeleteCustomer({ cust_id: customerId }).unwrap();
      showToast("Customer deleted successfully.", "warning");
      // setCustomers(prev => prev.filter(c => c.id !== customerId));
      // setCustomerDetails(prev => { const newDetails = { ...prev }; delete newDetails[customerId]; return newDetails; });
    } catch (error) {
      showToast("Failed to delete customer.", "danger");
    }
  };

  const handleMakePayment = async (paymentInfo, amount, date) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      // e.g., dispatch(makePayment({ ...paymentInfo, amount, date }));
      console.log("Dispatching payment:", { paymentInfo, amount, date });
      showToast("Payment processed successfully!", "success");
      setCustomerDetails((prevDetails) => {
        const newDetails = JSON.parse(JSON.stringify(prevDetails));
        const customerDetail = newDetails[paymentInfo.customerId];
        if (paymentInfo.type === "order") {
          const order = customerDetail.orders.find(
            (o) => o.id === paymentInfo.transactionId
          );
          order.depositedAmount += amount;
          customerDetail.installmentHistory.push({
            date,
            amount,
            orderId: paymentInfo.transactionId,
          });
        } else {
          const due = customerDetail.dues.find(
            (d) => d.id === paymentInfo.transactionId
          );
          due.paidAmount += amount;
          customerDetail.duesPaymentHistory.push({
            date,
            amount,
            invoiceId: due.SR_ID,
          });
        }
        return newDetails;
      });
    } catch (error) {
      showToast("Payment failed.", "danger");
    }
  };

  return (
    <>
      <ToastMessage
        show={toast.show}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast({ ...toast, show: false })}
      />
      {selectedCustomer ? (
        <Container fluid="lg" className="customer-page-shell py-4">
          <CustomerDetailPage
            customer={selectedCustomer}
            details={customerDetails[selectedCustomer.id]}
            onBack={() => setSelectedCustomer(null)}
            onMakePayment={handleMakePayment}
          />
        </Container>
      ) : (
        <Container fluid="lg" className="customer-page-shell py-4">
          <CustomerListPage
            customers={customers}
            customerDetails={customerDetails}
            // onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onSelectCustomer={setSelectedCustomer}
          />
        </Container>
      )}
    </>
  );
}
