import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf'
import format from 'date-fns/format';

const generateSalesReceipt = (items,total,cash, businessInfo, custName) => {
    const date = format(new Date(),'dd/MM/yyyy');
    const calcVerticalSpacing = (fontSize,doc, marginTop) =>{
        const spacing = ((fontSize*doc.getLineHeightFactor())/72)+marginTop;
        return spacing;
      }
    
      const layOut = new jsPDF('p','in','a4');
      let yPos1 = 0.3;
      const topHeight = (calcVerticalSpacing(9,layOut,1/72)+ ((calcVerticalSpacing(6,layOut,1/72)*3))) + calcVerticalSpacing(10,layOut,+1/72)+ calcVerticalSpacing(7,layOut,5/72);
    const itemsHeight = (calcVerticalSpacing(7,layOut,5/72)*items.length + 0.6);
    const summaryHeight = calcVerticalSpacing(10,layOut,5/72) + ((calcVerticalSpacing(9,layOut,5/72)*6));
    const len = (((((calcVerticalSpacing(7,layOut,5/72))))*3)+0.2*3);
    const totalHeight = topHeight+itemsHeight+summaryHeight+len;
    console.log("Top: "+topHeight);
    console.log("Items: "+itemsHeight);
    console.log("summary: "+summaryHeight);
    console.log("yPos: "+ len);
    console.log("Total: "+ totalHeight);
    // console.log("yPos1: "+(calcVerticalSpacing(6,layOut,yPos1+1/72))*2)
    
    const cashSale = new jsPDF('p','in',[2.165,(totalHeight)]);
    // [2.165,5]
    var pageHeight = cashSale.internal.pageSize.height || cashSale.internal.pageSize.getHeight();
    var pageWidth = cashSale.internal.pageSize.width || cashSale.internal.pageSize.getWidth();
    let marginleft = 0.1;
    let marginTop = 0.3;
    let margin =0.1;
    const center = pageWidth/2;
    let yPos = marginTop;
    
    // console.log(cashSale.getFontList());
    cashSale.setFont('Times New Romans','bold');
    cashSale.setFontSize(9)
    cashSale.text(String(businessInfo.busName),center-(cashSale.getTextWidth(String(businessInfo.busName))/2),marginTop);
    yPos = calcVerticalSpacing(9,cashSale,yPos+1/72);
    cashSale.setFont('Times New Romans','');
    cashSale.setFontSize(6)
    cashSale.text('Email: '+String(businessInfo.busEmail),center-(cashSale.getTextWidth('Email: '+String(businessInfo.busEmail))/2),yPos);
    yPos = calcVerticalSpacing(6,cashSale,yPos+1/72);
    cashSale.text('Tel: '+String(businessInfo.busContactOne) + '/' + String(businessInfo.busContactTwo) ,center-(cashSale.getTextWidth('Tel: '+String(businessInfo.busContactOne) + '/' + String(businessInfo.busContactTwo))/2),yPos);
    yPos = calcVerticalSpacing(6,cashSale,yPos+1/72);
    cashSale.text('Location: '+String(businessInfo.busLocation),center-(cashSale.getTextWidth('Location: '+String(businessInfo.busLocation))/2),yPos);
    yPos = calcVerticalSpacing(6,cashSale,yPos+1/72);
    cashSale.setLineWidth(1/72);
    cashSale.setDrawColor('black');
    cashSale.setLineDashPattern([2/72],0.5);
    cashSale.line(0.1,yPos,2.165-0.1,yPos);
    
    cashSale.setFontSize(10);
    cashSale.setFont('Times New Romans','bold');
    yPos = calcVerticalSpacing(10,cashSale,yPos+1/72);
    cashSale.text('SALES RECEIPT',center-(cashSale.getTextWidth('SALES RECEIPT')/2),yPos);
    yPos = yPos+0.1;
    cashSale.line(0.1,yPos,2.165-0.1,yPos);
    
    cashSale.setFontSize(7);
    yPos = calcVerticalSpacing(7,cashSale,yPos+5/72);
    cashSale.text("Qty",0.1,yPos);
    cashSale.text("Item Description",cashSale.getTextWidth('Qty')+0.3,yPos)
    cashSale.text("Price",(2.165-(cashSale.getTextWidth('Price')+0.1)),yPos)
    
    yPos = yPos+0.1;
    cashSale.line(0.1,yPos,2.165-0.1,yPos);
    // cashSale.setTextColor("gray")
    cashSale.setFont('Times New Romans','');
    
    items.map((item) => {
    yPos = calcVerticalSpacing(7,cashSale,yPos+5/72);
    cashSale.text(String(item.saleQuantity)+'x',0.1,yPos)
    cashSale.text(String(item.itemName),cashSale.getTextWidth('Qty')+0.3,yPos)
    cashSale.text(String(item.saleQuantity*item.salePrice)+' UGX',(2.165-(cashSale.getTextWidth(String(item.saleQuantity*item.salePrice)+' UGX')+0.1)),yPos)
    })
    
    cashSale.setFont('Times New Romans','bold');
    cashSale.setFontSize(10)
    yPos = calcVerticalSpacing(10,cashSale,yPos+5/72);
    cashSale.text(String(items.length)+'x Items Sold',center-(cashSale.getTextWidth(String(items.length)+'x Items Sold')/2),yPos);
    yPos=yPos+0.1
    cashSale.line(0.1,yPos,2.165-0.1,yPos);
    
    cashSale.setFontSize(9);
    yPos = calcVerticalSpacing(9,cashSale,yPos+5/72);
    cashSale.text("Sub Total:",0.1,yPos)
    cashSale.text(String(total)+' UGX',(2.165-(cashSale.getTextWidth(String(total)+' UGX')+0.1)),yPos)
    yPos =yPos+0.1
    cashSale.line(0.1,yPos,2.165-0.1,yPos);
    
    cashSale.setFont('Times New Romans','');
    yPos = calcVerticalSpacing(9,cashSale,yPos+5/72);
    cashSale.text("Discount:",0.1,yPos)
    cashSale.text("00.00 UGX",(2.165-(cashSale.getTextWidth('00.00 UGX')+0.1)),yPos)
    
    yPos = yPos+0.1;
    cashSale.line(0.1,yPos,2.165-0.1,yPos);
    cashSale.setFont('Times New Romans','bold');
    yPos = calcVerticalSpacing(9,cashSale,yPos+5/72);
    cashSale.text("Total:",0.1,yPos)
    cashSale.text(String(total)+' UGX',(2.165-(cashSale.getTextWidth(String(total)+' UGX')+0.1)),yPos)
    
    cashSale.setFont('Times New Romans','');
    yPos = calcVerticalSpacing(9,cashSale,yPos+5/72);
    cashSale.text("Cash",0.1,yPos)
    cashSale.text(String(cash),(2.165-(cashSale.getTextWidth(String(cash))+0.1)),yPos)
    yPos = yPos+0.1;
    cashSale.line(0.1,yPos,2.165-0.1,yPos);
    cashSale.setFont('Times New Romans','bold');
    yPos = calcVerticalSpacing(9,cashSale,yPos+5/72);
    cashSale.text("Change:",0.1,yPos)
    cashSale.text(String(cash - total)+' UGX',(2.165-(cashSale.getTextWidth(String(cash - total)+' UGX')+0.1)),yPos)
    yPos = yPos+0.1;
    cashSale.line(0.1,yPos,2.165-0.1,yPos);
    yPos = calcVerticalSpacing(9,cashSale,yPos+5/72);
    cashSale.text('THANK YOU',center-(cashSale.getTextWidth('THANK YOU')/2),yPos);
    
    cashSale.setFont('Times New Romans','');
    // yPos = calcVerticalSpacing(9,cashSale,yPos+5/72);
    
    cashSale.setFontSize(7);
    yPos = yPos+0.1;
    const pageH = totalHeight;
    console.log("pageH: "+pageH);
    cashSale.text("Customer Name:",0.1,pageH-0.5)
    cashSale.text(String(custName),(2.165-(cashSale.getTextWidth(String(custName))+0.1)),pageH-0.5)
    cashSale.line(0.1,pageH-0.4,2.165-0.1,pageH-0.4);
    cashSale.text("#1234",0.1,pageH-0.2);
    cashSale.text(String(date),cashSale.getTextWidth('#1234')+0.2,pageH-0.2);
    cashSale.text("6:05pm",(2.165-(cashSale.getTextWidth('3:04pm')+0.1)),pageH-0.2);
    cashSale.line(0.1,pageH-0.1,2.165-0.1,pageH-0.1);
    cashSale.autoPrint();
    cashSale.output('dataurlnewwindow');
    // cashSale.save('cashSale.pdf');
  return (
    <div>
      
    </div>
  );
}

export default generateSalesReceipt;
