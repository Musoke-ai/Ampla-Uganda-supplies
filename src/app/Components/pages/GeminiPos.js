import { useState, useEffect, useMemo, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  ListGroup,
  Modal,
  InputGroup,
  Badge, // Added for price type indicator
} from "react-bootstrap";
import { useSelector } from "react-redux";
import { selectStock } from "../../features/stock/stockSlice";
import { useMakeSalesMutation } from "../../features/api/salesSlice";
import CustomerSelection from "../Models/CustomerSelection";
import { PauseFill, PlayFill, Trash3Fill, XCircleFill, ArrowRepeat } from "react-bootstrap-icons";
import PermissionWrapper from "../../auth/PermissionWrapper";
import { useSettings } from "../Settings";
import { selectProfile } from "../../auth/authSlice";
import { ReceiptTemplate } from "../receipts/Receipt";
import { toast } from "react-toastify";

function PosPage() {
  // --- STATE MANAGEMENT ---

   const receiptRef = useRef();

  const { settings } = useSettings();
  const receiptTemplate = settings?.receiptTemplate;
  const companyProfile = useSelector(selectProfile);
  // console.log("receiptTemplate: ", receiptTemplate);

  const products = useSelector(selectStock);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [tenderedAmount, setTenderedAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [custId, setCustId] = useState("");
  const [customer, setCustomer] = useState(null); // Initialize as null
  const [moreInfo, setMoreInfo] = useState("");
  const [endDate, setEndDate] = useState("");

  const [defaultPriceType, setDefaultPriceType] = useState("retail"); // 'retail' or 'wholesale'
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState("");
  const [heldSales, setHeldSales] = useState([]);
  const [showHeldSalesModal, setShowHeldSalesModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // --- STYLES ---
const styles = `
    .pos-page-container {
        font-family: 'Inter', sans-serif;
        // background-color: #f8f9fa;
        height: 100vh;
        display: flex;
        flex-direction: column;
    }
    .main-content {
        flex-grow: 1;
        overflow: hidden;
    }
    .product-grid {
        height: calc(100vh - 250px);
        overflow-y: auto;
    }
    .cart-items {
        height: calc(100% - 350px);
        overflow-y: auto;
    }
    .product-card {
        cursor: pointer;
        transition: all 0.2s ease-in-out;
    }
    .product-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .quantity-btn {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .price-toggle-btn {
        cursor: pointer;
    }
`;

  const [makeSale, { isLoading }] = useMakeSalesMutation();

  useEffect(() => {
    const savedSales = JSON.parse(localStorage.getItem("heldSales") || "[]");
    setHeldSales(savedSales);
  }, []);

  // --- CART LOGIC ---
  const addProductToCart = (product) => {
    const salePrice =
      defaultPriceType === "wholesale"
        ? product.itemStockPrice
        : product.itemLeastPrice;

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.itemId === product.itemId);
      if (existingItem) {
        return prevCart.map((item) =>
          item.itemId === product.itemId
            ? { ...item, itemQuantity: item.itemQuantity + 1 }
            : item
        );
      }
      return [
        ...prevCart,
        { ...product, itemQuantity: 1, salePrice: salePrice },
      ];
    });
  };

  const updateQuantity = (productId, change) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.itemId === productId
            ? { ...item, itemQuantity: Math.max(0, item.itemQuantity + change) }
            : item
        )
        .filter((item) => item.itemQuantity > 0)
    );
  };
  
  // --- NEW: Toggle price for a specific item in the cart ---
  const handleTogglePriceInCart = (itemId) => {
    setCart(cart.map(item => {
        if (item.itemId === itemId) {
            // Toggle between retail and wholesale price
            const newPrice = item.salePrice === item.itemLeastPrice ? item.itemStockPrice : item.itemLeastPrice;
            return { ...item, salePrice: newPrice };
        }
        return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount("");
    setTenderedAmount("");
    setMoreInfo("");
    setCustId("");
    setCustomer(null);
    setEndDate("");
  };

  // --- HELD SALES LOGIC ---
  const handleHoldSale = () => {
    if (cart.length === 0) return;
    const newHeldSale = {
      id: Date.now(),
      cart,
      customer, // customer is an object
      custId,
      discount,
      taxRate,
      time: new Date().toLocaleTimeString(),
    };
    const updatedHeldSales = [...heldSales, newHeldSale];
    setHeldSales(updatedHeldSales);
    localStorage.setItem("heldSales", JSON.stringify(updatedHeldSales));
    clearCart();
  };

  const handleResumeSale = (saleId) => {
    const saleToResume = heldSales.find((sale) => sale.id === saleId);
    if (saleToResume) {
      setCart(saleToResume.cart);
      setCustomer(saleToResume.customer);
      setCustId(saleToResume.custId);
      setDiscount(saleToResume.discount);
      setTaxRate(saleToResume.taxRate);
      handleDeleteHeldSale(saleId);
    }
    setShowHeldSalesModal(false);
  };

  const handleDeleteHeldSale = (saleId) => {
    const updatedHeldSales = heldSales.filter((sale) => sale.id !== saleId);
    setHeldSales(updatedHeldSales);
    localStorage.setItem("heldSales", JSON.stringify(updatedHeldSales));
  };

  // --- PAYMENT & SALE COMPLETION ---
  const handleShowPaymentModal = () => {
    if (cart.length > 0) setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => setShowPaymentModal(false);

  const { subtotal, discountAmount, taxAmount, total } = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + item.salePrice * item.itemQuantity, 0);
    const discountAmount = parseFloat(discount) || 0;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxRate / 100);
    const total = taxableAmount + taxAmount;
    return { subtotal, discountAmount, taxAmount, total };
  }, [cart, discount, taxRate]);

  const changeDue = useMemo(() => {
    const tendered = parseFloat(tenderedAmount) || 0;
    return tendered - total;
  }, [tenderedAmount, total]);

  const dueAmount = useMemo(() => -changeDue, [changeDue]);

  const completeSale = async () => {
    const payloadItems = cart.map((item) => ({
      custId,
      saleQuantity: item.itemQuantity,
      salePrice: item.salePrice,
      saleItemId: item.itemId,
    }));
    const saleDetails = {
      custId,
      paymentMethod,
      tenderedAmount: parseFloat(tenderedAmount) || 0,
      discount: discountAmount,
      tax: taxAmount,
      total,
      dueAmount: dueAmount > 0 ? dueAmount : 0,
      endDate: dueAmount > 0 ? endDate : null,
      moreInfo,
    };
    try {
      await makeSale({ saleItems: payloadItems, saleDetails }).unwrap();
  toast.success('Sale successfull');
    // 3. Reset your POS for the next sale
    // ... clear cart, etc.
      setShowReceiptModal(true);
      handleClosePaymentModal();
    } catch (error) {
     toast.error('Error occured during the sale'+error?.status);
    }
  };

  const filteredProducts = useMemo(
    () => products.filter(
        (p) =>
          p.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.itemModel?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [products, searchTerm]
  );

  return (
    <div className="pos-page-container">
      <style>{styles}</style>
      <Container fluid className="p-3 main-content">
        <Row className="h-100">
          {/* Product Grid */}
          <Col md={7} lg={8} className="d-flex flex-column h-100">
            <Card className="flex-grow-1 shadow-sm">
              <Card.Header className="d-flex justify-content-between align-items-center">
                 <Form.Control
                    type="text"
                    placeholder="Search products by name or model..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="me-3"
                  />
                  <Form.Check 
                    type="switch"
                    id="price-type-switch"
                    label={defaultPriceType === 'retail' ? 'Default: Retail' : 'Default: Wholesale'}
                    checked={defaultPriceType === 'retail'}
                    onChange={() => setDefaultPriceType(defaultPriceType === 'retail' ? 'wholesale' : 'retail')}
                  />
              </Card.Header>
              <Card.Body className="product-grid p-3">
                <Row xs={2} sm={3} md={3} lg={4} xl={5} className="g-3">
                  {filteredProducts.map((product) => (
                    <Col key={product.itemId}>
                      <Card className="h-100 product-card" onClick={() => addProductToCart(product)}>
                        <Card.Body className="d-flex flex-column p-2">
                          <Card.Title className="fs-6 fw-bold mb-1">{product.itemName}</Card.Title>
                          <Card.Text className="text-muted small">Model: {product.itemModel}</Card.Text>
                           <p className="mt-auto fw-bold text-primary mb-0">Retail: {settings?.currency!=='none'?settings?.currency:""}{product.itemLeastPrice}</p>
                          <p className="fw-normal text-secondary small mb-0">Wholesale: {settings?.currency!=='none'?settings?.currency:""}{product.itemStockPrice}</p>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* Cart Section */}
          <Col md={5} lg={4} className="d-flex flex-column h-100">
            <Card className="flex-grow-1 shadow-sm">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Current Sale</h5>
                <div>
                   <Button variant="outline-warning" size="sm" onClick={() => setShowHeldSalesModal(true)} className="me-2">
                    <PauseFill /> Held ({heldSales.length})
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={clearCart} disabled={cart.length === 0}>
                   <XCircleFill /> Clear
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="d-flex flex-column p-0">
                <ListGroup variant="flush" className="flex-grow-1 cart-items">
                  {cart.length === 0 ? (
                    <p className="text-center text-muted p-5">Cart is empty.</p>
                  ) : (
                    cart.map((item) => (
                      <ListGroup.Item key={item.itemId} className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <p className="fw-bold mb-0">{item.itemName}</p>
                          <p className="text-muted small mb-0" onClick={() => handleTogglePriceInCart(item.itemId)}>
                            <Badge pill bg={item.salePrice === item.itemLeastPrice ? "info" : "secondary"} className="price-toggle-btn">
                               {item.salePrice === item.itemLeastPrice ? "Retail" : "W/S"} <ArrowRepeat size={10} />
                            </Badge>
                             <span className="ms-2">@ {settings?.currency!=='none'?settings?.currency:""}{item.salePrice}</span>
                          </p>
                        </div>
                        <div className="d-flex align-items-center">
                          <Button variant="light" size="sm" className="quantity-btn" onClick={() => updateQuantity(item.itemId, -1)} >-</Button>
                          <span className="mx-2 fw-medium">{item.itemQuantity}</span>
                          <Button variant="light" size="sm" className="quantity-btn" onClick={() => updateQuantity(item.itemId, 1)} >+</Button>
                        </div>
                        <div className="ms-3 text-end" style={{ width: "80px" }}>
                          <span className="fw-bold">{settings?.currency!=='none'?settings?.currency:""}{item.salePrice * item.itemQuantity}</span>
                        </div>
                      </ListGroup.Item>
                    ))
                  )}
                </ListGroup>
                
                {/* Calculation Section */}
                <div className={`p-3 border-top ${settings.theme==='dark'?'bg-dark':'bg-light'}`}>
                    <CustomerSelection setCustId={setCustId} setCustomer={setCustomer} />
                    <Row className="g-2 mb-3">
                        <Col>
                            <InputGroup><InputGroup.Text>Discount</InputGroup.Text><Form.Control type="number" placeholder="0.00" value={discount} onChange={(e) => setDiscount(e.target.value)} /></InputGroup>
                        </Col>
                        <Col>
                            <InputGroup><InputGroup.Text>Tax</InputGroup.Text><Form.Control type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} /><InputGroup.Text>%</InputGroup.Text></InputGroup>
                        </Col>
                    </Row>
                    <div className='mt-4 p-2'>
                  <div className="d-flex justify-content-between text-muted"><span>Subtotal</span> <span className="fw-medium">{settings?.currency!=='none'?settings?.currency:""}{subtotal}</span></div>
                  <div className="d-flex justify-content-between text-muted"><span>Discount</span> <span className="fw-medium text-danger">-{settings?.currency!=='none'?settings?.currency:""}{discountAmount}</span></div>
                  <div className="d-flex justify-content-between text-muted"><span>Tax ({taxRate}%)</span> <span className="fw-medium">{settings?.currency!=='none'?settings?.currency:""}{taxAmount}</span></div>
                 </div>

                  <hr />
                  <div className="d-flex justify-content-between fs-4 fw-bold"><span>Total</span> <span>{settings?.currency!=='none'?settings?.currency:""+total}</span></div>
                  <div className="d-grid gap-2 mt-3">
                    <PermissionWrapper
                    required={['salescreate']}
                    children={
                      <div className="d-grid gap-2 mt-3">
                    <Button variant="success" size="lg" onClick={handleShowPaymentModal} disabled={cart.length === 0}>Charge Payment</Button>
                     <Button variant="secondary" size="lg" onClick={handleHoldSale} disabled={cart.length === 0}>Hold Sale</Button>
                      </div>
                    }
                    />
                    
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      
      {/* Payment Modal */}
      <Modal show={showPaymentModal} onHide={handleClosePaymentModal} centered>
        <Modal.Header closeButton><Modal.Title>Complete Payment</Modal.Title></Modal.Header>
        <Modal.Body>
          <h3 className="text-center mb-3">Total Due: <span className="text-primary fw-bold">{settings?.currency!=='none'?settings?.currency:""}{total}</span></h3>
          <Form.Group className="mb-3"><Form.Label>Payment Method</Form.Label><Form.Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} size="lg" style={{height:'40px'}}><option value="Cash">Cash</option><option value="Mobile Money">Mobile Money</option><option value="Bank">Bank</option><option value="Credit">Credit</option></Form.Select></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Amount Paid</Form.Label><Form.Control type="number" size="lg" placeholder="0.00" value={tenderedAmount} onChange={(e) => setTenderedAmount(e.target.value)} autoFocus/></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Notes / More Info</Form.Label><Form.Control as="textarea" rows={2} value={moreInfo} onChange={(e) => setMoreInfo(e.target.value)} /></Form.Group>
          {dueAmount > 0 && (<Form.Group className="mb-3"><Form.Label>Credit End Date</Form.Label><Form.Control type="date" size="lg" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Form.Group>)}
          <h4 className={`text-center mt-3 fw-bold ${changeDue >= 0 ? 'text-success' : 'text-danger'}`}>{changeDue >= 0 ? `Change: ${settings?.currency!=='none'?settings?.currency:""}${changeDue}` : `Amount Due: ${settings?.currency!=='none'?settings?.currency:""}${-changeDue}`}</h4>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClosePaymentModal}>Cancel</Button>
          <Button variant="success" onClick={completeSale} disabled={isLoading || !tenderedAmount}>{isLoading ? "Processing..." : "Complete Sale"}</Button>
        </Modal.Footer>
      </Modal>
{/* <PrintableReceipt templateId={receiptTemplate} 
                   items={{
    items: cart?.map((item) => ({
      custId,
      saleQuantity: item.itemQuantity,
      salePrice: item.salePrice,
      saleItemId: item.itemId,
    })),
    details: {
      paymentMethod,
      tenderedAmount: parseFloat(tenderedAmount) || 0,
      discount: discountAmount,
      tax: taxAmount,
      total,
      dueAmount: dueAmount > 0 ? dueAmount : 0,
      endDate: dueAmount > 0 ? endDate : null,
      moreInfo,
    },
  }}
  companyInfo={companyProfile}            
     /> */}
      {/* Held Sales Modal */}

 <ReceiptTemplate
                ref={receiptRef}
                data={{
    items: cart?.map((item) => ({
      custId,
      saleQuantity: item.itemQuantity,
      salePrice: item.salePrice,
      saleItemId: item.itemId,
    })),
    details: {
      paymentMethod,
      tenderedAmount: parseFloat(tenderedAmount) || 0,
      discount: discountAmount,
      tax: taxAmount,
      total,
      dueAmount: dueAmount > 0 ? dueAmount : 0,
      endDate: dueAmount > 0 ? endDate : null,
      moreInfo,
    },
  }}
                companyInfo={companyProfile}
            />

      <Modal show={showHeldSalesModal} onHide={() => setShowHeldSalesModal(false)} centered>
          <Modal.Header closeButton><Modal.Title>Held Sales</Modal.Title></Modal.Header>
          <Modal.Body>
              {heldSales.length > 0 ? (
                  <ListGroup>
                      {heldSales.map(sale => (
                          <ListGroup.Item key={sale.id} className="d-flex justify-content-between align-items-center">
                              <div>
                                  {/* FIX: Render customer name, not the whole object */}
                                  <strong>{sale.customer?.custName || 'Walk-in Customer'}</strong>
                                  <br />
                                  <small className="text-muted">{sale.cart.length} items - Held at {sale.time}</small>
                              </div>
                              <div>
                                  <Button variant="outline-success" size="sm" className="me-2" onClick={() => handleResumeSale(sale.id)}><PlayFill /> Resume</Button>
                                  <Button variant="outline-danger" size="sm" onClick={() => handleDeleteHeldSale(sale.id)}><Trash3Fill /></Button>
                              </div>
                          </ListGroup.Item>
                      ))}
                  </ListGroup>
              ) : (<p className="text-center text-muted">No sales are currently on hold.</p>)}
          </Modal.Body>
      </Modal>
      {/* print receipt */}
      <Modal show={showReceiptModal} onHide={() => setShowReceiptModal(false)} centered>
          <Modal.Header closeButton><Modal.Title>Print sales Receipt</Modal.Title></Modal.Header>
          <Modal.Body>
  <Button variant="outline-success" size="sm" className="me-2" onClick={() => {     // 2. Use a short timeout to ensure the state has updated before printing
    setTimeout(() => {
        if (receiptRef.current) {
            receiptRef.current.print();
        }
    }, 100); }}>Print</Button>
  <Button variant="outline-danger" size="sm" onClick={() => {setShowReceiptModal(false);clearCart();}}>Cancel</Button>
          </Modal.Body>
      </Modal>
    </div>
  );
}

export default PosPage;