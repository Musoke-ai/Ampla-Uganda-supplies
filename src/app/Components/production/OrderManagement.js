import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  Button,
  Form,
  ProgressBar,
  InputGroup,
  ToggleButton,
  ToggleButtonGroup,
  Modal,
} from "react-bootstrap";
import { useSelector } from "react-redux";
import { selectStock } from "../../features/stock/stockSlice";
import { selectCustomers } from "../../features/api/customers";
import CustomerSelection from "../Models/CustomerSelection";
import {
  selectOrders,
  useAddOrderMutation,
  useDeleteOrderMutation,
  useUpdateOrderMutation,
} from "../../features/api/orderSlice";
import { LinearProgress } from "@mui/material";
import { Book, Delete, Edit, Search } from "@mui/icons-material";
import { ArrowDown, ArrowUp, BookHalf } from "react-bootstrap-icons";
import PermissionWrapper from "../../auth/PermissionWrapper";
import { useSettings } from "../Settings";
import { useTableSortSearch } from "../../hooks/useTableSortSearch";

const searchableFields = ['customerName', 'productName', 'customSize', 'description'];

const OrderManagement = () => {
  const { settings } = useSettings();
  const currency = settings?.currency!=="none"?settings?.currency:"";
  const theme = settings.theme;

  // --- Redux Selectors and RTK Query Mutations ---
  const [addOrder, { isLoading, isError, error, isSuccess }] =
    useAddOrderMutation();
  const [
    deleteOrder,
    {
      isLoading: isDeleteLoading,
      isError: isDeleteError,
      error: deleteError,
      isSuccess: isDeleteSuccess,
    },
  ] = useDeleteOrderMutation();
  const [
    updateOrder,
    {
      isLoading: updateLoading,
      isError: isUpdateError,
      error: updateError,
      isSuccess: isUpdateSuccess,
    },
  ] = useUpdateOrderMutation();
  const orders = useSelector(selectOrders);
  const customers = useSelector(selectCustomers);
  const products = useSelector(selectStock);

  // --- Data Enrichment & Table State Management ---
  const enrichedOrders = useMemo(() => {
    const customerMap = new Map(customers.map(c => [c.custId, c.custName]));
    const productMap = new Map(products.map(p => [p.itemId, p.itemName]));
    return orders.map(order => ({
      ...order,
      customerName: customerMap.get(order.custId) || `Cust ID: ${order.custId}`,
      productName: productMap.get(order.prodId) || 'Custom Item',
    }));
  }, [orders, customers, products]);

  const {
    items: sortedAndFilteredOrders,
    requestSort,
    sortConfig,
    setSearchTerm,
    searchTerm
  } = useTableSortSearch(enrichedOrders, searchableFields);


  // --- Local Component State ---
  const [orderType, setOrderType] = useState("default");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [custId, setCustId] = useState("");
  const [customer, setCustomer] = useState("");
  const [isUpdate, setIsUpdate] = useState(false);
  const [sellingCost, setSellingCost] = useState(0);
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState({
    custId: 0,
    prodId: 0,
    customSize: "",
    layers: 1,
    quantity: 1,
    quantityProduced: 0,
    totalCost: 0,
    amountPaid: 0,
    status: "Pending",
    description:'',
  });

  // --- Derived State & Helper Functions ---
  const visibleOrders = useMemo(() => {
    return sortedAndFilteredOrders.filter(order => {
      if (orderType === 'default') return !order.customSize;
      if (orderType === 'custom') return !!order.customSize;
      return true;
    });
  }, [sortedAndFilteredOrders, orderType]);

  const getSortIcon = (key) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp className="ms-1" />;
    }
    return <ArrowDown className="ms-1" />;
  };

  // --- Effects ---
  useEffect(() => {
    setOrder({ ...order, custId: custId });
  }, [custId]);

  const handleOrderTypeChange = (type) => setOrderType(type);
  const handleShowModal = () => setShowModal(true);

  const clearOrder = () => {
    setOrder({
      ...order,
      custId: 0,
      prodId: 0,
      customSize: "",
      layers: 1,
      quantity: 1,
      quantityProduced: 0,
      totalCost: 0,
      amountPaid: 0,
      status: "Pending",
      description: '',
    });
    setCustId("");
    setCustomer("");
    setIsUpdate(false);
  };

  const handleCloseModal = () => {
    clearOrder();
    setShowModal(false);
  };
  const handleCloseDeleteModal = () => {
    clearOrder();
    setOrderId("");
    setShowDeleteModal(false);
  };

  const createOrder = async () => {
    try {
      const data = await addOrder(order).unwrap();
      clearOrder();
      setShowModal(false);
    } catch (error) {
      console.log("Error happened while creating the order");
    }
  };

  const handleUpdateOrder = async () => {
    try {
      const _update = await updateOrder({ ...order, orderId }).unwrap();
      clearOrder();
      //setOrder([]);
      setOrderId("");
      setCustId("");
    } catch (error) {
      console.log("Error: " + error);
    }
  };

  const handleDeleteOrder = async () => {
    try {
      const _delete = await deleteOrder({ orderId }).unwrap();
      setOrderId("");
    } catch (error) {
      console.log("Error: " + error);
    }
  };

