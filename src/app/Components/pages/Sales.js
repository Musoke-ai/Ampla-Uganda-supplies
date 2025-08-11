import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, FormControl } from 'react-bootstrap';
import { BoxArrowUpRight, PeopleFill, CartFill } from 'react-bootstrap-icons';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useSelector } from 'react-redux';
import { selectCustomers } from '../../features/api/customers';
import { selectSales } from '../../features/api/salesSlice';
import { selectStock } from '../../features/stock/stockSlice';
import PermissionWrapper from '../../auth/PermissionWrapper';

import { useSettings } from '../Settings';

const SalesPage = () => {

    const { settings } = useSettings();

    const customers = useSelector(selectCustomers);
    const sales = useSelector(selectSales);
    const inventory = useSelector(selectStock);

    const [loading, setLoading] = useState(false);

    // State for filters and view options
    const [filter, setFilter] = useState('');
    const [viewBy, setViewBy] = useState('product');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Memoized calculations for performance
    const processedData = React.useMemo(() => {
        return sales.map(sale => {
            const customer = customers.find(c => c.custId === sale.custId);
            const product = inventory.find(i => i.itemId === sale.saleItemId);
            return {
                ...sale,
                customerName: customer ? customer?.custName : 'Unknown',
                productName: product ? product?.itemName : 'Unknown',
                price: product ? parseFloat(sale?.salePrice) : 0,
                totalSale: product ? parseFloat(sale.salePrice) * parseInt(sale.saleQuantity, 10) : 0
            };
        });
    }, [sales, customers, inventory]);

    const filteredData = React.useMemo(() => {
        return processedData.filter(item => {
            const itemDate = new Date(item.saleDateCreated);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            
            // Adjust start and end dates to be inclusive
            if(start) start.setHours(0, 0, 0, 0);
            if(end) end.setHours(23, 59, 59, 999);

            const isDateInRange = (!start || itemDate >= start) && (!end || itemDate <= end);
            
            const isTextMatch = item.productName.toLowerCase().includes(filter.toLowerCase()) ||
                                item.customerName.toLowerCase().includes(filter.toLowerCase());

            return isDateInRange && isTextMatch;
        });
    }, [processedData, filter, startDate, endDate]);

    const groupedData = React.useMemo(() => {
        const groups = filteredData.reduce((acc, item) => {
            const key = item['saleDateCreated'];
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(item);
            return acc;
        }, {});
        return Object.entries(groups).sort(([a], [b]) => new Date(b) - new Date(a));
    }, [filteredData]);

    const aggregatedViewData = React.useMemo(() => {
        const aggregation = filteredData.reduce((acc, item) => {
            const key = viewBy === 'product' ? item.productName : item.customerName;
            if (!acc[key]) {
                acc[key] = { totalQuantity: 0, totalRevenue: 0, salesCount: 0 };
            }
            acc[key].totalQuantity += parseInt(item.saleQuantity, 10);
            acc[key].totalRevenue += Number(item.salePrice) || 0 * Number(item.saleQuantity) || 0;
            acc[key].salesCount++;
            // parseInt(item.saleQuantity)*
            return acc;
        }, {});
        return Object.entries(aggregation).map(([name, data]) => ({ name, ...data }));
    }, [filteredData, viewBy]);

    // KPI Calculations
    const totalQuantitySold = React.useMemo(() => filteredData.reduce((sum, item) => sum + parseInt(item.saleQuantity || 0, 10), 0), [filteredData]);
    const totalRevenue = React.useMemo(() => filteredData.reduce((sum, item) => sum + item.totalSale || 0, 0), [filteredData]);
    const totalCustomers = React.useMemo(() => new Set(filteredData.map(s => s.custId)).size, [filteredData]);

    // Product and Customer Insights (calculated on all data, not filtered)
    const productSales = React.useMemo(() => {
        const productAggregation = processedData.reduce((acc, item) => {
            const key = item.productName;
            if (!acc[key]) {
                acc[key] = { name: key, totalQuantity: 0 };
            }
            acc[key].totalQuantity += parseInt(item.quantitySold, 10);
            return acc;
        }, {});
        const salesByProduct = Object.values(productAggregation);
        salesByProduct.sort((a, b) => b.totalQuantity - a.totalQuantity);
        return {
            mostSelling: salesByProduct[0],
            leastSelling: salesByProduct[salesByProduct.length - 1]
        };
    }, [processedData]);

    const customerSales = React.useMemo(() => {
        const customerAggregation = processedData.reduce((acc, item) => {
            const key = item.customerName;
            if (!acc[key]) {
                acc[key] = { name: key, totalRevenue: 0 };
            }
            acc[key].totalRevenue += item.totalSale;
            return acc;
        }, {});
        const salesByCustomer = Object.values(customerAggregation);
        salesByCustomer.sort((a, b) => b.totalRevenue - a.totalRevenue);
        return {
            mostValuable: salesByCustomer[0],
            leastValuable: salesByCustomer[salesByCustomer.length - 1]
        };
    }, [processedData]);

    // Export and Print functions
    const exportToPDF = (data, title) => {
        const doc = new jsPDF();
        doc.text(title, 14, 16);
        const tableColumn = ["Date", "Customer", "Product", "Quantity", "Price", "Total"];
        const tableRows = [];

        data.forEach(item => {
            const rowData = [
                item.saleDateCreated,
                item.customerName,
                item.productName,
                item.quantitySold,
                `$${item.price.toFixed(2)}`,
                `$${item.totalSale.toFixed(2)}`
            ];
            tableRows.push(rowData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });
        doc.save(`${title.replace(/\s/g, '_')}.pdf`);
    };

    const printData = () => {
        window.print();
    };

    if (loading) {
        return <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}><h2>Loading Dashboard...</h2></div>;
    }

    return (
        <Container fluid className={`p-4 ${settings.theme==='dark'?'bg-dark':'bg-light'}`}>
            <h4 className="mb-4 fw-bolder">Sales </h4>

            {/* KPI Cards */}
            <Row className="mb-4" style={{height:"100px"}}>
                <Col md={4}>
                    <Card className={`shadow-sm ${settings.theme==='dark'?'bg-dark':'bg-primary'} text-white`} style={{ height: '120px' }}>
                        <Card.Body className="d-flex justify-content-between align-items-center">
                            <div>
                                <Card.Title>Total Quantity Sold</Card.Title>
                                <Card.Text className="fs-2">{totalQuantitySold}</Card.Text>
                            </div>
                            <CartFill size={50} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className={`shadow-sm ${settings.theme==='dark'?'bg-dark':'bg-success'} text-white`} style={{ height: '120px' }}>
                        <Card.Body className="d-flex justify-content-between align-items-center">
                            <div>
                                <Card.Title>Total Revenue</Card.Title>
                                <Card.Text className="fs-2">{settings?.currency!=='none'?settings?.currency:""}{totalRevenue.toFixed(2)}</Card.Text>
                            </div>
                            <BoxArrowUpRight size={50} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className={`shadow-sm ${settings.theme==='dark'?'bg-dark':'bg-info'} text-white`} style={{ height: '120px' }}>
                        <Card.Body className="d-flex justify-content-between align-items-center">
                           <div>
                                <Card.Title>Total Customers</Card.Title>
                                <Card.Text className="fs-2">{totalCustomers}</Card.Text>
                            </div>
                            <PeopleFill size={50} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Insights */}
            {/* <Row className="mb-4" style={{ height: '150px' }}>
                <Col md={6}>
                    <Card >
                        <Card.Header>Product Insights</Card.Header>
                        <Card.Body>
                           {productSales.mostSelling && <p className="text-success"><strong>Most Selling:</strong> {productSales.mostSelling.name} ({productSales.mostSelling.totalQuantity} units)</p>}
                           {productSales.leastSelling && <p className="text-danger"><strong>Least Selling:</strong> {productSales.leastSelling.name} ({productSales.leastSelling.totalQuantity} units)</p>}
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card style={{ height: '150px' }}>
                        <Card.Header>Customer Insights</Card.Header>
                        <Card.Body>
                            {customerSales.mostValuable && <p className="text-success"><strong>Most Valuable:</strong> {customerSales.mostValuable.name} (${customerSales.mostValuable.totalRevenue.toFixed(2)})</p>}
                            {customerSales.leastValuable && <p className="text-danger"><strong>Least Valuable:</strong> {customerSales.leastValuable.name} (${customerSales.leastValuable.totalRevenue.toFixed(2)})</p>}
                        </Card.Body>
                    </Card>
                </Col>
            </Row> */}

            {/* Controls and Filters */}
            <Card className="p-3 mb-4 mt-5 " style={{height:'100px'}}>
                <Container>
                <Row >
                    <Col md={3} >
                        <Form.Group>
                            <Form.Label>Filter by Product or Customer</Form.Label>
                             <FormControl
                                placeholder="Start typing..."
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                     <Col md={3} >
                        <Form.Group>
                            <Form.Label>View By</Form.Label>
                            <Form.Select value={viewBy} onChange={e => setViewBy(e.target.value)} style={{height:'40px'}}>
                                <option value="product">Product</option>
                                <option value="customer">Customer</option>
                                <option value="daily">Daily Sales</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                 
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label>Start Date</Form.Label>
                            <Form.Control type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label>End Date</Form.Label>
                            <Form.Control type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </Form.Group>
                    </Col>
                     
                </Row>
                </Container>
            </Card>

            {/* Data Display */}
            {viewBy === 'product' || viewBy === 'customer' ? (
                <Card>
                    <Card.Header>
                        <div className='d-flex align-items-center justify-content-between w-100'>
                            <div> {viewBy === 'product' ? 'Product-wise Sales' : 'Customer-wise Sales'}</div>
                            <div className='d-flex gap-2'> 
                        <Button variant="primary" className="btn btn-sm " onClick={() => exportToPDF(filteredData, 'Filtered Sales Data')}>Export All</Button>
                        <Button variant="secondary" className=" btn btn-sm " onClick={printData}>Print View</Button>
                   </div>
                        </div>
                       
                        </Card.Header>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>{viewBy === 'product' ? 'Product Name' : 'Customer Name'}</th>
                                <th>Total Quantity Sold</th>
                                <th>Total Revenue</th>
                                <th>Number of Sales</th>
                            </tr>
                        </thead>
                        <tbody>
                            {aggregatedViewData.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.name}</td>
                                    <td>{item.totalQuantity}</td>
                                    <td>{settings?.currency!=='none'?settings?.currency:""}{item.totalRevenue }</td>
                                    <td>{item.salesCount}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th>Total</th>
                                <th>{aggregatedViewData.reduce((sum, item) => sum + Number(item.totalQuantity) || 0, 0)}</th>
                                <th>{settings?.currency!=='none'?settings?.currency:""}{ aggregatedViewData.reduce((sum, item) => sum + Number(item.totalRevenue) || 0, 0) }</th>
                                <th>{aggregatedViewData.reduce((sum, item) => sum + Number(item.salesCount) || 0, 0)}</th>
                            </tr>
                        </tfoot>
                    </Table>
                </Card>
            ) : (
                groupedData.map(([group, items]) => (
                    <Card key={group} className="mb-4">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <span>{new Date(group).toDateString()}</span>
                            <Button variant="outline-primary" size="sm" onClick={() => exportToPDF(items, `Sales_on_${group}`)}>Export this day</Button>
                        </Card.Header>
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>Sale ID</th>
                                    <th>Customer</th>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(sale => (
                                    <tr key={sale.saleId}>
                                        <td>{sale.saleId}</td>
                                        <td>{sale.customerName}</td>
                                        <td>{sale.productName}</td>
                                        <td>{sale.saleQuantity}</td>
                                        <td>{settings?.currency!=='none'?settings?.currency:""}{sale.salePrice}</td>
                                        <td>{settings?.currency!=='none'?settings?.currency:""}{sale.totalSale}</td>
                                    </tr>
                                ))}
                            </tbody>
                             <tfoot>
                                <tr>
                                    <th colSpan="3">Total</th>
                                    <th>{items.reduce((sum, item) => sum + parseInt(item.saleQuantity, 10) || 0, 0)}</th>
                                    <th>{items.reduce((sum, item) => sum + parseFloat(item.salePrice) || 0, 0)}</th>
                                    <th>{settings?.currency!=='none'?settings?.currency:""}{items.reduce((sum, item) => sum + item.totalSale, 0).toFixed(2)}</th>
                                </tr>
                            </tfoot>
                        </Table>
                    </Card>
                ))
            )}
        </Container>
    );
};

