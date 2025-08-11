import React, { useState, useEffect, useRef, useContext } from 'react';
import Chart from 'chart.js/auto';
import Litepicker from 'litepicker';
import { format, parseISO } from 'date-fns';

import { useSettings } from '../Settings';

// import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Table, Navbar, ProgressBar, Badge } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { selectOrders } from "../../features/api/orderSlice";
import { selectExpenses } from "../../features/api/ExpensesSlice";
import { selectEmployees } from "../../features/api/employeesSlice";
import { selectCustomers } from "../../features/api/customers";
import { selectStock } from "../../features/stock/stockSlice";
import { selectSales } from "../../features/api/salesSlice";
import { selectDebt } from "../../features/api/debtSlice";
import { selectRawMaterials } from "../../features/api/rawmaterialsSlice";
import { NavLink } from 'react-router-dom';

// --- Data using the exact column names from your CSV as keys ---
// const stockItems = [
//     { "S/N": 1, "Item Name": "Board 2", "itemStockPrice": 35.0, "itemLeastPrice": 40.0 },
//     { "S/N": 2, "Item Name": "Cake Board", "itemStockPrice": 130.0, "itemLeastPrice": 150.0 },
//     { "S/N": 3, "Item Name": "Hammer", "itemStockPrice": 12.50, "itemLeastPrice": 15.0 },
//     { "S/N": 4, "Item Name": "Nails (1lb box)", "itemStockPrice": 4.75, "itemLeastPrice": 5.75 },
//     { "S/N": 5, "Item Name": "Screwdriver Set", "itemStockPrice": 22.0, "itemLeastPrice": 25.5 }
// ];

const stockStock = [
    { "stock_item_id": 1, "quantity": 9 },
    { "stock_item_id": 2, "quantity": 135 },
    { "stock_item_id": 3, "quantity": 50 },
    { "stock_item_id": 4, "quantity": 200 },
    { "stock_item_id": 5, "quantity": 35 }
];

// --- Other Mock Data (replace with your actual data) ---
// const customers = [
//     { id: 1, CName: 'Mr. Daniels', CPhone: '0700000001' },
//     { id: 2, CName: 'Mr. Abas Ssendagala', CPhone: '0700000002' },
//     { id: 3, CName: 'Global Enterprises', CPhone: '0700000003' }
// ];
// const sales = [
//     { id: 1, customer_id: 2, stock_item_id: 2, quantity: 10, total: 1500, created_at: '2025-07-18 10:00:00' },
//     { id: 2, customer_id: 1, stock_item_id: 4, quantity: 20, total: 115, created_at: '2025-07-18 11:30:00' },
//     { id: 3, customer_id: 3, stock_item_id: 3, quantity: 5, total: 75, created_at: '2025-07-17 15:00:00' }
// ];
// const dues = [
//     {id: 1, customer_id: 3, amount: 200000, due_date: '2025-07-25'},
//     {id: 2, customer_id: 1, amount: 150000, due_date: '2025-07-30'},
// ];
// const employees = [
//     { EID: 53, EFirstName: 'John', ELastName: 'Doe'},
//     { EID: 54, EFirstName: 'Jane', ELastName: 'Smith'},
// ];
// const rawMaterials = [
//     { id: 1, name: 'Wood', quantity: 80 }, { id: 2, name: 'Steel', quantity: 50 },
//     { id: 3, name: 'Varnish', quantity: 30 }, { id: 4, name: 'Screws', quantity: 500 },
// ];
// const dailyExpenses = [
//     { id: 1, description: 'Office Supplies', amount: 75000, created_at: '2025-07-18 09:30:00'},
//     { id: 2, description: 'Fuel for Delivery', amount: 120000, created_at: '2025-07-17 12:00:00'},
// ];


