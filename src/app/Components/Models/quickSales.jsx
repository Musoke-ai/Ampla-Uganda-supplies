import React, { useState } from 'react';
import { Form, Button, InputGroup, FormControl, Card, Row, Col } from 'react-bootstrap';

const productsMock = [
  { id: 1, name: "Product A", price: 5000 },

];

export default function POSS() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [amountPaid, setAmountPaid] = useState(0);

  const filteredProducts = productsMock.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, qty) => {
    setCart(prev =>
      prev.map(item => item.id === id ? { ...item, qty: qty } : item)
    );
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;
  const change = amountPaid - total;

  return (
    <div className="container py-4">
      <Row>
        {/* Product List */}
        <Col md={5}>
          <FormControl
            placeholder="Search product"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-3"
          />
          <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'hidden' }}>
            {filteredProducts.map(product => (
              <Card key={product.id} className="mb-2">
                <Card.Body className="d-flex justify-content-between align-items-center">
                  <div>{product.name}</div>
                  <Button onClick={() => addToCart(product)}>Add</Button>
                </Card.Body>
              </Card>
            ))}
          </div>
        </Col>

        {/* Cart */}
        <Col md={7}>
          <Card>
            <Card.Body>
              <h5>Cart</h5>
              <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'hidden' }}>
                {cart.map(item => (
                  <div key={item.id} className="d-flex justify-content-between align-items-center mb-2">
                    <div>{item.name}</div>
                    <FormControl
                      type="number"
                      style={{ width: '60px' }}
                      value={item.qty}
                      onChange={(e) => updateQty(item.id, parseInt(e.target.value))}
                    />
                    <div>UGX {item.qty * item.price}</div>
                    <Button variant="danger" size="sm" onClick={() => removeFromCart(item.id)}>🗑</Button>
                  </div>
                ))}
              </div>

              <hr />
              <div className="mb-2">Subtotal: UGX {subtotal}</div>
              <div className="mb-2">Tax (5%): UGX {tax}</div>
              <div className="mb-2 font-weight-bold">Total: UGX {total}</div>

              <Form.Select
                className="mb-2"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{height:'2.2rem'}}
              >
                <option value="">Select Payment Method</option>
                <option value="cash">Cash</option>
                <option value="mobile">Mobile Money</option>
                <option value="card">Card</option>
              </Form.Select>

              <FormControl
                type="number"
                placeholder="Amount Paid"
                className="mb-2"
                value={amountPaid}
                style={{height:'2.2rem'}}
                onChange={(e) => setAmountPaid(parseFloat(e.target.value))}
              />

              <div className="mb-2">Change: UGX {change > 0 ? change : 0}</div>

              <FormControl className="mb-2" placeholder="Customer Name (optional)" />

              <div className="d-grid gap-2">
                <Button variant="success">Complete Sale</Button>
                <Button variant="outline-secondary">Hold Order</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}



// import { useState } from 'react';
// // import { Card, CardContent } from "@/components/ui/card";
// // import { Input } from "@/components/ui/input";
// // import { Button, Input, Card } from "react-bootstrap";
// // import { Button } from 'react-bootstrap';
// // import {Card} from '@mui/material';
// import { Input } from '@mui/material';
// // import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
// import { Card, Button, Form, InputGroup } from 'react-bootstrap'
// import { Search } from 'react-bootstrap-icons';

// import { Add } from '@mui/icons-material';
// const productsMock = [
//   { id: 1, name: "Product A", price: 5000 },
//   { id: 2, name: "Product B", price: 3000 },
//   { id: 3, name: "Product C", price: 7000 },
//   { id: 4, name: "Product D", price: 4500 },
// ];

// export default function POSS() {
//   const [search, setSearch] = useState('');
//   const [cart, setCart] = useState([]);
//   const [paymentMethod, setPaymentMethod] = useState('');
//   const [amountPaid, setAmountPaid] = useState(0);

//   const filteredProducts = productsMock.filter(p =>
//     p.name.toLowerCase().includes(search.toLowerCase())
//   );