export default SalesPage;













// import React from 'react';
// import {
//     Box, Typography, Grid, Card, CardContent, Table, TableBody, TableCell, TableContainer,
//     TableHead, TableRow, Paper, IconButton, Tooltip, Button, TextField
// } from '@mui/material';
// import { Search, Edit, Delete, Visibility } from '@mui/icons-material';
// import {
//     LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
//     ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
// } from 'recharts';

// import { useSelector } from 'react-redux';
// import { selectCustomers } from '../../features/api/customers';
// import { selectSales } from '../../features/api/salesSlice';
// import { calculateTotal, groupSalesBySRIDWithCustomer } from '../../dataAnalytics/functions';
// // import RecentTransactions from '../tables/RescentTransactions';
// // import CollapsibleTable from '../tables/SalesTable';
// import SalesTable from '../tables/SalesTable';
// import CurrencyFormat from 'react-currency-format';
// import { formatCurrencyWithScale } from '../../dataAnalytics/functions';
// import PermissionWrapper from '../../auth/PermissionWrapper';

// import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
// import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
// import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';


// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// const SalesPage = () => {

// const salesData = useSelector(selectSales);
// const customers = useSelector(selectCustomers);

// const transactionDetails = groupSalesBySRIDWithCustomer(salesData, customers);
// const salesSummary = calculateTotal(salesData);

