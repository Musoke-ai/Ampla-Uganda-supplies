import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
// Note: You must have react-bootstrap and react-bootstrap-icons installed in your project
// npm install react-bootstrap bootstrap react-bootstrap-icons jspdf jspdf-autotable react-redux
import { 
    Container, Row, Col, Form, Table, Button, Modal, Tabs, Tab, 
    Pagination, InputGroup, Badge, Alert, Dropdown
} from 'react-bootstrap';
import { Eye, Pencil, Trash, ArrowLeft, Download, Printer, Person } from 'react-bootstrap-icons';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import PermissionWrapper from '../auth/PermissionWrapper';
import { useUpdateOrderMutation } from '../features/api/orderSlice';
import { toast } from 'react-toastify';

import { useSettings } from './Settings';

// --- Import your Redux selectors ---
import { selectSales } from '../features/api/salesSlice';
import { selectStock } from '../features/stock/stockSlice';
import { selectOrders } from '../features/api/orderSlice';
import { selectDebt, usePayDebtMutation } from '../features/api/debtSlice';
import { selectCustomers as selectRawCustomers, useDeleteCustomerMutation, useUpdateCustomerMutation } from '../features/api/customers';

import AddCustomer from './Models/AddCustomer';

// --- Helper Functions ---
const calculateCustomerDues = (customerId, details) => {
    const customerDetails = details[customerId];
    if (!customerDetails) return 0;
    const orderDues = customerDetails.orders.reduce((acc, order) => acc + (Number(order.totalAmount) - Number(order.depositedAmount)), 0);
    const salesDues = customerDetails.dues.reduce((acc, due) => acc + (Number(due.totalAmount) - Number(due.paidAmount)), 0);
    return orderDues + salesDues;
};

const calculateCustomerTotals = (customerId, details) => {
    const customerDetails = details[customerId];
    if (!customerDetails) return { totalSales: 0, totalOrders: 0 };
    const totalSales = customerDetails.sales.reduce((acc, sale) => acc + (Number(sale.salePrice) * Number(sale.saleQuantity)), 0);
    const totalOrders = customerDetails.orders.length;
    return { totalSales, totalOrders };
};

