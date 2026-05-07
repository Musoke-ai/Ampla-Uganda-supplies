import React, { useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Table } from "react-bootstrap";
import {
  ClipboardCheck,
  ClipboardData,
  Hammer,
  PencilSquare,
  PlusCircle,
  SendCheck,
  Trash,
} from "react-bootstrap-icons";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

import { selectBranchScope } from "../../auth/authSlice";
import { selectBranches, useGetBranchesQuery } from "../../features/api/branchesSlice";
import { selectEmployees, useGetEmployeesQuery } from "../../features/api/employeesSlice";
import { selectOrders, useGetOrdersQuery } from "../../features/api/orderSlice";
import {
  selectProductionBatches,
  useAddProductionBatchExpenseMutation,
  useAddProductionBatchLaborMutation,
  useAddProductionBatchMaterialMutation,
  useCreateProductionBatchMutation,
  useDeleteProductionBatchMutation,
  useGetProductionBatchesQuery,
  usePostProductionBatchOutputMutation,
  useUpdateProductionBatchMutation,
  useUpdateProductionBatchQualityMutation,
  useUpdateProductionBatchStatusMutation,
} from "../../features/api/productionBatchSlice";
import { selectRawMaterials, useGetRawMaterialsQuery } from "../../features/api/rawmaterialsSlice";
import { selectStock, useGetStockQuery } from "../../features/stock/stockSlice";

const toNumber = (value) => Number(value || 0);
const today = () => new Date().toISOString().slice(0, 10);

const initialBatchForm = (branchId = "") => ({
  branchId,
  orderId: "",
  productId: "",
  supervisorId: "",
  quantityPlanned: "",
  startDate: today(),
  notes: "",
});

const initialActionForm = {
  materialId: "",
  quantity: "",
  employeeId: "",
  role: "",
  hoursWorked: "",
  laborCost: "",
  category: "",
  description: "",
  amount: "",
  productId: "",
  outputQuantity: "",
  wastageQuantity: "",
  qualityStatus: "approved",
  qualityNotes: "",
  status: "in_progress",
};

const hasBranchValue = (record) =>
  record?.branchId !== undefined && record?.branchId !== null && String(record.branchId) !== "";

const scopedOptions = (records, branchId) => {
  if (!branchId) return records;

  const filtered = records.filter(
    (record) => !hasBranchValue(record) || String(record.branchId) === String(branchId)
  );

  return filtered.length ? filtered : records;
};