//     return (
//         <Box sx={{ padding: '10px' }}>
//             {/* Header */}
//             <Grid container justifyContent="space-between" alignItems="center" sx={{ marginBottom: '20px' }}>
//                 <Typography variant="h4">Sales Overview</Typography>
//                 {/* <TextField variant="outlined" placeholder="Search sales..." InputProps={{ endAdornment: <Search /> }} /> */}
//             </Grid>

// {/* Sales Summary */}
// <Grid container spacing={3} justifyContent="center" sx={{ marginBottom: '20px' }}>
//     <Grid item xs={12} sm={3}>
//         <Card sx={{ backgroundColor: '#e3f2fd', display: 'flex', alignItems: 'center' }}>
//             <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//                 <ShoppingCartIcon color="primary" sx={{ fontSize: 40 }} />
//                 <Box>
//                     <Typography variant="h6">Total Sales</Typography>
//                     <Typography variant="h4" color="primary">
//                         {salesSummary?.totalQuantity}
//                     </Typography>
//                 </Box>
//             </CardContent>
//         </Card>
//     </Grid>

//     <Grid item xs={12} sm={3}>
//         <Card sx={{ backgroundColor: '#fff3e0', display: 'flex', alignItems: 'center' }}>
//             <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//                 <ReceiptLongIcon color="secondary" sx={{ fontSize: 40 }} />
//                 <Box>
//                     <Typography variant="h6">Transactions</Typography>
//                     <Typography variant="h4" color="secondary">
//                         {salesData?.length}
//                     </Typography>
//                 </Box>
//             </CardContent>
//         </Card>
//     </Grid>

//     <Grid item xs={12} sm={3}>
//         <Card sx={{ backgroundColor: '#e8f5e9', display: 'flex', alignItems: 'center' }}>
//             <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//                 <AttachMoneyIcon color="success" sx={{ fontSize: 40 }} />
//                 <Box>
//                     <Typography variant="h6">Total Revenue</Typography>
//                     <Typography variant="h4" color="success.main">
//                         {formatCurrencyWithScale(salesSummary?.totalCost).formatted}
//                     </Typography>
//                 </Box>
//             </CardContent>
//         </Card>
//     </Grid>
// </Grid>


//             {/* Sales Trends Chart */}
            

//             {/* Sales Table */}
//            {/* <RecentTransactions data={transactionDetails} limit={transactionDetails.length} /> */}
//         {/* <CollapsibleTable salesData={salesData} /> */}
//         <SalesTable data={transactionDetails} />
//         </Box>
//     );
// };

// export default SalesPage;