// --- Reusable Components ---
const KpiCard = ({ href, icon, title, value }) => (
    <a href={href} className="text-decoration-none text-dark">
        <Card className="h-100 shadow-sm border-0 kpi-card">
            <Card.Body className="d-flex align-items-center">
                <div className="flex-shrink-0 me-3">{icon}</div>
                <div>
                    <div className="text-muted small">{title}</div>
                    <div className="h5 fw-bold mb-0">{value}</div>
                </div>
                <div className="ms-auto text-muted">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-right-circle" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z"/></svg>
                </div>
            </Card.Body>
        </Card>
    </a>
);

const SectionCard = ({ id, title, children }) => (
    <Card id={id} className="shadow-sm border-0 mb-4">
        <Card.Header as="h5">{title}</Card.Header>
        <Card.Body>{children}</Card.Body>
    </Card>
);

// --- Main App Component ---
export default function Dashboard() {
    const stockItems = useSelector(selectStock);
    const customers = useSelector(selectCustomers);
    const dues = useSelector(selectDebt);
    const sales = useSelector(selectSales);
    const orders = useSelector(selectOrders);
    const dailyExpenses = useSelector(selectExpenses);
    const employees = useSelector(selectEmployees);
    const rawMaterials = useSelector(selectRawMaterials);

    const { settings } = useSettings();
    console.log("theme: ",settings.theme);

    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: new Date(),
    });
    const [kpis, setKpis] = useState({});
    const [filteredData, setFilteredData] = useState({ sales: [], expenses: [], orders: [] });

    const datePickerRef = useRef();
    const rawMaterialsChartRef = useRef(null);
    const salesVsStockChartRef = useRef(null);

    // Initialize Date Picker
    useEffect(() => {
        const picker = new Litepicker({
            element: datePickerRef.current,
            singleMode: false,
            format: 'MMM DD, YYYY',
            setup: (picker) => {
                picker.on('selected', (date1, date2) => {
                    setDateRange({ startDate: date1.dateInstance, endDate: date2.dateInstance });
                });
            },
        });
        picker.setDateRange(dateRange.startDate, dateRange.endDate);
    }, []);

    // Update data and KPIs when date range changes
    useEffect(() => {
        const filteredSales = sales.filter(s => new Date(s.saleDateCreated) >= dateRange.startDate && new Date(s.saleDateCreated) <= dateRange.endDate);
        const filteredExpenses = dailyExpenses.filter(e => new Date(e.expenseDateCreated) >= dateRange.startDate && new Date(e.expenseDateCreated) <= dateRange.endDate);
        const filteredOrders = orders.filter(e => new Date(e.orderDateCreated) >= dateRange.startDate && new Date(e.orderDateCreated) <= dateRange.endDate);

        setFilteredData({ sales: filteredSales, expenses: filteredExpenses, orders: filteredOrders });

        const totalRevenue = filteredSales.reduce((sum, s) => sum + Number(s.saleQuantity)*Number(s.salePrice), 0);
        let totalProfit = 0;
        let totalCost = 0;
        filteredSales.forEach(sale => {
            const item = stockItems.find(i => i['itemId'] === sale.saleItemId);
            if (item) {
                const cost = item.itemStockPrice * sale.saleQuantity;
                const profit = (item.itemLeastPrice * sale.saleQuantity) - cost;
                
                totalCost += cost;
                totalProfit += profit;
            }
        });

        const profitMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

        setKpis({
            totalStock: stockItems?.reduce((sum, s) => sum + Number(s?.itemQuantity)||0, 0),
            revenue: totalRevenue,
            profitMargin: profitMargin.toFixed(1),
            totalOrders: orders?.length,
            // totalDues: dues.reduce((sum, d) => sum + (Number(d.totalAmount)-Number(d.initialDeposit)), 0),
            totalDues: dues.reduce((sum, d) => {
  const total = Number(d.totalAmount) || 0;
  const deposit = Number(d.initialDeposit) || 0;
  return sum + (total - deposit);
}, 0),
            totalExpenses: dailyExpenses.reduce((sum, e) => sum + Number(e.amount)||0, 0),
            totalCustomers: customers.length,
            totalEmployees: employees.length,
        });
    }, [dateRange]);
    
    // Initialize and update charts
    useEffect(() => {
        const chartInstances = [];

        if (rawMaterialsChartRef.current) {
            const chart = new Chart(rawMaterialsChartRef.current, {
                type: 'bar',
                data: { labels: rawMaterials.map(m => m.name), datasets: [{ label: 'Quantity', data: rawMaterials.map(m => m.Quantity), backgroundColor: ['#0d6efd', '#198754', '#ffc107', '#6f42c1'], borderRadius: 5 }] },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
            chartInstances.push(chart);
        }

        if (salesVsStockChartRef.current) {
            const chart = new Chart(salesVsStockChartRef.current, {
                type: 'bar',
                data: { labels: [], datasets: [{ label: 'Sold', data: [], backgroundColor: '#ffc107', borderRadius: 5 }, { label: 'In Stock', data: [], backgroundColor: '#0d6efd', borderRadius: 5 }] },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
            });
            chartInstances.push(chart);
        }

        return () => chartInstances.forEach(chart => chart.destroy());
    }, []);

    // Update Sales vs Stock chart when data changes
    useEffect(() => {
        const chart = Chart.getChart(salesVsStockChartRef.current);
        if (!chart) return;
        const labels = stockItems.map(i => i['itemName']);
        const soldData = stockItems.map(item => sales?.filter(s => s?.saleItemId === item?.itemId).reduce((sum, s) => sum + Number(s?.saleQuantity)||0, 0));
        // const inStockData = stockItems.map(item => stockStock.find(s => s.itemId === item['itemId'])?.quantity || 0);
        const inStockData = stockItems.map(item => item?.itemQuantity || 0);
        chart.data.labels = labels;
        chart.data.datasets[0].data = soldData;
        chart.data.datasets[1].data = inStockData;
        chart.update();
    }, [filteredData.sales]);

    const [_orders, setOrders] = useState([]);
    const [totals, setTotals] = useState({ ordered: 0, produced: 0 });

    useEffect(() => {
        // Create lookup maps for efficient data combination
        const customerMap = new Map(customers?.map(c => [c.custId, c.custName]));
        const productMap = new Map(stockItems?.map(i => [i.itemId, i.itemName]));
        console.log("customerMap: ",customerMap);
        console.log("productMap: ",productMap);
        
        let totalOrdered = 0;
        let totalProduced = 0;

        // Combine data into a final, processed orders array
        const processedOrders = orders.map(order => {
            totalOrdered += parseInt(order.quantity, 10) || 0;
            totalProduced += parseInt(order.quantityProduced, 10) || 0;
            
            return {
                ...order,
                customerName: customerMap.get(order.custId) || `Cust-${order.custId}`,
                productName: order.customSize ? order.customSize : (productMap.get(order.prodId) || `Prod-${order.prodId}`),
            };
        });
        
        setOrders(processedOrders);
        setTotals({ ordered: totalOrdered, produced: totalProduced });

    }, []); // Empty dependency array ensures this runs only once on mount

    const getPaymentStatus = (order) => {
        const totalCost = parseFloat(order.totalCost) || 0;
        const amountPaid = parseFloat(order.amountPaid) || 0;

        if (amountPaid >= totalCost && totalCost > 0) {
            return { variant: 'success', text: 'Paid' };
        } else if (amountPaid > 0) {
            return { variant: 'warning', text: 'Partial' };
        } else {
            return { variant: 'danger', text: 'Unpaid' };
        }
    };

    const getProgress = (order) => {
        const ordered = parseInt(order.quantity, 10) || 0;
        const produced = parseInt(order.quantityProduced, 10) || 0;
        if (produced === 0 && ordered > 0) {
            return <Badge bg="secondary">Pending</Badge>;
        }
        const percentage = ordered > 0 ? Math.round((produced / ordered) * 100) : 0;
        return <ProgressBar now={percentage} label={`${percentage}%`} variant={percentage === 100 ? 'success' : 'primary'} />;
    };

    const formatOrderDate = (dateString) => {
        try {
            // Parse the ISO-like string and format it
            const date = parseISO(dateString);
            return format(date, 'MMM d, yyyy');
        } catch (error) {
            // Return a fallback for invalid dates
            console.error("Error formatting date:", error);
            return 'Invalid Date';
        }
    };

     const divStyle = {
    height: "100%",
    backgroundColor: settings.theme === 'dark' ? '#1A202C' : '#FFFFFF !important' // Sets color based on theme
  };

    return (
        <div style={divStyle}>
        {/* <div style={{ backgroundColor: '#f8f9fa',height:"100%" }} > */}
            <Navbar bg={settings.theme === 'dark'?"dark":"light"} expand="lg" className="shadow-sm sticky-top">
                <Container fluid>
                    <Navbar.Brand href="#" className="fw-bold d-flex align-items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-pie-chart-fill text-primary me-2" viewBox="0 0 16 16"><path d="M15.985 8.5H8.207l-5.5 5.5a8 8 0 0 0 13.277-5.5zM2 13.292A8 8 0 0 1 7.5.015v7.778l-5.5 5.5zM8 1.03A8 8 0 0 0 2.252 8h6.966V1.03z"/></svg>
                        Dashboard
                    </Navbar.Brand>
                    <div className="d-flex align-items-center ms-auto">
                        <div style={{width: '280px'}}><input ref={datePickerRef} type="text" className="form-control" /></div>
                    </div>
                </Container>
            </Navbar>

            <Container fluid className="p-4" >
              <div className='d-flex gap-2 flex-column'>
                <div>
<Row className="g-4" >
                    <Col xs={12} sm={6} lg={4} xl={3}>
                    <NavLink to="/home/inventory" className="menu-item_embedded" style={{textDecoration:'none'}} >
                    <KpiCard title="Total Stock" value={kpis.totalStock} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-box-seam text-primary" viewBox="0 0 16 16"><path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5l2.404.961L8 2.596l3.75 1.865 2.404-.961L8.186 1.113zM15 4.239l-6.5 2.6v7.922l6.5-3.25V4.24zM1 4.239v7.482l6.5 3.25V6.838L1 4.24zM8 16l-6.5-3.25V3.102L8 5.869v10.13z"/></svg>} />
                   </NavLink>
                    </Col>
                    <Col xs={12} sm={6} lg={4} xl={3}>
                    <NavLink to="/home/sales" className="menu-item_embedded" style={{textDecoration:'none'}} >
                    <KpiCard title="Revenue" value={`UGX ${kpis.revenue?.toLocaleString()}`} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-cash-stack text-warning" viewBox="0 0 16 16"><path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1H1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V5zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2H3z"/></svg>} />
                  </NavLink>
                    </Col>
                    <Col xs={12} sm={6} lg={4} xl={3}>
                    <NavLink to="/home/sales" className="menu-item_embedded" style={{textDecoration:'none'}} >
                    <KpiCard title="Profit Margin" value={`${kpis.profitMargin}%`} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-graph-up-arrow text-success" viewBox="0 0 16 16"><path fillRule="evenodd" d="M0 0h1v15h15v1H0V0zm10 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4.9l-3.613 4.417a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61L13.445 4H10.5a.5.5 0 0 1-.5-.5z"/></svg>} />
                   </NavLink>
                    </Col>
                    <Col xs={12} sm={6} lg={4} xl={3}>
                    <NavLink to="/home/production?tab=Orders" className="menu-item_embedded" style={{textDecoration:'none'}} >
                    <KpiCard  title="Total Orders" value={kpis.totalOrders} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-journal-check text-info" viewBox="0 0 16 16"><path fillRule="evenodd" d="M10.854 6.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 8.793l2.646-2.647a.5.5 0 0 1 .708 0z"/><path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z"/><path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z"/></svg>} />
                   </NavLink>
                    </Col>
                    <Col xs={12} sm={6} lg={4} xl={3}>
                    <NavLink to="/home/customers" className="menu-item_embedded" style={{textDecoration:'none'}} >
                    <KpiCard title="Total Dues" value={`UGX ${kpis.totalDues?.toLocaleString()}`} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-hourglass-split text-danger" viewBox="0 0 16 16"><path d="M2.5 15a.5.5 0 1 1 0-1h11a.5.5 0 0 1 0 1h-11zm2-13v1c0 .537.12 1.045.337 1.5h6.326c.216-.455.337-.963.337-1.5V2h-7zm3 6.25a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zM2 2.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-1z"/></svg>} />
                    </NavLink>
                    </Col>
                    <Col xs={12} sm={6} lg={4} xl={3}>
                    <NavLink to="/home/production?tab=Expenses" className="menu-item_embedded" style={{textDecoration:'none'}} >
                    <KpiCard title="Total Expenses" value={`UGX ${kpis.totalExpenses?.toLocaleString()}`} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-receipt text-secondary" viewBox="0 0 16 16"><path d="M1.92.506a.5.5 0 0 1 .434.14L3 1.293l.646-.647a.5.5 0 0 1 .708 0L5 1.293l.646-.647a.5.5 0 0 1 .708 0L7 1.293l.646-.647a.5.5 0 0 1 .708 0L9 1.293l.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .801.13l.5 1A.5.5 0 0 1 15 2v12a.5.5 0 0 1-.053.224l-.5 1a.5.5 0 0 1-.8.13L13 14.707l-.646.647a.5.5 0 0 1-.708 0L11 14.707l-.646.647a.5.5 0 0 1-.708 0L9 14.707l-.646.647a.5.5 0 0 1-.708 0L7 14.707l-.646.647a.5.5 0 0 1-.708 0L5 14.707l-.646.647a.5.5 0 0 1-.708 0L3 14.707l-.646.647a.5.5 0 0 1-.801-.13l-.5-1A.5.5 0 0 1 1 14V2a.5.5 0 0 1 .053-.224l.5-1a.5.5 0 0 1 .367-.27zm.217 1.338L2 2.118v11.764l.137.274.51-.51a.5.5 0 0 1 .707 0l.646.647.646-.646a.5.5 0 0 1 .708 0l.646.646.646-.646a.5.5 0 0 1 .708 0l.646.646.646-.646a.5.5 0 0 1 .708 0l.646.646.646-.646a.5.5 0 0 1 .708 0l.646.646.646-.646a.5.5 0 0 1 .708 0l.509.509.137-.274V2.118l-.137-.274-.51.51a.5.5 0 0 1-.707 0L12.354 1.5l-.647.646a.5.5 0 0 1-.708 0L10.354 1.5l-.647.646a.5.5 0 0 1-.708 0L8.354 1.5l-.647.646a.5.5 0 0 1-.708 0L6.354 1.5l-.647.646a.5.5 0 0 1-.708 0L4.354 1.5l-.647.646a.5.5 0 0 1-.708 0l-.509-.51z"/><path d="M3 4.5a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5zm8-6a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5z"/></svg>} />
                    </NavLink>
                    </Col>
                    <Col xs={12} sm={6} lg={4} xl={3}>
                    <NavLink to="/home/customers" className="menu-item_embedded" style={{textDecoration:'none'}} >
                    <KpiCard title="Total Customers" value={kpis.totalCustomers} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-people-fill text-info" viewBox="0 0 16 16"><path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path fillRule="evenodd" d="M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/></svg>} />
                    </NavLink>
                    </Col>
                    <Col xs={12} sm={6} lg={4} xl={3}>
                    <NavLink to="/home/production?tab=Employees" className="menu-item_embedded" style={{textDecoration:'none'}} >
                    <KpiCard title="Total Employees" value={kpis.totalEmployees} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-person-badge text-dark" viewBox="0 0 16 16"><path d="M6.5 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/><path d="M4.5 0A2.5 2.5 0 0 0 2 2.5v11A2.5 2.5 0 0 0 4.5 16h7a2.5 2.5 0 0 0 2.5-2.5v-11A2.5 2.5 0 0 0 11.5 0h-7zM3 2.5A1.5 1.5 0 0 1 4.5 1h7A1.5 1.5 0 0 1 13 2.5v11a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 13.5v-11z"/></svg>} />
                   </NavLink>
                    </Col>


                    <Col xs={6}><SectionCard id="sales-vs-stock" title="Product Sales vs. Stock"><div className="chart-container"><canvas ref={salesVsStockChartRef} /></div></SectionCard></Col>
                    <Col lg={6}><SectionCard id="materials" title="Raw Materials Status"><div className="chart-container"><canvas ref={rawMaterialsChartRef} /></div></SectionCard></Col>
                    
                    <Col lg={12}>
                    <SectionCard id="orders" title="Rescent Orders" >
                        {/* <Table headers={['ID', 'Customer', 'Items', 'Total', 'Date']}>
                            {filteredData.sales.map(sale => { const customer = customers.find(c => c.custId === sale.custId); const item = stockItems.find(i => i['itemId'] === sale?.saleItemId); return (<tr key={sale.saleId}><td>#{sale?.saleId}</td><td>{customer?.custName || 'N/A'}</td><td>{sale?.saleQuantity} x {item?.['itemName'] || 'N/A'}</td><td>{Number(sale?.saleQuantity)*Number(sale?.salePrice).toLocaleString()}</td><td>{new Date(sale?.saleDateCreated).toLocaleDateString()}</td></tr>);})}
                            </Table> */}

 <Table responsive striped bordered hover>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Customer</th>
                                <th>Order Date</th>
                                <th>Product / Custom Size</th>
                                <th className="text-center">Qty Ordered</th>
                                <th className="text-center">Qty Produced</th>
                                <th>Progress / Status</th>
                                <th className="text-center">Payment Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {_orders.map((order, index) => (
                                <tr key={order.orderId}>
                                    <td>{index + 1}</td>
                                    <td>{order.customerName}</td>
                                    <td>{formatOrderDate(order.orderDateCreated)}</td>
                                    <td>{order.productName}</td>
                                    <td className="text-center">{order.quantity}</td>
                                    <td className="text-center">{order.quantityProduced}</td>
                                    <td>{getProgress(order)}</td>
                                    <td className="text-center">
                                        <Badge bg={getPaymentStatus(order).variant}>
                                            {getPaymentStatus(order).text}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="fw-bold">
                                <td colSpan="4" className="text-end">Total</td>
                                <td className="text-center">{totals.ordered}</td>
                                <td className="text-center">{totals.produced}</td>
                                <td colSpan="2"></td>
                            </tr>
                        </tfoot>
                    </Table>

                            </SectionCard>
                            </Col>
                     {/* <Col lg={6}><SectionCard id="dues" title="Outstanding Dues"><Table headers={['ID', 'Customer', 'Amount Due', 'Due Date']}>{dues.map(due => { const customer = customers.find(c => c.custId === due.customer_id); return (<tr key={due.id}><td>#{due.id}</td><td>{customer?.custName || 'N/A'}</td><td className="text-danger fw-bold">{due?.amount?.toLocaleString()}</td><td>{new Date(due.due_date)?.toLocaleDateString()}</td></tr>);})}</Table></SectionCard></Col>
                    <Col lg={6}><SectionCard id="expenses" title="Expenses"><Table headers={['ID', 'Description', 'Amount', 'Date']}>{filteredData.expenses.map(expense => (<tr key={expense.id}><td>#{expense.id}</td><td>{expense.description}</td><td>{expense.amount.toLocaleString()}</td><td>{new Date(expense.created_at).toLocaleDateString()}</td></tr>))}</Table></SectionCard></Col> */}
                   
                </Row>
                </div>

                <div>
                <Row className="g-4 mt-2">
                  {/* <div>food</div> */}
                </Row>
                </div>

              </div>
            </Container>
        </div>
    );
}

