import React, { useEffect, useMemo, useState } from "react";
import { Table, Button, Modal, Form, Container, InputGroup } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useSelector } from "react-redux";
import { selectRawMaterials, useAddRawMaterialMutation, useUpdateRawMaterialMutation, useDeleteRawMaterialMutation } from "../../features/api/rawmaterialsSlice";
import {
  selectRawMaterialCategories,
  useAddRawMaterialCategoryMutation,
  useDeleteRawMaterialCategoryMutation,
  useGetRawMaterialCategoriesQuery,
  useUpdateRawMaterialCategoryMutation,
} from "../../features/api/rawMaterialCategoriesSlice";
import { selectBranches, useGetBranchesQuery } from "../../features/api/branchesSlice";
import ReactLoading from 'react-loading';
import RawMaterialModal from "./Process/SelectRawMaterials";
import PermissionWrapper from "../../auth/PermissionWrapper";
import { selectBranchScope } from "../../auth/authSlice";
import { Delete, Edit, Search } from "@mui/icons-material";
import { useSettings } from "../Settings";
import { toast } from "react-toastify";
import { useTableSortSearch } from "../../hooks/useTableSortSearch";
import { ArrowUp, ArrowDown } from "react-bootstrap-icons";
import {
  paginateItems,
  ProductionTableFooter,
} from "./ProductionTableControls";

const searchableFields = [
  "materialCode",
  "name",
  "category",
  "size",
  "unitOfMeasure",
  "supplier",
  "supplierContact",
  "storageLocation",
  "status",
  "note",
];

const unitOptions = ["pcs", "kg", "g", "litres", "ml", "metres", "rolls", "bags", "boxes", "sets"];
const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "discontinued", label: "Discontinued" },
];

const rawMaterialFields = [
  { key: "materialCode", label: "Material code", placeholder: "RM-SUGAR-001" },
  { key: "name", label: "Raw material name", placeholder: "Cotton fabric", required: true },
  { key: "category", label: "Category", type: "category", placeholder: "Fabric, packaging, chemical..." },
  { key: "size", label: "Package / specification", placeholder: "50 kg bag, 1 litre tin..." },
  { key: "unitOfMeasure", label: "Unit of measure", type: "select", options: unitOptions, required: true },
  { key: "Quantity", label: "Stock on hand", type: "number", step: "0.001", min: "0", required: true },
  { key: "unitPrice", label: "Unit price", type: "number", step: "0.01", min: "0", required: true },
  { key: "reorderLevel", label: "Reorder level", type: "number", step: "0.001", min: "0" },
  { key: "supplier", label: "Supplier", placeholder: "Supplier name" },
  { key: "supplierContact", label: "Supplier contact", placeholder: "Phone, email, or contact person" },
  { key: "storageLocation", label: "Storage location", placeholder: "Store A, Rack 3" },
  { key: "expiry", label: "Expiry date", type: "date" },
  { key: "status", label: "Status", type: "select", options: statusOptions, required: true },
  { key: "note", label: "Notes", type: "textarea", placeholder: "Handling instructions, quality notes, batch notes..." },
];

const formatQuantity = (value, unit = "") => {
  const number = Number(value) || 0;
  const formatted = Number.isInteger(number) ? String(number) : number.toFixed(3).replace(/\.?0+$/, "");
  return `${formatted}${unit ? ` ${unit}` : ""}`;
};

const stockStatus = (material) => {
  const quantity = Number(material?.Quantity) || 0;
  const reorderLevel = Number(material?.reorderLevel) || 0;

  if (quantity <= 0) {
    return { label: "Out", className: "danger" };
  }

  if (reorderLevel > 0 && quantity <= reorderLevel) {
    return { label: "Low", className: "warning" };
  }

  return { label: "Ok", className: "success" };
};