// --- Export Utilities ---
const exportToCsv = (filename, rows) => {
    const processRow = (row) => {
        let finalVal = '';
        for (let j = 0; j < row.length; j++) {
            let innerValue = row[j] === null || row[j] === undefined ? '' : row[j].toString();
            if (row[j] instanceof Date) {
                innerValue = row[j].toLocaleString();
            }
            let result = innerValue.replace(/"/g, '""');
            if (result.search(/("|,|\n)/g) >= 0)
                result = '"' + result + '"';
            if (j > 0)
                finalVal += ',';
            finalVal += result;
        }
        return finalVal + '\n';
    };

    let csvFile = '';
    for (let i = 0; i < rows.length; i++) {
        csvFile += processRow(rows[i]);
    }

    const blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};


// --- Sub-Components ---

const ToastMessage = ({ show, message, variant, onClose }) => {
    if (!show) return null;
    return (
        <Alert variant={variant} onClose={onClose} dismissible style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
            {message}
        </Alert>
    );
};

const SaleDetailModal = ({ show, onHide, saleGroup, customerName }) => {
    const { settings } = useSettings();
      const currency = settings.currency!=='none'?settings.currency:"";
    if (!saleGroup) return null;

    const receiptId = saleGroup.SR_ID;
    const items = saleGroup.items;
    const total = items.reduce((sum, item) => sum + Number(item.salePrice)||0 * Number(item.saleQuantity)||0, 0);

    const handlePrint = () => {
        const printContent = document.getElementById(`printable-sale-details-${receiptId}`).innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write('<html><head><title>Print Sale Receipt</title>');
        printWindow.document.write('<style>body{font-family:sans-serif} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ddd;padding:8px} th{background-color:#f2f2f2}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent);
        printWindow.document.write('</body></html>');
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
            head: [['#', 'Product', 'Price', 'Quantity', 'Subtotal']],
            body: items.map((item, index) => [
                index + 1,
                item.productName,
                `${currency}${item.salePrice.toFixed(2)}`,
                item.saleQuantity,
                `${currency}${(item.salePrice * item.saleQuantity).toFixed(2)}`
            ]),
            foot: [['', '', '', 'Total', `${currency}${total.toFixed(2)}`]],
            footStyles: { fontStyle: 'bold' }
        });
        doc.save(`Sale-Receipt-${receiptId}.pdf`);
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Sale Details (SR_ID: {receiptId})</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div id={`printable-sale-details-${receiptId}`}>
                    <h4>Customer: {customerName}</h4>
                    <Table striped bordered hover responsive>
                        <thead><tr><th>#</th><th>Product Name</th><th>Price</th><th>Quantity</th><th>Subtotal</th></tr></thead>
                        <tbody>{items.map((item, index) => (<tr key={item.saleId}><td>{index + 1}</td><td>{item.productName}</td><td>{currency}{item.salePrice.toFixed(2)}</td><td>{item.saleQuantity}</td><td>{currency}{(item.salePrice * item.saleQuantity).toFixed(2)}</td></tr>))}</tbody>
                        <tfoot><tr><th colSpan="4" className="text-end">Total</th><th>{currency}{total.toFixed(2)}</th></tr></tfoot>
                    </Table>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handlePrint}><Printer className="me-2" />Print</Button>
                <Button variant="primary" onClick={handleExportPDF}><Download className="me-2" />Export PDF</Button>
                <Button variant="outline-secondary" onClick={onHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
};

const OrderDetailModal = ({ show, onHide, order, customerName }) => {
    const { settings } = useSettings();
    const currency = settings.currency!=='none'?settings.currency:"";
    if (!order) return null;

    const handlePrint = () => {
        const printContent = document.getElementById(`printable-order-details-${order.id}`).innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write('<html><head><title>Print Order Details</title>');
        printWindow.document.write('<style>body{font-family:sans-serif; margin: 20px;} h4,h5{margin-bottom: 10px;}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent);
        printWindow.document.write('</body></html>');
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
                ['Product', order.productName],
                ['Custom Size', order.customSize || 'N/A'],
                ['Layers', order.layers],
                ['Quantity', order.quantity],
                ['Total Cost', `${currency}${order.totalAmount.toFixed(2)}`],
                ['Amount Paid', `${currency}${order.depositedAmount.toFixed(2)}`],
                ['Balance', `${currency}${(order.totalAmount - order.depositedAmount).toFixed(2)}`],
            ],
        });
        doc.save(`Order-Details-${order.id}.pdf`);
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton><Modal.Title>Order Details (ID: {order.id})</Modal.Title></Modal.Header>
            <Modal.Body>
                <div id={`printable-order-details-${order.id}`}>
                    <h4>Customer: {customerName}</h4>
                    <h5>Date: {order.date}</h5>
                    <p><strong>Product:</strong> {order.productName}</p>
                    <p><strong>Custom Size:</strong> {order.customSize || 'N/A'}</p>
                    <p><strong>Layers:</strong> {order.layers}</p>
                    <p><strong>Quantity:</strong> {order.quantity}</p>
                    <hr />
                    <p><strong>Total Cost:</strong> {currency}{order.totalAmount.toFixed(2)}</p>
                    <p><strong>Amount Paid:</strong> {currency}{order.depositedAmount.toFixed(2)}</p>
                    <p><strong>Balance:</strong> {currency}{(order.totalAmount - order.depositedAmount).toFixed(2)}</p>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handlePrint}><Printer className="me-2" />Print</Button>
                <Button variant="primary" onClick={handleExportPDF}><Download className="me-2" />Export PDF</Button>
                <Button variant="outline-secondary" onClick={onHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
};


const PaymentModal = ({ show, onHide, paymentInfo, onMakePayment }) => {

    const {settings } = useSettings();
    const currency = settings.currency!=='none'?settings.currency:"";

    const [paying,{isLoading, isSuccess}] = usePayDebtMutation();
    const [payOrder, {isLoading:isPayOrderLoading, isSuccess: isPayOrderSuccess}] = useUpdateOrderMutation();

    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => { if (show) { setPaymentAmount(''); setPaymentDate(new Date().toISOString().split('T')[0]); } }, [show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0 || amount > paymentInfo.remainingDue) { alert('Invalid payment amount.'); return; }
        if(paymentInfo.type==='order'){
        try{
const data = await payOrder({...paymentInfo, amountPaid: amount}).unwrap();
onHide();
toast.success("Payment Seccessfull");
        }catch(err){
             toast.error("An error occured");
            console.log("error: ",err);
        }
        }else{
        try{
const data = await paying({...paymentInfo, amountPaid: amount}).unwrap();
onHide();
toast.success("Payment Seccessfull");
        }catch(err){
            toast.error("An error occured");
            console.log("error: ",err);
        }
        }
        // await onMakePayment(paymentInfo, amount, paymentDate);
        // onHide();
    };

    if (!paymentInfo) return null;

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton><Modal.Title>{paymentInfo.title}</Modal.Title></Modal.Header>
            <Modal.Body>
                <p><strong>Transaction ID:</strong> {paymentInfo.transactionId}</p>
                <p><strong>Remaining Due:</strong> {currency}{paymentInfo.remainingDue?.toFixed(2)}</p>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3"><Form.Label>Payment Date</Form.Label><Form.Control type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required /></Form.Group>
                    <Form.Group className="mb-3"><Form.Label>Payment Amount</Form.Label><Form.Control type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} step="0.01" min="0.01" max={paymentInfo.remainingDue} required /></Form.Group>
                    <Button variant="success" type="submit" className="w-100" disabled={isLoading||isPayOrderLoading}>{isLoading||isPayOrderLoading?"Processing Payment":"Process Payment"}</Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

const EditCustomerModal = ({ show, onHide, customer, onSave }) => {
    const [upDateCustomer, { data, isLoading,isSuccess, isError,error }] = useUpdateCustomerMutation();
    const [formData, setFormData] = useState(customer);
    useEffect(() => { setFormData(customer); }, [customer]);
    const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
    
  const handleUpdateCustomer = async () => {
      try {
        await upDateCustomer({
          cust_id: formData.id,
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
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton><Modal.Title>Edit Customer</Modal.Title></Modal.Header>
            <Modal.Body>
                <Form>
                    {/* <Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control type="text" name="id" value={formData?.id || ''} onChange={handleChange} required /></Form.Group> */}
                    <Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control type="text" name="name" value={formData?.name || ''} onChange={handleChange} required /></Form.Group>
                    <Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" name="email" value={formData?.email || ''} onChange={handleChange} required /></Form.Group>
                    <Form.Group className="mb-3"><Form.Label>Phone</Form.Label><Form.Control type="tel" name="phone" value={formData?.phone || ''} onChange={handleChange} required /></Form.Group>
                    <Form.Group className="mb-3"><Form.Label>Address</Form.Label><Form.Control type="text" name="address" value={formData?.address || ''} onChange={handleChange} required /></Form.Group>
                    {
                        isLoading?<Button variant="primary" className="w-100">Saving Changes...</Button>:<Button variant="primary" onClick={handleUpdateCustomer} className="w-100">Save Changes</Button>
                    }
                    
                </Form>
            </Modal.Body>
        </Modal>
    );
};

const DeleteCustomerModal = ({ show, onHide, customer, onDelete, setDeletingCustomer }) => {

        const [DeleteCustomer, { data: deleteData, isLoading: isDeleteLoading, isSuccess:isDeleteSuccess, isError: isDeleteError }] =
        useDeleteCustomerMutation();

         const [toast, setToast] = useState({ show: false, message: '', variant: 'light' });

            const showToast = (message, variant = 'success') => {
        setToast({ show: true, message, variant });
        setTimeout(() => setToast({ show: false, message: '', variant: 'light' }), 3000);
    };

        const handleDeleteCustomer = async (customerId) => {
            // window.alert("Hi");
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
             const deleteCust =  await DeleteCustomer({ cust_id: customerId }).unwrap();
             setDeletingCustomer(null);
            showToast('Customer deleted successfully.', 'warning');
            // setCustomers(prev => prev.filter(c => c.id !== customerId));
            // setCustomerDetails(prev => { const newDetails = { ...prev }; delete newDetails[customerId]; return newDetails; });
        } catch(error) {
            showToast('Failed to delete customer.', 'danger');
        }
    };
    // const handleDelete = async () => { await onDelete(customer.id); onHide(); };
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton><Modal.Title>Confirm Deletion</Modal.Title></Modal.Header>
            <Modal.Body><p>Are you sure you want to delete <strong>{customer?.name+customer?.id}</strong>? This action cannot be undone.</p></Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={onHide}>Cancel</Button>
              {isDeleteLoading?<Button variant="danger">Deleting...</Button>:<Button variant="danger" onClick={()=>{handleDeleteCustomer(customer?.id)}} >Delete</Button>}
              </Modal.Footer>
        </Modal>
    );
};

const CustomerDetailPage = ({ customer, details, onBack, onMakePayment }) => {
    const { settings } = useSettings();
    const currency = settings.currency!=='none'?settings.currency:"";
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [showSaleDetail, setShowSaleDetail] = useState(false);
    const [selectedSaleGroup, setSelectedSaleGroup] = useState(null);
    const [showOrderDetail, setShowOrderDetail] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const groupedSales = useMemo(() => {
        const groups = details.sales.reduce((acc, sale) => {
            acc[sale.SR_ID] = acc[sale.SR_ID] || [];
            acc[sale.SR_ID].push(sale);
            return acc;
        }, {});
        return Object.entries(groups).map(([srId, items]) => ({
            SR_ID: srId,
            items,
            totalAmount: items.reduce((sum, item) => sum + Number(item?.salePrice)||0 * Number(item?.saleQuantity)||0, 0),
            status: items[0].status,
            date: items[0].saleDateCreated,
        }));
    }, [details.sales]);

    const openPaymentModal = (transactionId, type) => {
        let info = {};
        if (type === 'order') {
            const order = details.orders.find(o => o.id === transactionId);
            info = { title: 'Make Order Installment', remainingDue: order.totalAmount - order.depositedAmount, transactionId };
        } else {
            const due = details.dues.find(d => d.id === transactionId);
            info = { title: 'Pay Sales Due', remainingDue: due.totalAmount - due.paidAmount, type };
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

    return (
        <>
            <Button variant="link" onClick={onBack} className="mb-3 p-0 d-flex align-items-center"><ArrowLeft size={16} className="me-2" />Back to List</Button>
            <h2 className="mb-1">{customer.name}</h2>
            <p className="text-muted mb-4">{customer.email}</p>

            <Tabs defaultActiveKey="sales" id="customer-details-tabs" className="mb-3">
                <Tab eventKey="sales" title="Sales">
                    <Table striped bordered hover responsive>
                        <thead><tr><th>#</th><th>Invoice ID (SR_ID)</th><th>Date</th><th>Total Amount</th><th>Status</th><th>Action</th></tr></thead>
                        <tbody>{groupedSales.map((group, index) => (<tr key={group.SR_ID}><td>{index + 1}</td><td>{group.SR_ID}</td><td>{group.date}</td><td>{currency}{group.totalAmount.toFixed(2)}</td><td><Badge bg={group.status === 'paid' ? 'success' : 'danger'}>{group.status}</Badge></td><td><Button variant="info" size="sm" onClick={() => handleViewSale(group)}><Eye className="me-1"/>View</Button></td></tr>))}</tbody>
                    </Table>
                </Tab>
                <Tab eventKey="orders" title="Orders">
                    <Table striped bordered hover responsive>
                        <thead><tr><th>#</th><th>Order ID</th><th>Date</th><th>Total</th><th>Balance</th><th>Actions</th></tr></thead>
                        <tbody>{details.orders.map((o, index) => { const balance = o.totalAmount - o.depositedAmount; return (<tr key={o.id}><td>{index + 1}</td><td>{o.id}</td><td>{o.date}</td><td>{currency}{o.totalAmount.toFixed(2)}</td><td>{currency}{balance.toFixed(2)}</td><td className="d-flex gap-2"><Button variant="info" size="sm" onClick={() => handleViewOrder(o)}><Eye /></Button>{balance > 0 && <Button variant="success" size="sm" onClick={() => openPaymentModal(o.id, 'order')}>Pay</Button>}</td></tr>)})}</tbody>
                    </Table>
                </Tab>
                <Tab eventKey="dues" title="Dues">
                    <Table striped bordered hover responsive>
                        <thead><tr><th>#</th><th>Invoice ID (SR_ID)</th><th>Date</th><th>Total Amount</th><th>Amount Paid</th><th>Balance</th><th>Action</th></tr></thead>
                        <tbody>{details.dues.map((d, index) => { const balance = d.totalAmount - d.paidAmount; return (<tr key={d.id}><td>{index + 1}</td><td>{d.SR_ID}</td><td>{d.date}</td><td>${d.totalAmount.toFixed(2)}</td><td>{currency}{d.paidAmount.toFixed(2)}</td><td>{currency}{balance.toFixed(2)}</td><td>{balance > 0 ? <Button variant="success" size="sm" onClick={() => openPaymentModal(d.id, 'due')}>Pay Due</Button> : 'Cleared'}</td></tr>)})}</tbody>
                    </Table>
                </Tab>
            </Tabs>
            <PaymentModal show={!!paymentInfo} onHide={() => setPaymentInfo(null)} paymentInfo={paymentInfo} onMakePayment={onMakePayment} />
            <SaleDetailModal show={showSaleDetail} onHide={() => setShowSaleDetail(false)} saleGroup={selectedSaleGroup} customerName={customer.name} />
            <OrderDetailModal show={showOrderDetail} onHide={() => setShowOrderDetail(false)} order={selectedOrder} customerName={customer.name} />
        </>
    );
};

const CustomerListPage = ({ customers, customerDetails, onSaveCustomer, onDeleteCustomer, onSelectCustomer }) => {
const { settings } = useSettings();
const currency = settings.currency!=='none'?settings.currency:"";

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [showModal, setShowModal] = useState(false);
    
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [deletingCustomer, setDeletingCustomer] = useState(null);

    const customersWithDetails = useMemo(() => {
        return customers.map(c => ({ ...c, ...calculateCustomerTotals(c.id, customerDetails), dues: calculateCustomerDues(c.id, customerDetails), }));
    }, [customers, customerDetails]);

    const filteredCustomers = useMemo(() => {
        return customersWithDetails.filter(c => {
            const searchMatch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase());
            const statusMatch = statusFilter === 'all' || (statusFilter === 'paid' && c.dues === 0) || (statusFilter === 'due' && c.dues > 0);
            return searchMatch && statusMatch;
        });
    }, [customersWithDetails, searchTerm, statusFilter]);

    const sortedCustomers = useMemo(() => {
        let sortableItems = [...filteredCustomers];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) { return sortConfig.direction === 'ascending' ? -1 : 1; }
                if (a[sortConfig.key] > b[sortConfig.key]) { return sortConfig.direction === 'ascending' ? 1 : -1; }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredCustomers, sortConfig]);

    const totalPages = rowsPerPage === 'all' ? 1 : Math.ceil(sortedCustomers.length / rowsPerPage);
    const paginatedCustomers = rowsPerPage === 'all' ? sortedCustomers : sortedCustomers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') { direction = 'descending'; }
        setSortConfig({ key, direction });
    };

    const handleRowsPerPageChange = (e) => {
        const value = e.target.value;
        setRowsPerPage(value === 'all' ? 'all' : Number(value));
        setCurrentPage(1);
    };

    const handleExport = (format) => {
        const headers = ["#", "Name", "Email", "Phone", "Total Sales", "No. of Orders", "Dues"];
        const data = sortedCustomers.map((c, i) => [
            i + 1,
            c.name,
            c.email,
            c.phone,
            c.totalSales.toFixed(2),
            c.totalOrders,
            c.dues.toFixed(2)
        ]);

        if (format === 'csv') {
            exportToCsv("customers.csv", [headers, ...data]);
        } else if (format === 'pdf') {
            const doc = new jsPDF();
            doc.text("Customer List", 14, 16);
            doc.autoTable({ head: [headers], body: data, startY: 20 });
            doc.save("customers.pdf");
        }
    };

    return (
        <>
            <Row className="mb-4 align-items-center">
                <Col md={4}><h5>Customer Management</h5></Col>
                <Col md={8}>
                    <Row className="g-2">
                        <Col><InputGroup><Form.Control placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></InputGroup></Col>
                        <Col><Form.Select style={{height:'35px'}} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">All Statuses</option><option value="paid">Paid Up</option><option value="due">Has Dues</option></Form.Select></Col>
                        <Col><Form.Select style={{height:'35px'}}  value={rowsPerPage} onChange={handleRowsPerPageChange}><option value="5">5 Rows</option><option value="10">10 Rows</option><option value="25">25 Rows</option><option value="all">All Rows</option></Form.Select></Col>
                    </Row>
                </Col>
            </Row>
            
            <div className="mb-3 d-flex justify-content-end gap-2">
                <Button variant="outline-secondary" size="sm" onClick={() => window.print()}><Printer className="me-2"/>Print</Button>
                <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary" size="sm" id="dropdown-basic">
                        <Download className="me-2"/>Export
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleExport('pdf')}>Export as PDF</Dropdown.Item>
                        <Dropdown.Item onClick={() => handleExport('csv')}>Export as CSV</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
                <PermissionWrapper
                required={['customerscreate']}
                children={  <Button variant="outline-primary" size="sm" onClick={()=>setShowModal(true)} ><Person className="me-2" />Add</Button>}
                />
               
                 <AddCustomer showModal={showModal} handleModalToggle={setShowModal} />
            </div>

            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>#</th>
                        <th onClick={() => requestSort('name')} style={{cursor: 'pointer'}}>Name</th>
                        <th onClick={() => requestSort('email')} style={{cursor: 'pointer'}}>Email</th>
                        <th onClick={() => requestSort('address')} style={{cursor: 'pointer'}}>Address</th>
                        <th onClick={() => requestSort('phone')} style={{cursor: 'pointer'}}>Phone</th>
                        <th onClick={() => requestSort('totalSales')} style={{cursor: 'pointer'}}>Total Sales</th>
                        <th onClick={() => requestSort('totalOrders')} style={{cursor: 'pointer'}}>No. of Orders</th>
                        <th onClick={() => requestSort('dues')} style={{cursor: 'pointer'}}>Dues</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedCustomers.map((c, index) => (
                        <tr key={c.id}>
                            <td>{(currentPage - 1) * (rowsPerPage === 'all' ? 0 : rowsPerPage) + index + 1}</td>
                            <td>{c.name}</td>
                            <td>{c.email}</td>
                            <td>{c.address}</td>
                            <td>{c.phone}</td>
                            <td className="text-end">{currency}{c.totalSales.toFixed(2)}</td>
                            <td className="text-end">{c.totalOrders}</td>
                            <td className="text-end">{currency}{c.dues.toFixed(2)}</td>
                            <td className="text-center">
                                <PermissionWrapper
                                required={['customersview']}
                                children={
 <Button variant="outline-primary" size="sm" className="me-2" onClick={() => onSelectCustomer(c)}><Eye /></Button>
                                }
                                />
                               <PermissionWrapper
                               required={['customersupdate']}
                               children={
 <Button variant="outline-warning" size="sm" className="me-2" onClick={() => setEditingCustomer(c)}><Pencil /></Button>
                               }
                               />
                               <PermissionWrapper
                               required={['customersdelete']}
                               children={<Button variant="outline-danger" size="sm" onClick={() => setDeletingCustomer(c)}><Trash /></Button>}
                               />  
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <th colSpan="5">Totals</th>
                        <th className="text-end">{currency}{sortedCustomers.reduce((sum, c) => sum + Number(c.totalSales) || 0, 0).toFixed(2)}</th>
                        <th className="text-end">{sortedCustomers.reduce((sum, c) => sum + Number(c.totalOrders) || 0, 0)}</th>
                        <th className="text-end">{currency}{sortedCustomers.reduce((sum, c) => sum + c.dues, 0).toFixed(2)}</th>
                        <th></th>
                    </tr>
                </tfoot>
            </Table>
            {rowsPerPage !== 'all' && totalPages > 1 &&
                <div className="d-flex justify-content-center">
                    <Pagination>
                        <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
                        {[...Array(totalPages).keys()].map(num => (
                            <Pagination.Item key={num + 1} active={num + 1 === currentPage} onClick={() => setCurrentPage(num + 1)}>
                                {num + 1}
                            </Pagination.Item>
                        ))}
                        <Pagination.Next onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
                    </Pagination>
                </div>
            }
            <EditCustomerModal show={!!editingCustomer} onHide={() => setEditingCustomer(null)} customer={editingCustomer} onSave={onSaveCustomer} />
            <DeleteCustomerModal show={!!deletingCustomer} onHide={() => setDeletingCustomer(null)} setDeletingCustomer={setDeletingCustomer} customer={deletingCustomer} onDelete={onDeleteCustomer} />
        </>
    );
};


// --- Main Exported Component ---
export default function CustomerPage() {
    
    // Get raw data from Redux store
    const rawCustomersData = useSelector(selectRawCustomers);
    const rawSalesData = useSelector(selectSales);
    const rawOrdersData = useSelector(selectOrders);
    const rawDuesData = useSelector(selectDebt);
    const rawInventoryData = useSelector(selectStock);

          const [upDateCustomer, { data, isLoading, isLoading: isUpdateLoading, isSuccess: isUpdateSuccess, isError: isUpdateError }] = useUpdateCustomerMutation();

    const [showAddModal, setShowAddModal] = useState(false);

    // Local state for UI
    const [customers, setCustomers] = useState([]);
    const [customerDetails, setCustomerDetails] = useState({});
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', variant: 'light' });

    // Process data from Redux store when it changes
    useEffect(() => {
        // Ensure data is an array before mapping to prevent errors
        const inventoryMap = new Map((rawInventoryData || []).map(item => [parseInt(item.itemId, 10), item.itemName]));

        const processedCustomers = (rawCustomersData || []).map(c => ({
            id: parseInt(c.custId, 10),
            name: c.custName,
            email: c.custEmail,
            phone: c.custContact,
            address: c.custLocation,
        }));

        const processedDetails = {};
        processedCustomers.forEach(c => {
            const custId = c.id;
            processedDetails[custId] = {
                sales: (rawSalesData || []).filter(s => parseInt(s.custId, 10) === custId).map(s => ({ 
                    ...s, 
                    saleId: parseInt(s.saleId, 10),
                    SR_ID: parseInt(s.SR_ID, 10),
                    salePrice: parseFloat(s.salePrice),
                    saleQuantity: parseInt(s.saleQuantity, 10),
                    saleItemId: parseInt(s.saleItemId, 10),
                    status: 'paid', 
                    productName: inventoryMap.get(parseInt(s.saleItemId, 10)) || 'Unknown Product' 
                })),
                orders: (rawOrdersData || []).filter(o => parseInt(o.custId, 10) === custId).map(o => ({ 
                    id: parseInt(o.orderId, 10), 
                    date: o.orderDateCreated, 
                    totalAmount: parseFloat(o.totalCost), 
                    depositedAmount: parseFloat(o.amountPaid), 
                    productName: inventoryMap.get(parseInt(o.prodId, 10)) || 'Custom Item', 
                    customSize: o.customSize, 
                    layers: parseInt(o.layers, 10), 
                    quantity: parseInt(o.quantity, 10) 
                })),
                dues: (rawDuesData || []).filter(d => parseInt(d.custId, 10) === custId).map(d => ({ 
                    id: parseInt(d.indebtId, 10), 
                    SR_ID: parseInt(d.SR_ID, 10), 
                    date: d.indebtDateCreated, 
                    totalAmount: parseFloat(d.totalAmount), 
                    paidAmount: parseFloat(d.initialDeposit) 
                })),
                installmentHistory: [],
                duesPaymentHistory: [],
            };
        });

        Object.values(processedDetails).forEach(detail => {
            const dueSrIds = new Set(detail.dues.map(d => d.SR_ID));
            detail.sales.forEach(sale => {
                if (dueSrIds.has(sale.SR_ID)) { sale.status = 'unpaid'; }
            });
        });

        setCustomers(processedCustomers);
        setCustomerDetails(processedDetails);

    }, [rawCustomersData, rawSalesData, rawOrdersData, rawDuesData, rawInventoryData]);

    const showToast = (message, variant = 'success') => {
        setToast({ show: true, message, variant });
        setTimeout(() => setToast({ show: false, message: '', variant: 'light' }), 3000);
    };

        const handleDeleteCustomer = async (customerId) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
            // e.g., dispatch(deleteCustomer(customerId));
            // console.log("Dispatching delete for customer ID:", customerId);
            //   await DeleteCustomer({ cust_id: customerId }).unwrap();
            showToast('Customer deleted successfully.', 'warning');
            // setCustomers(prev => prev.filter(c => c.id !== customerId));
            // setCustomerDetails(prev => { const newDetails = { ...prev }; delete newDetails[customerId]; return newDetails; });
        } catch(error) {
            showToast('Failed to delete customer.', 'danger');
        }
    };

    const handleMakePayment = async (paymentInfo, amount, date) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
            // e.g., dispatch(makePayment({ ...paymentInfo, amount, date }));
            console.log("Dispatching payment:", { paymentInfo, amount, date });
            showToast('Payment processed successfully!', 'success');
            setCustomerDetails(prevDetails => {
                const newDetails = JSON.parse(JSON.stringify(prevDetails));
                const customerDetail = newDetails[paymentInfo.customerId];
                if (paymentInfo.type === 'order') {
                    const order = customerDetail.orders.find(o => o.id === paymentInfo.transactionId);
                    order.depositedAmount += amount;
                    customerDetail.installmentHistory.push({ date, amount, orderId: paymentInfo.transactionId });
                } else {
                    const due = customerDetail.dues.find(d => d.id === paymentInfo.transactionId);
                    due.paidAmount += amount;
                    customerDetail.duesPaymentHistory.push({ date, amount, invoiceId: due.SR_ID });
                }
                return newDetails;
            });
        } catch (error) {
            showToast('Payment failed.', 'danger');
        }
    };

    return (
        <>
            <ToastMessage show={toast.show} message={toast.message} variant={toast.variant} onClose={() => setToast({ ...toast, show: false })} />
            {selectedCustomer ? (
                <Container fluid="lg" className="py-4">
                    <CustomerDetailPage 
                        customer={selectedCustomer} 
                        details={customerDetails[selectedCustomer.id]} 
                        onBack={() => setSelectedCustomer(null)}
                        onMakePayment={handleMakePayment}
                    />
                </Container>
            ) : (
                <Container fluid="lg" className="py-4">
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
