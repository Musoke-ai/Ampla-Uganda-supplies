import React, { forwardRef, useImperativeHandle } from 'react';
// Reverted to a standard import. Requires `npm install jspdf`.
import jsPDF from 'jspdf';

// --- Helper Functions for PDF Generation ---

/**
 * A utility to draw a dashed line in jsPDF.
 * @param {jsPDF} doc The jsPDF document instance.
 * @param {number} x1 Start X coordinate.
 * @param {number} y Start Y coordinate.
 * @param {number} x2 End X coordinate.
 */
const drawDashedLine = (doc, x1, y, x2) => {
    doc.setLineDashPattern([1, 1], 0);
    doc.line(x1, y, x2, y);
    doc.setLineDashPattern([], 0); // Reset dash pattern
};

/**
 * A utility to wrap text to fit a specific width in jsPDF.
 * @param {jsPDF} doc The jsPDF document instance.
 * @param {string} text The text to wrap.
 * @param {number} x The X coordinate to start drawing.
 * @param {number} y The Y coordinate to start drawing.
 * @param {number} maxWidth The maximum width the text can occupy.
 * @param {string} align The alignment of the text ('left', 'center', 'right').
 * @returns {number} The new Y position after drawing the text.
 */
const wrapText = (doc, text, x, y, maxWidth, align = 'left') => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y, { align: align });
    return y + (doc.getTextDimensions(lines).h);
};


// --- PDF Template Generator Function ---
// This function draws a standard retail receipt.

const RECEIPT_WIDTH_80MM = 72; // Usable width for 80mm paper
const MARGIN = 4;

const generateStandardReceipt = (doc, data, companyInfo) => {
    const { items, details } = data;
    const width = RECEIPT_WIDTH_80MM;
    const centerX = width / 2;
    let y = MARGIN + 5;

    // Header
    doc.setFont('Helvetica', 'bold').setFontSize(14).text(companyInfo.busName, centerX, y, { align: 'center' });
    y += 6;
    doc.setFont('Helvetica', 'normal').setFontSize(8);
    y = wrapText(doc, companyInfo.busLocation, centerX, y, width - MARGIN * 2, 'center');
    y += 4;
    doc.text(`${companyInfo.busContactOne}`, centerX, y, { align: 'center' });
    y += 5;
    drawDashedLine(doc, MARGIN, y, width - MARGIN);
    y += 5;

    // --- NEW: Date, Time, and Customer Info Section ---
    const now = new Date();
    doc.setFont('Helvetica', 'normal').setFontSize(8);
    doc.text(`Date: ${now.toLocaleDateString()}`, MARGIN, y);
    doc.text(`Time: ${now.toLocaleTimeString()}`, width - MARGIN, y, { align: 'right' });
    y += 5;

    // Only show customer name if it exists in the data
    if (details.customerName) {
        doc.text(`Customer: ${details.customerName}`, MARGIN, y);
        y += 5;
    }
    drawDashedLine(doc, MARGIN, y, width - MARGIN);
    y += 5;


    // Items Table Header
    doc.setFont('Helvetica', 'bold').setFontSize(9);
    doc.text('Item', MARGIN, y);
    doc.text('Qty', width / 2, y, { align: 'center' });
    doc.text('Price', width - MARGIN, y, { align: 'right' });
    y += 2;
    doc.line(MARGIN, y, width - MARGIN, y);
    y += 4;

    // Items List
    doc.setFont('Helvetica', 'normal').setFontSize(9);
    items.forEach(item => {
        const itemTotal = item.saleQuantity * item.salePrice;
        const itemName = item.name || `Item ID: ${item.saleItemId}`;
        const textY = y;
        const textLines = doc.splitTextToSize(itemName, width / 2 - MARGIN);
        doc.text(textLines, MARGIN, textY);
        doc.text(item.saleQuantity.toString(), width / 2, textY, { align: 'center' });
        doc.text(`$${itemTotal.toFixed(2)}`, width - MARGIN, textY, { align: 'right' });
        y += (textLines.length * 4) + 2; // Adjust Y based on lines
    });

    // Totals
    y += 2;
    drawDashedLine(doc, MARGIN, y, width - MARGIN);
    y += 5;
    doc.setFontSize(10);
    
    const labelX = width - MARGIN - 30;
    const valueX = width - MARGIN;

    // Tax
    doc.setFont('Helvetica', 'normal');
    doc.text('Tax:', labelX, y, { align: 'right' });
    doc.text(`$${details.tax.toFixed(2)}`, valueX, y, { align: 'right' });
    y += 6;

    // Discount
    doc.text('Discount:', labelX, y, { align: 'right' });
    doc.text(`$${details.discount.toFixed(2)}`, valueX, y, { align: 'right' });
    y += 6;

    // Total
    doc.setFont('Helvetica', 'bold');
    doc.text('Total:', labelX, y, { align: 'right' });
    doc.text(`$${details.total.toFixed(2)}`, valueX, y, { align: 'right' });
    y += 6;

    // --- NEW: Amount Paid and Amount Due ---
    doc.setFont('Helvetica', 'normal');
    doc.text('Amount Paid:', labelX, y, { align: 'right' });
    doc.text(`$${details.tenderedAmount.toFixed(2)}`, valueX, y, { align: 'right' });
    y += 6;

    doc.setFont('Helvetica', 'bold');
    doc.text('Amount Due:', labelX, y, { align: 'right' });
    doc.text(`$${details.dueAmount.toFixed(2)}`, valueX, y, { align: 'right' });
    y += 10;


    // Footer
    doc.setFont('Helvetica', 'normal').setFontSize(8);
    doc.text('Thank you for your purchase!', centerX, y, { align: 'center' });
};


// --- Exportable Component ---

/**
 * A component to programmatically print a PDF receipt.
 * It exposes a `print` method via a ref.
 *
 * @param {object} props
 * @param {object} props.data - The receipt data object.
 * @param {object} props.companyInfo - Information about your business.
 */
export const ReceiptTemplate = forwardRef(({ data, companyInfo }, ref) => {

    const handleGeneratePdf = () => {
        if (!data || !data.items || !data.details) {
            console.error("Receipt data is missing or incomplete.");
            alert("Error: Cannot print receipt due to missing data.");
            return;
        }
         if (!companyInfo) {
            console.error("Company information is missing.");
            alert("Error: Company information is not set up for receipts.");
            return;
        }

        // Create a new PDF document with a tall, narrow page size for 80mm paper.
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [RECEIPT_WIDTH_80MM, 297]
        });

        // Call the generator function to draw the receipt.
        generateStandardReceipt(doc, data, companyInfo);
        
        // Open the PDF in a new browser tab for previewing and printing.
        doc.output('dataurlnewwindow');
    };
    
    // Expose the print function to parent components via the ref.
    useImperativeHandle(ref, () => ({
        print() {
            handleGeneratePdf();
        }
    }));

    // This component does not render any visible UI itself.
    return null;
});