//   const addToCart = (product) => {
//     setCart(prev => {
//       const existing = prev.find(item => item.id === product.id);
//       if (existing) {
//         return prev.map(item =>
//           item.id === product.id ? { ...item, qty: item.qty + 1 } : item
//         );
//       }
//       return [...prev, { ...product, qty: 1 }];
//     });
//   };

//   const updateQty = (id, qty) => {
//     setCart(prev =>
//       prev.map(item => item.id === id ? { ...item, qty: qty } : item)
//     );
//   };

//   const removeFromCart = (id) => {
//     setCart(prev => prev.filter(item => item.id !== id));
//   };

//   const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
//   const tax = subtotal * 0.05;
//   const total = subtotal + tax;
//   const change = amountPaid - total;

//   return (
//     <div>

//       <div className='d-flex justify-content-between'>
//  <div >
//    <div className='d-flex justify-content-center my-4'>
//               <InputGroup style={{maxWidth: '400px'}}>
//               <InputGroup.Text>
//               <Search />
//               </InputGroup.Text>
//               <Form.Control 
//               type="text"
//               placeholder='Search products...'
//               aria-label="Saerch"
//               />
//               </InputGroup>
//             </div>
// <Card style={{width:'500px', height:"70vh", overflowX:'hidden', overflowY:'auto'}}>
//   <Card.Body> 
//   {filteredProducts.map(product => (
//           <div key={product.id}>
//              <div className="p-2 d-flex gap-2 align-items-center justify-content-between">
//                 <div className="text-sm font-bold">{product.name}</div>
//                 {/* <div className="text-sm">UGX {product.price}</div> */}
//               <div><Button className="mt-2 btn btn-sm btn-dark" onClick={() => addToCart(product)}> <Add /> </Button></div>
//              </div>
//            </div>
//          ))}
//   </Card.Body>
// </Card>
//  </div>

//   <div>
//     <Card style={{height:"82vh", width:'650px'}}>
//       <Card.Body>

//         <div
//         style={{
//           width:'100%',
//           display:'grid',
//           gridTemplateRows:' 0.2fr 1.3fr 0.6fr',
//           gap:'5px'
//         }}
//         >
//           <div style={{width:'100%'}}>
//             <Button className='btn btn-success btn-sm w-full'>Select Customer</Button>
//           </div>
//         <div style={{overflowX:'hidden', overflowY:'auto', height:'300px'}} className='bg-light p-2 mb-3 rounded'>

//         {/* <div className='d-flex justify-content-between mt-1 mb-1'>
//         <div>Product 1</div>
//         <div>
//           <input
//           type='text'
//           placeholder='Price'
//           value={2000}
//           />
//         </div>
//         <div>
//           <input
//           style={{width:"6rem", height:'2rem', borderRadius:'10%'}}
//           className='bg-dark text-white p-2'
//           type='number'
//           value={4}
//           />
//         </div>
//         </div> */}

//         <div className='w-100 h-100 text-center d-flex align-items-center justify-content-center'>
// <div className='bg-white p-2 rounded shadow-sm fw-bold'>
//   Add Products to sell
// </div>
//         </div>

//         <div>
//         </div>
//         </div>

//         <div>
//           <Card style={{width:'100%', height:'100%'}}>
//   <Card.Body>
//  <div className="">

// <div className='d-flex justify-content-between'>
//   <div><span className='fw-bold'>Total Cost:</span> 35000.00</div>
//   <div><span className='fw-bold'>Items Quantity:</span> 100</div>
// </div>

// <div>
//   <Form>
//     <div className='d-flex'>
//       <div>
//  <Form.Label for="tax">Tax(%)</Form.Label>
//    <Form.Control
//    id="tax"
//    type='text'
//    className='w-50'
//    />
//       </div>
//       <div>
//    <Form.Label for="discount">Discount</Form.Label>
//    <Form.Control
//    id="discount"
//    type='text'
//    className='w-50'
//    />
//       </div>
//     </div>
//   </Form>
// </div>
//          <div className="d-flex mt-2 justify-content-between gap-2 fw-bold">
//           <div className='w-50'> <Button variant='danger' className="w-100 fw-bold shadow-sm">Hold Sale</Button></div>
//           <div className='w-50'><Button variant="warning" className="w-100 fw-bold shadow-sm">Check Out</Button></div>   
//          </div>
//         </div>
//   </Card.Body>
// </Card>
//         </div>

