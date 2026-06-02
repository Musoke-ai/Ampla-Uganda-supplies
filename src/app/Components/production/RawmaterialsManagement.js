import React, { useEffect, useMemo, useRef, useState } from "react";
import { Table, Button, Modal, Form, Container, InputGroup } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useSelector } from "react-redux";
import {
  selectRawMaterials,
  useAddRawMaterialMutation,
  useDeleteRawMaterialMutation,
  useGetRawMaterialsQuery,
  useUpdateRawMaterialMutation,
} from "../../features/api/rawmaterialsSlice";
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
import { ArrowUp, ArrowDown, UpcScan, Camera, PlusCircle, Stars, XCircle } from "react-bootstrap-icons";
import BarcodeScannerDialog from "../BarcodeScannerDialog";
import ImageCaptureDialog from "../ImageCaptureDialog";
import { useAnalyzeCatalogImageMutation } from "../../features/api/catalogImageAnalysisSlice";
import {
  paginateItems,
  ProductionTableFooter,
} from "./ProductionTableControls";

const searchableFields = [
  "materialCode",
  "rawMaterialBarcode",
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

const API_ROOT = (process.env.REACT_APP_API_BASE_URL || "").replace(/\/api\/?$/, "");

const assetUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ROOT}/${String(path).replace(/^\/+/, "")}`;
};

const toRawMaterialFormData = (data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key === "rawMaterialImageFile" || key === "rawMaterialImagePreview") return;
    if (value !== undefined && value !== null) formData.append(key, value);
  });

  if (data.rawMaterialImageFile) {
    formData.append("rawMaterialImage", data.rawMaterialImageFile);
  }

  return formData;
};

const rawMaterialAnalysisLabels = {
  name: "Raw material name",
  description: "Description",
  materialCode: "Material code",
  rawMaterialBarcode: "Barcode",
  category: "Category",
  size: "Package / specification",
  unitOfMeasure: "Unit",
  supplier: "Supplier",
  storageLocation: "Storage location",
  note: "Notes",
};

const buildAnalysisSummary = (fields = {}, labels = {}) =>
  Object.entries(fields)
    .filter(([, value]) => String(value || "").trim())
    .map(([key, value]) => ({
      key,
      label: labels[key] || key,
      value: String(value || "").trim(),
    }));

const readableErrorMessage = (error, fallback) => {
  const message = error?.data?.message || error?.data?.error || error?.error || fallback;

  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.filter(Boolean).join(" ");
  if (message && typeof message === "object") return Object.values(message).filter(Boolean).join(" ");

  return fallback;
};

const unitOptions = ["pcs", "kg", "g", "litres", "ml", "metres", "rolls", "bags", "boxes", "sets"];
const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "discontinued", label: "Discontinued" },
];

const rawMaterialFields = [
  { key: "materialCode", label: "Material code", placeholder: "RM-SUGAR-001" },
  { key: "rawMaterialBarcode", label: "Barcode", type: "barcode", placeholder: "Scan or type supplier barcode" },
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

const rawMaterialThumbStyle = {
  width: 44,
  height: 44,
  borderRadius: 10,
  objectFit: "cover",
  border: "1px solid rgba(15, 23, 42, 0.12)",
  background: "#f8fbf8",
  flexShrink: 0,
};

const rawMaterialThumbPlaceholderStyle = {
  ...rawMaterialThumbStyle,
  display: "grid",
  placeItems: "center",
  objectFit: "initial",
  background: "#e8f5ec",
  color: "#2f8f57",
  fontWeight: 800,
};

const rawMaterialPreviewStyle = {
  width: 72,
  height: 72,
  borderRadius: 12,
  objectFit: "cover",
  border: "1px solid rgba(15, 23, 42, 0.12)",
  background: "#f8fbf8",
  flexShrink: 0,
};

const rawMaterialPlaceholderStyle = {
  ...rawMaterialPreviewStyle,
  display: "grid",
  placeItems: "center",
  objectFit: "initial",
  background: "#e8f5ec",
  color: "#2f8f57",
  fontWeight: 800,
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
      <Button type="button" variant="outline-primary" onClick={() => setShowModal(true)}>
        Manage Categories
      </Button>

      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" size="lg" dialogClassName="production-modal-shell">
        <Modal.Header closeButton>
          <Modal.Title>Raw Material Categories</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form className="production-form-grid mb-4" onSubmit={(event) => event.preventDefault()}>
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
              <Button type="button" variant="outline-secondary" onClick={resetForm}>
                Cancel Edit
              </Button>
            ) : null}
            <Button type="button" onClick={submitCategory} disabled={isAdding || isUpdating}>
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
                      <Button type="button" variant="info" size="sm" className="me-2 text-white" onClick={() => editCategory(category)}>
                        <Edit />
                      </Button>
                      <Button type="button" variant="danger" size="sm" onClick={() => removeCategory(category)} disabled={isDeleting}>
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
          <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
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
    const { refetch: refetchRawMaterials } = useGetRawMaterialsQuery();
    const { refetch: refetchRawMaterialCategories } = useGetRawMaterialCategoriesQuery();
    const branches = useSelector(selectBranches) ?? [];
    const rawMaterialCategories = useSelector(selectRawMaterialCategories) ?? [];
    const currentBranchId = branchScope?.effective_branch_id ? String(branchScope.effective_branch_id) : "";
    const canSwitchBranches = Boolean(branchScope?.can_switch_branches);

    const createEmptyForm = () => ({
      branchId: currentBranchId,
      materialCode: "",
      rawMaterialBarcode: "",
      rawMaterialImage: "",
      rawMaterialImageFile: null,
      rawMaterialImagePreview: "",
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
    const [addRawMaterial, {isLoading} ]= useAddRawMaterialMutation();
    const [updateRawMaterial, {isLoading:isUpdateLoading} ]= useUpdateRawMaterialMutation();
    const [deleteRawMaterial, {isLoading:isDeleteLoading, isError: isDeleteError, error:deleteError, isSuccess:isDeleteSuccess} ]= useDeleteRawMaterialMutation();
    const [quickAddRawMaterialCategory, { isLoading: isQuickAddingRawCategory }] = useAddRawMaterialCategoryMutation();
    const [analyzeCatalogImage, { isLoading: isAnalyzingImage }] = useAnalyzeCatalogImageMutation();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlertModal, setShowDeleteAlertModal] = useState(false);
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);
  const [imageCaptureOpen, setImageCaptureOpen] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState("");
  const [imageAnalysisNote, setImageAnalysisNote] = useState("");
  const [imageAnalysisAlert, setImageAnalysisAlert] = useState(null);
  const [imageAnalysisSummary, setImageAnalysisSummary] = useState([]);
  const [saveFeedback, setSaveFeedback] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const rawMaterialModalCloseGuardRef = useRef(false);
  const rawMaterialCaptureModeRef = useRef("add");
  const pendingRawMaterialCaptureFileRef = useRef(null);
  const recentBarcodeScanRef = useRef({ value: "", time: 0 });
  const [forceRawMaterialModalMode, setForceRawMaterialModalMode] = useState(null);
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
    setQuickCategoryName("");
    setImageAnalysisNote("");
    setImageAnalysisAlert(null);
    setImageAnalysisSummary([]);
    setSaveFeedback(null);
    setFormData({
      ...createEmptyForm(),
      ...material,
      branchId: material?.branchId ? String(material.branchId) : currentBranchId,
      status: material?.status || "active",
      unitOfMeasure: material?.unitOfMeasure || "pcs",
      rawMaterialImageFile: null,
      rawMaterialImagePreview: assetUrl(material?.rawMaterialImage),
    });
    setShowEditModal(true);
  };

  const closeAddRawMaterialModal = () => {
    if (isLoading || isAnalyzingImage || imageCaptureOpen || rawMaterialModalCloseGuardRef.current) return;
    setShowAddModal(false);
    setForceRawMaterialModalMode(null);
    setSaveFeedback(null);
  };

  const closeEditRawMaterialModal = () => {
    if (isUpdateLoading || isAnalyzingImage || imageCaptureOpen || rawMaterialModalCloseGuardRef.current) return;
    setShowEditModal(false);
    setForceRawMaterialModalMode(null);
    setSaveFeedback(null);
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
    rawMaterialBarcode: String(formData.rawMaterialBarcode || "").trim(),
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
    rawMaterialImage: formData.rawMaterialImage || "",
    rawMaterialImageFile: formData.rawMaterialImageFile || null,
    rawMaterialImagePreview: formData.rawMaterialImagePreview || "",
  });

  const handleAdd = async () => {
    if (!validateForm()) {
      return;
    }

    try{
        setSaveFeedback({ type: "info", message: "Saving raw material. Please wait..." });
        await addRawMaterial(
           toRawMaterialFormData(cleanPayload())
        ).unwrap();
        refetchRawMaterials();
        setSaveFeedback({ type: "success", message: "Raw material added successfully." });
        toast.success("Raw material added successfully");
        window.setTimeout(() => {
          setFormData(createEmptyForm());
          setQuickCategoryName("");
          setImageAnalysisNote("");
          setImageAnalysisAlert(null);
          setImageAnalysisSummary([]);
          setSaveFeedback({ type: "success", message: "Raw material added successfully. You can add another raw material." });
        }, 900);
    }catch (error){
      const message = error?.data?.message || ("An error occured! " + error.status);
      setSaveFeedback({ type: "danger", message });
      toast.error(message);
    }
  };

  const handleEdit = async () => {
    if (!validateForm()) {
      return;
    }

    try{
        setSaveFeedback({ type: "info", message: "Updating raw material. Please wait..." });
        await updateRawMaterial(
           toRawMaterialFormData(cleanPayload())
        ).unwrap();
        refetchRawMaterials();
        setSaveFeedback({ type: "success", message: "Raw material updated successfully." });
        toast.success("Raw material updated successfully");
        window.setTimeout(() => {
          setFormData(createEmptyForm());
          setShowEditModal(false);
          setForceRawMaterialModalMode(null);
          setSelectedMaterial(null);
          setSaveFeedback(null);
        }, 900);
    }catch (error){
      const message = error?.data?.message || ("An error occured! " + error.status);
      setSaveFeedback({ type: "danger", message });
      toast.error(message);
    }
    // setFormData({});
  };

  const handleDelete = async (id) => {
    try{
        await deleteRawMaterial(
           {materialId: id}
        ).unwrap();
        refetchRawMaterials();
        toast.success("Raw material deleted successfully");
        setShowDeleteAlertModal(false);
        setSelectedMaterial(null);
        setMaterialId("");  
    }catch (error){
toast.error("An error occured! "+error.status);
    }
  };

  const handleRawMaterialBarcodeDetected = (barcode) => {
    const cleanBarcode = String(barcode || "").trim();
    const now = Date.now();

    if (
      !cleanBarcode ||
      (recentBarcodeScanRef.current.value === cleanBarcode && now - recentBarcodeScanRef.current.time < 2500)
    ) {
      return;
    }

    recentBarcodeScanRef.current = { value: cleanBarcode, time: now };
    setFormData((current) => ({ ...current, rawMaterialBarcode: cleanBarcode }));
    setSearchTerm(cleanBarcode);
    setBarcodeScannerOpen(false);
    toast.success(`Raw material barcode detected: ${cleanBarcode}`, { toastId: `raw-material-barcode-${cleanBarcode}` });
  };

  const applyRawMaterialImageFile = (file) => {
    setImageAnalysisNote("");
    setImageAnalysisAlert(null);
    setImageAnalysisSummary([]);
    setFormData((current) => ({
      ...current,
      rawMaterialImageFile: file,
      rawMaterialImagePreview: file ? URL.createObjectURL(file) : assetUrl(current.rawMaterialImage),
    }));
  };

  const matchRawMaterialCategory = (categoryName) => {
    const normalized = String(categoryName || "").trim().toLowerCase();
    if (!normalized) return null;

    return (
      activeCategoryOptions.find((category) => String(category.categoryName || "").toLowerCase() === normalized) ||
      activeCategoryOptions.find((category) => {
        const candidate = String(category.categoryName || "").toLowerCase();
        return candidate.includes(normalized) || normalized.includes(candidate);
      }) ||
      null
    );
  };

  const applyRawMaterialImageAnalysis = (analysis) => {
    const fields = analysis?.fields || {};
    const summary = buildAnalysisSummary(fields, rawMaterialAnalysisLabels);
    const suggestedName =
      analysis?.matchedCategoryName ||
      analysis?.suggestedCategoryName ||
      fields.category ||
      "";
    const matchedCategory = matchRawMaterialCategory(suggestedName);

    setFormData((current) => {
      const next = { ...current };
      const shouldFill = (key, defaults = []) => {
        const value = String(next[key] || "").trim();
        return !value || defaults.map(String).includes(value);
      };

      [
        "name",
        "materialCode",
        "rawMaterialBarcode",
        "size",
        "unitOfMeasure",
        "supplier",
        "storageLocation",
        "note",
      ].forEach((key) => {
        const defaults = key === "unitOfMeasure" ? ["pcs"] : [];
        if (fields[key] && shouldFill(key, defaults)) {
          next[key] = fields[key];
        }
      });

      if (fields.description && shouldFill("note")) {
        next.note = fields.description;
      }

      if (!next.category && suggestedName) {
        next.category = matchedCategory?.categoryName || suggestedName;
      }

      return next;
    });

    setImageAnalysisSummary(summary);

    if (matchedCategory) {
      setImageAnalysisNote(`Suggested category: ${matchedCategory.categoryName}`);
      setImageAnalysisAlert(null);
    } else if (suggestedName) {
      setQuickCategoryName(suggestedName);
      setImageAnalysisNote(`Suggested new category: ${suggestedName}`);
      setImageAnalysisAlert(null);
    } else {
      setImageAnalysisNote(analysis?.notes || "Image checked. Confirm the fields before saving.");
      setImageAnalysisAlert(null);
    }
  };

  const analyzeRawMaterialImage = async (
    file = formData.rawMaterialImageFile,
    event = null
  ) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (!file) {
      toast.info("Capture or upload a raw material image first.");
      return;
    }

    rawMaterialModalCloseGuardRef.current = true;
    rawMaterialCaptureModeRef.current = showEditModal ? "edit" : "add";
    setForceRawMaterialModalMode(rawMaterialCaptureModeRef.current);
    setImageAnalysisAlert({ type: "info", message: "Reading raw material image. Please wait..." });
    if (rawMaterialCaptureModeRef.current === "edit") {
      setShowEditModal(true);
    } else {
      setShowAddModal(true);
    }

    try {
      const response = await analyzeCatalogImage({
        image: file,
        type: "raw_material",
        branchId: formData.branchId || currentBranchId,
      }).unwrap();
      applyRawMaterialImageAnalysis(response);
      setImageAnalysisAlert({ type: "success", message: "Raw material fields extracted from image. Review them before saving." });
      toast.success("Raw material fields extracted from image.");
    } catch (error) {
      const message = readableErrorMessage(error, "Could not extract fields from this image.");
      setImageAnalysisAlert({ type: "danger", message });
      toast.error(message);
    } finally {
      if (rawMaterialCaptureModeRef.current === "edit") {
        setShowEditModal(true);
      } else {
        setShowAddModal(true);
      }
      window.setTimeout(() => {
        rawMaterialModalCloseGuardRef.current = false;
      }, 1200);
    }
  };

  const handleRawMaterialImageCaptured = (file) => {
    pendingRawMaterialCaptureFileRef.current = file;
    rawMaterialModalCloseGuardRef.current = true;
    rawMaterialCaptureModeRef.current = showEditModal ? "edit" : "add";
    setForceRawMaterialModalMode(rawMaterialCaptureModeRef.current);
    if (showEditModal) {
      setShowEditModal(true);
    } else {
      setShowAddModal(true);
    }
  };

  useEffect(() => {
    if (imageCaptureOpen || !pendingRawMaterialCaptureFileRef.current) {
      return;
    }

    const file = pendingRawMaterialCaptureFileRef.current;
    pendingRawMaterialCaptureFileRef.current = null;
    rawMaterialModalCloseGuardRef.current = true;
    setForceRawMaterialModalMode(rawMaterialCaptureModeRef.current);

    window.setTimeout(() => {
      if (rawMaterialCaptureModeRef.current === "edit") {
        setShowEditModal(true);
      } else {
        setShowAddModal(true);
      }
      applyRawMaterialImageFile(file);
      analyzeRawMaterialImage(file);
    }, 0);
  }, [imageCaptureOpen]);

  const createQuickRawMaterialCategory = async (event = null) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    const categoryName = quickCategoryName.trim();
    if (!categoryName) {
      toast.error("Enter a category name first.");
      return;
    }

    const existing = matchRawMaterialCategory(categoryName);
    if (existing) {
      setFormData((current) => ({ ...current, category: existing.categoryName }));
      setQuickCategoryName("");
      toast.success("Existing category selected.");
      return;
    }

    try {
      const response = await quickAddRawMaterialCategory({
        branchId: formData.branchId || currentBranchId,
        categoryName,
        description: "",
        isActive: 1,
      }).unwrap();
      const createdName = response?.data?.categoryName || categoryName;
      await refetchRawMaterialCategories();
      setFormData((current) => ({ ...current, category: createdName }));
      setQuickCategoryName("");
      toast.success("Raw material category created and selected.");
    } catch (error) {
      toast.error(error?.data?.message || "Could not create raw material category.");
    }
  };

  const renderImageField = () => (
    <Form.Group>
      <Form.Label>Raw material image</Form.Label>
      <div className="d-flex align-items-center gap-3">
        {formData.rawMaterialImagePreview ? (
          <img
            src={formData.rawMaterialImagePreview}
            alt="Raw material preview"
            style={rawMaterialPreviewStyle}
          />
        ) : (
          <div style={rawMaterialPlaceholderStyle}>
            {String(formData.name || "R").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="d-flex flex-column flex-sm-row gap-2 flex-grow-1">
          <Form.Control
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => applyRawMaterialImageFile(event.target.files?.[0] || null)}
          />
          <Button
            type="button"
            variant="outline-secondary"
            className="d-inline-flex align-items-center justify-content-center gap-2"
            onClick={() => setImageCaptureOpen(true)}
          >
            <Camera />
            Capture
          </Button>
          <Button
            type="button"
            variant="outline-primary"
            className="d-inline-flex align-items-center justify-content-center gap-2"
            disabled={isAnalyzingImage || !formData.rawMaterialImageFile}
            onClick={(event) => analyzeRawMaterialImage(formData.rawMaterialImageFile, event)}
          >
            <Stars />
            {isAnalyzingImage ? "Reading..." : "Auto fill"}
          </Button>
        </div>
      </div>
      <Form.Text className="text-muted">JPEG, PNG, or WEBP up to 3MB.</Form.Text>
      {imageAnalysisNote ? (
        <div className="small text-success fw-semibold mt-2">{imageAnalysisNote}</div>
      ) : null}
      {imageAnalysisAlert ? (
        <div className={`alert alert-${imageAnalysisAlert.type} py-2 px-3 mt-2 mb-0`}>
          {imageAnalysisAlert.message}
        </div>
      ) : null}
      {imageAnalysisSummary.length ? (
        <div className="mt-2 p-2 rounded border bg-light">
          <div className="small fw-bold text-dark mb-1">Auto-extracted fields</div>
          <div className="d-flex flex-column gap-1">
            {imageAnalysisSummary.map((item) => (
              <div key={item.key} className="small text-muted">
                <span className="fw-semibold text-dark">{item.label}:</span> {item.value}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Form.Group>
  );

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
              type="button"
              variant="primary"
              onClick={() => {
                setSelectedMaterial(null);
                setFormData(createEmptyForm());
                setQuickCategoryName("");
                setImageAnalysisNote("");
                setImageAnalysisAlert(null);
                setImageAnalysisSummary([]);
                setSaveFeedback(null);
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
              placeholder="Search by code, barcode, name, category, supplier, location, or note"
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
            <th onClick={() => requestSort('rawMaterialBarcode')} className="production-sortable">
              Barcode {getSortIcon('rawMaterialBarcode')}
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
             <td>{material.rawMaterialBarcode || "N/A"}</td>
             <td>
              <div className="d-flex align-items-center gap-3">
                {material.rawMaterialImage ? (
                  <img
                    src={assetUrl(material.rawMaterialImage)}
                    alt={material.name || "Raw material"}
                    style={rawMaterialThumbStyle}
                  />
                ) : (
                  <div style={rawMaterialThumbPlaceholderStyle}>
                    {String(material.name || "R").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="fw-bold">{material.name}</div>
                  <div className="small text-muted">{material.size || "No package/spec"}{material.note ? ` - ${material.note}` : ""}</div>
                </div>
              </div>
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
              <PermissionWrapper  required={['rawupdate']} children={<Button type="button" variant="info" size="sm" className="me-2 text-white" onClick={() => handleShowEdit(material)}><Edit /></Button>}/>
              <PermissionWrapper  required={['rawdelete']} children={ <Button type="button" variant="danger" size="sm" className="me-2 text-white" onClick={() =>{ setMaterialId(material.materialId);setShowDeleteAlertModal(true);}} ><Delete /></Button>}/>
              </td>
            </tr>
          ))}
          {sortedMaterials.length === 0 ? (
            <tr>
              <td colSpan={13} className="text-center">No raw materials found.</td>
            </tr>
          ) : null}
          <tr className="production-total-row">
            <td className="fs-5 fw-bold" colSpan={4}>Total:</td>
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
      <Modal
        show={showAddModal || forceRawMaterialModalMode === "add"}
        onHide={() => {}}
        backdrop="static"
        keyboard={false}
        dialogClassName="production-modal-shell"
      >
        <Modal.Header>
          <Modal.Title>Add Raw Material</Modal.Title>
          <Button
            type="button"
            variant="light"
            className="ms-auto"
            onClick={closeAddRawMaterialModal}
            disabled={isLoading || isAnalyzingImage || imageCaptureOpen}
            aria-label="Close raw material form"
          >
            <XCircle />
          </Button>
        </Modal.Header>
        {isLoading?<div><ReactLoading type="balls" color="gray" height={'30px'} width={'30px'} className=''  /></div>:""}
        <Modal.Body>
          <Form className="production-form-grid" onSubmit={(event) => event.preventDefault()}>
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
            {renderImageField()}
            {rawMaterialFields.map((field) => (
              <Form.Group key={field.key} className={field.type === "textarea" ? "production-form-grid-single" : ""}>
                <Form.Label>{field.label}{field.required ? " *" : ""}</Form.Label>
                {field.type === "category" ? (
                  <>
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
                    <InputGroup className="mt-2">
                      <Form.Control
                        placeholder="Quick create category"
                        value={quickCategoryName}
                        onChange={(event) => setQuickCategoryName(event.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline-success"
                        onClick={(event) => createQuickRawMaterialCategory(event)}
                        disabled={isQuickAddingRawCategory}
                      >
                        <PlusCircle className="me-2" />
                        {isQuickAddingRawCategory ? "Creating..." : "Create"}
                      </Button>
                    </InputGroup>
                  </>
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
                ) : field.type === "barcode" ? (
                  <>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        inputMode="numeric"
                        placeholder={field.placeholder}
                        value={formData[field.key] || ""}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value.trim() })}
                      />
                      <Button
                        variant="outline-secondary"
                        type="button"
                        title="Scan barcode with camera"
                        onClick={() => setBarcodeScannerOpen(true)}
                      >
                        <UpcScan />
                      </Button>
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Click this field and scan with a handheld scanner, or use the camera button.
                    </Form.Text>
                  </>
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
        </Modal.Body>
        <Modal.Footer>
          {saveFeedback ? (
            <div className={`alert alert-${saveFeedback.type} py-2 px-3 mb-0 me-auto`}>
              {saveFeedback.message}
            </div>
          ) : null}
          <Button type="button" variant="secondary" onClick={closeAddRawMaterialModal} disabled={isLoading || isAnalyzingImage}>Close</Button>
          {
        isLoading? <Button type="button" variant="primary" disabled><ReactLoading type="balls" color="gray" height={'30px'} width={'30px'} className=''  />Adding</Button>:<Button type="button" variant="primary" onClick={handleAdd} disabled={isAnalyzingImage}>Add</Button>
        }
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal
        show={showEditModal || forceRawMaterialModalMode === "edit"}
        onHide={() => {}}
        backdrop="static"
        keyboard={false}
        dialogClassName="production-modal-shell"
      >
        <Modal.Header>
          <Modal.Title>Edit Raw Material</Modal.Title>
          <Button
            type="button"
            variant="light"
            className="ms-auto"
            onClick={closeEditRawMaterialModal}
            disabled={isUpdateLoading || isAnalyzingImage || imageCaptureOpen}
            aria-label="Close raw material form"
          >
            <XCircle />
          </Button>
        </Modal.Header>
        {isLoading?<div><ReactLoading type="balls" color="gray" height={'30px'} width={'30px'} className=''  /></div>:""}
        <Modal.Body>
          <Form className="production-form-grid" onSubmit={(event) => event.preventDefault()}>
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
            {renderImageField()}
            {rawMaterialFields.map((field) => (
              <Form.Group key={field.key} className={field.type === "textarea" ? "production-form-grid-single" : ""}>
                <Form.Label>{field.label}{field.required ? " *" : ""}</Form.Label>
                {field.type === "category" ? (
                  <>
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
                    <InputGroup className="mt-2">
                      <Form.Control
                        placeholder="Quick create category"
                        value={quickCategoryName}
                        onChange={(event) => setQuickCategoryName(event.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline-success"
                        onClick={(event) => createQuickRawMaterialCategory(event)}
                        disabled={isQuickAddingRawCategory}
                      >
                        <PlusCircle className="me-2" />
                        {isQuickAddingRawCategory ? "Creating..." : "Create"}
                      </Button>
                    </InputGroup>
                  </>
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
                ) : field.type === "barcode" ? (
                  <>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        inputMode="numeric"
                        placeholder={field.placeholder}
                        value={formData[field.key] || ""}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value.trim() })}
                      />
                      <Button
                        variant="outline-secondary"
                        type="button"
                        title="Scan barcode with camera"
                        onClick={() => setBarcodeScannerOpen(true)}
                      >
                        <UpcScan />
                      </Button>
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Click this field and scan with a handheld scanner, or use the camera button.
                    </Form.Text>
                  </>
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
        </Modal.Body>
        <Modal.Footer>
          {saveFeedback ? (
            <div className={`alert alert-${saveFeedback.type} py-2 px-3 mb-0 me-auto`}>
              {saveFeedback.message}
            </div>
          ) : null}
          <Button type="button" variant="secondary" onClick={closeEditRawMaterialModal} disabled={isUpdateLoading || isAnalyzingImage}>Close</Button>
          {
            isUpdateLoading?<Button type="button" variant="primary" disabled><ReactLoading type="bars" color="gray" height={'30px'} width={'30px'} className=''/>updating</Button>:<Button type="button" variant="primary" onClick={handleEdit} disabled={isAnalyzingImage}>Save Changes</Button>
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
          <Button type="button" variant="secondary" onClick={() => setShowDeleteAlertModal(false)}>Close</Button>
          {
            isDeleteLoading?<Button type="button" variant="primary" disabled><ReactLoading type="bars" color="gray" height={'30px'} width={'30px'} className=''/>deleting</Button>: <Button type="button" variant="danger" size="sm" onClick={() => handleDelete(materialId)} >Delete</Button>
          }
          
        </Modal.Footer>
      </Modal>

      <BarcodeScannerDialog
        open={barcodeScannerOpen}
        title="Scan raw material barcode"
        description="Use the device camera to capture the raw material barcode while creating or editing the item."
        onClose={() => setBarcodeScannerOpen(false)}
        onDetected={handleRawMaterialBarcodeDetected}
      />
      <ImageCaptureDialog
        show={imageCaptureOpen}
        title="Capture raw material image"
        fileNamePrefix="raw-material-image"
        onClose={() => setImageCaptureOpen(false)}
        onCapture={handleRawMaterialImageCaptured}
      />
    </Container>
  );
};

export default RawMaterialsTable;
