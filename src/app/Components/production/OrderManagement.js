import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  InputGroup,
  Modal,
  ProgressBar,
  Table,
  ToggleButton,
  ToggleButtonGroup,
} from "react-bootstrap";
import { LinearProgress } from "@mui/material";
import { Delete, Edit, Search } from "@mui/icons-material";
import { ArrowDown, ArrowUp } from "react-bootstrap-icons";
import { useSelector } from "react-redux";

import PermissionWrapper from "../../auth/PermissionWrapper";
import { selectBranches, useGetBranchesQuery } from "../../features/api/branchesSlice";
import { selectCustomers } from "../../features/api/customers";
import {
  selectOrders,
  useAddOrderMutation,
  useDeleteOrderMutation,
  useUpdateOrderMutation,
} from "../../features/api/orderSlice";
import { selectStock } from "../../features/stock/stockSlice";
import { useTableSortSearch } from "../../hooks/useTableSortSearch";
import CustomerSelection from "../Models/CustomerSelection";
import { useSettings } from "../Settings";
import {
  paginateItems,
  ProductionTableFooter,
} from "./ProductionTableControls";

const searchableFields = ["customerName", "branchName", "productName", "customSize", "description"];
const safeArray = (value) => (Array.isArray(value) ? value : []);

const initialOrderState = {
  branchId: "",
  custId: 0,
  prodId: 0,
  customSize: "",
  layers: 1,
  quantity: 1,
  quantityProduced: 0,
  totalCost: 0,
  amountPaid: 0,
  status: "Pending",
  description: "",
};