// </div>
//       </Card.Body>
//     </Card>
//   </div>

//       </div>
      
//     </div>
    // <div className="grid grid-cols-3 gap-4 p-4">
    //   {/* Product Selection */}
    //   <div className="col-span-2">
    //     <Input
    //       placeholder="Search product"
    //       value={search}
    //       onChange={(e) => setSearch(e.target.value)}
    //       className="mb-4"
    //     />
    //     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    //       {filteredProducts.map(product => (
    //         <div className='card' key={product.id}>
    //           <div className="card-body p-4 text-center">
    //             <div className="text-sm font-bold">{product.name}</div>
    //             <div className="text-sm">UGX {product.price}</div>
    //             <Button className="mt-2 w-full" onClick={() => addToCart(product)}>ADD</Button>
    //           </div>
    //         </div>
    //       ))}
    //     </div>
    //   </div>

    //   {/* Cart & Checkout */}
    //   <div className="bg-white rounded-xl shadow p-4">
    //     <h2 className="font-bold mb-2">Cart</h2>
    //     <div className="text-sm mb-2">
    //       {cart.map(item => (
    //         <div key={item.id} className="flex justify-between items-center mb-2">
    //           <div>{item.name}</div>
    //           <Input
    //             type="number"
    //             className="w-16"
    //             value={item.qty}
    //             onChange={(e) => updateQty(item.id, parseInt(e.target.value))}
    //           />
    //           <div>UGX {item.qty * item.price}</div>
    //           <Button size="sm" variant="ghost" onClick={() => removeFromCart(item.id)}>🗑</Button>
    //         </div>
    //       ))}
    //     </div>

    //     <div className="border-t pt-2 mt-2 text-sm">
    //       <div className="flex justify-between"><span>Subtotal</span><span>UGX {subtotal}</span></div>
    //       <div className="flex justify-between"><span>Tax (5%)</span><span>UGX {tax}</span></div>
    //       <div className="flex justify-between font-bold"><span>Total</span><span>UGX {total}</span></div>
    //     </div>

    //     <div className="mt-4 space-y-2">
    //       {/* <Select onValueChange={setPaymentMethod}>
    //         <SelectTrigger><SelectValue placeholder="Payment Method" /></SelectTrigger>
    //         <SelectContent>
    //           <SelectItem value="cash">Cash</SelectItem>
    //           <SelectItem value="mobile">Mobile Money</SelectItem>
    //           <SelectItem value="card">Card</SelectItem>
    //         </SelectContent>
    //       </Select> */}

    //       <Input
    //         placeholder="Amount Paid"
    //         type="number"
    //         value={amountPaid}
    //         onChange={(e) => setAmountPaid(parseFloat(e.target.value))}
    //       />

    //       <div className="text-sm">Change: UGX {change > 0 ? change : 0}</div>

    //       <Input placeholder="Customer Name (optional)" />

    //       <div className="flex gap-2 mt-2">
    //         <Button className="w-full">Complete Sale</Button>
    //         <Button variant="outline" className="w-full">Hold Order</Button>
    //       </div>
    //     </div>
    //   </div>
    // </div>
  // );
// }


// import React, { useState, useEffect, useRef } from 'react';
// import { useSelector } from 'react-redux';
// import { selectStock } from '../../features/stock/stockSlice';
// import { useMakeSalesMutation } from '../../features/api/salesSlice';
// import Fuse from 'fuse.js';
// import { Button, Form, Row, Col, Spinner, InputGroup, FormControl, Card } from 'react-bootstrap';
// import IncDecCounter from '../actions/IncDecCounter';
// import PriceInput from '../actions/PriceInput';
// import CustomerSelection from './CustomerSelection';
// import CurrencyFormat from 'react-currency-format';
// import generateReceipt from '../../documents/functions/generateReceipt';

