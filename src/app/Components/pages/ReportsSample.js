import React, { useState, useMemo } from 'react';
import { Container, Row, Col, Tabs, Tab, Form, Button, Dropdown, Table, Navbar } from 'react-bootstrap';
import {
    Boxes, GearFill, PeopleFill, Download, PrinterFill, FileEarmarkPdfFill, FileEarmarkSpreadsheetFill,
    CashCoin, PersonVcardFill, BuildingFill, SortUp, SortDown, XCircleFill, FunnelFill
} from 'react-bootstrap-icons';

import { useSelector } from 'react-redux';
import { selectStock } from '../../features/stock/stockSlice';
import { selectSales } from '../../features/api/salesSlice';
import { selectCustomers } from '../../features/api/customers';
import { selectOrders } from '../../features/api/orderSlice';
import { selectDebt } from '../../features/api/debtSlice';
import { selectEmployees } from '../../features/api/employeesSlice';
import { selectRawMaterials } from '../../features/api/rawmaterialsSlice';
import { selectExpenses } from '../../features/api/ExpensesSlice';

import { useSettings } from '../Settings';


// In a real project, you would install these via npm/yarn
// For this example, we assume jsPDF is available on the window object
// import jsPDF from 'jspdf';
// import 'jspdf-autotable';

// --- COMBINED DATABASE DATA ---
const fullDbData = {
    employees: [
        { empID: 8, empName: 'John Kawesa', empEmail: 'hmusoke9@gmail.com', empLocation: 'Bweyogerere', empContact: '0703299738', empRole: 'Manager', empSalary: 25000, empStatus: 1, startDate: '2025-03-22' },
        { empID: 9, empName: 'Wassubende James', empEmail: 'james123@gmail.com', empLocation: 'Mbale', empContact: '0774566592', empRole: 'Machine Operator', empSalary: 30000, empStatus: 1, startDate: '2025-03-26' }
    ],
    inventory: [
        { itemID: 108, itemName: 'Cake Board', itemCategoryID: 0, itemModel: 'CB-18', itemQuality: 'New', itemQuantity: 135, itemCondition: 'Good', itemSize: '18inches', itemStockPrice: 17000, itemLeastPrice: 15000, itemNotes: 'For Bakery', itemOwner: 18, itemDateCreated: '2025-04-27' },
        { itemID: 109, itemName: 'Board 2"', itemCategoryID: 0, itemModel: 'B2"', itemQuality: 'New', itemQuantity: 9, itemCondition: 'Good', itemSize: '2"', itemStockPrice: 60000, itemLeastPrice: 4000, itemNotes: 'For Bakery', itemOwner: 86, itemDateCreated: '2025-05-30' }
    ],
    rawMaterials: [
        { materialId: 2, name: 'Board', size: '4ftx8ft', quantity: 3, unitPrice: 55000, supplier: 'Ham Enterprise', note: 'As main material', dateCreated: '2025-03-16' },
        { materialId: 8, name: 'Glue', size: '3Ltrs', quantity: 13, unitPrice: 200000, supplier: 'KL enterprise', note: 'For Binding', dateCreated: '2025-05-11' },
        { materialId: 9, name: 'Glue', size: '2ltrs', quantity: 12, unitPrice: 30000, supplier: 'KK Enterprise', note: 'For binding', dateCreated: '2025-05-30' }
    ],
    sales: [
        { saleID: 33, saleItemID: 34, saleOwner: 6, custID: 2, SR_ID: 2, salePrice: 280000, saleQuantity: 2, saleDateCreated: '2023-11-26' },
        { saleID: 34, saleItemID: 34, saleOwner: 6, custID: 2, SR_ID: 2, salePrice: 280000, saleQuantity: 1, saleDateCreated: '2023-11-26' },
        { saleID: 35, saleItemID: 35, saleOwner: 6, custID: 2, SR_ID: 2, salePrice: 200000, saleQuantity: 1, saleDateCreated: '2023-11-26' },
        { saleID: 36, saleItemID: 35, saleOwner: 6, custID: 2, SR_ID: 2, salePrice: 200000, saleQuantity: 1, saleDateCreated: '2023-11-26' },
        { saleID: 38, saleItemID: 33, saleOwner: 6, custID: 2, SR_ID: 2, salePrice: 200000, saleQuantity: 3, saleDateCreated: '2023-11-26' },
        { saleID: 39, saleItemID: 31, saleOwner: 6, custID: 2, SR_ID: 2, salePrice: 280000, saleQuantity: 2, saleDateCreated: '2023-11-26' },
        { saleID: 40, saleItemID: 43, saleOwner: 6, custID: 2, SR_ID: 2, salePrice: 330000, saleQuantity: 4, saleDateCreated: '2023-11-30' },
        { saleID: 41, saleItemID: 43, saleOwner: 6, custID: 2, SR_ID: 2, salePrice: 330000, saleQuantity: 3, saleDateCreated: '2023-11-30' },
        { saleID: 42, saleItemID: 46, saleOwner: 6, custID: 2, SR_ID: 2, salePrice: 5000, saleQuantity: 5, saleDateCreated: '2023-11-30' },
        { saleID: 429, saleItemID: 82, saleOwner: 19, custID: 2, SR_ID: 2, salePrice: 280000, saleQuantity: 1, saleDateCreated: '2024-07-12' }
    ],
    customers: [
        { custID: 2, custName: 'Customer A'}, { custID: 3, custName: 'Customer B'}, { custID: 9, custName: 'Customer C'},
        { custID: 10, custName: 'Customer D'}, { custID: 14, custName: 'Customer E'}, { custID: 18, custName: 'Customer F'},
        { custID: 19, custName: 'Customer G'}, { custID: 20, custName: 'Customer H'}, { custID: 22, custName: 'Customer I'},
        { custID: 24, custName: 'Customer J'}, { custID: 26, custName: 'Customer K'},
    ],
    debtsTrack: [
        { trackID: 11, debtID: 20, indebtOwner: 18, amountPaid: 5000, datepaid: '2024-11-29' },
        { trackID: 12, debtID: 21, indebtOwner: 18, amountPaid: 30000, datepaid: '2024-11-29' },
        { trackID: 29, debtID: 26, indebtOwner: 86, amountPaid: 5000, datepaid: '2025-06-01' }
    ],
     indebt: [
        { indebtID: 20, indebtItemID: 62, indebtOwner: 18, custID: 20, totalAmount: 55000, dateCreated: '2024-11-29' },
        { indebtID: 21, indebtItemID: 81, indebtOwner: 18, custID: 10, totalAmount: 200000, dateCreated: '2024-11-29' },
        { indebtID: 26, indebtItemID: 108, indebtOwner: 86, custID: 28, totalAmount: 51000, dateCreated: '2025-05-29' }
    ],
    productionOrders: [ { id: 'PO201', productId: 108, standardUnits: 100, actualUnits: 98, scrap: 2, standardHours: 10, actualHours: 10.5, employeeId: 8, date: '2025-07-10' }, { id: 'PO202', productId: 109, standardUnits: 50, actualUnits: 50, scrap: 0, standardHours: 8, actualHours: 7.8, employeeId: 9, date: '2025-07-11' } ],
    materialUsage: [ { orderId: 'PO201', materialId: 2, standardQty: 50, actualQty: 52 }, { orderId: 'PO201', materialId: 8, standardQty: 10, actualQty: 10 }, { orderId: 'PO202', materialId: 2, standardQty: 30, actualQty: 29.5 } ],
    expenses: [ { id: 'OH01', description: 'Warehouse Rent', category: 'Facilities', amount: 5000, date: '2025-07-01' }, { id: 'OH02', description: 'Utilities', category: 'Facilities', amount: 1500, date: '2025-07-01' }, { id: 'OH03', description: 'Google Ads', category: 'Marketing', amount: 2000, date: '2025-07-05' } ],
    cashTransactions: [ { description: 'Loan Received', amount: 10000, type: 'financing', date: '2025-07-02'}, { description: 'Paid Supplier Ham Enterprise', amount: -4000, type: 'operating', date: '2025-07-03'} ],
    employeePayments: [ { paymentId: 'PAY01', employeeId: 8, date: '2025-07-15', hoursWorked: 40, rate: 25000/160, totalPay: 6250 }, { paymentId: 'PAY02', employeeId: 9, date: '2025-07-15', hoursWorked: 42, rate: 30000/160, totalPay: 7875 } ],
    standardLaborRate: 40
};

