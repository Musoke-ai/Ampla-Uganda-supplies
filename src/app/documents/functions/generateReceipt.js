import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import React from 'react';
import img1 from '../../icons/document/img_461192.png'
import ProductExcerpty from '../../Components/excerpts/ProductExcerpty';
import format from 'date-fns/format';
import CurrencyFormat from 'react-currency-format';

const generateReceipt = (
    businessInfo,
    receiptItems,
    receiptNumber,
    products
) => {
    const totalAmount = receiptItems.reduce((accumulator, item) => {
        return accumulator += Number(item.saleQuantity)*Number(item.salePrice)
    }, 0)

    const extractItem =(itemId)=>{
        let itemName;
        products.map((product) => {
          if(Number(product.itemId) === Number(itemId)){
            itemName = product.itemName;
          }
        })
        return itemName
      }

    const doc = new jsPDF();
    // doc.addImage(img1, 12, 10, 40, 50);
    autoTable(doc, {
      body: [
        [
            // {
            //     content: doc.addImage(img1)
            // },
          {
            content: businessInfo.busName,
            styles: {
              halign: 'left',
              fontSize: 20,
              textColor: '#ffffff'
            }
          },
          {
            content: 'Sales Receipt',
            styles: {
              halign: 'right',
              fontSize: 20,
              textColor: '#ffffff'
            }
          }
        ],
      ],
      theme: 'plain',
      styles: {
        fillColor: '#36454F'
      }
    });

    autoTable(doc, {
      body: [
        [
            {
                content: 'From:'
                +'\n'+businessInfo.busName
                +'\n'+businessInfo.busBuilding
                +'\n'+businessInfo.busLocation
                +'\nTell: '+businessInfo.busContactOne+' / '+businessInfo.busContactTwo
                +'\nEmail: '+businessInfo.busEmail,
                styles: {
                  halign: 'left'
                }
              },
          {
            content: 'Reference: #SR'+receiptNumber
            +'\nDate: '+format(new Date(),'MMM-dd-yyyy')
            +'\nReceipt number: '+receiptNumber,
            styles: {
              halign: 'right'
            }
          }
        ],
      ],
      theme: 'plain'
    });

    autoTable(doc, {
      body: [
        [
          {
            content: 'Sales Receipt To:'
            +'\n'+ receiptItems[0]?.custName,
            styles: {
              halign:'left',
              fontSize: 14
            }
          }
        ]
      ],
      theme: 'plain'
    });

    autoTable(doc, {
      head: [['#', 'Items', 'Quantity', 'Price', 'Amount']],
     body: receiptItems.map((item,index)=>{
        return [
            index+1,
            extractItem(item.saleItemId),
            item.saleQuantity,
            'Ush'+item.salePrice,
            'Ush'+Number(item.salePrice)*Number(item.saleQuantity),
        ]
     })
      ,
      theme: 'striped',
      headStyles:{
        fillColor: '#343a40'
      }
    });

    autoTable(doc, {
      body: [
        [
          {
            content: 'Subtotal:',
            styles:{
              halign:'right'
            }
          },
          {
            content: 'Ush'+totalAmount,
            styles:{
              halign:'right'
            }
          },
        ],
        [
          {
            content: 'Total amount:',
            styles:{
              halign:'right'
            }
          },
          {
            content: 'Ush'+totalAmount,
            styles:{
              halign:'right'
            }
          },
        ],
      ],
      theme: 'plain'
    });

    autoTable(doc, {
      body: [
        [
          {
            content: 'Received With Thanks!',
            styles: {
              halign: 'center',
              fontSize: 12,
              fontStyle: 'bold'
            }
          }
        ]
      ],
      theme: "plain"
    });

    return doc.save("invoice");

}
export default generateReceipt;