const firstValue = (record, keys = []) => {
  const match = keys.find(
    (key) => record?.[key] !== undefined && record?.[key] !== null && String(record[key]) !== ""
  );

  return match ? record[match] : "";
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getOrderProductId = (order, productList = []) => {
  if (!order) return "";

  const directId = firstValue(order, [
    "prodId",
    "productId",
    "itemId",
    "prod_id",
    "product_id",
    "item_id",
  ]);

  if (directId) return String(directId);

  const productName = normalizeText(
    firstValue(order, ["productName", "itemName", "prodName", "customSize", "description"])
  );

  if (!productName) return "";

  const match = productList.find((product) =>
    [product.itemName, product.productName, product.name]
      .map(normalizeText)
      .filter(Boolean)
      .some((name) => name === productName || name.includes(productName) || productName.includes(name))
  );

  return match?.itemId ? String(match.itemId) : "";
};

const getOrderQuantity = (order) =>
  firstValue(order, ["quantity", "orderQuantity", "qty", "quantityOrdered"]) || "";

const batchHasRecordedActivity = (batch) =>
  toNumber(batch?.quantityProduced) > 0 ||
  toNumber(batch?.wastageQuantity) > 0 ||
  toNumber(batch?.costing?.materialCost) > 0 ||
  toNumber(batch?.costing?.laborCost) > 0 ||
  toNumber(batch?.costing?.expenseCost) > 0 ||
  toNumber(batch?.costing?.outputQuantity) > 0 ||
  toNumber(batch?.costing?.wastageQuantity) > 0;

export default function ProductionBatches() {
  const branchScope = useSelector(selectBranchScope);
  const currentBranchId = branchScope?.effective_branch_id
    ? String(branchScope.effective_branch_id)
    : "";
  const canSwitchBranches = Boolean(branchScope?.can_switch_branches);
  const branches = useSelector(selectBranches) ?? [];
  const products = useSelector(selectStock) ?? [];
  const rawMaterials = useSelector(selectRawMaterials) ?? [];
  const orders = useSelector(selectOrders) ?? [];
  const employees = useSelector(selectEmployees) ?? [];
  const batches = useSelector(selectProductionBatches) ?? [];

  useGetBranchesQuery();
  useGetStockQuery();
  useGetRawMaterialsQuery();
  useGetOrdersQuery();
  useGetEmployeesQuery();
  useGetProductionBatchesQuery();

  const [createBatch, { isLoading: isCreating }] = useCreateProductionBatchMutation();
  const [updateBatch, { isLoading: isUpdatingBatch }] = useUpdateProductionBatchMutation();
  const [deleteBatch, { isLoading: isDeletingBatch }] = useDeleteProductionBatchMutation();
  const [addMaterial, { isLoading: isAddingMaterial }] = useAddProductionBatchMaterialMutation();
  const [addLabor, { isLoading: isAddingLabor }] = useAddProductionBatchLaborMutation();
  const [addExpense, { isLoading: isAddingExpense }] = useAddProductionBatchExpenseMutation();
  const [postOutput, { isLoading: isPostingOutput }] = usePostProductionBatchOutputMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateProductionBatchStatusMutation();
  const [updateQuality, { isLoading: isUpdatingQuality }] = useUpdateProductionBatchQualityMutation();

  const [batchForm, setBatchForm] = useState(initialBatchForm(currentBranchId));
  const [editingBatchId, setEditingBatchId] = useState("");
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [actionForm, setActionForm] = useState(initialActionForm);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionMode, setActionMode] = useState("material");

  const selectedBatch = useMemo(
    () => batches.find((batch) => String(batch.batchId) === String(selectedBatchId)) || batches[0],
    [batches, selectedBatchId]
  );

  const branchId = batchForm.branchId || currentBranchId;
  const actionBranchId = selectedBatch?.branchId || branchId;
  const branchProducts = useMemo(
    () => scopedOptions(products, branchId),
    [branchId, products]
  );
  const branchOrders = useMemo(
    () => scopedOptions(orders, branchId),
    [branchId, orders]
  );
  const branchMaterials = useMemo(
    () => scopedOptions(rawMaterials, branchId),
    [branchId, rawMaterials]
  );
  const branchEmployees = useMemo(
    () => scopedOptions(employees, branchId),
    [branchId, employees]
  );
  const actionProducts = useMemo(
    () => scopedOptions(products, actionBranchId),
    [actionBranchId, products]
  );
  const actionMaterials = useMemo(
    () => scopedOptions(rawMaterials, actionBranchId),
    [actionBranchId, rawMaterials]
  );
  const actionEmployees = useMemo(
    () => scopedOptions(employees, actionBranchId),
    [actionBranchId, employees]
  );

  const productMap = useMemo(
    () => new Map(products.map((product) => [String(product.itemId), product.itemName])),
    [products]
  );
  const branchMap = useMemo(
    () => new Map(branches.map((branch) => [String(branch.branchId), branch.branchName])),
    [branches]
  );

  const totals = useMemo(() => {
    return batches.reduce(
      (summary, batch) => {
        summary.total += 1;
        if (batch.status === "in_progress") summary.inProgress += 1;
        if (batch.status === "completed") summary.completed += 1;
        summary.cost += toNumber(batch.costing?.totalCost);
        summary.output += toNumber(batch.costing?.outputQuantity);
        summary.wastage += toNumber(batch.costing?.wastageQuantity);
        return summary;
      },
      { total: 0, inProgress: 0, completed: 0, cost: 0, output: 0, wastage: 0 }
    );
  }, [batches]);

  const resetBatchForm = () => {
    setBatchForm(initialBatchForm(currentBranchId));
    setEditingBatchId("");
  };

  const openEditBatch = (batch) => {
    setEditingBatchId(String(batch.batchId));
    setBatchForm({
      branchId: batch.branchId ? String(batch.branchId) : currentBranchId,
      orderId: batch.orderId ? String(batch.orderId) : "",
      productId: batch.productId ? String(batch.productId) : "",
      supervisorId: batch.supervisorId ? String(batch.supervisorId) : "",
      quantityPlanned: batch.quantityPlanned || "",
      startDate: batch.startDate || today(),
      endDate: batch.endDate || "",
      status: batch.status || "planned",
      notes: batch.notes || "",
    });
  };

  const handleSaveBatch = async (event) => {
    event.preventDefault();
    const payload = {
      ...batchForm,
      branchId: batchForm.branchId || currentBranchId,
    };

    try {
      if (editingBatchId) {
        await updateBatch({ ...payload, batchId: editingBatchId }).unwrap();
        toast.success("Production batch updated.");
      } else {
        await createBatch(payload).unwrap();
        toast.success("Production batch created.");
      }
      resetBatchForm();
    } catch (error) {
      toast.error(error?.data?.message || error?.error || "Production batch could not be saved.");
    }
  };

  const handleDeleteBatch = async () => {
    if (!batchToDelete?.batchId) return;

    try {
      await deleteBatch({ batchId: batchToDelete.batchId }).unwrap();
      toast.success("Production batch deleted.");
      setBatchToDelete(null);
      if (String(editingBatchId) === String(batchToDelete.batchId)) {
        resetBatchForm();
      }
    } catch (error) {
      toast.error(error?.data?.message || error?.error || "Production batch could not be deleted.");
    }
  };

  const openAction = (mode, batch) => {
    setActionMode(mode);
    setSelectedBatchId(String(batch.batchId));
    setActionForm({
      ...initialActionForm,
      productId: batch.productId || "",
      outputQuantity: Math.max(toNumber(batch.quantityPlanned) - toNumber(batch.quantityProduced), 0) || "",
      status: batch.status || "in_progress",
    });
    setShowActionModal(true);
  };

  const closeAction = () => {
    setShowActionModal(false);
    setActionForm(initialActionForm);
  };

  const handleActionSubmit = async (event) => {
    event.preventDefault();
    if (!selectedBatch) return;

    const batchId = selectedBatch.batchId;

    try {
      if (actionMode === "material") {
        await addMaterial({
          batchId,
          materialId: actionForm.materialId,
          quantity: actionForm.quantity,
        }).unwrap();
        toast.success("Material usage recorded.");
      } else if (actionMode === "labor") {
        await addLabor({
          batchId,
          employeeId: actionForm.employeeId,
          role: actionForm.role,
          hoursWorked: actionForm.hoursWorked,
          laborCost: actionForm.laborCost,
        }).unwrap();
        toast.success("Labor cost recorded.");
      } else if (actionMode === "expense") {
        await addExpense({
          batchId,
          category: actionForm.category || "Production",
          description: actionForm.description,
          amount: actionForm.amount,
        }).unwrap();
        toast.success("Production expense recorded.");
      } else if (actionMode === "output") {
        await postOutput({
          batchId,
          productId: actionForm.productId,
          quantity: actionForm.outputQuantity,
          wastageQuantity: actionForm.wastageQuantity,
        }).unwrap();
        toast.success("Finished goods posted to inventory.");
      } else if (actionMode === "quality") {
        await updateQuality({
          batchId,
          qualityStatus: actionForm.qualityStatus,
          qualityNotes: actionForm.qualityNotes,
        }).unwrap();
        toast.success("Quality check updated.");
      } else if (actionMode === "status") {
        await updateStatus({
          batchId,
          status: actionForm.status,
        }).unwrap();
        toast.success("Batch status updated.");
      }

      closeAction();
    } catch (error) {
      toast.error(error?.data?.message || error?.error || "Batch action could not be completed.");
    }
  };

  const money = (value) =>
    `UGX ${Number(value || 0).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;
  const selectedOrder = useMemo(
    () => branchOrders.find((order) => String(order.orderId) === String(batchForm.orderId)) || null,
    [batchForm.orderId, branchOrders]
  );
  const editingBatch = useMemo(
    () => batches.find((batch) => String(batch.batchId) === String(editingBatchId)) || null,
    [batches, editingBatchId]
  );
  const editingBatchHasActivity = batchHasRecordedActivity(editingBatch);
  const selectedOrderProductId = getOrderProductId(selectedOrder, products);
  const selectedProductFromAll = products.find(
    (product) => String(product.itemId) === String(batchForm.productId)
  );
  const batchProductOptions = useMemo(() => {
    if (selectedOrderProductId) {
      const orderProduct = products.find(
        (product) => String(product.itemId) === String(selectedOrderProductId)
      );

      return orderProduct ? [orderProduct] : [];
    }

    const optionMap = new Map(branchProducts.map((product) => [String(product.itemId), product]));

    if (selectedProductFromAll) {
      optionMap.set(String(selectedProductFromAll.itemId), selectedProductFromAll);
    }

    return Array.from(optionMap.values());
  }, [branchProducts, products, selectedOrderProductId, selectedProductFromAll]);

  return (
    <div className="production-modal-stack">
      <Row className="g-3">
        <Col md={6} xl={3}>
          <Metric title="Batches" value={totals.total} note={`${totals.inProgress} in progress`} />
        </Col>
        <Col md={6} xl={3}>
          <Metric title="Completed" value={totals.completed} note="Finished batches" />
        </Col>
        <Col md={6} xl={3}>
          <Metric title="Batch Cost" value={money(totals.cost)} note="Materials + labor + expenses" />
        </Col>
        <Col md={6} xl={3}>
          <Metric title="Output" value={totals.output} note={`${totals.wastage} wastage recorded`} />
        </Col>
      </Row>

      <Card className="border-0 shadow-sm production-batch-form-card">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center justify-content-between gap-3 mb-3 flex-wrap">
            <div className="d-flex align-items-center gap-2">
              {editingBatchId ? <PencilSquare /> : <PlusCircle />}
              <h5 className="mb-0">{editingBatchId ? "Edit Production Batch" : "Create Production Batch"}</h5>
            </div>
            {editingBatchId ? (
              <Button variant="outline-secondary" size="sm" onClick={resetBatchForm}>
                Cancel Edit
              </Button>
            ) : null}
          </div>
          <Form onSubmit={handleSaveBatch}>
            <Row className="g-3">
              <Col md={6} xl={3}>
                <Form.Group>
                  <Form.Label>Branch</Form.Label>
                  <Form.Select
                    disabled={!canSwitchBranches || editingBatchHasActivity}
                    value={batchForm.branchId || currentBranchId}
                    onChange={(event) =>
                      setBatchForm({ ...batchForm, branchId: event.target.value, orderId: "", productId: "" })
                    }
                    required
                  >
                    <option value="">Select branch</option>
                    {branches.map((branch) => (
                      <option key={branch.branchId} value={branch.branchId}>
                        {branch.branchName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6} xl={3}>
                <Form.Group>
                  <Form.Label>Order</Form.Label>
                  <Form.Select
                    disabled={editingBatchHasActivity}
                    value={batchForm.orderId}
                    onChange={(event) => {
                      const order = branchOrders.find((item) => String(item.orderId) === event.target.value);
                      const orderProductId = getOrderProductId(order, branchProducts);
                      setBatchForm({
                        ...batchForm,
                        orderId: event.target.value,
                        productId: orderProductId || batchForm.productId,
                        quantityPlanned: getOrderQuantity(order) || batchForm.quantityPlanned,
                      });
                    }}
                  >
                    <option value="">No linked order</option>
                    {branchOrders.map((order) => (
                      <option key={order.orderId} value={order.orderId}>
                        #{order.orderId} - {productMap.get(getOrderProductId(order, products)) || order.productName || order.customSize || "Custom item"}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6} xl={3}>
                <Form.Group>
                  <Form.Label>Product</Form.Label>
                  <Form.Select
                    value={batchForm.productId}
                    onChange={(event) => setBatchForm({ ...batchForm, productId: event.target.value })}
                    disabled={Boolean(batchForm.orderId) || editingBatchHasActivity}
                    required
                  >
                    <option value="">Select product</option>
                    {batchProductOptions.map((product) => (
                      <option key={product.itemId} value={product.itemId}>
                        {product.itemName}
                      </option>
                    ))}
                  </Form.Select>
                  {batchForm.orderId ? (
                    <Form.Text>
                      Auto-selected from order
                      {selectedOrderProductId && productMap.get(String(selectedOrderProductId))
                        ? `: ${productMap.get(String(selectedOrderProductId))}`
                        : ""}
                      . Clear the linked order to choose a different product.
                    </Form.Text>
                  ) : null}
                </Form.Group>
              </Col>
              <Col md={6} xl={3}>
                <Form.Group>
                  <Form.Label>Planned Qty</Form.Label>
                  <Form.Control
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={batchForm.quantityPlanned}
                    onChange={(event) => setBatchForm({ ...batchForm, quantityPlanned: event.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6} xl={3}>
                <Form.Group>
                  <Form.Label>Supervisor</Form.Label>
                  <Form.Select
                    value={batchForm.supervisorId}
                    onChange={(event) => setBatchForm({ ...batchForm, supervisorId: event.target.value })}
                  >
                    <option value="">No supervisor</option>
                    {branchEmployees.map((employee) => (
                      <option key={employee.empID} value={employee.empID}>
                        {employee.empName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6} xl={3}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={batchForm.status || "planned"}
                    onChange={(event) => setBatchForm({ ...batchForm, status: event.target.value })}
                  >
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="quality_check">Quality Check</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6} xl={3}>
                <Form.Group>
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={batchForm.startDate}
                    onChange={(event) => setBatchForm({ ...batchForm, startDate: event.target.value })}
                  />
                </Form.Group>
              </Col>
              {editingBatchId ? (
                <Col md={6} xl={3}>
                  <Form.Group>
                    <Form.Label>End Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={batchForm.endDate || ""}
                      onChange={(event) => setBatchForm({ ...batchForm, endDate: event.target.value })}
                    />
                  </Form.Group>
                </Col>
              ) : null}
              <Col md={12} xl={6}>
                <Form.Group>
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    value={batchForm.notes}
                    onChange={(event) => setBatchForm({ ...batchForm, notes: event.target.value })}
                    placeholder="Production instructions, reservation notes, or QC expectations"
                  />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Button type="submit" variant="success" disabled={isCreating || isUpdatingBatch}>
                  {editingBatchId
                    ? (isUpdatingBatch ? "Updating..." : "Update Batch")
                    : (isCreating ? "Creating..." : "Create Batch")}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <ClipboardData />
            <h5 className="mb-0">Batch Costing & Workflow</h5>
          </div>

          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Product</th>
                  <th>Progress</th>
                  <th>Cost</th>
                  <th>QC</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => {
                  const produced = toNumber(batch.quantityProduced);
                  const planned = toNumber(batch.quantityPlanned);
                  const progress = planned > 0 ? Math.min(100, Math.round((produced / planned) * 100)) : 0;

                  return (
                    <tr key={batch.batchId}>
                      <td>
                        <div className="fw-bold">{batch.batchNo}</div>
                        <small className="text-muted">
                          {branchMap.get(String(batch.branchId)) || "Branch"} | {batch.status}
                        </small>
                      </td>
                      <td>{batch.productName || productMap.get(String(batch.productId)) || "Product"}</td>
                      <td>
                        <div>{produced} / {planned}</div>
                        <small className="text-muted">{progress}% complete</small>
                      </td>
                      <td>
                        <div className="fw-bold">{money(batch.costing?.totalCost)}</div>
                        <small className="text-muted">Unit {money(batch.costing?.costPerUnit)}</small>
                      </td>
                      <td>
                        <Badge bg={batch.qualityStatus === "approved" ? "success" : "warning"}>
                          {batch.qualityStatus || "pending"}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-2">
                          <Button size="sm" variant="outline-success" onClick={() => openAction("material", batch)}>
                            Material
                          </Button>
                          <Button size="sm" variant="outline-secondary" onClick={() => openAction("labor", batch)}>
                            Labor
                          </Button>
                          <Button size="sm" variant="outline-secondary" onClick={() => openAction("expense", batch)}>
                            Expense
                          </Button>
                          <Button size="sm" variant="success" onClick={() => openAction("output", batch)}>
                            Output
                          </Button>
                          <Button size="sm" variant="outline-primary" onClick={() => openAction("quality", batch)}>
                            QC
                          </Button>
                          <Button size="sm" variant="outline-dark" onClick={() => openAction("status", batch)}>
                            Status
                          </Button>
                          <Button size="sm" variant="outline-primary" onClick={() => openEditBatch(batch)}>
                            <PencilSquare className="me-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline-danger" onClick={() => setBatchToDelete(batch)}>
                            <Trash className="me-1" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          {!batches.length ? (
            <Alert variant="info" className="mb-0">
              No production batches have been created yet.
            </Alert>
          ) : null}
        </Card.Body>
      </Card>

      <Modal
        show={showActionModal}
        onHide={closeAction}
        centered
        dialogClassName="production-modal-shell production-batch-action-modal"
      >
        <Form onSubmit={handleActionSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{actionTitle(actionMode)}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="text-muted">
              Batch <strong>{selectedBatch?.batchNo}</strong>
            </p>
            {actionMode === "material" ? (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Raw Material</Form.Label>
                  <Form.Select
                    value={actionForm.materialId}
                    onChange={(event) => setActionForm({ ...actionForm, materialId: event.target.value })}
                    required
                  >
                    <option value="">Select material</option>
                    {actionMaterials.map((material) => (
                      <option key={material.materialId} value={material.materialId}>
                        {material.name || material.materialName} - Available {material.Quantity || material.quantity || 0}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <NumberField label="Quantity Used" value={actionForm.quantity} onChange={(quantity) => setActionForm({ ...actionForm, quantity })} />
              </>
            ) : null}

            {actionMode === "labor" ? (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Worker</Form.Label>
                  <Form.Select
                    value={actionForm.employeeId}
                    onChange={(event) => setActionForm({ ...actionForm, employeeId: event.target.value })}
                  >
                    <option value="">No linked worker</option>
                    {actionEmployees.map((employee) => (
                      <option key={employee.empID} value={employee.empID}>
                        {employee.empName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Control value={actionForm.role} onChange={(event) => setActionForm({ ...actionForm, role: event.target.value })} />
                </Form.Group>
                <NumberField label="Hours Worked" value={actionForm.hoursWorked} onChange={(hoursWorked) => setActionForm({ ...actionForm, hoursWorked })} />
                <NumberField label="Labor Cost" value={actionForm.laborCost} onChange={(laborCost) => setActionForm({ ...actionForm, laborCost })} />
              </>
            ) : null}

            {actionMode === "expense" ? (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Control value={actionForm.category} onChange={(event) => setActionForm({ ...actionForm, category: event.target.value })} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control value={actionForm.description} onChange={(event) => setActionForm({ ...actionForm, description: event.target.value })} />
                </Form.Group>
                <NumberField label="Amount" value={actionForm.amount} onChange={(amount) => setActionForm({ ...actionForm, amount })} />
              </>
            ) : null}

            {actionMode === "output" ? (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Finished Product</Form.Label>
                  <Form.Select
                    value={actionForm.productId}
                    onChange={(event) => setActionForm({ ...actionForm, productId: event.target.value })}
                    required
                  >
                    <option value="">Select product</option>
                    {actionProducts.map((product) => (
                      <option key={product.itemId} value={product.itemId}>
                        {product.itemName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <NumberField label="Produced Quantity" value={actionForm.outputQuantity} onChange={(outputQuantity) => setActionForm({ ...actionForm, outputQuantity })} />
                <NumberField label="Wastage Quantity" value={actionForm.wastageQuantity} onChange={(wastageQuantity) => setActionForm({ ...actionForm, wastageQuantity })} />
              </>
            ) : null}

            {actionMode === "quality" ? (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Quality Status</Form.Label>
                  <Form.Select
                    value={actionForm.qualityStatus}
                    onChange={(event) => setActionForm({ ...actionForm, qualityStatus: event.target.value })}
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rework">Needs rework</option>
                    <option value="rejected">Rejected</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Quality Notes</Form.Label>
                  <Form.Control as="textarea" rows={3} value={actionForm.qualityNotes} onChange={(event) => setActionForm({ ...actionForm, qualityNotes: event.target.value })} />
                </Form.Group>
              </>
            ) : null}

            {actionMode === "status" ? (
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={actionForm.status}
                  onChange={(event) => setActionForm({ ...actionForm, status: event.target.value })}
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="quality_check">Quality Check</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={closeAction}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              disabled={
                isAddingMaterial ||
                isAddingLabor ||
                isAddingExpense ||
                isPostingOutput ||
                isUpdatingQuality ||
                isUpdatingStatus
              }
            >
              Save
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={Boolean(batchToDelete)} onHide={() => setBatchToDelete(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Production Batch</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Delete batch <strong>{batchToDelete?.batchNo}</strong>?
          </p>
          <Alert variant="warning" className="mb-0">
            Only batches with no recorded materials, labor, expenses, or output can be deleted.
            Active production history should be cancelled or completed instead.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setBatchToDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteBatch} disabled={isDeletingBatch}>
            {isDeletingBatch ? "Deleting..." : "Delete Batch"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function Metric({ title, value, note }) {
  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Body className="p-3">
        <div className="d-flex align-items-start gap-2">
          <Hammer className="text-success mt-1" />
          <div>
            <div className="text-muted small">{title}</div>
            <div className="h5 fw-bold mb-1">{value}</div>
            <div className="text-muted small">{note}</div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <Form.Group className="mb-3">
      <Form.Label>{label}</Form.Label>
      <Form.Control
        type="number"
        min="0"
        step="0.001"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </Form.Group>
  );
}

function actionTitle(mode) {
  const labels = {
    material: "Record Material Usage",
    labor: "Add Labor Cost",
    expense: "Add Production Expense",
    output: "Post Finished Goods",
    quality: "Quality Check",
    status: "Update Batch Status",
  };

  const icons = {
    material: <ClipboardData className="me-2" />,
    labor: <Hammer className="me-2" />,
    expense: <ClipboardData className="me-2" />,
    output: <SendCheck className="me-2" />,
    quality: <ClipboardCheck className="me-2" />,
    status: <ClipboardData className="me-2" />,
  };

  return (
    <>
      {icons[mode]}
      {labels[mode] || "Batch Action"}
    </>
  );
}