const OrderManagement = () => {
  const { settings } = useSettings();
  const currency = settings?.currency !== "none" ? settings?.currency : "";
  const theme = settings.theme;

  useGetBranchesQuery();

  const [addOrder, { isLoading }] = useAddOrderMutation();
  const [deleteOrder, { isLoading: isDeleteLoading, isSuccess: isDeleteSuccess }] =
    useDeleteOrderMutation();
  const [updateOrder, { isLoading: updateLoading }] = useUpdateOrderMutation();

  const ordersState = useSelector(selectOrders);
  const branchesState = useSelector(selectBranches);
  const customersState = useSelector(selectCustomers);
  const productsState = useSelector(selectStock);
  const orders = useMemo(() => safeArray(ordersState), [ordersState]);
  const branches = useMemo(() => safeArray(branchesState), [branchesState]);
  const customers = useMemo(() => safeArray(customersState), [customersState]);
  const products = useMemo(() => safeArray(productsState), [productsState]);

  const enrichedOrders = useMemo(() => {
    const customerMap = new Map(customers.map((customer) => [customer.custId, customer.custName]));
    const productMap = new Map(products.map((product) => [product.itemId, product.itemName]));
    const branchMap = new Map(branches.map((branch) => [branch.branchId, branch.branchName]));

    return orders.map((order) => ({
      ...order,
      branchName: branchMap.get(order.branchId) || "Unassigned",
      customerName: customerMap.get(order.custId) || `Cust ID: ${order.custId}`,
      productName: productMap.get(order.prodId) || "Custom Item",
    }));
  }, [branches, customers, orders, products]);

  const {
    items: sortedAndFilteredOrders,
    requestSort,
    sortConfig,
    setSearchTerm,
    searchTerm,
  } = useTableSortSearch(enrichedOrders, searchableFields);

  const [orderType, setOrderType] = useState("default");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [custId, setCustId] = useState("");
  const [isUpdate, setIsUpdate] = useState(false);
  const [sellingCost, setSellingCost] = useState(0);
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(initialOrderState);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const visibleOrders = useMemo(
    () =>
      sortedAndFilteredOrders.filter((entry) => {
        if (orderType === "default") return !entry.customSize;
        if (orderType === "custom") return Boolean(entry.customSize);
        return true;
      }),
    [orderType, sortedAndFilteredOrders]
  );

  const filteredCustomers = useMemo(() => {
    if (!order.branchId) {
      return customers;
    }

    return customers.filter(
      (customer) => String(customer.branchId || "") === String(order.branchId)
    );
  }, [customers, order.branchId]);

  const filteredProducts = useMemo(() => {
    if (!order.branchId) {
      return products;
    }

    return products.filter(
      (product) => String(product.branchId || "") === String(order.branchId)
    );
  }, [order.branchId, products]);

  useEffect(() => {
    setCurrentPage(1);
  }, [orderType, rowsPerPage, searchTerm, sortConfig]);

  useEffect(() => {
    const nextTotalPages = Math.max(1, Math.ceil(visibleOrders.length / rowsPerPage));
    if (currentPage > nextTotalPages) {
      setCurrentPage(nextTotalPages);
    }
  }, [currentPage, rowsPerPage, visibleOrders.length]);

  const { totalPages, paginatedItems: paginatedOrders } = useMemo(
    () => paginateItems(visibleOrders, currentPage, rowsPerPage),
    [currentPage, rowsPerPage, visibleOrders]
  );

  const getSortIcon = (key) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === "ascending" ? (
      <ArrowUp className="ms-1" />
    ) : (
      <ArrowDown className="ms-1" />
    );
  };

  useEffect(() => {
    setOrder((currentOrder) => ({ ...currentOrder, custId }));
  }, [custId]);

  useEffect(() => {
    const selectedCustomer = customers.find(
      (customer) => Number(customer.custId) === Number(custId)
    );

    if (selectedCustomer?.branchId) {
      setOrder((currentOrder) => ({
        ...currentOrder,
        branchId: currentOrder.branchId || selectedCustomer.branchId,
      }));
    }
  }, [custId, customers]);

  useEffect(() => {
    const selectedProduct = products.find(
      (product) => Number(product.itemId) === Number(order.prodId)
    );

    if (selectedProduct) {
      setSellingCost(selectedProduct.itemLeastPrice);
    }
  }, [order.prodId, products]);

  useEffect(() => {
    const cost = parseFloat(sellingCost) || 0;
    const quantity = parseInt(order.quantity, 10) || 0;

    setOrder((currentOrder) => ({
      ...currentOrder,
      totalCost: cost * quantity,
    }));
  }, [order.quantity, sellingCost]);

  const clearOrder = () => {
    setOrder(initialOrderState);
    setCustId("");
    setIsUpdate(false);
    setSellingCost(0);
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
      await addOrder(order).unwrap();
      clearOrder();
      setShowModal(false);
    } catch (error) {
      console.log("Error happened while creating the order", error);
    }
  };

  const handleUpdateOrder = async () => {
    try {
      await updateOrder({ ...order, orderId }).unwrap();
      clearOrder();
      setOrderId("");
      setShowModal(false);
    } catch (error) {
      console.log("Error: " + error);
    }
  };

  const handleDeleteOrder = async () => {
    try {
      await deleteOrder({ orderId }).unwrap();
      setOrderId("");
      setShowDeleteModal(false);
    } catch (error) {
      console.log("Error: " + error);
    }
  };

  const canSave = Boolean(
    order.branchId && order.custId && (order.customSize || order.prodId) && order.quantity && order.totalCost
  );

  return (
    <div className="container mt-4 production-section-shell">
      <div className="production-section-header">
        <div>
          <div className="production-section-copy">
            <h2>Customer Orders</h2>
            <p>
              Track standard and custom production orders with clearer progress,
              payments, and queue visibility.
            </p>
          </div>
          <ToggleButtonGroup
            type="radio"
            name="orderType"
            value={orderType}
            onChange={setOrderType}
            className="mt-3"
          >
            <ToggleButton id="tbg-btn-1" value="default" variant="outline-primary">
              Default Order
            </ToggleButton>
            <ToggleButton id="tbg-btn-2" value="custom" variant="outline-secondary">
              Custom Order
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
        <div className="production-action-cluster">
          <PermissionWrapper
            required={["orderscreate"]}
            children={
              <Button variant="primary" onClick={() => setShowModal(true)}>
                Add New Order
              </Button>
            }
          />
        </div>
      </div>

      <div className="production-filter-bar">
        <div className="production-filter-search">
          <InputGroup>
            <InputGroup.Text className={`${theme === "dark" ? "text-white" : "text-dark"}`}>
              <Search />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search by customer, product, size, or description"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </InputGroup>
        </div>
        <div className="production-stat-row">
          <span className="production-stat-chip">Orders: {visibleOrders.length}</span>
          <span className="production-stat-chip">
            Produced:{" "}
            {visibleOrders.reduce(
              (total, currentOrder) => total + (Number(currentOrder.quantityProduced) || 0),
              0
            )}
          </span>
        </div>
      </div>

      <div className="production-table-card">
        <div className="production-table-scroll">
          <Table hover className="production-modern-table align-middle">
            <thead>
              <tr>
                <th>#</th>
                <th onClick={() => requestSort("customerName")} className="production-sortable">
                  Customer {getSortIcon("customerName")}
                </th>
                <th onClick={() => requestSort("branchName")} className="production-sortable">
                  Branch {getSortIcon("branchName")}
                </th>
                {orderType === "default" ? (
                  <th onClick={() => requestSort("productName")} className="production-sortable">
                    Product {getSortIcon("productName")}
                  </th>
                ) : null}
                {orderType === "custom" ? (
                  <th onClick={() => requestSort("customSize")} className="production-sortable">
                    Size {getSortIcon("customSize")}
                  </th>
                ) : null}
                <th onClick={() => requestSort("layers")} className="production-sortable">
                  Layers {getSortIcon("layers")}
                </th>
                <th onClick={() => requestSort("quantity")} className="production-sortable">
                  Ordered {getSortIcon("quantity")}
                </th>
                <th
                  onClick={() => requestSort("quantityProduced")}
                  className="production-sortable"
                >
                  Produced {getSortIcon("quantityProduced")}
                </th>
                <th>Progress</th>
                <th onClick={() => requestSort("totalCost")} className="production-sortable">
                  Total Cost {getSortIcon("totalCost")}
                </th>
                <th onClick={() => requestSort("amountPaid")} className="production-sortable">
                  Paid {getSortIcon("amountPaid")}
                </th>
                <th>Remaining</th>
                <th onClick={() => requestSort("description")} className="production-sortable">
                  Description {getSortIcon("description")}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.length > 0 ? (
                <>
                  {paginatedOrders.map((entry, index) => {
                    const progress =
                      Number(entry.quantity) > 0
                        ? (Number(entry.quantityProduced) / Number(entry.quantity)) * 100
                        : 0;

                    return (
                      <tr key={entry.orderId || index}>
                        <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                        <td>{entry.customerName}</td>
                        <td>{entry.branchName}</td>
                        {orderType === "default" ? <td>{entry.productName}</td> : null}
                        {orderType === "custom" ? <td>{entry.customSize}</td> : null}
                        <td>{entry.layers}</td>
                        <td>{entry.quantity}</td>
                        <td>{entry.quantityProduced}</td>
                        <td>
                          <ProgressBar now={progress} label={`${progress.toFixed(0)}%`} />
                        </td>
                        <td>{currency}{entry.totalCost}</td>
                        <td>{currency}{entry.amountPaid}</td>
                        <td>{currency}{Number(entry.totalCost) - Number(entry.amountPaid)}</td>
                        <td>{entry.description}</td>
                        <td>
                          <div className="d-flex flex-row justify-content-between gap-2">
                            <PermissionWrapper
                              required={["ordersupdate"]}
                              children={
                                <Button
                                  className="btn-sm"
                                  onClick={() => {
                                    setOrderId(entry.orderId);
                                    setOrder(entry);
                                    setCustId(entry.custId);
                                    setIsUpdate(true);
                                    setShowModal(true);
                                  }}
                                >
                                  <Edit />
                                </Button>
                              }
                            />
                            <PermissionWrapper
                              required={["ordersdelete"]}
                              children={
                                <Button
                                  className="btn-sm btn-danger"
                                  onClick={() => {
                                    setOrderId(entry.orderId);
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  <Delete />
                                </Button>
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="production-total-row">
                    <td colSpan={5}>Total:</td>
                    <td>
                      {visibleOrders.reduce(
                        (total, currentOrder) => total + (Number(currentOrder.quantity) || 0),
                        0
                      )}
                    </td>
                    <td>
                      {visibleOrders.reduce(
                        (total, currentOrder) =>
                          total + (Number(currentOrder.quantityProduced) || 0),
                        0
                      )}
                    </td>
                    <td></td>
                    <td>
                      {currency}
                      {visibleOrders
                        .reduce(
                          (total, currentOrder) => total + (Number(currentOrder.totalCost) || 0),
                          0
                        )
                        .toFixed(2)}
                    </td>
                    <td>
                      {currency}
                      {visibleOrders
                        .reduce(
                          (total, currentOrder) => total + (Number(currentOrder.amountPaid) || 0),
                          0
                        )
                        .toFixed(2)}
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td colSpan="13" className="text-center">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
        <ProductionTableFooter
          totalItems={visibleOrders.length}
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={setRowsPerPage}
          itemLabel="orders"
        />
      </div>

      <Modal
        show={showModal}
        onHide={handleCloseModal}
        backdrop="static"
        dialogClassName="production-modal-shell"
      >
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
            <div className="production-form-grid">
              <div className="production-form-grid-single">
                <Form.Group className="mb-3">
                  <Form.Label>Branch</Form.Label>
                  <Form.Select
                    value={order.branchId || ""}
                    onChange={(event) => {
                      const branchId = event.target.value;
                      setOrder((currentOrder) => ({
                        ...currentOrder,
                        branchId,
                        prodId:
                          branchId && String(currentOrder.branchId || "") !== String(branchId)
                            ? ""
                            : currentOrder.prodId,
                      }));
                    }}
                  >
                    <option value="">Select branch</option>
                    {branches.map((branch) => (
                      <option key={branch.branchId} value={branch.branchId}>
                        {branch.branchName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="production-form-grid-single">
                <CustomerSelection
                  setCustId={setCustId}
                  custId={custId}
                  setCustomer={() => {}}
                  customersOverride={filteredCustomers}
                />
              </div>
              {orderType === "default" ? (
                <>
                  <Form.Group className="production-form-grid-single" controlId="selectProduct">
                    <Form.Label>Select Product</Form.Label>
                    <Form.Control
                      as="select"
                      value={order.prodId || ""}
                      style={{ height: "46px" }}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setOrder((currentOrder) => ({
                          ...currentOrder,
                          prodId: !Number.isNaN(value) ? value : "",
                        }));
                      }}
                    >
                      <option value="" disabled>
                        Select Product
                      </option>
                      {filteredProducts.map((product) => (
                        <option key={product.itemId} value={product.itemId}>
                          {product.itemName}
                        </option>
                      ))}
                    </Form.Control>
                    {!order.prodId ? (
                      <div style={{ color: "red", fontSize: "0.9em" }}>
                        Please select a product
                      </div>
                    ) : null}
                  </Form.Group>
                  <Form.Group controlId="quantity">
                    <Form.Label>Quantity</Form.Label>
                    <Form.Control
                      type="number"
                      min={1}
                      value={order.quantity}
                      onChange={(event) =>
                        setOrder((currentOrder) => ({
                          ...currentOrder,
                          quantity: event.target.value,
                        }))
                      }
                    />
                  </Form.Group>
                  <Form.Group controlId="quantityProduced">
                    <Form.Label>Quantity Produced</Form.Label>
                    <Form.Control
                      type="number"
                      min={0}
                      max={order.quantity}
                      value={order.quantityProduced}
                      onChange={(event) =>
                        setOrder((currentOrder) => ({
                          ...currentOrder,
                          quantityProduced: event.target.value,
                        }))
                      }
                    />
                  </Form.Group>
                  <Form.Group className="production-form-grid-single">
                    <Form.Label>Select Selling Cost</Form.Label>
                    {(() => {
                      const selectedProduct = products.find(
                        (product) => Number(product.itemId) === Number(order.prodId)
                      );

                      if (!selectedProduct) {
                        return <p className="text-muted mb-0">Product information not available.</p>;
                      }

                      return (
                        <>
                          <Form.Check
                            type="radio"
                            name={`sellingCost-${order.prodId}`}
                            label={`Retail: ${selectedProduct.itemLeastPrice}`}
                            value={selectedProduct.itemLeastPrice}
                            id={`retail-${order.prodId}`}
                            checked={String(sellingCost) === String(selectedProduct.itemLeastPrice)}
                            onChange={(event) => setSellingCost(event.target.value)}
                          />
                          <Form.Check
                            type="radio"
                            name={`sellingCost-${order.prodId}`}
                            label={`Wholesale: ${selectedProduct.itemStockPrice}`}
                            value={selectedProduct.itemStockPrice}
                            id={`wholesale-${order.prodId}`}
                            checked={String(sellingCost) === String(selectedProduct.itemStockPrice)}
                            onChange={(event) => setSellingCost(event.target.value)}
                          />
                        </>
                      );
                    })()}
                  </Form.Group>
                  <Form.Group controlId="price">
                    <Form.Label>Total Cost</Form.Label>
                    <Form.Control
                      type="text"
                      disabled
                      value={order.totalCost}
                      onChange={(event) =>
                        setOrder((currentOrder) => ({
                          ...currentOrder,
                          totalCost: event.target.value,
                        }))
                      }
                    />
                  </Form.Group>
                  <Form.Group controlId="amountPaid">
                    <Form.Label>Amount Paid</Form.Label>
                    <Form.Control
                      type="text"
                      value={order.amountPaid}
                      onChange={(event) =>
                        setOrder((currentOrder) => ({
                          ...currentOrder,
                          amountPaid: event.target.value,
                        }))
                      }
                    />
                  </Form.Group>
                  <Form.Group className="production-form-grid-single" controlId="description">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      type="text"
                      value={order.description}
                      onChange={(event) =>
                        setOrder((currentOrder) => ({
                          ...currentOrder,
                          description: event.target.value,
                        }))
                      }
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
                      onChange={(event) =>
                        setOrder((currentOrder) => ({
                          ...currentOrder,
                          customSize: event.target.value,
                        }))
                      }
                    />
                  </Form.Group>
                  <Form.Group controlId="layers">
                    <Form.Label>Number of Layers</Form.Label>
                    <Form.Control
                      type="number"
                      value={order.layers}
                      onChange={(event) =>
                        setOrder((currentOrder) => ({
                          ...currentOrder,
                          layers: event.target.value,
                        }))
                      }
                    />
                  </Form.Group>
                  <Form.Group controlId="quantity">
                    <Form.Label>Quantity</Form.Label>
                    <Form.Control
                      type="number"
                      value={order.quantity}
                      onChange={(event) =>
                        setOrder((currentOrder) => ({
                          ...currentOrder,
                          quantity: event.target.value,
                        }))
                      }
                    />
                  </Form.Group>
                  <Form.Group controlId="quantityProduced">
                    <Form.Label>Quantity Produced</Form.Label>
                    <Form.Control
                      type="number"
                      value={order.quantityProduced}
                      onChange={(event) =>
                        setOrder((currentOrder) => ({
                          ...currentOrder,
                          quantityProduced: event.target.value,
                        }))
                      }
                    />
                  </Form.Group>
                  <Form.Group controlId="totalCost">
                    <Form.Label>Total Cost</Form.Label>
                    <Form.Control
                      type="text"
                      value={order.totalCost}
                      onChange={(event) =>
                        setOrder((currentOrder) => ({
                          ...currentOrder,
                          totalCost: event.target.value,
                        }))
                      }
                    />
                  </Form.Group>
                  <Form.Group controlId="paid">
                    <Form.Label>Amount Paid</Form.Label>
                    <Form.Control
                      type="text"
                      value={order.amountPaid}
                      onChange={(event) =>
                        setOrder((currentOrder) => ({
                          ...currentOrder,
                          amountPaid: event.target.value,
                        }))
                      }
                    />
                  </Form.Group>
                  <Form.Group className="production-form-grid-single" controlId="description">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      type="text"
                      value={order.description}
                      onChange={(event) =>
                        setOrder((currentOrder) => ({
                          ...currentOrder,
                          description: event.target.value,
                        }))
                      }
                    />
                  </Form.Group>
                </>
              )}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          {isUpdate ? (
            updateLoading ? (
              <Button>Updating</Button>
            ) : (
              <Button onClick={handleUpdateOrder}>Update</Button>
            )
          ) : isLoading ? (
            <Button variant="primary">Saving...</Button>
          ) : (
            <Button variant="primary" onClick={createOrder} disabled={!canSave}>
              Save Order
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      <Modal
        show={showDeleteModal}
        onHide={handleCloseDeleteModal}
        backdrop="static"
        dialogClassName="production-modal-shell"
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete Alert</Modal.Title>
        </Modal.Header>
        {isDeleteLoading ? <LinearProgress /> : <div></div>}
        <Modal.Body>
          <div className="production-modal-alert production-modal-alert-danger">
            {isDeleteSuccess
              ? "Order deleted successfully."
              : "You are about to delete an order."}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Close
          </Button>
          {isDeleteLoading ? (
            <Button className="btn btn-danger btn-small">Deleting...</Button>
          ) : orderId ? (
            <Button className="btn btn-danger btn-small" onClick={handleDeleteOrder}>
              Delete
            </Button>
          ) : (
            <Button className="btn btn-danger btn-small" disabled>
              Delete
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OrderManagement;