const RawMaterialCategoryManager = ({
  branches = [],
  canSwitchBranches = false,
  currentBranchId = "",
}) => {
  const categories = useSelector(selectRawMaterialCategories);
  const [addCategory, { isLoading: isAdding }] = useAddRawMaterialCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateRawMaterialCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteRawMaterialCategoryMutation();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    branchId: currentBranchId,
    categoryName: "",
    description: "",
    isActive: 1,
  });

  useEffect(() => {
    if (!showModal || editingCategory) {
      return;
    }

    setFormData((previous) => ({ ...previous, branchId: currentBranchId }));
  }, [currentBranchId, editingCategory, showModal]);

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      branchId: currentBranchId,
      categoryName: "",
      description: "",
      isActive: 1,
    });
  };

  const submitCategory = async () => {
    const payload = {
      ...formData,
      categoryName: String(formData.categoryName || "").trim(),
      description: String(formData.description || "").trim(),
      isActive: formData.isActive ? 1 : 0,
    };

    if (!payload.branchId) {
      toast.error("Please select a branch for this category.");
      return;
    }

    if (!payload.categoryName) {
      toast.error("Category name is required.");
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory({ ...payload, categoryId: editingCategory.categoryId }).unwrap();
        toast.success("Raw material category updated successfully");
      } else {
        await addCategory(payload).unwrap();
        toast.success("Raw material category added successfully");
      }
      resetForm();
    } catch (error) {
      toast.error(error?.data?.message || "Could not save raw material category.");
    }
  };

  const editCategory = (category) => {
    setEditingCategory(category);
    setFormData({
      branchId: category?.branchId ? String(category.branchId) : currentBranchId,
      categoryName: category?.categoryName || "",
      description: category?.description || "",
      isActive: Number(category?.isActive ?? 1),
    });
  };

  const removeCategory = async (category) => {
    try {
      await deleteCategory({ categoryId: category.categoryId }).unwrap();
      toast.success("Raw material category deleted successfully");
      if (editingCategory?.categoryId === category.categoryId) {
        resetForm();
      }
    } catch (error) {
      toast.error(error?.data?.message || "Could not delete raw material category.");
    }
  };

  return (
    <>
      <Button variant="outline-primary" onClick={() => setShowModal(true)}>
        Manage Categories
      </Button>

      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" size="lg" dialogClassName="production-modal-shell">
        <Modal.Header closeButton>
          <Modal.Title>Raw Material Categories</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form className="production-form-grid mb-4">
            <Form.Group>
              <Form.Label>Branch</Form.Label>
              <Form.Select
                value={formData.branchId || ""}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                disabled={!canSwitchBranches}
              >
                <option value="">Select branch</option>
                {branches.map((branch) => (
                  <option key={branch.branchId} value={String(branch.branchId)}>
                    {branch.branchName}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Category name *</Form.Label>
              <Form.Control
                value={formData.categoryName}
                placeholder="Fabric, packaging, chemical..."
                onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={String(formData.isActive)}
                onChange={(e) => setFormData({ ...formData, isActive: Number(e.target.value) })}
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="production-form-grid-single">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.description}
                placeholder="Optional notes about what belongs in this category"
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>
          </Form>

          <div className="d-flex gap-2 justify-content-end mb-3">
            {editingCategory ? (
              <Button variant="outline-secondary" onClick={resetForm}>
                Cancel Edit
              </Button>
            ) : null}
            <Button onClick={submitCategory} disabled={isAdding || isUpdating}>
              {editingCategory ? "Save Category" : "Add Category"}
            </Button>
          </div>

          <div className="production-table-scroll">
            <Table hover responsive className="production-modern-table align-middle">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.categoryId}>
                    <td className="fw-bold">{category.categoryName}</td>
                    <td>{category.description || "No description"}</td>
                    <td>
                      <span className={`badge bg-${Number(category.isActive) ? "success" : "secondary"}`}>
                        {Number(category.isActive) ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-center">
                      <Button variant="info" size="sm" className="me-2 text-white" onClick={() => editCategory(category)}>
                        <Edit />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => removeCategory(category)} disabled={isDeleting}>
                        <Delete />
                      </Button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center">No raw material categories found.</td>
                  </tr>
                ) : null}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

