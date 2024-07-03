import jsPDF from 'jspdf'
import format from 'date-fns/format';

const generateInvoice = (
    customerInfo,
    colors,
    businessInfo,
    content,
    totals,
    signURL,
    date,
    dueDate
) => {

    const calcVerticalSpacing = (fontSize,doc, marginTop) =>{
        const spacing = ((fontSize*doc.getLineHeightFactor())/72)+marginTop;
        return spacing;
      }
    
    const calcXPos = (pdf,text,marginRight) => {
      const pageWidth = pdf.internal.pageSize.width || pdf.internal.pageSize.getWidth();
      const textWidth = pdf.getTextWidth(text);
      const xPos = pageWidth-(textWidth+marginRight)
      return xPos;
    }
    
     const pdf = new jsPDF('p','in','a4');
     var pageHeight = pdf.internal.pageSize.height || pdf.internal.pageSize.getHeight();
     var pageWidth = pdf.internal.pageSize.width || pdf.internal.pageSize.getWidth();
     let marginleft = 0.5;
     let marginTop = 0.5;
     let margin =0.5;
     const endNote = "Account are due on demand";
    
     //Invoice details layout
     pdf.setFontSize('17');
     pdf.setLineHeightFactor(0.9);
     pdf.text("INVOICE",calcXPos(pdf,'INVOICE',margin), margin,{align:'left'});
    let yPos1 = margin;
    pdf.setFontSize('10');
    pdf.setLineHeightFactor(0.2);
     pdf.text(" ",calcXPos(pdf,' ',margin), calcVerticalSpacing(10,pdf,yPos1+10/72),{align:'left'});
     yPos1 = calcVerticalSpacing(10,pdf,yPos1+10/72);
     pdf.text("N0. INV001",calcXPos(pdf,'NO. INV001',margin), calcVerticalSpacing(10,pdf,yPos1+10/72),{align:'left'});
     yPos1 = calcVerticalSpacing(10,pdf,yPos1+10/72);
     pdf.text(" ",calcXPos(pdf,' ',margin), calcVerticalSpacing(10,pdf,yPos1+10/72),{align:'left'});
     yPos1 = calcVerticalSpacing(10,pdf,yPos1+10/72);
     pdf.text("DATE",calcXPos(pdf,'DATE',margin),calcVerticalSpacing(10,pdf,yPos1+10/72),{align:'left'});
     yPos1 = calcVerticalSpacing(10,pdf,yPos1+10/72);
     pdf.text(String(date),calcXPos(pdf,'Jan 16 2024',margin), calcVerticalSpacing(10,pdf,yPos1+10/72),{align:'left'});
     yPos1 = calcVerticalSpacing(10,pdf,yPos1+10/72);
     pdf.text(" ",calcXPos(pdf,' ',margin), calcVerticalSpacing(10,pdf,yPos1+10/72),{align:'left'});
     yPos1 = calcVerticalSpacing(10,pdf,yPos1+10/72);
     pdf.text("DUE",calcXPos(pdf,'DUE',margin), calcVerticalSpacing(10,pdf,yPos1+10/72),{align:'left'});
     yPos1 = calcVerticalSpacing(10,pdf,yPos1+10/72);
     pdf.text(String(format(new Date(dueDate), 'dd/MM/yyyy')),calcXPos(pdf,String(format(new Date(dueDate), 'dd/MM/yyyy')),margin), calcVerticalSpacing(10,pdf,yPos1+10/72),{align:'left'});
     yPos1 = calcVerticalSpacing(10,pdf,yPos1+10/72);
     pdf.text(" ",calcXPos(pdf,' ',margin), calcVerticalSpacing(10,pdf,yPos1+10/72),{align:'left'});
     yPos1 = calcVerticalSpacing(10,pdf,yPos1+10/72);
     pdf.text("BALANCE ",calcXPos(pdf,'BALANCE',margin), calcVerticalSpacing(10,pdf,yPos1+10/72),{align:'left'});
     yPos1 = calcVerticalSpacing(10,pdf,yPos1+10/72);
     pdf.text('UGX'+String(totals.balance),calcXPos(pdf,'UGX'+(String(totals.balance)),margin), calcVerticalSpacing(10,pdf,yPos1+10/72),{align:'left'});
     // add company logo if available
    // pdf.addImage(signURL,marginleft,0.5,100/72, 50/72);
    // marginleft = marginleft+100/72+0.1;
    // marginleft = 0.5;
     //From info layout
     pdf.setFontSize('20');
     pdf.setTextColor(colors.BusinessTitleColor);
     pdf.text(businessInfo.busName,marginleft,0.5);
     pdf.setFontSize('10');
     pdf.setTextColor('gray');
     pdf.setLineHeightFactor(0.7);
     let yPos = 0.5
     pdf.text(" ",marginleft,calcVerticalSpacing(9,pdf,yPos+(9/72)));
     yPos = calcVerticalSpacing(9,pdf,yPos+(9/72));
     pdf.text('TIN Number: '+businessInfo.tin,marginleft,calcVerticalSpacing(9,pdf,yPos+(9/72)));
     yPos = calcVerticalSpacing(9,pdf,yPos+(9/72));
     pdf.text(businessInfo.busLocation,marginleft,calcVerticalSpacing(9,pdf,yPos+(9/72)));
     yPos = calcVerticalSpacing(9,pdf,yPos+(9/72));
     pdf.text(businessInfo.tel,marginleft,calcVerticalSpacing(9,pdf,yPos+(9/72)));
     yPos = calcVerticalSpacing(9,pdf,yPos+(9/72));
     pdf.text(businessInfo.busEmail,marginleft,calcVerticalSpacing(9,pdf,yPos+(9/72)));
    //line separator
    pdf.setLineWidth(1/72);
    pdf.setDrawColor('black');
    pdf.line(0.5,yPos1+0.5,pageWidth-0.5,yPos1+0.5);
    //Bill to layout
    pdf.setTextColor('black');
    yPos1 = yPos1+0.5+1/72;
    pdf.text('BILL TO:',margin, calcVerticalSpacing(10,pdf,yPos1+10/72));
    pdf.setFontSize('13');
    pdf.setLineHeightFactor(0.4)
    yPos1 = calcVerticalSpacing(13,pdf,yPos1+13/72);
    pdf.setTextColor(colors.BillTitleColor);
    pdf.text(String(customerInfo.custName),margin, calcVerticalSpacing(13,pdf,yPos1+13/72));
    yPos1 = calcVerticalSpacing(13,pdf,yPos1+13/72);
    pdf.setFontSize('10');
    pdf.text(' ',margin, calcVerticalSpacing(10,pdf,yPos1+10/72));
    pdf.setTextColor('gray');
    yPos1 = calcVerticalSpacing(10,pdf,yPos1+10/72);
    pdf.text(String(customerInfo.custAddress),margin, calcVerticalSpacing(10,pdf,yPos1+10/72));
    yPos1 = calcVerticalSpacing(10,pdf,yPos1+10/72);
    pdf.text(String(customerInfo.custTel_1),margin, calcVerticalSpacing(10,pdf,yPos1+10/72));
    yPos1 = calcVerticalSpacing(10,pdf,yPos1+10/72);
    pdf.text(String(customerInfo.custEmail),margin, calcVerticalSpacing(10,pdf,yPos1+10/72));
    //line separator
    pdf.setLineWidth(1/72);
    pdf.setDrawColor('black');
    pdf.line(0.5,yPos1+0.5,pageWidth-0.5,yPos1+0.5);
    //Table of items
    const descSpan = 3;
    const rateSpan = 2;
    const qtySpan = 1;
    const amtSpan = 2
    const amountLength = pdf.getTextWidth('AMOUNT')-0.2;
    
    //HEADER LAYOUT
    pdf.setTextColor('black');
    pdf.setFontSize('15');
    yPos1 = yPos1+0.6+1/72;
    pdf.text('DESCRIPTION',margin, calcVerticalSpacing(16,pdf,yPos1+16/72),{align:'left'});
    pdf.text('RATE',margin+descSpan, calcVerticalSpacing(16,pdf,yPos1+16/72),{align:'left'});
    pdf.text('QTY',margin+(descSpan+rateSpan), calcVerticalSpacing(16,pdf,yPos1+16/72),{align:'left'});
    pdf.text('AMOUNT',margin+(descSpan+rateSpan+qtySpan), calcVerticalSpacing(16,pdf,yPos1+16/72),{align:'left'});
    
    //line separator
    pdf.setLineWidth(1/72);
    pdf.setDrawColor('black');
    pdf.line(0.5,yPos1+0.5,pageWidth-0.5,yPos1+0.5);
    //END OF HEADER LAYOUT
    
    //CONTENT LAYOUT
    pdf.setFontSize('10')
    yPos1 = yPos1+0.6+1/72;
    content.map((item) => {
        pdf.text(item.itemName,margin, calcVerticalSpacing(10,pdf,yPos1+10/72),{align:'left'});
        pdf.text(item.salePrice,margin+descSpan, calcVerticalSpacing(10,pdf,yPos1+10/72),{align:'left'});
        pdf.text(String(item.saleQuantity),margin+(descSpan+rateSpan), calcVerticalSpacing(10,pdf,yPos1+10/72),{align:'left'});
        pdf.text(String(item.salePrice*item.saleQuantity),margin+(descSpan+rateSpan+qtySpan+amountLength), calcVerticalSpacing(10,pdf,yPos1+10/72),{align:'left'});
        yPos1 = calcVerticalSpacing(10,pdf,(yPos1+10/72)-0.5);
        //line separator
        pdf.setLineWidth(1/72);
        pdf.setDrawColor('black');
        pdf.setLineDashPattern([1/72]);
        pdf.line(0.5,yPos1+0.2,pageWidth-0.5,yPos1+0.2);
        yPos1 = yPos1+0.75;
        //END OF CONTENT LAYOUT 
    })
    
    //Footer
    //line separator
    pdf.setLineWidth(1/72);
    pdf.setDrawColor('black');
    pdf.setLineDashPattern();
    pdf.line(0.5,yPos1,pageWidth-0.5,yPos1);
    pdf.setFontSize('13')
    yPos1 = yPos1+1/72+0.1;
    pdf.text('TOTAL',margin+descSpan, calcVerticalSpacing(13,pdf,yPos1+13/72),{align:'left'});
    pdf.text('',margin+(descSpan+rateSpan), calcVerticalSpacing(13,pdf,yPos1+13/72),{align:'left'});
    pdf.setTextColor(colors.totalCostColor);
    pdf.text(String(totals.totalCost),margin+(descSpan+rateSpan+qtySpan+(amountLength-0.1)), calcVerticalSpacing(13,pdf,yPos1+13/72),{align:'left'});
    
    pdf.setLineWidth(1/72);
    pdf.setDrawColor('black');
    pdf.line(margin+descSpan,yPos1+0.5,pageWidth-0.5,yPos1+0.5);
    
    yPos1 = yPos1+0.6+1/72;
    pdf.setTextColor('black');
    pdf.text('BALANCE',margin+descSpan, calcVerticalSpacing(13,pdf,yPos1+13/72),{align:'left'});
    pdf.text('',margin+(descSpan+rateSpan), calcVerticalSpacing(13,pdf,yPos1+13/72),{align:'left'});
    pdf.setTextColor(colors.amountDueColor);
    pdf.text('UGX'+String(totals.balance),margin+(descSpan+rateSpan+qtySpan+(amountLength-0.1)), calcVerticalSpacing(13,pdf,yPos1+13/72),{align:'left'});
    //END LINE
    pdf.setLineWidth(1/72);
    pdf.setDrawColor('black');
    pdf.line(margin+descSpan,yPos1+0.5,pageWidth-0.5,yPos1+0.5);
    
    //SIGNATURE
    if(signURL != null){
    pdf.setFontSize('9');
    pdf.setTextColor('gray');
    pdf.addImage(signURL,'png',pageWidth-2,pageHeight-1.7,1,1);
    //signature date stamp
    pdf.text('Signed on',pageWidth-2,(pageHeight-2)+1.5);
    pdf.text(String(date),pageWidth-2,(pageHeight-2)+1.7);
  }
    //SIGNATURE
    
    //INVOICE BOTTON NOTE
    pdf.setFontSize('10');
    pdf.setTextColor('gray');
    pdf.text(endNote,margin,pageHeight-margin);
    //INVOICE BOTTON NOTE
    // pdf.context2d.save();
    const invoice = pdf.output('bloburl');
    console.log("outPut: "+ invoice);
    
    //  pdf.save('sampleInvoice.pdf');
   return invoice;
}


export default generateInvoice;