// --- MAIN APP COMPONENT ---
function ReportPage() {

    const { settings } = useSettings();

    const currency = settings.currency!=='none'?settings.currency:"";

    const inventory = useSelector(selectStock);
    const sales = useSelector(selectSales);
    const customers = useSelector(selectCustomers);
    const employees = useSelector(selectEmployees);
    const indebt = useSelector(selectDebt);
    const rawMaterials = useSelector(selectRawMaterials);
    const expenses = useSelector(selectExpenses);

    const [activeTab, setActiveTab] = useState('inventory');
    const [activeReportId, setActiveReportId] = useState('inventory-on-hand');
    const [filters, setFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });


// --- REPORT GENERATOR FUNCTIONS ---
function generateInventoryOnHand(filters) { const { category = 'all', status = 'all' } = filters; const lowStockThreshold = 50; let data = inventory; if (category !== 'all' && category) data = data.filter(p => p?.itemCategoryID === parseInt(category)); if (status !== 'all' && status) { data = data.filter(p => { if (status === 'in_stock') return p?.itemQuantity > lowStockThreshold; if (status === 'low_stock') return p.itemQuantity > 0 && p.itemQuantity <= lowStockThreshold; if (status === 'out_of_stock') return p.itemQuantity === 0; return false; }); } return { headers: ['Product ID', 'Name', 'Category ID', 'Stock Level', 'Unit Cost'], rows: data.map(p => [p.itemID, p.itemName, p.itemCategoryID, p.itemQuantity, `${currency}${p.itemLeastPrice}`]) }; }
function generateInventoryValuation(filters) { const { category = 'all' } = filters; let data = inventory; if (category !== 'all' && category) data = data.filter(p => p.itemCategoryID === parseInt(category)); const rows = data.map(p => { const value = p.itemQuantity * p.itemLeastPrice; return [p.itemID, p.itemName, p.itemCategoryID, p.itemQuantity, `${currency}${p.itemLeastPrice}`, `${currency}${value.toFixed(2)}`]; }); return { headers: ['Product ID', 'Name', 'Category ID', 'On Hand', 'Cost per Unit', 'Total Value'], rows }; }
function generateInventoryAging(filters) { const today = new Date(); const data = inventory.map(p => { const purchaseDate = new Date(p.itemDateCreated); const age = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24)); return { ...p, age }; }).sort((a, b) => b.age - a.age); return { headers: ['Product ID', 'Name', 'Stock', 'Purchase Date', 'Age (Days)'], rows: data.map(p => [p.itemID, p.itemName, p.itemQuantity, p.itemDateCreated, p.age]) }; }
function generateLowStock(filters) { const { category = 'all' } = filters; const lowStockThreshold = 50; let data = inventory.filter(p => p.itemQuantity > 0 && p.itemQuantity <= lowStockThreshold); if (category !== 'all' && category) data = data.filter(p => p.itemCategoryID === parseInt(category)); return { headers: ['Product ID', 'Name', 'Category ID', 'Stock Level'], rows: data.map(p => [p.itemID, p.itemName, p.itemCategoryID, p.itemQuantity]) }; }
function generateProductionYield(filters) { const { employeeId = 'all', startDate, endDate } = filters; let data = fullDbData.productionOrders; if (employeeId !== 'all' && employeeId) data = data.filter(po => po.employeeId === parseInt(employeeId)); if (startDate) data = data.filter(po => new Date(po.date) >= new Date(startDate)); if (endDate) data = data.filter(po => new Date(po.date) <= new Date(endDate)); return { headers: ['Order ID', 'Product', 'Employee', 'Standard Units', 'Actual Units', 'Scrap', 'Yield %'], rows: data.map(po => { const product = fullDbData.inventory.find(p => p.itemID === po.productId); const employee = fullDbData.employees.find(e => e.empID === po.employeeId); const yieldPercent = po.standardUnits > 0 ? ((po.actualUnits / po.standardUnits) * 100).toFixed(2) : 0; return [po.id, product?.itemName || 'N/A', employee?.empName || 'N/A', po.standardUnits, po.actualUnits, po.scrap, `${yieldPercent}%`]; }) }; }
function generateProductionStatus(filters) { const { orderId = 'all', startDate, endDate } = filters; let data = fullDbData.productionOrders; if (orderId !== 'all' && orderId) data = data.filter(po => po.id === orderId); if (startDate) data = data.filter(po => new Date(po.date) >= new Date(startDate)); if (endDate) data = data.filter(po => new Date(po.date) <= new Date(endDate)); return { headers: ['Order ID', 'Product Name', 'Date', 'Status'], rows: data.map(po => { const product = fullDbData.inventory.find(p => p.itemID === po.productId); const status = po.actualUnits >= po.standardUnits ? 'Completed' : 'In Progress'; return [po.id, product?.itemName || 'N/A', po.date, status]; }) }; }
function generateLaborEfficiency(filters) { const { employeeId = 'all', startDate, endDate } = filters; let data = fullDbData.productionOrders; if (employeeId !== 'all' && employeeId) data = data.filter(po => po.employeeId === parseInt(employeeId)); if (startDate) data = data.filter(po => new Date(po.date) >= new Date(startDate)); if (endDate) data = data.filter(po => new Date(po.date) <= new Date(endDate)); return { headers: ['Employee', 'Order ID', 'Product', 'Standard Hours', 'Actual Hours', 'Efficiency %'], rows: data.map(po => { const employee = fullDbData.employees.find(e => e.empID === po.employeeId); const product = fullDbData.inventory.find(p => p.itemID === po.productId); const efficiency = po.actualHours > 0 ? ((po.standardHours / po.actualHours) * 100).toFixed(2) : 0; return [employee?.empName || 'N/A', po.id, product?.itemName || 'N/A', po.standardHours, po.actualHours, `${efficiency}%`]; }) }; }
function generateTeamPerformance(filters) { const { startDate, endDate } = filters; let data = fullDbData.productionOrders; if (startDate) data = data.filter(po => new Date(po.date) >= new Date(startDate)); if (endDate) data = data.filter(po => new Date(po.date) <= new Date(endDate)); const teamData = data.reduce((acc, po) => { const employee = fullDbData.employees.find(e => e.empID === po.employeeId); const team = employee?.team || 'N/A'; if (!acc[team]) acc[team] = { totalScrap: 0, totalOrders: 0 }; acc[team].totalScrap += po.scrap; acc[team].totalOrders++; return acc; }, {}); return { headers: ['Team', 'Total Orders', 'Total Scrap', 'Avg Scrap per Order'], rows: Object.entries(teamData).map(([team, d]) => { const avgScrap = d.totalOrders > 0 ? (d.totalScrap / d.totalOrders).toFixed(2) : 0; return [`Team ${team}`, d.totalOrders, d.totalScrap, avgScrap]; }) }; }
function generateMaterialOnHand(filters) { const { supplier = 'all', status = 'all' } = filters; const lowStockThreshold = 10; let data = rawMaterials; if (supplier !== 'all' && supplier) data = data.filter(m => m.supplier === supplier); if (status !== 'all' && status) { data = data.filter(m => { if (status === 'in_stock') return m.quantity > lowStockThreshold; if (status === 'low_stock') return m.quantity > 0 && m.quantity <= lowStockThreshold; if (status === 'out_of_stock') return m.quantity === 0; return false; }); } return { headers: ['Material ID', 'Name', 'Supplier', 'Stock Level', 'Unit'], rows: data.map(m => [m.materialId, m.name, m.supplier, m.quantity, m.size]) }; }
function generateMaterialExpiry(filters) { const today = new Date(); const upcomingExpiryDays = 90; const data = rawMaterials.filter(m => m.expiry && (new Date(m.expiry) - today) / (1000 * 60 * 60 * 24) <= upcomingExpiryDays).sort((a,b) => new Date(a.expiry) - new Date(b.expiry)); return { headers: ['Material ID', 'Name', 'Supplier', 'Expiry Date', 'Days to Expiry'], rows: data.map(m => { const expiryDate = new Date(m.expiry); const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24)); return [m.materialId, m.name, m.supplier, m.expiry, diffDays]; }) }; }
function generateMaterialUsageVariance(filters) { const { orderId = 'all', materialId = 'all' } = filters; let data = fullDbData.materialUsage; if (orderId !== 'all' && orderId) data = data.filter(mu => mu.orderId === orderId); if (materialId !== 'all' && materialId) data = data.filter(mu => mu.materialId === parseInt(materialId)); return { headers: ['Order ID', 'Material', 'Standard Qty', 'Actual Qty', 'Variance', 'Variance %'], rows: data.map(mu => { const material = fullDbData.rawMaterials.find(m => m.materialId === mu.materialId); const variance = mu.actualQty - mu.standardQty; const variancePercent = mu.standardQty > 0 ? ((variance / mu.standardQty) * 100).toFixed(2) : 0; return [mu.orderId, material?.name || 'N/A', mu.standardQty, mu.actualQty, variance.toFixed(2), `${variancePercent}%`]; }) }; }
function generateSalesByCustomer(filters) { const { customerId = 'all', startDate, endDate } = filters; let data = sales; if (customerId !== 'all' && customerId) data = data.filter(so => so.custID === parseInt(customerId)); if (startDate) data = data.filter(so => new Date(so.saleDateCreated) >= new Date(startDate)); if (endDate) data = data.filter(so => new Date(so.saleDateCreated) <= new Date(endDate)); const salesData = data.reduce((acc, so) => { const customer = customers.find(c => c.custID === so.custID); const customerName = customer ? customer.custName : `Customer #${so.custID}`; const totalValue = so.saleQuantity * so.salePrice; if (!acc[customerName]) acc[customerName] = { name: customerName, totalSales: 0, totalOrders: 0 }; acc[customerName].totalSales += totalValue; acc[customerName].totalOrders++; return acc; }, {}); return { headers: ['Customer', 'Total Orders', 'Total Sales Value'], rows: Object.values(salesData).map(d => [d.name, d.totalOrders, `${currency}${d.totalSales}`]).sort((a, b) => parseFloat(b[2].substring(1)) - parseFloat(a[2].substring(1))) }; }
function generateCustomerOrderHistory(filters) { const { customerId = 'all' } = filters; if (customerId === 'all' || !customerId) { return { headers: ['Order ID', 'Customer', 'Product', 'Quantity', 'Date', 'Value'], rows: [] }; } let data = fullDbData.sales.filter(so => so.custID === parseInt(customerId)); return { headers: ['Order ID', 'Product', 'Quantity', 'Date', 'Value'], rows: data.map(so => { const product = fullDbData.inventory.find(p => p.itemID === so.saleItemID); const value = (so.saleQuantity * so.salePrice).toFixed(2); return [so.saleID, product ? product.itemName : `Item #${so.saleItemID}`, so.saleQuantity, so.saleDateCreated, `${currency}${value}`]; }) } }
function generatePayrollHistory(filters) { const { employeeId = 'all', startDate, endDate } = filters; let data = fullDbData.employeePayments; if (employeeId !== 'all' && employeeId) data = data.filter(p => p.employeeId === parseInt(employeeId)); if (startDate) data = data.filter(p => new Date(p.date) >= new Date(startDate)); if (endDate) data = data.filter(p => new Date(p.date) <= new Date(endDate)); const rows = data.map(p => { const employee = fullDbData.employees.find(e => e.empID === p.employeeId); return [p.paymentId, employee.empName, p.date, p.hoursWorked, `${currency}${p.rate.toFixed(2)}`, `${currency}${p.totalPay.toFixed(2)}`]; }); return { headers: ['Payment ID', 'Employee', 'Date', 'Hours Worked', 'Rate', 'Total Pay'], rows }; }
function generateProfitAndLoss(filters) { const { startDate, endDate } = filters; let _sales = sales; let overheads = expenses; if (startDate) { _sales = _sales.filter(so => new Date(so.saleDateCreated) >= new Date(startDate)); overheads = overheads.filter(oh => new Date(oh.date) >= new Date(startDate)); } if (endDate) { _sales = _sales.filter(so => new Date(so.saleDateCreated) <= new Date(endDate)); overheads = overheads.filter(oh => new Date(oh.date) <= new Date(endDate)); } const totalRevenue = _sales.reduce((sum, so) => sum + (so.saleQuantity * so.salePrice), 0); const totalCogs = _sales.reduce((sum, so) => { const product = inventory.find(p => p.itemID === so.saleItemID); return sum + (so.saleQuantity * (product ? product.itemLeastPrice : 0)); }, 0); const totalOverhead = overheads.reduce((sum, oh) => sum + oh.amount, 0); const grossProfit = totalRevenue - totalCogs; const netProfit = grossProfit - totalOverhead; return { headers: ['Metric', 'Amount'], rows: [ ['Total Revenue', `${currency}${totalRevenue}`], ['Cost of Goods Sold (COGS)', `(${currency}${totalCogs})`], ['Gross Profit', `${currency}${grossProfit}`], ['Overhead Expenses', `(${currency}${totalOverhead})`], ['Net Profit', `${currency}${netProfit}`] ] }; }
function generateCogsAnalysis(filters) { const { orderId = 'all', startDate, endDate } = filters; let orders = fullDbData.productionOrders; if (orderId !== 'all' && orderId) orders = orders.filter(po => po.id === orderId); if (startDate) orders = orders.filter(po => new Date(po.date) >= new Date(startDate)); if (endDate) orders = orders.filter(po => new Date(po.date) <= new Date(endDate)); const rows = orders.map(po => { const materialCost = fullDbData.materialUsage.filter(mu => mu.orderId === po.id).reduce((sum, mu) => { const material = fullDbData.rawMaterials.find(rm => rm.materialId === mu.materialId); return sum + (mu.actualQty * (material ? material.unitPrice : 0)); }, 0); const laborCost = po.actualHours * fullDbData.standardLaborRate; const totalCogs = materialCost + laborCost; return [po.id, `${currency}${materialCost.toFixed(2)}`, `${currency}${laborCost.toFixed(2)}`, `${currency}${totalCogs.toFixed(2)}`]; }); return { headers: ['Production Order', 'Material Cost', 'Labor Cost', 'Total COGS'], rows }; }
function generateSalesMarginAnalysis(filters) { const { customerId = 'all', productId = 'all', startDate, endDate } = filters; let sales = fullDbData.sales; if (customerId !== 'all' && customerId) sales = sales.filter(so => so.custID === parseInt(customerId)); if (productId !== 'all' && productId) sales = sales.filter(so => so.saleItemID === parseInt(productId)); if (startDate) sales = sales.filter(so => new Date(so.saleDateCreated) >= new Date(startDate)); if (endDate) sales = sales.filter(so => new Date(so.saleDateCreated) <= new Date(endDate)); const rows = sales.map(so => { const product = fullDbData.inventory.find(p => p.itemID === so.saleItemID); if (!product) return null; const revenue = so.saleQuantity * so.salePrice; const cogs = so.saleQuantity * product.itemLeastPrice; const profit = revenue - cogs; const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0; return [so.saleID, product.itemName, `${currency}${revenue.toFixed(2)}`, `$${cogs.toFixed(2)}`, `${currency}${profit.toFixed(2)}`, `${margin}%`]; }).filter(Boolean); return { headers: ['Sales Order ID', 'Product', 'Revenue', 'COGS', 'Gross Profit', 'Margin %'], rows }; }
function generateArAging(filters) { const { customerId = 'all' } = filters; let debts = indebt; if (customerId !== 'all' && customerId) debts = debts.filter(d => d.custID === parseInt(customerId)); const today = new Date(); const rows = debts.map(debt => { const customer = fullDbData.customers.find(c => c.custID === debt.custID); const customerName = customer ? customer.custName : `Customer #${debt.custID}`; const payments = fullDbData.debtsTrack.filter(p => p.debtID === debt.indebtID); const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0); const balance = debt.totalAmount - totalPaid; if (balance <= 0) return null; const orderDate = new Date(debt.dateCreated); const age = Math.floor((today - orderDate) / (1000 * 60 * 60 * 24)); let bucket = age <= 30 ? '0-30 Days' : age <= 60 ? '31-60 Days' : age <= 90 ? '61-90 Days' : '90+ Days'; return [debt.indebtID, customerName, debt.dateCreated, `$${debt.totalAmount}`, `$${balance}`, bucket]; }).filter(row => row !== null); return { headers: ['Debt ID', 'Customer', 'Date', 'Total Amount', 'Outstanding', 'Aging Bucket'], rows }; }
function generateDuesReport(filters) { const { customerId = 'all', startDate, endDate } = filters; let debts = indebt; if (customerId !== 'all' && customerId) debts = debts.filter(d => d.custID === parseInt(customerId)); if (startDate) debts = debts.filter(d => new Date(d.dateCreated) >= new Date(startDate)); if (endDate) debts = debts.filter(d => new Date(d.dateCreated) <= new Date(endDate)); const rows = debts.map(debt => { const customer = fullDbData.customers.find(c => c.custID === debt.custID); const customerName = customer ? customer.custName : `Customer #${debt.custID}`; const item = fullDbData.inventory.find(i => i.itemID === debt.indebtItemID); const itemName = item ? item.itemName : `Item #${debt.indebtItemID}`; const payments = fullDbData.debtsTrack.filter(p => p.debtID === debt.indebtID); const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0); const balance = debt.totalAmount - totalPaid; return [debt.indebtID, customerName, itemName, `${currency}${debt.totalAmount.toFixed(2)}`, `${currency}${totalPaid.toFixed(2)}`, `${currency}${balance.toFixed(2)}`, debt.dateCreated]; }); return { headers: ['Debt ID', 'Customer', 'Item', 'Total Amount', 'Amount Paid', 'Balance Due', 'Date'], rows }; }
function generateCashFlow(filters) { const { startDate, endDate } = filters; let cashIn = 0; let cashOut = 0; let rows = []; let payments = fullDbData.debtsTrack; let expenses = fullDbData.expenses; let transactions = fullDbData.cashTransactions; if (startDate) { payments = payments.filter(d => new Date(d.datepaid) >= new Date(startDate)); expenses = expenses.filter(d => new Date(d.date) >= new Date(startDate)); transactions = transactions.filter(d => new Date(d.date) >= new Date(startDate)); } if (endDate) { payments = payments.filter(d => new Date(d.datepaid) <= new Date(endDate)); expenses = expenses.filter(d => new Date(d.date) <= new Date(endDate)); transactions = transactions.filter(d => new Date(d.date) <= new Date(endDate)); } rows.push(['<strong>Cash from Operations</strong>', '']); payments.forEach(p => { rows.push([`Payment for Debt #${p.debtID}`, `${currency}${p.amountPaid.toFixed(2)}`]); cashIn += p.amountPaid; }); expenses.forEach(oh => { rows.push([`Paid: ${oh.description}`, `(${currency}${oh.amount.toFixed(2)})`]); cashOut += oh.amount; }); transactions.filter(t => t.type === 'operating').forEach(t => { if (t.amount > 0) { rows.push([t.description, `${currency}${t.amount.toFixed(2)}`]); cashIn += t.amount; } else { rows.push([t.description, `(${currency}${Math.abs(t.amount).toFixed(2)})`]); cashOut += Math.abs(t.amount); } }); rows.push(['<strong>Cash from Financing</strong>', '']); transactions.filter(t => t.type === 'financing').forEach(t => { if (t.amount > 0) { rows.push([t.description, `${currency}${t.amount.toFixed(2)}`]); cashIn += t.amount; } }); const netCashFlow = cashIn - cashOut; rows.push(['', '']); rows.push(['<strong>Total Cash In</strong>', `<strong>${currency}${cashIn.toFixed(2)}</strong>`]); rows.push(['<strong>Total Cash Out</strong>', `<strong>($${cashOut.toFixed(2)})</strong>`]); rows.push(['<strong>Net Cash Flow</strong>', `<strong>${currency}${netCashFlow.toFixed(2)}</strong>`]); return { headers: ['Transaction', 'Amount'], rows }; }
function generateExpenseBreakdown(filters) { const { expenseCategory = 'all', startDate, endDate } = filters; let data = expenses; if (expenseCategory !== 'all' && expenseCategory) data = data.filter(e => e.category === expenseCategory); if (startDate) data = data.filter(e => new Date(e.date) >= new Date(startDate)); if (endDate) data = data.filter(e => new Date(e.date) <= new Date(endDate)); const rows = data.map(e => [e.date, e.description, e.category, `${currency}${e.amount}`]); return { headers: ['Date', 'Description', 'Category', 'Amount'], rows }; }

