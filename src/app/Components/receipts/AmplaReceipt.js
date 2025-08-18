import React, { useState, useRef, forwardRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectStock } from '../../features/stock/stockSlice';
import { selectCustomers } from '../../features/api/customers';
import { useSettings } from '../Settings';
// Import libraries from node_modules
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // This import extends the jsPDF prototype with the autoTable method
import { Modal, Button, Form, Container, Row, Col, Card } from 'react-bootstrap';

// --- Helper function to format currency ---
const formatCurrency = (amount, currency = 'UGX') => {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(0);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

// --- HTML Preview Modal Component (No changes needed here) ---
const ReceiptPreviewModal = forwardRef((props, ref) => {
    const { 
        show, 
        onClose, 
        onDownload, 
        onPrint, 
        cart, 
        saleDetails, 
        companyInfo, 
        customerName, 
        receiptSize, 
        onSizeChange,
        productsMap,
        currency
    } = props;
    
    if (!show) return null;

    const subtotal = cart.reduce((acc, item) => acc + (item.itemQuantity * item.salePrice), 0);
    
    const receiptPreviewStyle = {
      width: receiptSize,
      transition: 'width 0.3s ease-in-out',
    };

    return (
        <Modal show={show} onHide={onClose} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title as="h3">Receipt Preview</Modal.Title>
                <div className="d-flex align-items-center ms-auto me-3">
                    <span className="text-muted me-2 small">Size:</span>
                    {['80mm', '58mm'].map(size => (
                        <Form.Check
                            key={size}
                            inline
                            type="radio"
                            id={`receipt-size-${size}`}
                            label={size}
                            name="receiptSizePreview"
                            value={size}
                            checked={receiptSize === size}
                            onChange={(e) => onSizeChange(e.target.value)}
                        />
                    ))}
                </div>
            </Modal.Header>
            
            <Modal.Body className="">
                <div 
                    ref={ref} 
                    className="receipt-container bg-white shadow-sm p-3 mx-auto font-monospace text-black"
                    style={receiptPreviewStyle}
                >
                    {/* Company Info */}
                    <div className="text-center mb-4">
                        <h2 className="fs-5 fw-bold">{companyInfo.busName}</h2>
                        <p className="small mb-0">{companyInfo.busLocation}</p>
                        <p className="small mb-0">Phone: {companyInfo.busContactOne} - {companyInfo.busContactTwo}</p>
                        <p className="small mb-0">Email: {companyInfo.busEmail}</p>
                    </div>

                    <hr className="my-2 border-dark border-dashed" />

                    {/* Sale & Customer Details */}
                    <div className="d-flex justify-content-between small mb-2">
                        <span>Receipt #: {Math.floor(10000 + Math.random() * 90000)}</span>
                        <span>{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="small mb-4">Customer: {customerName}</div>
                    
                    <div className="border-top border-bottom border-dark border-dashed py-2">
                        <div className="d-flex fw-bold small">
                            <span className="flex-grow-1">ITEM</span>
                            <span style={{ width: '40px' }} className="text-center">QTY</span>
                            <span style={{ width: '80px' }} className="text-end">TOTAL</span>
                        </div>
                        {cart.map((item, index) => (
                            <div key={index} className="d-flex small mt-1">
                                <span className="flex-grow-1">{productsMap.get(item.itemId) || `ID: ${item.itemId}`}</span>
                                <span style={{ width: '40px' }} className="text-center">{item.itemQuantity}</span>
                                <span style={{ width: '80px' }} className="text-end">{currency+Number((item.itemQuantity * item.salePrice)||0)}</span>
                            </div>
                        ))}
                    </div>
    
                    {/* Totals Section */}
                    <div className="mt-4 d-flex flex-column gap-1 small">
                        <div className="d-flex justify-content-between"><span>Subtotal:</span><span>{currency+Number(subtotal)||0}</span></div>
                        <div className="d-flex justify-content-between"><span>Discount:</span><span>-{currency+Number(saleDetails.discountAmount)||0}</span></div>
                        <div className="d-flex justify-content-between"><span>Tax:</span><span>{currency+Number(saleDetails.taxAmount)||0}</span></div>
                        <div className="d-flex justify-content-between fw-bold fs-6 border-top border-dark border-dashed pt-1 mt-1">
                            <span>Total:</span>
                            <span>{currency+Number(saleDetails.total)||0}</span>
                        </div>
                    </div>

                    <hr className="my-3 border-dark border-dashed" />

                    <div className="d-flex flex-column gap-1 small">
                        <div className="d-flex justify-content-between"><span>Payment Method:</span><span>{saleDetails.paymentMethod}</span></div>
                        <div className="d-flex justify-content-between"><span>Tendered:</span><span>{currency+Number(saleDetails.tenderedAmount)||0}</span></div>
                        <div className="d-flex justify-content-between"><span>Due Amount:</span><span>{currency+Number(saleDetails.dueAmount)||0}</span></div>
                    </div>

                    <div className="text-center mt-4 small">
                        <p className="mb-1">{saleDetails.moreInfo}</p>
                        <p className="fw-bold mt-1 mb-0">Thank you for your business!</p>
                    </div>
                </div>
            </Modal.Body>
            
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
                <Button variant="dark" onClick={onPrint} className="d-flex align-items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="me-2"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print
                </Button>
                <Button variant="primary" onClick={onDownload} className="d-flex align-items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="me-2"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download PDF
                </Button>
            </Modal.Footer>
        </Modal>
    );
});


// --- Parent App Component ---
export default function AmplaReceipt({companyInfo, customerName, cart, saleDetails}) {
    const [showPreview, setShowPreview] = useState(false);
    const [receiptSize, setReceiptSize] = useState('80mm');
    const previewRef = useRef();

    const { settings } = useSettings();
    const  currency  = settings.currency!=='none' ? settings.currency : '';

    const products = useSelector(selectStock);
    const customers = useSelector(selectCustomers);
    
    const productsMap = new Map(products.map(p => [p.itemId, p.itemName]));
    const customersMap = new Map(customers.map(c => [c.custId, c.custName]));

    const handlePrint = () => {
        const printContent = previewRef.current;
        if (printContent) {
            const printWindow = window.open('', '', 'height=800,width=800');
            
            printWindow.document.write('<!DOCTYPE html><html><head><title>Print Receipt</title>');
            printWindow.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">');
            
            printWindow.document.write(`
                <style>
                    @media print {
                        @page { size: ${receiptSize} auto; margin: 4mm; }
                        body { width: ${receiptSize}; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .receipt-container { width: 100% !important; max-width: 100% !important; box-shadow: none !important; margin: 0 !important; padding: 0 !important; }
                    }
                </style>
            `);

            printWindow.document.write('</head><body>');
            printWindow.document.write(printContent.outerHTML);
            
            printWindow.document.write(`
                <script>
                    window.onload = function() {
                        setTimeout(function() { window.print(); window.close(); }, 250);
                    }
                </script>
            `);
            
            printWindow.document.write('</body></html>');
            printWindow.document.close();
        }
    };

    useEffect(()=>{
          setTimeout(() => setShowPreview(true), 1000);
    },[])

    const generateAndDownloadPdf = () => {
        const paperWidth = receiptSize === '80mm' ? 80 : 58;
        // Use the imported jsPDF class directly
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [paperWidth, 297] });

        const center = paperWidth / 2;
        const margin = 5;
        const rightAlign = paperWidth - margin;

        // --- PDF Content Generation ---
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12);
        doc.text(companyInfo.busName, center, 15, { align: 'center' });
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.text(companyInfo.busLocation, center, 20, { align: 'center' });
        doc.text(`Phone: ${companyInfo.busContactOne} - ${companyInfo.busContactTwo}`, center, 24, { align: 'center' });
        doc.text(`Email: ${companyInfo.busEmail}`, center, 28, { align: 'center' });
        
        doc.setLineWidth(0.2);
        doc.line(margin, 32, rightAlign, 32);

        const saleDate = new Date().toLocaleString();
        doc.text(`Receipt #: ${Math.floor(10000 + Math.random() * 90000)}`, margin, 38);
        doc.text(`Date: ${saleDate}`, margin, 42);
        doc.text(`Customer: ${customerName}`, margin, 46);

        const tableColumn = ["Item", "Qty", "Total"];
        const tableRows = cart.map(item => [
            productsMap.get(item.itemId) || `ID: ${item.itemId}`, 
            item.itemQuantity, 
            currency+Number(item.itemQuantity * item.salePrice)||0
        ]);
        
        // The autoTable method is available because we imported 'jspdf-autotable'
        doc.autoTable({
            head: [tableColumn], body: tableRows, startY: 50, theme: 'plain',
            styles: { fontSize: 8, cellPadding: 1 },
            headStyles: { fontStyle: 'bold', halign: 'center' },
            columnStyles: { 0: { halign: 'left' }, 1: { halign: 'center' }, 2: { halign: 'right' } },
            margin: { left: margin, right: margin }
        });

        let finalY = doc.lastAutoTable.finalY + 5;
        const subtotal = cart.reduce((acc, item) => acc + (item.itemQuantity * item.salePrice), 0);
        
        const addTotalLine = (label, value, options = {}) => {
            if (options.fontStyle) doc.setFont("Helvetica", options.fontStyle);
            if (options.fontSize) doc.setFontSize(options.fontSize);
            
            doc.text(label, margin, finalY);
            doc.text(value, rightAlign, finalY, { align: 'right' });
            
            if (options.fontStyle || options.fontSize) { // Reset to default
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(9);
            }
            finalY += 5;
        };

        addTotalLine("Subtotal: ", `${currency}`+Number(subtotal)||0);
        addTotalLine("Discount: ", `-${currency+Number(saleDetails.discountAmount)||0}`);
        addTotalLine("Tax: ", `${currency}`+Number(saleDetails.taxAmount)||0);

        doc.line(margin, finalY - 2, rightAlign, finalY - 2);
        addTotalLine("Total:", `${currency}`+Number(saleDetails.total)||0, { fontStyle: 'bold', fontSize: 10 });
        
        finalY += 2;
        addTotalLine("Payment Method:", saleDetails.paymentMethod);
        addTotalLine("Tendered:", `${currency}`+Number(saleDetails.tenderedAmount)||0);
        addTotalLine("Due Amount:", `${currency}`+Number(saleDetails.dueAmount)||0);
        
        finalY += 5;
        doc.setFontSize(8);
        doc.text(saleDetails.moreInfo, center, finalY, { align: 'center', maxWidth: paperWidth - (margin * 2) });
        finalY += 4;
        doc.setFont("Helvetica", "bold");
        doc.text("Thank you for your business!", center, finalY, { align: 'center' });
        
        doc.save(`receipt-${customerName.replace(/\s/g, '_')}-${Date.now()}.pdf`);
    };

    return (
        <>
            <Container fluid className=" min-vh-100 p-4">
                <Row className="justify-content-center">
                    <Col md={10} lg={8} xl={6}>
                         <Card className="text-center shadow-sm">
                            <Card.Header as="h2">Receipt Generator</Card.Header>
                            <Card.Body>
                                <Card.Text className="text-muted mb-4">
                                    Click the button below to generate a preview of the receipt.
                                </Card.Text>
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={() => setShowPreview(true)}
                                >
                                    Preview Receipt
                                </Button>
                            </Card.Body>
                         </Card>
                    </Col>
                </Row>
            </Container>
            
            <ReceiptPreviewModal
                ref={previewRef}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onDownload={generateAndDownloadPdf}
                onPrint={handlePrint}
                cart={cart}
                saleDetails={saleDetails}
                companyInfo={companyInfo}
                customerName={customersMap.get(customerName) || customerName}
                receiptSize={receiptSize}
                onSizeChange={setReceiptSize}
                productsMap={productsMap}
                currency={currency}
            />
        </>
    );
}
