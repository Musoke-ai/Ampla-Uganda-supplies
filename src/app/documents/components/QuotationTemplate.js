import React from 'react';
import jsPDF from 'jspdf';

const generateQuotation = () => {
  const doc = new jsPDF();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Quotation', 105, 20, 'center');

  // Quotation details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text('Quotation Number: Q12345', 20, 40);
  doc.text('Due Date: 2024-03-31', 20, 50);

  // From Company details
  doc.text('From:', 20, 70);
  doc.text('Your Company Name', 30, 75);
  doc.text('123 Main Street', 30, 80);
  doc.text('City, Country', 30, 85);

  // To Company details
  doc.text('To:', 150, 70);
  doc.text('Customer Name', 160, 75);
  doc.text('Customer Address', 160, 80);
  doc.text('City, Country', 160, 85);

  // Product table
  const productData = [
    ['Product', 'Quantity', 'Unit Price', 'Total'],
    ['Product A', '10 units', '$100', '$1000'],
    // Add more rows for other products if needed
  ];
  doc.autoTable({
    startY: 100,
    head: [['Product', 'Quantity', 'Unit Price', 'Total']],
    body: productData.slice(1),
  });

  // Footer
  doc.setFontSize(10);
  doc.text('Thank you for choosing us!', 105, 170, 'center');

  doc.save('quotation.pdf');
};

const QuotationTemplate = () => {
  return (
    <div>
      <button onClick={generateQuotation}>Generate Quotation</button>
    </div>
  );
};

export default QuotationTemplate;