const RawMaterialsTable = () => {
const { settings } = useSettings();
const currency = settings.currency!=="none"?settings?.currency:"";
const theme = settings.theme;
    const branchScope = useSelector(selectBranchScope);
    useGetBranchesQuery();
    useGetRawMaterialCategoriesQuery();
    const branches = useSelector(selectBranches) ?? [];
    const rawMaterialCategories = useSelector(selectRawMaterialCategories) ?? [];
    const currentBranchId = branchScope?.effective_branch_id ? String(branchScope.effective_branch_id) : "";
    const canSwitchBranches = Boolean(branchScope?.can_switch_branches);

    const createEmptyForm = () => ({
      branchId: currentBranchId,
      materialCode: "",
      name: "",
      category: "",
      size: "",
      unitOfMeasure: "pcs",
      Quantity: "",
      unitPrice: "",
      reorderLevel: "",
      supplier: "",
      supplierContact: "",
      storageLocation: "",
      status: "active",
      note: "",
      expiry: "",
    });

    const rawMaterials = useSelector(selectRawMaterials);
    const [addRawMaterial, {isLoading, isError, error, isSuccess} ]= useAddRawMaterialMutation();
    const [updateRawMaterial, {isLoading:isUpdateLoading, isError: isUpdateError, error:updateError, isSuccess:isUpdateSuccess} ]= useUpdateRawMaterialMutation();
    const [deleteRawMaterial, {isLoading:isDeleteLoading, isError: isDeleteError, error:deleteError, isSuccess:isDeleteSuccess} ]= useDeleteRawMaterialMutation();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlertModal, setShowDeleteAlertModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [materialId, setMaterialId] = useState("");

  const { items: sortedMaterials, requestSort, sortConfig, setSearchTerm, searchTerm } = useTableSortSearch(rawMaterials, searchableFields);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortConfig, rowsPerPage]);

  useEffect(() => {
    const nextTotalPages = Math.max(1, Math.ceil(sortedMaterials.length / rowsPerPage));
    if (currentPage > nextTotalPages) {
      setCurrentPage(nextTotalPages);
    }
  }, [currentPage, rowsPerPage, sortedMaterials.length]);

  const {
    totalPages,
    paginatedItems: paginatedMaterials,
  } = useMemo(
    () => paginateItems(sortedMaterials, currentPage, rowsPerPage),
    [currentPage, rowsPerPage, sortedMaterials]
  );

  const [formData, setFormData] = useState(createEmptyForm);
  const activeCategoryOptions = useMemo(
    () => rawMaterialCategories.filter((category) => Number(category?.isActive ?? 1) === 1),
    [rawMaterialCategories]
  );

  useEffect(() => {
    if (!showAddModal) {
      setFormData((previous) => ({
        ...previous,
        branchId: previous?.materialId ? previous.branchId : currentBranchId,
      }));
    }
  }, [currentBranchId, showAddModal]);

  const handleShowEdit = (material) => {
    setSelectedMaterial(material);
    setFormData({
      ...createEmptyForm(),
      ...material,
      branchId: material?.branchId ? String(material.branchId) : currentBranchId,
      status: material?.status || "active",
      unitOfMeasure: material?.unitOfMeasure || "pcs",
    });
    setShowEditModal(true);
  };

  const getSortIcon = (key) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp />;
    }
    return <ArrowDown />;
  };

  const validateForm = () => {
    if (!formData.branchId) {
      toast.error("Please select a branch.");
      return false;
    }

    if (!String(formData.name || "").trim()) {
      toast.error("Raw material name is required.");
      return false;
    }

    for (const field of ["Quantity", "unitPrice", "reorderLevel"]) {
      const value = Number(formData[field] || 0);
      if (Number.isNaN(value) || value < 0) {
        toast.error(`${field} must be zero or more.`);
        return false;
      }
    }

    return true;
  };

  const cleanPayload = () => ({
    ...formData,
    materialCode: String(formData.materialCode || "").trim().toUpperCase(),
    name: String(formData.name || "").trim(),
    category: String(formData.category || "").trim(),
    size: String(formData.size || "").trim(),
    unitOfMeasure: formData.unitOfMeasure || "pcs",
    Quantity: Number(formData.Quantity || 0),
    unitPrice: Number(formData.unitPrice || 0),
    reorderLevel: Number(formData.reorderLevel || 0),
    supplier: String(formData.supplier || "").trim(),
    supplierContact: String(formData.supplierContact || "").trim(),
    storageLocation: String(formData.storageLocation || "").trim(),
    status: formData.status || "active",
    note: String(formData.note || "").trim(),
    expiry: formData.expiry || "",
  });

  const handleAdd = async () => {
    if (!validateForm()) {
      return;
    }

    try{
        await addRawMaterial(
           cleanPayload()
        ).unwrap();
        toast.success("Raw material added successfully");
        setFormData(createEmptyForm())
        setShowAddModal(false)
    }catch (error){
      toast.error(error?.data?.message || ("An error occured! " + error.status));
    }
  };

  const handleEdit = async () => {
    if (!validateForm()) {
      return;
    }

    try{
        await updateRawMaterial(
           cleanPayload()
        ).unwrap();
        toast.success("Raw material updated successfully");
                setFormData(createEmptyForm())
        setShowEditModal(false);
         setSelectedMaterial(null);
    }catch (error){
toast.error(error?.data?.message || ("An error occured! " + error.status));
    }
    // setFormData({});
  };

  const handleDelete = async (id) => {
    try{
        await deleteRawMaterial(
           {materialId: id}
        ).unwrap();
        toast.success("Raw material deleted successfully");
        setShowDeleteAlertModal(false);
        setSelectedMaterial(null);
        setMaterialId("");  
    }catch (error){
toast.error("An error occured! "+error.status);
    }
  };

  return (
    <Container className="mt-4 production-section-shell">
      <div className="production-section-header">
        <div className="production-section-copy">
          <h2>Raw Materials</h2>
          <p>Track supplier stock, current quantities, and the daily material intake workflow.</p>
        </div>
        <PermissionWrapper required={['rawcreate']}>
          <div className="production-action-cluster">
            <RawMaterialModal />
            <RawMaterialCategoryManager
              branches={branches}
              canSwitchBranches={canSwitchBranches}
              currentBranchId={currentBranchId}
            />
            <Button
              variant="primary"
              onClick={() => {
                setFormData(createEmptyForm());
                setShowAddModal(true);
              }}
            >
              Add New Raw Material
            </Button>
          </div>
        </PermissionWrapper>
      </div>

      <div className="production-filter-bar">
        <div className="production-filter-search">
          <InputGroup>
            <InputGroup.Text className={`${theme==='dark'?'text-white':'text-dark'}`}><Search /></InputGroup.Text>
            <Form.Control
              placeholder="Search by code, name, category, supplier, location, or note"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </div>
        <div className="production-stat-row">
          <span className="production-stat-chip">Materials: {sortedMaterials.length}</span>
          <span className="production-stat-chip">
            Qty: {sortedMaterials.reduce((total, item) => total + (Number(item.Quantity) || 0), 0)}
          </span>
        </div>
      </div>
      
      <div className="production-table-card">
        <div className="production-table-scroll">
          <Table hover responsive className="production-modern-table align-middle">
            <thead>
          <tr>
           <th>#</th>
            <th onClick={() => requestSort('materialCode')} className="production-sortable">
              Code {getSortIcon('materialCode')}
            </th>
            <th onClick={() => requestSort('name')} className="production-sortable">
              Raw Material {getSortIcon('name')}
            </th>
            <th onClick={() => requestSort('category')} className="production-sortable">
              Category {getSortIcon('category')}
            </th>
            <th onClick={() => requestSort('Quantity')} className="production-sortable">
              Stock {getSortIcon('Quantity')}
            </th>
            <th onClick={() => requestSort('reorderLevel')} className="production-sortable">
              Reorder {getSortIcon('reorderLevel')}
            </th>
            <th onClick={() => requestSort('unitPrice')} className="production-sortable">
              Unit Price {getSortIcon('unitPrice')}
            </th>
            <th onClick={() => requestSort('supplier')} className="production-sortable">
              Supplier {getSortIcon('supplier')}
            </th>
            <th onClick={() => requestSort('storageLocation')} className="production-sortable">
              Location {getSortIcon('storageLocation')}
            </th>
            <th onClick={() => requestSort('expiry')} className="production-sortable">
              Expiry {getSortIcon('expiry')}
            </th>
            <th onClick={() => requestSort('status')} className="production-sortable">
              Status {getSortIcon('status')}
            </th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedMaterials.map((material, idx) => (
            <tr key={material.materialId}>
             <td>{(currentPage - 1) * rowsPerPage + idx + 1}</td>
             <td>{material.materialCode || "N/A"}</td>
             <td>
              <div className="fw-bold">{material.name}</div>
              <div className="small text-muted">{material.size || "No package/spec"}{material.note ? ` - ${material.note}` : ""}</div>
             </td>
             <td>{material.category || "Uncategorized"}</td>
             <td>
              <div>{formatQuantity(material.Quantity, material.unitOfMeasure)}</div>
              <span className={`badge bg-${stockStatus(material).className}`}>{stockStatus(material).label}</span>
             </td>
             <td>{formatQuantity(material.reorderLevel, material.unitOfMeasure)}</td>
             <td>{currency}{material.unitPrice}</td>
             <td>
              <div>{material.supplier || "Unspecified"}</div>
              {material.supplierContact ? <div className="small text-muted">{material.supplierContact}</div> : null}
             </td>
             <td>{material.storageLocation || "Not set"}</td>
             <td>{material.expiry || "N/A"}</td>
             <td><span className="badge bg-secondary text-capitalize">{material.status || "active"}</span></td>
              <td className="text-center">
              <PermissionWrapper  required={['rawupdate']} children={<Button variant="info" size="sm" className="me-2 text-white" onClick={() => handleShowEdit(material)}><Edit /></Button>}/>
              <PermissionWrapper  required={['rawdelete']} children={ <Button variant="danger" size="sm" className="me-2 text-white" onClick={() =>{ setMaterialId(material.materialId);setShowDeleteAlertModal(true);}} ><Delete /></Button>}/>
              </td>
            </tr>
          ))}
          {sortedMaterials.length === 0 ? (
            <tr>
              <td colSpan={12} className="text-center">No raw materials found.</td>
            </tr>
          ) : null}
          <tr className="production-total-row">
            <td className="fs-5 fw-bold" colSpan={3}>Total:</td>
            <td className="fs-5 fw-bold" colSpan={2}>
              {formatQuantity(sortedMaterials.reduce((total, item) => total + (Number(item.Quantity) || 0), 0))}
            </td>
            <td className="fs-5 fw-bold">
              {currency}{sortedMaterials.reduce((total, item) => total + ((Number(item.Quantity) || 0) * (Number(item.unitPrice) || 0)), 0).toFixed(2)}
            </td>
            <td colSpan={6}></td>
          </tr>
        </tbody>
      </Table>
        </div>
        <ProductionTableFooter
          totalItems={sortedMaterials.length}
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={setRowsPerPage}
          itemLabel="materials"
        />
      </div>

      {/* Add Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} backdrop="static" dialogClassName="production-modal-shell">
        <Modal.Header closeButton>
          <Modal.Title>Add Raw Material</Modal.Title>
        </Modal.Header>
        {isLoading?<div><ReactLoading type="balls" color="gray" height={'30px'} width={'30px'} className=''  /></div>:""}
        <Modal.Body>
          <Form className="production-form-grid">
            <Form.Group>
              <Form.Label>Branch</Form.Label>
              <Form.Select
                value={formData.branchId || ""}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                disabled={!canSwitchBranches}
              >
                <option value="">Select branch</option>
                {branches.map((branch) => (
                  <option key={branch.branchId} value={String(branch.branchId)}>
                    {branch.branchName}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            {rawMaterialFields.map((field) => (
              <Form.Group key={field.key} className={field.type === "textarea" ? "production-form-grid-single" : ""}>
                <Form.Label>{field.label}{field.required ? " *" : ""}</Form.Label>
                {field.type === "category" ? (
                  <Form.Select
                    value={formData[field.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  >
                    <option value="">Select category</option>
                    {activeCategoryOptions.map((category) => (
                      <option key={category.categoryId} value={category.categoryName}>
                        {category.categoryName}
                      </option>
                    ))}
                    {formData.category && !activeCategoryOptions.some((category) => category.categoryName === formData.category) ? (
                      <option value={formData.category}>{formData.category}</option>
                    ) : null}
                  </Form.Select>
                ) : field.type === "select" ? (
                  <Form.Select
                    value={formData[field.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    required={field.required}
                  >
                    {(field.options || []).map((option) => {
                      const value = typeof option === "string" ? option : option.value;
                      const label = typeof option === "string" ? option : option.label;
                      return <option key={value} value={value}>{label}</option>;
                    })}
                  </Form.Select>
                ) : field.type === "textarea" ? (
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder={field.placeholder}
                    value={formData[field.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  />
                ) : (
                  <Form.Control
                    type={field.type || "text"}
                    min={field.min}
                    step={field.step}
                    placeholder={field.placeholder}
                    value={formData[field.key] || ""}
                    required={field.required}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  />
                )}
              </Form.Group>
            ))}
          </Form>
          {isSuccess?<div className="bg-success fw-bold text-white p-2">Raw material added successfully</div>:""}
          {isError?<div className="bg-danger fw-bold text-white p-2">An error occured! {error}</div>:""}
        </Modal.Body>
        <Modal.Footer>
       
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Close</Button>
          {
        isLoading? <Button variant="primary" ><ReactLoading type="balls" color="gray" height={'30px'} width={'30px'} className=''  />Adding</Button>:<Button variant="primary" onClick={handleAdd}>Add</Button>
        }
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} backdrop="static" dialogClassName="production-modal-shell">
        <Modal.Header closeButton>
          <Modal.Title>Edit Raw Material</Modal.Title>
        </Modal.Header>
        {isLoading?<div><ReactLoading type="balls" color="gray" height={'30px'} width={'30px'} className=''  /></div>:""}
        <Modal.Body>
          <Form className="production-form-grid">
            <Form.Group>
              <Form.Label>Branch</Form.Label>
              <Form.Select
                value={formData.branchId || ""}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                disabled={!canSwitchBranches}
              >
                <option value="">Select branch</option>
                {branches.map((branch) => (
                  <option key={branch.branchId} value={String(branch.branchId)}>
                    {branch.branchName}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            {rawMaterialFields.map((field) => (
              <Form.Group key={field.key} className={field.type === "textarea" ? "production-form-grid-single" : ""}>
                <Form.Label>{field.label}{field.required ? " *" : ""}</Form.Label>
                {field.type === "category" ? (
                  <Form.Select
                    value={formData[field.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  >
                    <option value="">Select category</option>
                    {activeCategoryOptions.map((category) => (
                      <option key={category.categoryId} value={category.categoryName}>
                        {category.categoryName}
                      </option>
                    ))}
                    {formData.category && !activeCategoryOptions.some((category) => category.categoryName === formData.category) ? (
                      <option value={formData.category}>{formData.category}</option>
                    ) : null}
                  </Form.Select>
                ) : field.type === "select" ? (
                  <Form.Select
                    value={formData[field.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    required={field.required}
                  >
                    {(field.options || []).map((option) => {
                      const value = typeof option === "string" ? option : option.value;
                      const label = typeof option === "string" ? option : option.label;
                      return <option key={value} value={value}>{label}</option>;
                    })}
                  </Form.Select>
                ) : field.type === "textarea" ? (
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder={field.placeholder}
                    value={formData[field.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  />
                ) : (
                  <Form.Control
                    type={field.type || "text"}
                    min={field.min}
                    step={field.step}
                    placeholder={field.placeholder}
                    value={formData[field.key] || ""}
                    required={field.required}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  />
                )}
              </Form.Group>
            ))}
          </Form>
          {isUpdateSuccess?<div className="bg-success fw-bold text-white p-2">Raw material updated successfully</div>:""}
          {isUpdateError?<div className="bg-danger fw-bold text-white p-2">An error occured! {updateError}</div>:""}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Close</Button>
          {
            isUpdateLoading?<Button variant="primary" ><ReactLoading type="bars" color="gray" height={'30px'} width={'30px'} className=''/>updating</Button>:<Button variant="primary" onClick={handleEdit}>Save Changes</Button>
          }
          
        </Modal.Footer>
      </Modal>

       {/* delete alert Modal */}
        <Modal show={showDeleteAlertModal} onHide={() => setShowDeleteAlertModal(false)} backdrop="static" dialogClassName="production-modal-shell">
        <Modal.Header closeButton>
          <Modal.Title>Alert</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="production-modal-alert production-modal-alert-danger">
            You are about to delete this item completely from the inventory.
          </div>
          {isDeleteSuccess?<div className="bg-success fw-bold text-white p-2">Item deleted successfully</div>:""}
          {isDeleteError?<div className="bg-danger fw-bold text-white p-2">An error occured! {deleteError}</div>:""}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteAlertModal(false)}>Close</Button>
          {
            isDeleteLoading?<Button variant="primary" ><ReactLoading type="bars" color="gray" height={'30px'} width={'30px'} className=''/>deleting</Button>: <Button variant="danger" size="sm" onClick={() => handleDelete(materialId)} >Delete</Button>
          }
          
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default RawMaterialsTable;
