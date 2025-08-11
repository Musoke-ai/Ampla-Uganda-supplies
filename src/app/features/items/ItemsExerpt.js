import { useSelector } from "react-redux";
import {
    useGetStokQuery,
    selectStok,
} from "../api/stockSlice";
// Assuming 'selectAllItems' is exported from your stock slice, which is standard
// when using createEntityAdapter. Add this selector to your slice if it doesn't exist.
import { selectStockById, selectStock } from '../stock/stockSlice';
import React, { useState } from 'react';
import StockEntry from "../../Components/StockEntry";
import Box from '@mui/material/Box';
import { LinearProgress, Tab } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import format from "date-fns/format";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { Print, FileDownload, ContactlessOutlined } from "@mui/icons-material";
import { Card, Button, Row, Col, Form } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import PermissionWrapper from "../../auth/PermissionWrapper";
import { useSettings } from "../../Components/Settings";

const ItemsExcerpt = () => {

    const { settings } = useSettings();

    const {
        isLoading: isStockQueryLoading,
    } = useGetStokQuery();

    const [value, setValue] = useState('1');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const stock = useSelector(selectStok);
    // 1. Get all items from the store once and create a lookup map for efficiency.
    const items = useSelector(selectStock);
    console.log("Stock: ", items[0]);
    const itemsMap = new Map(items.map(item => [Number(item.itemId), item.itemName]));
    console.log("Items: ", itemsMap.get(108));

    const isDataAvailable = stock.length > 0;

    const stockDates = [...new Set(stock.map(item => item?.stockCreated?.split(" ")[0]))];

    const filteredStockDates = stockDates.filter(date => {
        if (!date) return false;
        if (startDate && new Date(date) < new Date(startDate)) return false;
        if (endDate && new Date(date) > new Date(endDate)) return false;
        return true;
    });

    const handlePrintOrExport = (action, stockDate = null) => {
        const doc = new jsPDF();
        const tableData = [];
        const tableHeaders = ["#", "Item", "Old Stock", "New Stock"];

        const dataToProcess = stockDate
            ? stock.filter(item => item?.stockCreated?.split(" ")[0] === stockDate)
            : stock;

        dataToProcess.forEach((stockItem, index) => {
            // 2. Use the map to find the item name. This fixes the error.
            const itemName = itemsMap.get(Number(stockItem?.stockItem)) || 'N/A';
            tableData.push([
                index + 1,
                itemName,
                stockItem?.oldStock,
                stockItem?.stockItemQuantity
            ]);
        });

        const title = stockDate
            ? `Stock Data for ${format(new Date(stockDate), 'EEE-dd-yyyy')}`
            : "Complete Stock Report";
        doc.text(title, 14, 15);

        autoTable(doc, {
            head: [tableHeaders],
            body: tableData,
            startY: 20,
        });

        if (action === 'print') {
            doc.autoPrint();
            window.open(doc.output('bloburl'), '_blank');
        } else {
            const fileName = stockDate ? `stock-${stockDate}.pdf` : 'full-stock-report.pdf';
            doc.save(fileName);
        }
    };

    // 3. Simplified component, receives itemName as a prop. No more hooks here.
    const StockExcerpt = ({ stockItem, index, itemName }) => {
        return (
            <tr>
                <td>{index}</td>
                <td>{itemName}</td>
                <td>{stockItem?.oldStock}</td>
                <td>{stockItem?.stockItemQuantity}</td>
            </tr>
        );
    };

    const StockItems = ({ stockDate }) => {
        return stock
            .filter(item => item?.stockCreated?.split(" ")[0] === stockDate)
            .map((item, index) => {
                // 4. Find the item name here and pass it down.
                const itemName = itemsMap.get(Number(item?.stockItem)) || 'N/A';
                return <StockExcerpt key={item.id} stockItem={item} index={index + 1} itemName={itemName} />
            });
    };

    const Total = ({ stockDate }) => {
        const itemsToSum = stock.filter(item => item?.stockCreated?.split(" ")[0] === stockDate);
        return itemsToSum.reduce((prev, curr) => prev + Number(curr.stockItemQuantity), 0);
    };

    const handleValueChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <div className="container-fluid mt-4">
            <TabContext value={value}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <TabList aria-label="stock Tabs" onChange={handleValueChange}>
                        <Tab label="Production Summary" value='1' className={`${settings.theme==='dark'?'text-white':'text-dark'}`} />               
<Tab label="New Production Stock" value='2' className={`${settings.theme==='dark'?'text-white':'text-dark'}`} />                    
                    </TabList>
                </Box>
                <TabPanel value="1">
                    {isStockQueryLoading && <LinearProgress />}
                    <div className="p-2">
                        {isDataAvailable ? (
                            <>
                                <Card className="mb-2 shadow-sm" style={{height:'130px'}}>
                                    <Card.Body>
                                        <Card.Title>Filter and Export</Card.Title>
                                        <Row className="align-items-end">
                                            <Col md={4}>
                                                <Form.Group>
                                                    <Form.Label>Start Date</Form.Label>
                                                    <Form.Control type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group>
                                                    <Form.Label>End Date</Form.Label>
                                                    <Form.Control type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                                                </Form.Group>
                                            </Col>
                                            <Col md={4} className="d-flex justify-content-start justify-content-md-end mt-3 mt-md-0">
                                                <Button variant="secondary" className="me-2" onClick={() => handlePrintOrExport('print')}>
                                                    <Print fontSize="small" className="me-1" /> Print Filtered
                                                </Button>
                                                <Button variant="primary" onClick={() => handlePrintOrExport('export')}>
                                                    <FileDownload fontSize="small" className="me-1" /> Export Filtered
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                <Row>
                                    {filteredStockDates.length > 0 ? filteredStockDates.map((date) => (
                                        <Col key={date} md={12} className="mb-4">
                                            <Card className="shadow-sm">
                                                <Card.Header className={`d-flex justify-content-between align-items-center ${settings.theme === 'dark'?'bg-dark':'bg-light'}`} >
                                                    <strong className="fw-bold fs-6">Production Date: {format(new Date(date), 'EEE, dd-MMM-yyyy')}</strong>
                                                    <div>
                                                        <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => handlePrintOrExport('print', date)}>
                                                            <Print fontSize="small" />
                                                        </Button>
                                                        <Button variant="outline-primary" size="sm" onClick={() => handlePrintOrExport('export', date)}>
                                                            <FileDownload fontSize="small" />
                                                        </Button>
                                                    </div>
                                                </Card.Header>
                                                <Card.Body>
                                                    <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                        <table className="table table-striped table-hover">
                                                            <thead className={`${settings.theme === 'dark'?'table-dark': 'table-light'}`} >
                                                                <tr >
                                                                    <th >#</th>
                                                                    <th >Item</th>
                                                                    <th >Old Stock</th>
                                                                    <th >New Stock</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <StockItems stockDate={date} />
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </Card.Body>
                                                <Card.Footer>
                                                    <h6 className="mb-0"><strong>Total New Quantity:</strong> {<Total stockDate={date} />}</h6>
                                                </Card.Footer>
                                            </Card>
                                        </Col>
                                    )) : <div className="text-center bg-white rounded p-4 shadow-sm">No stock data available for the selected date range.</div>}
                                </Row>
                            </>
                        ) : (
                            <div className="d-flex justify-content-center align-items-center text-center bg-white rounded p-4 shadow-sm">
                                No Stock Data Available
                            </div>
                        )}
                    </div>
                </TabPanel>
                <PermissionWrapper
                required={['stockcreate']}
                children={
   <TabPanel value="2">
                    <StockEntry />
                </TabPanel>
                }
                />
             
            </TabContext>
        </div>
    );
};

export default ItemsExcerpt;