// const QuickSales = () => {
//   const businessInfo = useSelector(state => state.auth.profile);
//   const businessId = businessInfo?.busId;
//   const stock = useSelector(selectStock).filter(item => item.itemQuantity > 0);

//   const [makeSales, { data, isLoading, isSuccess, isError }] = useMakeSalesMutation();

//   const [fuse, setFuse] = useState(null);
//   const [query, setQuery] = useState('');
//   const [filteredStock, setFilteredStock] = useState(stock);

//   const [selectedItems, setSelectedItems] = useState([]);
//   const [custId, setCustId] = useState(null);
//   const [customer, setCustomer] = useState(null);
//   const [paymentMethod, setPaymentMethod] = useState('cash');
//   const [amountPaid, setAmountPaid] = useState('');
//   const [showCheckout, setShowCheckout] = useState(false);
//   const [receiptNo, setReceiptNo] = useState('');
//   const [showToast, setShowToast] = useState(false);

//   useEffect(() => {
//     setFuse(new Fuse(stock, { threshold: 0.2, keys: ['itemName', 'itemModel'] }));
//   }, [stock]);

//   useEffect(() => {
//     if (!fuse) return;
//     if (query.trim() === '') {
//       setFilteredStock(stock);
//     } else {
//       const results = fuse.search(query).map(r => r.item);
//       setFilteredStock(results);
//     }
//   }, [query, fuse, stock]);

//   const addProduct = (item) => {
//     if (selectedItems.some(i => i.itemId === item.itemId)) return;
//     setSelectedItems(prev => [
//       ...prev,
//       {
//         ...item,
//         saleQuantity: 1,
//         salePrice: item.itemLeastPrice,
//       },
//     ]);
//   };

//   const updateItem = (id, field, value) => {
//     setSelectedItems(prev =>
//       prev.map(item =>
//         item.itemId === id ? { ...item, [field]: value } : item
//       )
//     );
//   };

//   const removeProduct = (id) => {
//     setSelectedItems(prev => prev.filter(item => item.itemId !== id));
//   };

//   const totalCost = selectedItems.reduce(
//     (sum, item) => sum + item.saleQuantity * item.salePrice, 0
//   );
//   const totalProducts = selectedItems.reduce(
//     (sum, item) => sum + item.saleQuantity, 0
//   );

//   const handleCheckout = async () => {
//     const payloadItems = selectedItems.map(item => ({
//       ...item,
//       custId,
//       saleOwner: businessId,
//       saleItemId: item.itemId,
//     }));
//     const res = await makeSales({ saleItems: payloadItems }).unwrap();
//     setReceiptNo(res.receiptNumber);
//     setShowToast(true);
//   };

//   const handleGenerateReceipt = () => {
//     generateReceipt(
//       businessInfo,
//       selectedItems,
//       receiptNo,
//       stock,
//       customer
//     );
//     reset();
//   };

//   const reset = () => {
//     setSelectedItems([]);
//     setCustId(null);
//     setCustomer(null);
//     setPaymentMethod('cash');
//     setAmountPaid('');
//     setShowCheckout(false);
//     setShowToast(false);
//     setReceiptNo('');
//   };

//   return (
//     <Row>
//       {/* Product list with search */}
//       <Col md={6}>
//         <InputGroup className="mb-3">
//           <FormControl
//             placeholder="Search product..."
//             value={query}
//             onChange={e => setQuery(e.target.value)}
//           />
//         </InputGroup>
//         <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
//           {filteredStock.map(item => (
//             <Card key={item.itemId} className="mb-2">
//               <Card.Body>
//                 <Row>
//                   <Col>{item.itemName}</Col>
//                   <Col className="text-end">
//                     <Button onClick={() => addProduct(item)}>Add</Button>
//                   </Col>
//                 </Row>
//               </Card.Body>
//             </Card>
//           ))}
//         </div>
//       </Col>