// Hook 1: SET THE DEFAULT PRICE
// This runs ONLY when the product ID changes, to set the initial price.
useEffect(() => {
  const selectedProduct = products?.find(
    (product) => Number(product.itemId) === Number(order.prodId)
  );

  if (selectedProduct) {
    // Only sets the default retail price for the new item.
    // It won't run again when you change the radio button.
    setSellingCost(selectedProduct.itemLeastPrice);
  }
}, [order.prodId]); // Note the more specific dependency!

// Hook 2: UPDATE THE TOTAL COST
// This runs ONLY when the quantity or the selected price changes.
useEffect(() => {
  // We use parseFloat to handle decimals and ensure it's a number.
  const cost = parseFloat(sellingCost) || 0;
  const quantity = parseInt(order.quantity, 10) || 0;

  setOrder(currentOrder => ({
    ...currentOrder,
    totalCost: cost * quantity
  }));
}, [sellingCost, order.quantity]); // Runs when dependencies change.

  const canSave = Boolean(order.custId && (order.customSize || order.prodId) && order.quantity && order.totalCost );
  return (
    <div className="container mt-4">
      <h2>Customer Orders</h2>
      <div className="d-flex flex-row justify-content-between">
        <div>
          <ToggleButtonGroup
            type="radio"
            name="orderType"
            value={orderType}
            onChange={handleOrderTypeChange}
          >
            <ToggleButton
              id="tbg-btn-1"
              value="default"
              variant="outline-primary"
            >
              Default Order
            </ToggleButton>
            <ToggleButton
              id="tbg-btn-2"
              value="custom"
              variant="outline-secondary"
            >
              Custom Order
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
        <div>
          <PermissionWrapper required={['orderscreate']} children={
          <Button className="mt-3" variant="primary" onClick={handleShowModal}>
            Add New Order
          </Button>
          } />
        </div>
      </div>

      <div className="d-flex justify-content-start mt-3">
        <InputGroup style={{ maxWidth: "400px" }}>
          <InputGroup.Text className={`${theme==='dark'?'text-white':'text-dark'}`}><Search /></InputGroup.Text>
          <Form.Control
            placeholder="Search by customer, product, size, or description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
      </div>

      <Table striped bordered hover className="mt-3">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th onClick={() => requestSort('customerName')} style={{ cursor: 'pointer' }}>Customer {getSortIcon('customerName')}</th>
            {orderType==='default'?<th onClick={() => requestSort('productName')} style={{ cursor: 'pointer' }}>Product {getSortIcon('productName')}</th>:""}
            {orderType==='custom'?<th onClick={() => requestSort('customSize')} style={{ cursor: 'pointer' }}>Size {getSortIcon('customSize')}</th>:""}
            <th onClick={() => requestSort('layers')} style={{ cursor: 'pointer' }}>Layers {getSortIcon('layers')}</th>
            <th onClick={() => requestSort('quantity')} style={{ cursor: 'pointer' }}>Ordered {getSortIcon('quantity')}</th>
            <th onClick={() => requestSort('quantityProduced')} style={{ cursor: 'pointer' }}>Produced {getSortIcon('quantityProduced')}</th>
            <th>Progress</th>
            <th onClick={() => requestSort('totalCost')} style={{ cursor: 'pointer' }}>Total Cost {getSortIcon('totalCost')}</th>
            <th onClick={() => requestSort('amountPaid')} style={{ cursor: 'pointer' }}>Paid {getSortIcon('amountPaid')}</th>
            <th >Remaining</th>
            <th onClick={() => requestSort('description')} style={{ cursor: 'pointer' }}>Description {getSortIcon('description')}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visibleOrders.length > 0 ? (
            visibleOrders.map((order, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                 <td>{order.customerName}</td>
                {orderType==='default'?<td>{order.productName}</td>:""}
                 {orderType==='custom'?  <td>{order.customSize}</td> :""}
                <td>{order.layers}</td>
                <td>{order.quantity}</td>
                <td>{order.quantityProduced}</td>
                <td>
                  <ProgressBar
                    now={
                      order.quantityProduced > 0 &&
                      (order.quantityProduced / order.quantity) * 100
                    }
                    label={`${(
                      (order.quantityProduced / order.quantity) *
                      100
                    ).toFixed(0)}%`}
                  />
                </td>
                <td>{currency}{order.totalCost}</td>
                <td>{currency}{order.amountPaid}</td>
                <td>{currency}{Number(order.totalCost) - Number(order.amountPaid)}</td>
                <td>{order.description}</td>
                <td>
                  <div className="d-flex flex-row justify-content-between">
                    {/* <div>
                      <Button className="btn-sm btn-success">
                        <BookHalf />
                      </Button>
                    </div> */}
                    <div>
                      <PermissionWrapper required={['ordersupdate']} children={                      <Button
                        className="btn-sm"
                        onClick={() => {
                          setOrderId(order.orderId);
                          setOrder(order);
                          setCustId(order.custId);
                          setIsUpdate(true);
                          handleShowModal();
                        }}
                      >
                        <Edit />
                      </Button>} />

                    </div>
                    <div>
                      <PermissionWrapper required={['ordersdelete']} children={<Button
                        className="btn-sm btn-danger"
                        onClick={() => {
                          setOrderId(order.orderId);
                          // handleDeleteOrder();
                          setShowDeleteModal(true);
                        }}
                      >
                        <Delete />
                      </Button>}/>
                    </div>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="12" className="text-center">No orders found.</td></tr>
          )}
            <tr className="fs-5 fw-bold">
              <td colSpan={4}>Total: </td>
              <td >{visibleOrders.reduce((prev, curr) => prev+Number(curr.quantity)||0, 0)}</td>
             
              <td >{visibleOrders.reduce((prev, curr) => prev+Number(curr.quantityProduced)||0, 0)}</td>
            <td></td>

             <td colSpan={1} >{currency}{visibleOrders.reduce((prev, curr) => prev+Number(curr.totalCost)||0, 0).toFixed(2)}</td>

             <td >{currency}{visibleOrders.reduce((prev, curr) => prev+Number(curr.amountPaid)||0, 0).toFixed(2)}</td>

            </tr>
        </tbody>
      </Table>

      {/* Order Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {isUpdate
              ? "Update Order"
              : orderType === "default"
              ? "Add Default Order"
              : "Add Custom Order"}
          </Modal.Title>
        </Modal.Header>
        {isLoading ? <LinearProgress /> : <div></div>}
        <Modal.Body>
          <Form>
            <CustomerSelection
              setCustId={setCustId}
              custId={custId}
              setCustomer={setCustomer}
            />
            {orderType === "default" ? (
              <>
                <Form.Group controlId="selectProduct">
                  <Form.Label>Select Product</Form.Label>
                  <Form.Control
                    as="select"
                    className="mb-3"
                    value={order.prodId || ""}
                    style={{ height: "40px" }}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      !isNaN(value)
                        ? setOrder({ ...order, prodId: value })
                        : setOrder({ ...order, prodId: "" });
                    }}
                  >
                    <option value="" disabled>
                      Select Product
                    </option>
                    {products.map((product) => {
                      return (
                        <option key={product.itemId} value={product.itemId}>
                          {product.itemName}
                        </option>
                      );
                    })}
                  </Form.Control>
                  {!order.prodId && (
                    <div style={{ color: "red", fontSize: "0.9em" }}>
                      Please select a product
                    </div>
                  )}
                </Form.Group>
                <Form.Group controlId="quantity">
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    value={order.quantity}
                    onChange={(e) => {
                      setOrder({ ...order, quantity: e.target.value });
                    }}
                  />
                </Form.Group>
                <Form.Group controlId="quantityProduced">
                  <Form.Label>Quantity produced</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    max={order.quantity}
                    value={order.quantityProduced}
                    onChange={(e) => {
                      setOrder({ ...order, quantityProduced: e.target.value });
                    }}
                  />
                </Form.Group>
              
               <Form.Group>
    <Form.Label>Select Selling Cost</Form.Label>
    {(() => {
      const selectedProduct = products?.find(
        (product) => Number(product.itemId) === Number(order.prodId)
      );

      if (!selectedProduct) {
        return <p className="text-muted">Product information not available.</p>;
      }

      return (
        <>
          <Form.Check
            type="radio"
            name={`sellingCost-${order.prodId}`}
            label={`Retail: ${selectedProduct.itemLeastPrice}`}
            value={selectedProduct.itemLeastPrice}
            id={`retail-${order.prodId}`}
            checked={sellingCost == selectedProduct.itemLeastPrice}
            onChange={(e) => 
              {setSellingCost(e.target.value);
                //  setOrder({ ...order, totalCost: Number(order.quantity)||0*Number(e.target.value)||0 });
              }
            }
          />
          <Form.Check
            type="radio"
            name={`sellingCost-${order.prodId}`}
            label={`Wholesale: ${selectedProduct.itemStockPrice}`}
            value={selectedProduct.itemStockPrice}
            id={`wholesale-${order.prodId}`}
            checked={sellingCost == selectedProduct.itemStockPrice}
            onChange={(e) => setSellingCost(e.target.value)}
          />
        </>
      );
    })()}
  </Form.Group>

                <Form.Group controlId="price">
                  <Form.Label>Total Cost</Form.Label>
                  <Form.Control
                    type="text"
                    disabled={orderType==='default'?true:false}
                    value={order.totalCost}
                    onChange={(e) => {
                      setOrder({ ...order, totalCost: e.target.value });
                    }}
                  />
                </Form.Group>
                <Form.Group controlId="amountPaid">
                  <Form.Label>Amount Paid</Form.Label>
                  <Form.Control
                    type="text"
                    value={order.amountPaid}
                    onChange={(e) => {
                      setOrder({ ...order, amountPaid: e.target.value });
                    }}
                  />
                </Form.Group>
                <Form.Group controlId="description">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    type="text"
                    value={order.description}
                    onChange={(e) => {
                      setOrder({ ...order, description: e.target.value });
                    }}
                  />
                </Form.Group>
              </>
            ) : (
              <>
                <Form.Group controlId="size">
                  <Form.Label>Size</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter size"
                    value={order.customSize}
                    onChange={(e) => {
                      setOrder({ ...order, customSize: e.target.value });
                    }}
                  />
                </Form.Group>
                <Form.Group controlId="layers">
                  <Form.Label>Number of Layers</Form.Label>
                  <Form.Control
                    type="number"
                    value={order.layers}
                    onChange={(e) => {
                      setOrder({ ...order, layers: e.target.value });
                    }}
                  />
                </Form.Group>
                <Form.Group controlId="quantity">
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    value={order.quantity}
                    onChange={(e) => {
                      setOrder({ ...order, quantity: e.target.value });
                    }}
                  />
                </Form.Group>
                    <Form.Group controlId="quantityProduced">
                  <Form.Label>Quantity produced</Form.Label>
                  <Form.Control
                    type="number"
                    value={order.quantityProduced}
                    onChange={(e) => {
                      setOrder({ ...order, quantityProduced: e.target.value });
                    }}
                  />
                </Form.Group>
                <Form.Group controlId="totalCost">
                  <Form.Label>Total Cost</Form.Label>
                  <Form.Control
                    type="text"
                    value={order.totalCost}
                    onChange={(e) => {
                      setOrder({ ...order, totalCost: e.target.value });
                    }}
                  />
                </Form.Group>
                <Form.Group controlId="paid">
                  <Form.Label>Amount Paid</Form.Label>
                  <Form.Control
                    type="text"
                    value={order.amountPaid}
                    onChange={(e) => {
                      setOrder({ ...order, amountPaid: e.target.value });
                    }}
                  />
                </Form.Group>
                <Form.Group controlId="description">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    type="text"
                    value={order.description}
                    onChange={(e) => {
                      setOrder({ ...order, description: e.target.value });
                    }}
                  />
                </Form.Group>
              </>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          {isUpdate ? (updateLoading?
            <Button >Updating</Button>:<Button onClick={handleUpdateOrder}>Update</Button>
          ) : isLoading ? (
            <Button variant="primary">Saving...</Button>
          ) : (
            <Button
              variant="primary"
              onClick={createOrder}
              disabled={!canSave}
            >
              Save Order
            </Button>
          )}
        </Modal.Footer>
      </Modal>
      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>
       Delete Alert
          </Modal.Title>
        </Modal.Header>
        {isDeleteLoading ? <LinearProgress /> : <div></div>}
        <Modal.Body className="text-danger">
          {
            isDeleteSuccess?<div className="text-success"> Item successfully deleted !</div>:<div> You are about to delete an order !</div>
          }
        
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Close
          </Button>
          {isDeleteLoading ? 
            <Button className="btn btn-danger btn-small" >Deleting...</Button>:orderId?
           <Button className="btn btn-danger btn-small" onClick={handleDeleteOrder} >Delete</Button>:<Button className="btn btn-danger btn-small" disabled >Delete</Button>
          }
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OrderManagement;
