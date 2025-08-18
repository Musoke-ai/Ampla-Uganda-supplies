import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { useSelector } from 'react-redux';
import { selectProfile } from '../../auth/authSlice';
import { selectStock } from '../../features/stock/stockSlice';
import { selectCustomers } from '../../features/api/customers';

// --- Helper function to format currency ---
const formatCurrency = (amount, currency) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return '$0.00';
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'UGX' }).format(amount);
};

// --- HTML Preview Modal Component ---
const ReceiptPreviewModal = forwardRef(({ show, onClose, onDownload, onPrint, cart, saleDetails, companyInfo, customerName, receiptSize, onSizeChange }, ref) => {
    if (!show) return null;

    const subtotal = cart.reduce((acc, item) => acc + (item.itemQuantity * item.salePrice), 0);
    
    // Conditional styling based on receipt size for the preview
    const previewWidthClass = receiptSize === '80mm' ? 'max-w-sm' : 'max-w-[220px]';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full sm:w-11/12 md:w-1/2 lg:max-w-md max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Receipt Preview</h3>
                    {/* --- Size selector is now inside the modal header --- */}
                    <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600">Size:</span>
                        {['80mm', '58mm'].map(size => (
                            <label key={size} className="flex items-center space-x-1 cursor-pointer">
                                <input
                                    type="radio"
                                    name="receiptSizePreview"
                                    value={size}
                                    checked={receiptSize === size}
                                    onChange={(e) => onSizeChange(e.target.value)}
                                    className="form-radio h-4 w-4 text-blue-600"
                                />
                                <span className="text-sm text-gray-700">{size}</span>
                            </label>
                        ))}
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
                </header>
                
                <div className="p-6 flex-grow overflow-y-auto bg-gray-50">
                    <div ref={ref} className={`receipt-container bg-white shadow-md p-4 mx-auto font-mono text-sm text-black w-full transition-all duration-300 ${previewWidthClass}`}>
                        {/* Company Info */}
                        <div className="text-center mb-4">
                            <h2 className="text-xl font-bold">{companyInfo.name}</h2>
                            <p className="text-xs">{companyInfo.address}</p>
                            <p className="text-xs">Phone: {companyInfo.phone}</p>
                            <p className="text-xs">Website: {companyInfo.website}</p>
                        </div>

                        <div className="border-t border-dashed border-black my-2"></div>

                        {/* Sale & Customer Details */}
                        <div className="flex justify-between text-xs mb-2">
                            <span>Receipt #: {Math.floor(10000 + Math.random() * 90000)}</span>
                            <span>{new Date(saleDetails.endDate).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs mb-4">Customer: {customerName}</div>
                        
                        <div className="border-t border-b border-dashed border-black py-2">
                            <div className="flex font-bold text-xs">
                                <span className="flex-grow">ITEM</span>
                                <span className="w-8 text-center">QTY</span>
                                <span className="w-16 text-right">TOTAL</span>
                            </div>
                            {cart.map((item, index) => (
                                <div key={index} className="flex text-xs mt-1">
                                    <span className="flex-grow">{`ID: ${item.itemId}`}</span>
                                    <span className="w-8 text-center">{item.itemQuantity}</span>
                                    <span className="w-16 text-right">{formatCurrency(item.itemQuantity * item.salePrice)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Totals Section */}
                        <div className="mt-4 space-y-1 text-xs">
                            <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                            <div className="flex justify-between"><span>Discount:</span><span>-{formatCurrency(saleDetails.discountAmount)}</span></div>
                            <div className="flex justify-between"><span>Tax:</span><span>{formatCurrency(saleDetails.taxAmount)}</span></div>
                            <div className="flex justify-between font-bold text-base border-t border-dashed border-black pt-1 mt-1"><span>Total:</span><span>{formatCurrency(saleDetails.total)}</span></div>
                        </div>

                        <div className="border-t border-dashed border-black mt-4 pt-2 space-y-1 text-xs">
                            <div className="flex justify-between"><span>Payment Method:</span><span>{saleDetails.paymentMethod}</span></div>
                            <div className="flex justify-between"><span>Tendered:</span><span>{formatCurrency(saleDetails.tenderedAmount)}</span></div>
                            <div className="flex justify-between"><span>Change Due:</span><span>{formatCurrency(saleDetails.dueAmount)}</span></div>
                        </div>

                        <div className="text-center mt-4 text-xs">
                            <p>{saleDetails.moreInfo}</p>
                            <p className="font-bold mt-1">Thank you for your business!</p>
                        </div>
                    </div>
                </div>
                
                <footer className="flex justify-end items-center p-4 border-t bg-gray-100 rounded-b-lg">
                    <button onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 transition-colors">
                        Close
                    </button>
                    <button onClick={onPrint} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg mr-2 transition-colors flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Print
                    </button>
                    <button onClick={onDownload} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download PDF
                    </button>
                </footer>
            </div>
        </div>
    );
});


// --- Parent App Component ---
export default function AmplaReceipt({companyInfo, customerName, cart, saleDetails}) {
    const [scriptsLoaded, setScriptsLoaded] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [receiptSize, setReceiptSize] = useState('80mm'); // State for receipt size
    const products = useSelector(selectStock);
    const _products = products.map((product) => [product.itemId, product.itemName] );
    const productsMap = new Map(_products);
    const customers = useSelector(selectCustomers);
    const _customers = customers.map((customer) => [customer.custId, customer.custName] );
    const customersMap = new Map(_customers);
    const previewRef = useRef();

    useEffect(() => {
        const jspdfScript = document.createElement('script');
        jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        jspdfScript.async = true;
        jspdfScript.onload = () => {
            const autotableScript = document.createElement('script');
            autotableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js';
            autotableScript.async = true;
            autotableScript.onload = () => setScriptsLoaded(true);
            document.body.appendChild(autotableScript);
        };
        document.body.appendChild(jspdfScript);
    }, []);

    // const companyInfo = { name: "The Gadget Store", address: "123 Tech Avenue, Silicon Valley, CA 94043", phone: "1-800-555-GADT", website: "www.thegadgetstore.com" };
    // const customerName = "John Doe";
    // const cart = [ { itemId: 'G-001', itemQuantity: 2, salePrice: 299.99 }, { itemId: 'A-052', itemQuantity: 1, salePrice: 49.50 }, { itemId: 'C-113', itemQuantity: 5, salePrice: 5.99 }];
    // const saleDetails = { paymentMethod: "Credit Card", tenderedAmount: 750.00, discountAmount: 30.00, taxAmount: 51.97, total: 699.45, dueAmount: 50.55, endDate: new Date().toISOString(), moreInfo: "All sales are final. 30-day warranty on electronics." };

    const handlePrint = () => {
        const printContent = previewRef.current;
        if (printContent) {
            const printWindow = window.open('', '', 'height=800,width=800');
            
            printWindow.document.write('<!DOCTYPE html><html><head><title>Print Receipt</title>');
            printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
            
            printWindow.document.write(`
                <style>
                    @media print {
                        @page {
                            size: ${receiptSize} auto;
                            margin: 4mm;
                        }
                        body {
                            width: ${receiptSize};
                            margin: 0;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        .receipt-container {
                            width: 100% !important;
                            max-width: 100% !important;
                            box-shadow: none !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                    }
                </style>
            `);

            printWindow.document.write('</head><body>');
            printWindow.document.write(printContent.outerHTML);
            
            printWindow.document.write(`
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            window.close();
                        }, 250);
                    }
                </script>
            `);
            
            printWindow.document.write('</body></html>');
            printWindow.document.close();
        }
    };

    const generateAndDownloadPdf = () => {
        if (!scriptsLoaded || !window.jspdf) { console.error("jsPDF library is not loaded yet."); return; }
        
        const { jsPDF } = window.jspdf;
        const paperWidth = receiptSize === '80mm' ? 80 : 58;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [paperWidth, 200] });

        const center = paperWidth / 2;
        const margin = receiptSize === '80mm' ? 10 : 5;
        const rightAlign = paperWidth - margin;

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12);
        doc.text(companyInfo.busName, center, 15, { align: 'center' });
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.text(companyInfo.busLocation, center, 20, { align: 'center' });
        doc.text(`Phone: ${companyInfo.busContactOne} - ${companyInfo.busContactTwo}`, center, 24, { align: 'center' });
        doc.text(`Email: ${companyInfo.busEmail}`, center, 28, { align: 'center' });
        doc.setLineWidth(0.5);
        doc.line(margin, 32, rightAlign, 32);
        const saleDate = new Date().toLocaleString();
        doc.text(`Receipt #: ${Math.floor(10000 + Math.random() * 90000)}`, margin, 38);
        doc.text(`Date: ${saleDate}`, margin, 42);
        doc.text(`Customer: ${customersMap.get(customerName)}`, margin, 46);

        const tableColumn = ["Item", "Qty", "Price", "Total"];
        const tableRows = [];
        cart.forEach(item => {
            tableRows.push([`${productsMap.get(item.itemId)}`, item.itemQuantity, formatCurrency(item.salePrice), formatCurrency(item.itemQuantity * item.salePrice)]);
        });
        
        doc.autoTable({
            head: [tableColumn], body: tableRows, startY: 50, theme: 'plain',
            styles: { fontSize: 8, cellPadding: 1, halign: 'center' },
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
            columnStyles: { 0: { halign: 'left' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
            margin: { left: margin, right: margin }
        });

        let finalY = doc.lastAutoTable.finalY + 5;
        const subtotal = cart.reduce((acc, item) => acc + (item.itemQuantity * item.salePrice), 0);
        const totalsX = rightAlign - 100;
        doc.setFontSize(9);
        doc.setFont("Helvetica", "bold");
        doc.text("Subtotal:", totalsX, finalY);
        doc.text(formatCurrency(subtotal), rightAlign, finalY, { align: 'right' });
        finalY += 5;
        doc.text("Discount:", totalsX, finalY);
        doc.text(`-${formatCurrency(saleDetails.discountAmount)}`, rightAlign, finalY, { align: 'right' });
        finalY += 5;
        doc.text("Tax:", totalsX, finalY);
        doc.text(formatCurrency(saleDetails.taxAmount), rightAlign, finalY, { align: 'right' });
        finalY += 5;
        doc.setFontSize(10);
        doc.text("Total:", totalsX, finalY);
        doc.text(formatCurrency(saleDetails.total), rightAlign, finalY, { align: 'right' });
        finalY += 7;
        doc.setLineWidth(0.2);
        doc.line(margin, finalY - 2, rightAlign, finalY - 2);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Payment Method:`, margin, finalY + 2);
        doc.text(saleDetails.paymentMethod, rightAlign, finalY + 2, { align: 'right' });
        finalY += 5;
        doc.text(`Tendered Amount:`, margin, finalY + 2);
        doc.text(formatCurrency(saleDetails.tenderedAmount), rightAlign, finalY + 2, { align: 'right' });
        finalY += 5;
        doc.text(`Change Due:`, margin, finalY + 2);
        doc.text(formatCurrency(saleDetails.dueAmount), rightAlign, finalY + 2, { align: 'right' });
        finalY += 10;
        doc.setFontSize(8);
        doc.text(saleDetails.moreInfo, center, finalY, { align: 'center' });
        finalY += 4;
        doc.text("Thank you for your business!", center, finalY, { align: 'center' });
        
        doc.save(`receipt-${customerName.replace(/\s/g, '_')}-${Date.now()}.pdf`);
    };

    return (
        <>
            <div className="bg-gray-100 min-h-screen font-sans">
                <header className="bg-white shadow-md">
                    <div className="container mx-auto px-8 py-4">
                        <h1 className="text-2xl font-bold text-gray-800">Receipt Generator</h1>
                        <p className="text-gray-600 mt-1">Click the button to preview and print your receipt.</p>
                    </div>
                </header>
                <main className="container mx-auto px-8 py-12">
                    <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg mx-auto">
                        <div className="text-center">
                             <button
                                onClick={() => setShowPreview(true)}
                                disabled={!scriptsLoaded}
                                className={`font-bold py-3 px-6 rounded-lg shadow-lg transition-transform transform focus:outline-none focus:ring-4 focus:ring-blue-300 ${!scriptsLoaded ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white'}`}
                            >
                                {!scriptsLoaded ? 'Loading Libraries...' : 'Preview Receipt'}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
            <ReceiptPreviewModal
                ref={previewRef}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onDownload={generateAndDownloadPdf}
                onPrint={handlePrint}
                cart={cart}
                saleDetails={saleDetails}
                companyInfo={companyInfo}
                customerName={customerName}
                receiptSize={receiptSize}
                onSizeChange={setReceiptSize}
            />
        </>
    );
}