// --- REPORT DEFINITIONS with MOCK data for missing tables ---
const reports = {
    inventory: [ { id: 'inventory-on-hand', name: 'Inventory On Hand', generator: generateInventoryOnHand, filters: ['category', 'status'] }, { id: 'inventory-valuation', name: 'Inventory Valuation', generator: generateInventoryValuation, filters: ['category'] }, { id: 'inventory-aging', name: 'Inventory Aging', generator: generateInventoryAging, filters: [] }, { id: 'low-stock', name: 'Low Stock', generator: generateLowStock, filters: ['category'] } ],
    production: [ { id: 'production-yield', name: 'Production Yield', generator: generateProductionYield, filters: ['dateRange', 'employee'] }, { id: 'production-status', name: 'Order Status', generator: generateProductionStatus, filters: ['dateRange', 'productionOrder'] } ],
    employees: [ { id: 'labor-efficiency', name: 'Labor Efficiency', generator: generateLaborEfficiency, filters: ['employee', 'dateRange'] }, { id: 'team-performance', name: 'Team Performance', generator: generateTeamPerformance, filters: ['dateRange'] }, { id: 'payroll-history', name: 'Payroll History', generator: generatePayrollHistory, filters: ['employee', 'dateRange'] } ],
    rawMaterials: [ { id: 'material-on-hand', name: 'Material On Hand', generator: generateMaterialOnHand, filters: ['supplier', 'status'] }, { id: 'material-expiry', name: 'Material Expiry', generator: generateMaterialExpiry, filters: [] }, { id: 'material-usage-variance', name: 'Usage Variance', generator: generateMaterialUsageVariance, filters: ['productionOrder', 'material'] } ],
    customers: [ { id: 'sales-by-customer', name: 'Sales by Customer', generator: generateSalesByCustomer, filters: ['customer', 'dateRange'] }, { id: 'customer-order-history', name: 'Order History', generator: generateCustomerOrderHistory, filters: ['customer'] }, { id: 'ar-aging', name: 'A/R Aging', generator: generateArAging, filters: ['customer'] }, { id: 'dues-report', name: 'Customer Dues', generator: generateDuesReport, filters: ['customer', 'dateRange'] } ],
    financials: [ { id: 'profit-loss', name: 'Profit & Loss', generator: generateProfitAndLoss, filters: ['dateRange'] }, { id: 'cogs-analysis', name: 'COGS Analysis', generator: generateCogsAnalysis, filters: ['dateRange', 'productionOrder'] }, { id: 'sales-margin', name: 'Sales Margin Analysis', generator: generateSalesMarginAnalysis, filters: ['dateRange', 'customer', 'product'] }, { id: 'expense-breakdown', name: 'Expense Breakdown', generator: generateExpenseBreakdown, filters: ['dateRange', 'expenseCategory'] }, { id: 'cash-flow', name: 'Cash Flow Statement', generator: generateCashFlow, filters: ['dateRange'] } ]
};

    const handleTabSelect = (key) => {
        setActiveTab(key);
        const firstReportId = reports[key][0].id;
        setActiveReportId(firstReportId);
        setFilters({});
        setSortConfig({ key: null, direction: 'ascending' });
    };

    const handleReportSelect = (e) => {
        setActiveReportId(e.target.value);
        setFilters({});
        setSortConfig({ key: null, direction: 'ascending' });
    };

    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };

    const clearFilters = () => {
        setFilters({});
    };

    const currentReport = useMemo(() => {
        for (const category in reports) {
            const found = reports[category].find(r => r.id === activeReportId);
            if (found) return found;
        }
        return null;
    }, [activeReportId]);

    const reportData = useMemo(() => {
        if (!currentReport) return { headers: [], rows: [] };
        return currentReport.generator(filters);
    }, [currentReport, filters]);
    
    const sortedRows = useMemo(() => {
        let sortableRows = [...reportData.rows];
        if (sortConfig.key !== null) {
            sortableRows.sort((a, b) => {
                let valA = a[sortConfig.key];
                let valB = b[sortConfig.key];
                
                const isNumeric = !isNaN(parseFloat(String(valA).replace(/[$,%()]/g, ''))) && isFinite(String(valA).replace(/[$,%()]/g, ''));

                if (isNumeric) {
                    valA = parseFloat(String(valA).replace(/[$,%()]/g, ''));
                    valB = parseFloat(String(valB).replace(/[$,%()]/g, ''));
                }
                
                if (valA < valB) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (valA > valB) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableRows;
    }, [reportData.rows, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return null;
        }
        return sortConfig.direction === 'ascending' ? <SortUp className="ms-1" /> : <SortDown className="ms-1" />;
    };

    const totals = useMemo(() => {
        if (!reportData.rows || reportData.rows.length === 0) return null;
        
        const totalsRow = new Array(reportData.headers.length).fill('');
        let hasTotals = false;

        reportData.headers.forEach((header, index) => {
            const firstCell = String(reportData.rows[0][index]);
            const isNumeric = firstCell.startsWith('$') || !isNaN(parseFloat(firstCell));

            if (isNumeric) {
                const total = reportData.rows.reduce((sum, currentRow) => {
                    const val = parseFloat(String(currentRow[index]).replace(/[$,%()]/g, '')) || 0;
                    return sum + val;
                }, 0);

                if (firstCell.startsWith('$')) {
                    totalsRow[index] = `${currency}${total.toFixed(2)}`;
                } else {
                    totalsRow[index] = total.toFixed(2).replace(/\.00$/, '');
                }
                hasTotals = true;
            }
        });

        if (hasTotals) {
            totalsRow[0] = 'Total';
            return totalsRow;
        }
        return null;

    }, [reportData.rows, reportData.headers]);


    const exportTableToCSV = () => {
        if (!currentReport) return;
        const { headers } = reportData;
        const rows = sortedRows;
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += headers.join(",") + "\r\n";
        rows.forEach(rowArray => {
            let row = rowArray.join(",");
            csvContent += row + "\r\n";
        });

        if (totals) {
            csvContent += totals.map(t => `"${t}"`).join(",") + "\r\n";
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        const date = new Date().toISOString().slice(0, 10);
        link.setAttribute("download", `${currentReport.name.toLowerCase().replace(/ /g, '_')}_${date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportTableToPDF = () => {
        if (!currentReport || !window.jspdf) return;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const { headers } = reportData;
        const body = sortedRows.map(row => row.map(cell => String(cell).replace(/<\/?strong>/g, '')));
        const foot = totals ? [totals.map(cell => String(cell).replace(/<\/?strong>/g, ''))] : [];
        const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        doc.autoTable({
            head: [headers],
            body: body,
            foot: foot,
            didDrawPage: (data) => {
                doc.setFontSize(20);
                doc.text(currentReport.name, data.settings.margin.left, 15);
                doc.setFontSize(10);
                doc.text(date, doc.internal.pageSize.getWidth() - data.settings.margin.right, 15, { align: 'right' });
            },
            footStyles: { fontStyle: 'bold', fillColor: [243, 244, 246] }
        });
        const filenameDate = new Date().toISOString().slice(0, 10);
        doc.save(`${currentReport.name.toLowerCase().replace(/ /g, '_')}_${filenameDate}.pdf`);
    };


function getIconForTab(tabKey) {
    switch(tabKey) {
        case 'inventory': return Boxes;
        case 'production': return GearFill;
        case 'employees': return PeopleFill;
        case 'rawMaterials': return BuildingFill;
        case 'customers': return PersonVcardFill;
        case 'financials': return CashCoin;
        default: return FunnelFill;
    }
}

function FilterControl({ filterId, filters, onChange }) {
    const commonProps = {
        size: 'sm',
        className: 'me-3 mb-2 mb-md-0',
        style: { minWidth: '180px', height: '35px' },
    };

    switch(filterId) {
        case 'dateRange':
            return (
                <>
                    <Form.Group as={Row} className="align-items-center me-3 mb-2 mb-md-0">
                         <Form.Label column sm="auto" className="mb-0">Start:</Form.Label>
                         <Col sm="auto">
                            <Form.Control type="date" value={filters.startDate || ''} onChange={e => onChange('startDate', e.target.value)} {...commonProps} />
                         </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="align-items-center me-3 mb-2 mb-md-0">
                         <Form.Label column sm="auto" className="mb-0">End:</Form.Label>
                         <Col sm="auto">
                            <Form.Control type="date" value={filters.endDate || ''} onChange={e => onChange('endDate', e.target.value)} {...commonProps} />
                         </Col>
                    </Form.Group>
                </>
            );
        case 'category':
            const categories = [...new Set(inventory?.map(p => p.itemCategoryID))];
            return (
                 <Form.Group as={Row} className="align-items-center me-3 mb-2 mb-md-0">
                    <Form.Label column sm="auto" className="mb-0">Category:</Form.Label>
                    <Col sm="auto"><Form.Select value={filters.category || 'all'} onChange={e => onChange('category', e.target.value)} {...commonProps}><option value="all">All</option>{categories.map(c => <option key={c} value={c}>Category {c}</option>)}</Form.Select></Col>
                 </Form.Group>
            );
        case 'status':
            return (
                 <Form.Group as={Row} className="align-items-center me-3 mb-2 mb-md-0">
                    <Form.Label column sm="auto" className="mb-0">Status:</Form.Label>
                    <Col sm="auto"><Form.Select value={filters.status || 'all'} onChange={e => onChange('status', e.target.value)} {...commonProps}><option value="all">All</option><option value="in_stock">In Stock</option><option value="low_stock">Low Stock</option><option value="out_of_stock">Out of Stock</option></Form.Select></Col>
                 </Form.Group>
            );
        case 'employee':
            return (
                 <Form.Group as={Row} className="align-items-center me-3 mb-2 mb-md-0">
                    <Form.Label column sm="auto" className="mb-0">Employee:</Form.Label>
                    <Col sm="auto"><Form.Select value={filters.employeeId || 'all'} onChange={e => onChange('employeeId', e.target.value)} {...commonProps}><option value="all">All</option>{employees?.map(e => <option key={e.empID} value={e.empID}>{e.empName}</option>)}</Form.Select></Col>
                 </Form.Group>
            );
        // Add other filter controls here following the same pattern...
        default:
            return null;
    }
}

const activeTabStyle = {
    fontWeight: 'bold',
    color: '#0d6efd' // Bootstrap's primary blue color
};

const inactiveTabStyle = {
    fontWeight: 'normal',
    color: '#6c757d' // Bootstrap's muted secondary text color
};
    return (
        <Container fluid className="p-0 d-flex flex-column vh-100">
            <Navbar bg={settings.theme==='dark'?'dark':'light'} expand="lg" className="border-bottom">
                <Container fluid>
                    <Navbar.Brand href="#home" className="fw-bold">
                        <CashCoin className="me-2 text-primary" size={24} />
                        ReportGen
                    </Navbar.Brand>
                </Container>
            </Navbar>

            <Tabs activeKey={activeTab} onSelect={handleTabSelect} id="report-tabs" className={`px-3 border-bottom ${settings.theme==='dark'?'bg-dark':'bg-light'}`}>
    {Object.keys(reports).map(key => (
        <Tab
            key={key}
            eventKey={key}
            title={
                <span
                    className="d-flex align-items-center"
                    // The style prop now conditionally applies one of the style objects
                    style={activeTab === key ? activeTabStyle : inactiveTabStyle}
                >
                    {React.createElement(getIconForTab(key), { className: 'me-2' })}
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                </span>
            }
        >
            <div className={`p-3 ${settings.theme==='dark'?'bg-dark':'bg-light'} border-bottom d-flex align-items-center flex-wrap gap-3`}>
                <Form.Group as={Row} className="align-items-center me-3 mb-2 mb-md-0">
                    <Form.Label column sm="auto" className="mb-0">Report:</Form.Label>
                    <Col sm="auto">
                        <Form.Select style={{height: '35px'}} value={activeReportId} onChange={handleReportSelect} size="sm">
                            {reports[key].map(report => (
                                <option key={report.id} value={report.id}>{report.name}</option>
                            ))}
                        </Form.Select>
                    </Col>
                </Form.Group>
                {currentReport?.filters.map(filterId => (
                    <FilterControl key={filterId} filterId={filterId} filters={filters} onChange={handleFilterChange} />
                ))}
                 <Button variant="outline-secondary" size="sm" onClick={clearFilters} className="ms-auto">
                    <XCircleFill className="me-1" /> Clear Filters
                </Button>
            </div>
        </Tab>
    ))}
</Tabs>
            
            <Container fluid className="p-3 flex-grow-1" style={{ overflowY: 'auto' }}>
                <div className={`p-3 ${settings.theme==='dark'?'bg-dark':'bg-light'} rounded shadow-sm`}>
                     <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="h4 mb-0">{currentReport?.name}</h2>
                        <div className='d-flex gap-3'>
                            <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => window.print()}>
                                <PrinterFill className="me-1" /> Print
                            </Button>
                            <Dropdown>
                                <Dropdown.Toggle variant="success" size="sm" id="dropdown-basic">
                                    <Download className="me-1" /> Export
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={exportTableToPDF}><FileEarmarkPdfFill className="me-2 text-danger" /> PDF</Dropdown.Item>
                                    <Dropdown.Item onClick={exportTableToCSV}><FileEarmarkSpreadsheetFill className="me-2 text-success" /> CSV</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    </div>
                    
                    <Table striped bordered hover responsive size="sm">
                        <thead>
                            <tr>
                                {reportData.headers.map((header, index) => (
                                    <th key={index} onClick={() => requestSort(index)} className='bg-dark text-light' style={{cursor: 'pointer'}}>
                                        {header} {getSortIcon(index)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedRows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {row.map((cell, cellIndex) => (
                                        <td key={cellIndex} dangerouslySetInnerHTML={{ __html: cell }}/>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                        {totals && (
                             <tfoot className="table-group-divider">
                                <tr>
                                    {totals.map((total, index) => (
                                        <td key={index} className="fw-bold" dangerouslySetInnerHTML={{ __html: total }} />
                                    ))}
                                </tr>
                            </tfoot>
                        )}
                    </Table>
                    {reportData.rows.length === 0 && <p className="text-center text-muted">No data available for the selected filters.</p>}
                </div>
            </Container>
        </Container>
    );
}


export default ReportPage;
