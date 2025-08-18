import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  Badge,
  Offcanvas,
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
import AmplaReceipt from "../receipts/AmplaReceipt";
import './PosPage.css';
import { toast } from "react-toastify";

function PosPage() {
  // --- STATE MANAGEMENT ---
  const receiptRef = useRef();
  const { settings } = useSettings();
  const companyProfile = useSelector(selectProfile);
  const stockData = useSelector(selectStock);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [tenderedAmount, setTenderedAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [custId, setCustId] = useState("");
  const [customer, setCustomer] = useState(null);
  const [moreInfo, setMoreInfo] = useState("");
  const [endDate, setEndDate] = useState("");
  const [defaultPriceType, setDefaultPriceType] = useState("retail");
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState("");
  const [cart, setCart] = useState([]);
  const [heldSales, setHeldSales] = useState([]);
  const [showHeldSalesModal, setShowHeldSalesModal] = useState(false);
  const [showCartOffcanvas, setShowCartOffcanvas] = useState(false);
  const [saleDetails, setSaleDetails] = useState({});
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [makeSale, { isLoading }] = useMakeSalesMutation();

  useEffect(() => {
    const savedSales = JSON.parse(localStorage.getItem("heldSales") || "[]");
    setHeldSales(savedSales);
    setTaxRate(settings?.taxRate || 0);
  }, [settings?.taxRate]);

  // --- CART LOGIC ---

  const addProductToCart = (product) => {
    const salePrice =
      defaultPriceType === "wholesale"
        ? product.itemStockPrice
        : product.itemLeastPrice;

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.itemId === product.itemId);

      if (existingItem) {
        if (existingItem.cartQuantity < existingItem.itemQuantity) {
          return prevCart.map((item) =>
            item.itemId === product.itemId
              ? { ...item, cartQuantity: item.cartQuantity + 1 }
              : item
          );
        } else {
          toast.warn(`Cannot add more. Only ${existingItem.itemQuantity} of ${existingItem.itemName} available.`);
          return prevCart;
        }
      } else {
        if (product.itemQuantity > 0) {
          // FIXED: Now correctly assigns the calculated salePrice
          return [...prevCart, { ...product, cartQuantity: 1, salePrice: salePrice }];
        } else {
          toast.warn(`${product.itemName} is out of stock.`);
          return prevCart;
        }
      }
    });
  };

  const updateQuantity = useCallback((productId, change) => {
    setCart(currentCart => {
      const itemInCart = currentCart.find((item) => item.itemId === productId);
      if (!itemInCart) return currentCart;

      const newCartQuantity = itemInCart.cartQuantity + change;

      if (change > 0 && newCartQuantity > itemInCart.itemQuantity) {
        toast.warn(`Cannot add more. Only ${itemInCart.itemQuantity} of ${itemInCart.itemName} available.`);
        return currentCart;
      }

      if (newCartQuantity > 0) {
        return currentCart.map(item =>
          item.itemId === productId
            ? { ...item, cartQuantity: newCartQuantity }
            : item
        );
      } else {
        return currentCart.filter(item => item.itemId !== productId);
      }
    });
  }, []);

  // NEW: Function to handle direct quantity input
  const setQuantity = useCallback((productId, quantityString) => {
    // If the input is empty, don't do anything yet
    if (quantityString === "") {
        setCart(currentCart => currentCart.map(item => 
            item.itemId === productId ? { ...item, cartQuantity: "" } : item
        ));
        return;
    }

    const quantity = parseInt(quantityString, 10);

    setCart(currentCart => {
        const itemInCart = currentCart.find(item => item.itemId === productId);
        if (!itemInCart) return currentCart;

        // If not a valid number or less than 1, remove the item
        if (isNaN(quantity) || quantity < 1) {
            return currentCart.filter(item => item.itemId !== productId);
        }

        // If quantity exceeds stock, set to max stock and alert user
        if (quantity > itemInCart.itemQuantity) {
            toast.warn(`Only ${itemInCart.itemQuantity} of ${itemInCart.itemName} available.`);
            return currentCart.map(item =>
                item.itemId === productId ? { ...item, cartQuantity: itemInCart.itemQuantity } : item
            );
        }

        // Otherwise, set the quantity
        return currentCart.map(item =>
            item.itemId === productId ? { ...item, cartQuantity: quantity } : item
        );
    });
  }, []);

  const handleTogglePriceInCart = useCallback((itemId) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.itemId === itemId) {
        const newPrice = item.salePrice === item.itemLeastPrice ? item.itemStockPrice : item.itemLeastPrice;
        return { ...item, salePrice: newPrice };
      }
      return item;
    }));
  }, []);

  const clearCart = () => {
    setCart([]); setDiscount(""); setTenderedAmount(""); setMoreInfo(""); setCustId(""); setCustomer(null); setEndDate("");
  };

  const handleShow = () => setShowReceiptModal(true);
  const handleClose = () => { clearCart(); setShowReceiptModal(false); };

  const handleHoldSale = () => {
    if (cart.length === 0) return;
    const newHeldSale = { id: Date.now(), cart, customer, custId, discount, taxRate, time: new Date().toLocaleTimeString() };
    const updatedHeldSales = [...heldSales, newHeldSale];
    setHeldSales(updatedHeldSales);
    localStorage.setItem("heldSales", JSON.stringify(updatedHeldSales));
    clearCart();
  };

  const handleResumeSale = (saleId) => {
    const saleToResume = heldSales.find((sale) => sale.id === saleId);
    if (saleToResume) {
      setCart(saleToResume.cart); setCustomer(saleToResume.customer); setCustId(saleToResume.custId); setDiscount(saleToResume.discount); setTaxRate(saleToResume.taxRate);
      handleDeleteHeldSale(saleId);
    }
    setShowHeldSalesModal(false);
  };

  const handleDeleteHeldSale = (saleId) => {
    const updatedHeldSales = heldSales.filter((sale) => sale.id !== saleId);
    setHeldSales(updatedHeldSales);
    localStorage.setItem("heldSales", JSON.stringify(updatedHeldSales));
  };

  const { subtotal, discountAmount, taxAmount, total } = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + item.salePrice * item.cartQuantity, 0);
    const discountAmount = parseFloat(discount) || 0;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = taxableAmount * (taxRate / 100);
    const total = taxableAmount + taxAmount;
    return { subtotal, discountAmount, taxAmount, total };
  }, [cart, discount, taxRate]);

  const changeDue = useMemo(() => (parseFloat(tenderedAmount) || 0) - total, [tenderedAmount, total]);
  const dueAmount = useMemo(() => -changeDue, [changeDue]);

  const completeSale = async () => {
    const payloadItems = cart.map((item) => ({ custId, saleQuantity: item.cartQuantity, salePrice: item.salePrice, saleItemId: item.itemId }));
    const currentSaleDetails = { custId, paymentMethod, tenderedAmount: parseFloat(tenderedAmount) || 0, discount: discountAmount, tax: taxAmount, total, dueAmount: dueAmount > 0 ? dueAmount : 0, endDate: dueAmount > 0 ? endDate : null, moreInfo };
    setSaleDetails(currentSaleDetails);
    try {
      await makeSale({ saleItems: payloadItems, saleDetails: currentSaleDetails }).unwrap();
      toast.success('Sale successful');
      handleShow(); handleClosePaymentModal();
    } catch (error) {
      toast.error('Error occurred during the sale: ' + (error?.data?.message || 'Please try again.'));
    }
  };

  const filteredProducts = useMemo(() => stockData.filter(p => p.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) || p.itemModel?.toLowerCase().includes(searchTerm.toLowerCase())), [stockData, searchTerm]);

  const handleShowCart = () => setShowCartOffcanvas(true);
  const handleCloseCart = () => setShowCartOffcanvas(false);

  const handleShowPaymentModal = () => { if (cart.length > 0) setShowPaymentModal(true); };
  const handleClosePaymentModal = () => setShowPaymentModal(false);

  const CartContent = useCallback(() => (
    <Card className="flex-grow-1 shadow-sm d-flex flex-column h-100">
      <Card.Header className="d-flex justify-content-between align-items-center p-2">
        <h5 className="mb-0">Current Sale</h5>
        <div><Button variant="outline-warning" size="sm" onClick={() => setShowHeldSalesModal(true)} className="me-2"><PauseFill /> Held ({heldSales.length})</Button><Button variant="outline-danger" size="sm" onClick={clearCart} disabled={cart.length === 0}><XCircleFill /> Clear</Button></div>
      </Card.Header>
      <Card.Body className="d-flex flex-column p-0 flex-grow-1 cart-body-wrapper">
        {customer && (<div className="p-2 bg-light-subtle border-bottom d-flex justify-content-between align-items-center"><div><small className="text-muted d-block">Customer</small><span className="fw-medium">{customer.custName}</span></div><Button variant="link" size="sm" className="p-0 text-danger" onClick={() => { setCustomer(null); setCustId(""); }}><XCircleFill /></Button></div>)}
        <ListGroup variant="flush" className="cart-items">
          {cart.length === 0 ? (<p className="text-center text-muted p-5 m-0">Cart is empty.</p>) : (cart.map((item) => (
            <ListGroup.Item key={item.itemId} className="d-flex flex-wrap align-items-center">
              <div className="flex-grow-1">
                <p className="fw-bold mb-0">{item.itemName}</p>
                <p className="text-muted small mb-0" onClick={() => handleTogglePriceInCart(item.itemId)}><Badge pill bg={item.salePrice === item.itemLeastPrice ? "info" : "secondary"} className="price-toggle-btn">{item.salePrice === item.itemLeastPrice ? "Retail" : "W/S"} <ArrowRepeat size={12} /></Badge><span className="ms-2">@ {settings?.currency !== 'none' ? settings?.currency : ""}{item.salePrice}</span></p>
              </div>
              <div className="d-flex align-items-center my-1 my-sm-0">
                <Button variant="light" size="sm" className="quantity-btn" onClick={() => updateQuantity(item.itemId, -1)} >-</Button>
                <Form.Control
                    type="number"
                    value={item.cartQuantity}
                    onChange={(e) => setQuantity(item.itemId, e.target.value)}
                    className="quantity-input mx-1 text-center"
                    min="1"
                />
                <Button variant="light" size="sm" className="quantity-btn" onClick={() => updateQuantity(item.itemId, 1)} >+</Button>
              </div>
              <div className="ms-sm-3 text-end" style={{ minWidth: "80px" }}><span className="fw-bold">{settings?.currency !== 'none' ? settings?.currency : ""}{(item.salePrice * item.cartQuantity).toFixed(2)}</span></div>
            </ListGroup.Item>
          )))}
        </ListGroup>
        <div className={`p-3 border-top mt-auto ${settings.theme === 'dark' ? 'bg-dark' : 'bg-light'}`}>
          <Row className="g-2 my-2">
            <Col className="mb-2"><InputGroup><InputGroup.Text>Discount</InputGroup.Text><Form.Control type="number" placeholder="0.00" value={discount} onChange={(e) => setDiscount(e.target.value)} /></InputGroup></Col>
            <Col className="mt-2"><InputGroup><InputGroup.Text>Tax</InputGroup.Text><Form.Control type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} /><InputGroup.Text>%</InputGroup.Text></InputGroup></Col>
          </Row>
          <div className='mt-4 p-2'>
            <div className="d-flex justify-content-between text-muted"><span>Subtotal</span> <span className="fw-medium">{settings?.currency !== 'none' ? settings?.currency : ""}{subtotal.toFixed(2)}</span></div>
            <div className="d-flex justify-content-between text-muted"><span>Discount</span> <span className="fw-medium text-danger">-{settings?.currency !== 'none' ? settings?.currency : ""}{discountAmount.toFixed(2)}</span></div>
            <div className="d-flex justify-content-between text-muted"><span>Tax ({taxRate}%)</span> <span className="fw-medium">{settings?.currency !== 'none' ? settings?.currency : ""}{taxAmount.toFixed(2)}</span></div>
          </div><hr />
          <div className="d-flex justify-content-between fs-4 fw-bold"><span>Total</span> <span>{settings?.currency !== 'none' ? settings?.currency : ""}{total.toFixed(2)}</span></div>
          <div className="d-grid gap-2 mt-3"><PermissionWrapper required={['salescreate']}><Button variant="success" size="lg" onClick={handleShowPaymentModal} disabled={cart.length === 0 || !customer}>Charge Payment</Button></PermissionWrapper><Button variant="secondary" size="lg" onClick={handleHoldSale} disabled={cart.length === 0} className="mt-2">Hold Sale</Button></div>
        </div>
      </Card.Body>
    </Card>
  ), [cart, heldSales, customer, custId, discount, taxRate, settings, handleTogglePriceInCart, updateQuantity, setQuantity, clearCart, subtotal, discountAmount, taxAmount, total]);

  return (
    <div className="pos-page-container">
      <Container fluid className="p-3 main-content-pos">
        <Row className="h-100 gx-3">
          <Col md={7} lg={8} className="product-grid-container">
            <Card className="flex-grow-1 shadow-sm d-flex flex-column">
              <Card.Header style={{ height: '65px' }} className="p-2">
                <Row className="g-2 align-items-center">
                  <Col lg={4} md={6}><Form.Control type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></Col>
                  <Col lg={5} md={6}><CustomerSelection setCustId={setCustId} setCustomer={setCustomer} /></Col>
                  <Col lg={3} md={6}><Form.Check type="switch" id="price-type-switch" className="mt-2 ms-4" label={defaultPriceType === 'retail' ? 'Default: Retail' : 'Default: Wholesale'} checked={defaultPriceType === 'retail'} onChange={() => setDefaultPriceType(p => p === 'retail' ? 'wholesale' : 'retail')} /></Col>
                </Row>
              </Card.Header>
              <Card.Body className="product-grid">
                <Row xs={2} sm={3} md={3} lg={4} xl={5} className="g-2">
                  {filteredProducts.map((product) => {
                    const isOutOfStock = product.itemQuantity <= 0;
                    return (
                      <Col key={product.itemId}>
                        <Card className={`h-100 product-card ${isOutOfStock ? 'out-of-stock' : ''}`} onClick={() => !isOutOfStock && addProductToCart(product)}>
                          {isOutOfStock && (<div className="out-of-stock-overlay"><Badge bg="danger" pill>Out of Stock</Badge></div>)}
                          <Card.Body className="d-flex flex-column p-2">
                            <Card.Title className="fs-6 fw-bold mb-1">{product.itemName}</Card.Title>
                            <Card.Text className="text-muted small">Model: {product.itemModel}</Card.Text>
                            <Card.Text className="text-muted small">Qty: {product.itemQuantity}</Card.Text>
                            <p className="mt-auto fw-bold text-primary mb-0">Retail: {settings?.currency !== 'none' ? settings?.currency : ""}{product.itemLeastPrice}</p>
                            <p className="fw-normal text-secondary small mb-0">Wholesale: {settings?.currency !== 'none' ? settings?.currency : ""}{product.itemStockPrice}</p>
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </Card.Body>
            </Card>
          </Col>
          <Col md={5} lg={4} className="d-none d-md-flex cart-container"><CartContent /></Col>
        </Row>
      </Container>
      <div className="d-md-none mobile-cart-button-container"><Button variant="primary" className="w-100 py-2" onClick={handleShowCart}>View Cart ({cart.reduce((sum, item) => sum + Number(item.cartQuantity || 0), 0)} items) - {settings?.currency !== 'none' ? settings?.currency : ""}{total.toFixed(2)}</Button></div>
      <Offcanvas show={showCartOffcanvas} onHide={handleCloseCart} placement="bottom" className="h-100"><Offcanvas.Header closeButton><Offcanvas.Title>Cart</Offcanvas.Title></Offcanvas.Header><Offcanvas.Body className="d-flex flex-column p-0"><CartContent /></Offcanvas.Body></Offcanvas>
      <Modal show={showPaymentModal} onHide={handleClosePaymentModal} centered backdrop="static" keyboard={false}>
        <Modal.Header closeButton={!isLoading} ><Modal.Title>Complete Payment</Modal.Title></Modal.Header>
        <Modal.Body>
          <h3 className="text-center mb-3">Total Due: <span className="text-primary fw-bold">{settings?.currency !== 'none' ? settings?.currency : ""}{total.toFixed(2)}</span></h3>
          <Form.Group className="mb-3"><Form.Label>Payment Method</Form.Label><Form.Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} size="lg" style={{ height: '45px' }}><option value="Cash">Cash</option><option value="Mobile Money">Mobile Money</option><option value="Bank">Bank</option><option value="Credit">Credit</option></Form.Select></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Amount Paid</Form.Label><Form.Control type="number" size="lg" placeholder="0.00" value={tenderedAmount} onChange={(e) => setTenderedAmount(e.target.value)} autoFocus /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Notes / More Info</Form.Label><Form.Control as="textarea" rows={2} value={moreInfo} onChange={(e) => setMoreInfo(e.target.value)} /></Form.Group>
          {dueAmount > 0 && (<Form.Group className="mb-3"><Form.Label>Credit End Date</Form.Label><Form.Control type="date" size="lg" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Form.Group>)}
          <h4 className={`text-center mt-3 fw-bold ${changeDue >= 0 ? 'text-success' : 'text-danger'}`}>{changeDue >= 0 ? `Change: ${settings?.currency !== 'none' ? settings?.currency : ""}${changeDue.toFixed(2)}` : `Amount Due: ${settings?.currency !== 'none' ? settings?.currency : ""}${-changeDue.toFixed(2)}`}</h4>
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" disabled={isLoading}  onClick={handleClosePaymentModal}>Cancel</Button><Button variant="success" onClick={completeSale} disabled={isLoading || !tenderedAmount}>{isLoading ? "Processing..." : "Complete Sale"}</Button></Modal.Footer>
      </Modal>
      <Modal show={showHeldSalesModal} onHide={() => setShowHeldSalesModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Held Sales</Modal.Title></Modal.Header>
        <Modal.Body>{heldSales.length > 0 ? (<ListGroup>{heldSales.map(sale => (<ListGroup.Item key={sale.id} className="d-flex justify-content-between align-items-center"><div><strong>{sale.customer?.custName || 'Walk-in Customer'}</strong><br /><small className="text-muted">{sale.cart.length} items - Held at {sale.time}</small></div><div><Button variant="outline-success" size="sm" className="me-2" onClick={() => handleResumeSale(sale.id)}><PlayFill /> Resume</Button><Button variant="outline-danger" size="sm" onClick={() => handleDeleteHeldSale(sale.id)}><Trash3Fill /></Button></div></ListGroup.Item>))}</ListGroup>) : (<p className="text-center text-muted">No sales are currently on hold.</p>)}</Modal.Body>
      </Modal>
      <div style={{ display: 'none' }}><ReceiptTemplate ref={receiptRef} data={{ items: cart, details: saleDetails }} companyInfo={companyProfile} /></div>
      <Modal show={showReceiptModal} onHide={handleClose} fullscreen={true} backdrop="static" keyboard={false}>
        <Modal.Header closeButton><Modal.Title>Receipt</Modal.Title></Modal.Header>
        <Modal.Body><AmplaReceipt companyInfo={companyProfile} customerName={customer?.custName} cart={cart} saleDetails={saleDetails} /></Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={handleClose}>Close & New Sale</Button></Modal.Footer>
      </Modal>
    </div>
  );
}

export default PosPage;