//       {/* Selected items and transaction form */}
//       <Col md={6}>
//         <h5>Selected Items</h5>
//         {selectedItems.map(item => (
//           <Card key={item.itemId} className="mb-2">
//             <Card.Body>
//               <Row className="align-items-center">
//                 <Col>{item.itemName}</Col>
//                 <Col xs={3}>
//                   <PriceInput
//                     item={item}
//                     calcTotal={() => updateItem(item.itemId, 'salePrice', item.salePrice)}
//                   />
//                 </Col>
//                 <Col xs={2}>
//                   <IncDecCounter
//                     _item={item}
//                     calTotal={() =>
//                       updateItem(item.itemId, 'saleQuantity', item.saleQuantity)
//                     }
//                     setTotalProducts={() =>
//                       updateItem(item.itemId, 'saleQuantity', item.saleQuantity)
//                     }
//                     calTotalProducts={() =>
//                       updateItem(item.itemId, 'saleQuantity', item.saleQuantity)
//                     }
//                   />
//                 </Col>
//                 <Col xs={1}>
//                   <Button
//                     variant="danger"
//                     size="sm"
//                     onClick={() => removeProduct(item.itemId)}
//                   >
//                     X
//                   </Button>
//                 </Col>
//               </Row>
//             </Card.Body>
//           </Card>
//         ))}

//         <div className="mt-3">
//           <Form.Group className="mb-2">
//             <Form.Label>Select Customer</Form.Label>
//             <CustomerSelection
//               setCustId={setCustId}
//               setCustomer={setCustomer}
//               custId={custId}
//             />
//           </Form.Group>

//           <Form.Group className="mb-2">
//             <Form.Label>Payment Method</Form.Label>
//             <Form.Select
//               value={paymentMethod}
//               onChange={e => setPaymentMethod(e.target.value)}
//             >
//               <option value="cash">Cash</option>
//               <option value="onDelivery">Cash on Delivery</option>
//             </Form.Select>
//           </Form.Group>

//           <p>Total Products: <strong>{totalProducts}</strong></p>
//           <p>
//             Total Cost:{' '}
//             <strong>
//               <CurrencyFormat
//                 value={totalCost}
//                 displayType={'text'}
//                 thousandSeparator
//                 prefix={'UGX '}
//               />
//             </strong>
//           </p>

//           <Button
//             variant="primary"
//             disabled={selectedItems.length === 0 || !custId}
//             onClick={() => setShowCheckout(true)}
//           >
//             Continue to Checkout
//           </Button>

//           {showCheckout && (
//             <Form className="mt-3">
//               <Form.Group className="mb-2">
//                 <Form.Label>Amount Paid</Form.Label>
//                 <Form.Control
//                   type="number"
//                   value={amountPaid}
//                   onChange={e => setAmountPaid(e.target.value)}
//                   min={0}
//                 />
//               </Form.Group>

//               <Button
//                 variant="success"
//                 disabled={isLoading}
//                 onClick={handleCheckout}
//               >
//                 {isLoading ? (
//                   <>
//                     <Spinner animation="border" size="sm" /> Processing...
//                   </>
//                 ) : (
//                   'Complete Sale'
//                 )}
//               </Button>
//             </Form>
//           )}
//         </div>
//       </Col>

//       {/* Success toast */}
//       {isSuccess && (
//         <div className="position-fixed bottom-0 end-0 m-3">
//           <div className="toast show bg-success text-white">
//             <div className="toast-header">
//               <strong className="me-auto">Quick Sale</strong>
//               <Button
//                 variant="light"
//                 size="sm"
//                 onClick={() => setShowToast(false)}
//               >
//                 ×
//               </Button>
//             </div>
//             <div className="toast-body">
//               Sale saved! Receipt No: {receiptNo}.
//               <div className="d-flex mt-2 justify-content-end">
//                 <Button
//                   size="sm"
//                   variant="info"
//                   onClick={handleGenerateReceipt}
//                 >
//                   Print Receipt
//                 </Button>
//                 <Button size="sm" variant="danger" onClick={reset} className="ms-2">
//                   Done
//                 </Button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </Row>
//   );
// };

// export default QuickSales;
