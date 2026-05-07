import React, { useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Table,
  Modal,
  Form,
  InputGroup,
  Dropdown,
  Card,
  Pagination,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  BoxSeam,
  ExclamationTriangle,
  GraphUpArrow,
  ChatDots,
  PencilSquare,
  Search,
  Trash,
  XCircle,
} from "react-bootstrap-icons";
import "./InventorySample.css";

import CategoryManagement from "../production/CategoryManagement";
import { useSettings } from "../Settings";
import PermissionWrapper from "../../auth/PermissionWrapper";
import { selectBranchScope } from "../../auth/authSlice";
import { selectBranches, useGetBranchesQuery } from "../../features/api/branchesSlice";
import { selectCategories, useGetCategoriesQuery } from "../../features/api/categorySlice";
import {
  selectStock,
  useAddStockMutation,
  useDeleteStockMutation,
  useGetStockQuery,
  useUpdateStockMutation,
} from "../../features/stock/stockSlice";

const palette = {
  bg: "#f8fbf8",
  surface: "#ffffff",
  border: "#e7efe9",
  text: "#15202b",
  muted: "#6f7d8c",
  green: "#2f8f57",
  greenSoft: "#e8f5ec",
  blue: "#2f80ed",
  blueSoft: "#e8f1ff",
  amber: "#f59e0b",
  amberSoft: "#fff4df",
  red: "#ef4444",
  redSoft: "#ffebeb",
  shadow: "0 12px 32px rgba(15, 23, 42, 0.05)",
};

export default function InventoryPage() {
  const { settings } = useSettings();
  const currency = settings?.currency !== "none" ? settings?.currency : "UGX";
  const lowStockThreshold = Number(settings?.lowLevelProducts) || 10;
  const branchScope = useSelector(selectBranchScope);
  const currentBranchId = branchScope?.effective_branch_id
    ? String(branchScope.effective_branch_id)
    : "";

  useGetBranchesQuery();
  useGetCategoriesQuery();

  const {
    isLoading: isStockLoading,
    isError: isStockError,
    error: stockError,
  } = useGetStockQuery();

  const inventory = useSelector(selectStock) ?? [];
  const branches = useSelector(selectBranches) ?? [];
  const categories = useSelector(selectCategories) ?? [];
  const createInitialFormState = () => ({
    itemId: null,
    branchId: currentBranchId,
    itemName: "",
    itemCategoryId: "1",
    itemModel: "",
    itemSku: "",
    itemBarcode: "",
    itemBrand: "",
    itemProductType: "purchased",
    itemUnit: "pcs",
    itemSupplier: "",
    itemReorderLevel: "",
    itemQuality: "New",
    itemQuantity: "",
    itemCondition: "Good",
    itemSize: "",
    itemStockPrice: "",
    itemLeastPrice: "",
    itemWholesalePrice: "",
    itemNotes: "",
    itemOwner: "",
  });
  const [createInventory, { isLoading: isCreating }] = useAddStockMutation();
  const [deleteInventory, { isLoading: isDeleteLoading }] = useDeleteStockMutation();
  const [updateInventory, { isLoading: isUpdateLoading }] = useUpdateStockMutation();


  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(createInitialFormState);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [filter, setFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "itemName",
    direction: "ascending",
  });
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const formatCurrency = (amount) =>
    `${currency} ${Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;

  const processedInventory = useMemo(() => {
    const branchMap = new Map(
      branches.map((branch) => [String(branch.branchId), branch.branchName])
    );
    let sortableItems = inventory.map((item) => ({
      ...item,
      branchName: branchMap.get(String(item.branchId)) || "Unassigned",
    }));

    if (filter.trim()) {
      const normalizedFilter = filter.toLowerCase();
      sortableItems = sortableItems.filter(
        (item) =>
          String(item.itemName || "").toLowerCase().includes(normalizedFilter) ||
          String(item.itemModel || "").toLowerCase().includes(normalizedFilter) ||
          String(branchMap.get(String(item.branchId)) || "")
            .toLowerCase()
            .includes(normalizedFilter)
      );
    }

    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const valueA = a[sortConfig.key] ?? "";
        const valueB = b[sortConfig.key] ?? "";

        if (valueA < valueB) return sortConfig.direction === "ascending" ? -1 : 1;
        if (valueA > valueB) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    return sortableItems;
  }, [branches, inventory, filter, sortConfig]);

  const totalPages =
    rowsPerPage === "All" ? 1 : Math.max(1, Math.ceil(processedInventory.length / Number(rowsPerPage)));

  const paginatedInventory = useMemo(() => {
    if (rowsPerPage === "All") return processedInventory;

    const start = (currentPage - 1) * Number(rowsPerPage);
    return processedInventory.slice(start, start + Number(rowsPerPage));
  }, [currentPage, processedInventory, rowsPerPage]);

  const totals = useMemo(
    () => ({
      quantity: processedInventory.reduce(
        (sum, item) => sum + (Number(item.itemQuantity) || 0),
        0
      ),
      stockValue: processedInventory.reduce(
        (sum, item) =>
          sum + (Number(item.itemQuantity) || 0) * (Number(item.itemStockPrice) || 0),
        0
      ),
      leastValue: processedInventory.reduce(
        (sum, item) =>
          sum + (Number(item.itemQuantity) || 0) * (Number(item.itemLeastPrice) || 0),
        0
      ),
    }),
    [processedInventory]
  );

  const metrics = useMemo(() => {
    const lowStockItems = inventory.filter((item) => {
      const qty = Number(item.itemQuantity) || 0;
      return qty > 0 && qty <= lowStockThreshold;
    }).length;

    const outOfStockItems = inventory.filter((item) => (Number(item.itemQuantity) || 0) <= 0).length;

    const stockValue = inventory.reduce(
      (sum, item) => sum + (Number(item.itemQuantity) || 0) * (Number(item.itemStockPrice) || 0),
      0
    );

    return {
      totalProducts: inventory.length,
      stockValue,
      lowStockItems,
      outOfStockItems,
    };
  }, [inventory, lowStockThreshold]);

  const pricePreview = useMemo(() => {
    const cost = Number(currentItem.itemStockPrice) || 0;
    const retail = Number(currentItem.itemLeastPrice) || 0;
    const wholesale = Number(currentItem.itemWholesalePrice) || 0;
    const profit = cost > 0 && retail > 0 ? retail - cost : 0;
    const margin = cost > 0 && retail > 0 ? (profit / retail) * 100 : 0;

    return {
      profit,
      margin,
      wholesaleProfit: cost > 0 && wholesale > 0 ? wholesale - cost : 0,
    };
  }, [currentItem.itemLeastPrice, currentItem.itemStockPrice, currentItem.itemWholesalePrice]);

  const handleShowFormModal = (item) => {
    setCurrentItem(item ? { ...item } : createInitialFormState());
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setCurrentItem(createInitialFormState());
  };

  const handleShowDeleteModal = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleSaveItem = async (itemData) => {
    if (itemData.itemId) {
      try {
        await updateInventory({
          itemId: itemData.itemId,
          branchId: itemData.branchId,
          item_name: itemData.itemName,
          item_category: itemData.itemCategoryId,
          item_model: itemData.itemModel,
          item_sku: itemData.itemSku,
          item_barcode: itemData.itemBarcode,
          item_brand: itemData.itemBrand,
          item_product_type: itemData.itemProductType,
          item_unit: itemData.itemUnit,
          item_supplier: itemData.itemSupplier,
          item_reorder_level: itemData.itemReorderLevel,
          item_quality: itemData.itemQuality,
          item_quantity: itemData.itemQuantity,
          item_condition: itemData.itemCondition,
          item_size: itemData.itemSize,
          item_min_price: itemData.itemLeastPrice,
          item_wholesale_price: itemData.itemWholesalePrice,
          item_notes: itemData.itemNotes,
          item_owner: itemData.itemOwner,
          item_stock_price: itemData.itemStockPrice,
        }).unwrap();
        toast.success("Item updated successfully.");
        handleCloseFormModal();
      } catch (error) {
        toast.error(error?.data?.message || error?.error || "Failed to update item.");
      }
      return;
    }

    try {
      await createInventory({
        branchId: itemData.branchId,
        item_name: itemData.itemName,
        item_category: itemData.itemCategoryId,
        item_model: itemData.itemModel,
        item_sku: itemData.itemSku,
        item_barcode: itemData.itemBarcode,
        item_brand: itemData.itemBrand,
        item_product_type: itemData.itemProductType,
        item_unit: itemData.itemUnit,
        item_supplier: itemData.itemSupplier,
        item_reorder_level: itemData.itemReorderLevel,
        item_quality: itemData.itemQuality,
        item_quantity: itemData.itemQuantity,
        item_condition: itemData.itemCondition,
        item_size: itemData.itemSize,
        item_min_price: itemData.itemLeastPrice,
        item_wholesale_price: itemData.itemWholesalePrice,
        item_notes: itemData.itemNotes,
        item_owner: itemData.itemOwner,
        item_stock_price: itemData.itemStockPrice,
      }).unwrap();
      toast.success("Item added successfully.");
      handleCloseFormModal();
    } catch (error) {
      toast.error(error?.data?.message || error?.error || "Failed to add item.");
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      await deleteInventory({ itemId: itemToDelete.itemId }).unwrap();
      toast.success("Item deleted successfully.");
      handleCloseDeleteModal();
    } catch (error) {
      toast.error(error?.data?.message || error?.error || "Failed to delete item.");
    }
  };

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "ascending" ? "↑" : "↓";
  };

  const exportToCSV = () => {
    if (!processedInventory.length) return;
    const headers = ["itemName", "itemModel", "branchName", "itemQuantity", "itemStockPrice", "itemLeastPrice"];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      processedInventory
        .map((item) => headers.map((header) => item[header] ?? "").join(","))
        .join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "inventory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Inventory List", 14, 15);
    doc.autoTable({
      startY: 20,
      head: [["#", "Item Name", "Model", "Branch", "Qty", "Cost Price", "Retail Price", "Condition", "Quality"]],
      body: processedInventory.map((item, index) => [
        index + 1,
        item.itemName,
        item.itemModel,
        item.branchName,
        item.itemQuantity,
        formatCurrency(item.itemStockPrice),
        formatCurrency(item.itemLeastPrice),
        item.itemCondition,
        item.itemQuality,
      ]),
    });
    doc.save("inventory.pdf");
  };

  const getStockStatus = (quantity) => {
    const qty = Number(quantity) || 0;
    if (qty <= 0) {
      return {
        label: "Out of Stock",
        tone: palette.redSoft,
        text: palette.red,
      };
    }
    if (qty <= lowStockThreshold) {
      return {
        label: "Low Stock",
        tone: palette.amberSoft,
        text: "#bc7a11",
      };
    }
    return {
      label: "In Stock",
      tone: palette.greenSoft,
      text: palette.green,
    };
  };

  return (
    <Container
      fluid
      className="inventory-page py-4 px-3 px-lg-4"
      style={{
        backgroundColor: palette.bg,
        minHeight: "100vh",
      }}
    >
      <header className="mb-4">
        <Row className="align-items-center g-3" style={{ position: "relative", zIndex: 20 }}>
          <Col>
            <h2
              className="mb-2"
              style={{
                color: palette.text,
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              Inventory Management
            </h2>
            <p className="mb-0" style={{ color: palette.muted }}>
              Manage your products, track stock levels and keep your inventory up to date.
            </p>
          </Col>
          <Col xs="auto" className="d-flex gap-2 flex-wrap">
            <Button
              as={Link}
              to="/home/assistant"
              variant="light"
              style={toolbarButtonStyle}
            >
              <ChatDots className="me-2" />
              Ask Ampla Copilot
            </Button>
            <Dropdown>
              <Dropdown.Toggle
                variant="light"
                id="inventory-export"
                style={toolbarButtonStyle}
              >
                Export
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={exportToCSV}>Export to CSV</Dropdown.Item>
                <Dropdown.Item onClick={exportToPDF}>Export to PDF</Dropdown.Item>
                <Dropdown.Item onClick={() => window.print()}>Print</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <PermissionWrapper
              required={["productscreate"]}
              children={
                <Button onClick={() => handleShowFormModal(null)} style={addButtonStyle}>
                  + Add New Item
                </Button>
              }
            />
          </Col>
        </Row>
      </header>

      {isStockError && (
        <div className="mb-3">
          <div className="alert alert-danger rounded-4 border-0 shadow-sm mb-0">
            {stockError?.data?.message || stockError?.error || "Could not load inventory data."}
          </div>
        </div>
      )}

      {isStockLoading && (
        <div className="mb-3">
          <div className="progress" style={{ height: 6, borderRadius: 999 }}>
            <div className="progress-bar progress-bar-striped progress-bar-animated w-100" />
          </div>
        </div>
      )}

      <Row className="g-3 mb-4" style={{ position: "relative", zIndex: 1 }}>
        <Col md={6} xl={3}>
          <MetricCard
            icon={<BoxSeam size={20} />}
            accent={palette.greenSoft}
            color={palette.green}
            title="Total Products"
            value={metrics.totalProducts}
            note="All products in inventory"
          />
        </Col>
        <Col md={6} xl={3}>
          <MetricCard
            icon={<GraphUpArrow size={20} />}
            accent={palette.blueSoft}
            color={palette.blue}
            title="Total Stock Value"
            value={formatCurrency(metrics.stockValue)}
            note="Across all products"
          />
        </Col>
        <Col md={6} xl={3}>
          <MetricCard
            icon={<ExclamationTriangle size={20} />}
            accent={palette.amberSoft}
            color="#bc7a11"
            title="Low Stock Items"
            value={metrics.lowStockItems}
            note="Items running low"
          />
        </Col>
        <Col md={6} xl={3}>
          <MetricCard
            icon={<XCircle size={20} />}
            accent={palette.redSoft}
            color={palette.red}
            title="Out of Stock"
            value={metrics.outOfStockItems}
            note="Currently unavailable"
          />
        </Col>
      </Row>

      <Card
        className="border-0"
        style={{
          borderRadius: 28,
          backgroundColor: palette.surface,
          boxShadow: palette.shadow,
          position: "relative",
          zIndex: 1,
          marginTop: "0.25rem",
        }}
      >
        <Card.Body className="p-3 p-lg-4">
          <Row className="g-3 align-items-center mb-3">
            <Col md="auto">
              <Dropdown onSelect={(value) => setRowsPerPage(value === "All" ? "All" : Number(value))}>
                <Dropdown.Toggle variant="light" id="rows-per-page" style={controlButtonStyle}>
                  Show: {rowsPerPage}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item eventKey="5" onClick={() => setCurrentPage(1)}>5</Dropdown.Item>
                  <Dropdown.Item eventKey="10" onClick={() => setCurrentPage(1)}>10</Dropdown.Item>
                  <Dropdown.Item eventKey="25" onClick={() => setCurrentPage(1)}>25</Dropdown.Item>
                  <Dropdown.Item eventKey="All" onClick={() => setCurrentPage(1)}>All</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Col>
            <Col lg={5} className="ms-lg-auto">
              <InputGroup style={searchGroupStyle}>
                <InputGroup.Text style={searchAdornmentStyle}>
                  <Search />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by item name, model, or branch..."
                  value={filter}
                  onChange={(event) => {
                    setFilter(event.target.value);
                    setCurrentPage(1);
                  }}
                  style={searchInputStyle}
                />
              </InputGroup>
            </Col>
          </Row>

          <div
            style={{
              overflowX: "auto",
              borderRadius: 22,
              WebkitOverflowScrolling: "touch",
            }}
          >
            <Table hover className="align-middle mb-0" style={{ minWidth: 1180 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${palette.border}` }}>
                  <th style={headerCellStyle}>#</th>
                  <th style={sortableHeaderStyle} onClick={() => requestSort("itemName")}>
                    Item Name {getSortIcon("itemName")}
                  </th>
                  <th style={sortableHeaderStyle} onClick={() => requestSort("itemModel")}>
                    Model / SKU {getSortIcon("itemModel")}
                  </th>
                  <th style={sortableHeaderStyle} onClick={() => requestSort("branchName")}>
                    Branch {getSortIcon("branchName")}
                  </th>
                  <th style={sortableHeaderStyle} onClick={() => requestSort("itemQuantity")}>
                    Qty in Stock {getSortIcon("itemQuantity")}
                  </th>
                  <th style={sortableHeaderStyle} onClick={() => requestSort("itemStockPrice")}>
                    Cost Price {getSortIcon("itemStockPrice")}
                  </th>
                  <th style={sortableHeaderStyle} onClick={() => requestSort("itemLeastPrice")}>
                    Retail Price {getSortIcon("itemLeastPrice")}
                  </th>
                  <th style={sortableHeaderStyle} onClick={() => requestSort("itemCondition")}>
                    Condition {getSortIcon("itemCondition")}
                  </th>
                  <th style={sortableHeaderStyle} onClick={() => requestSort("itemQuality")}>
                    Quality {getSortIcon("itemQuality")}
                  </th>
                  <th style={headerCellStyle}>Status</th>
                  <th style={{ ...headerCellStyle, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInventory.map((item, index) => {
                  const status = getStockStatus(item.itemQuantity);
                  const absoluteIndex =
                    rowsPerPage === "All"
                      ? index + 1
                      : (currentPage - 1) * Number(rowsPerPage) + index + 1;
                  return (
                    <tr key={item.itemId} style={{ borderBottom: `1px solid ${palette.border}` }}>
                      <td style={bodyCellStyle}>{absoluteIndex}</td>
                      <td style={bodyCellStyle}>
                        <div className="d-flex align-items-center gap-3">
                          <div style={itemAvatarStyle}>{String(item.itemName || "I").charAt(0).toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 700, color: palette.text }}>{item.itemName}</div>
                          </div>
                        </div>
                      </td>
                      <td style={bodyCellStyle}>{item.itemModel}</td>
                      <td style={bodyCellStyle}>{item.branchName}</td>
                      <td style={{ ...bodyCellStyle, color: status.text, fontWeight: 800 }}>
                        {item.itemQuantity}
                      </td>
                      <td style={bodyCellStyle}>{formatCurrency(item.itemStockPrice)}</td>
                      <td style={bodyCellStyle}>{formatCurrency(item.itemLeastPrice)}</td>
                      <td style={bodyCellStyle}>
                        <span style={conditionBadgeStyle(item.itemCondition)}>{item.itemCondition || "N/A"}</span>
                      </td>
                      <td style={bodyCellStyle}>
                        <span style={qualityBadgeStyle(item.itemQuality)}>{item.itemQuality || "N/A"}</span>
                      </td>
                      <td style={bodyCellStyle}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "0.45rem 0.8rem",
                            borderRadius: 999,
                            backgroundColor: status.tone,
                            color: status.text,
                            fontWeight: 700,
                            fontSize: 13,
                            border: `1px solid ${status.text}22`,
                          }}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td style={{ ...bodyCellStyle, textAlign: "center" }}>
                        <PermissionWrapper
                          required={["productsupdate"]}
                          children={
                            <Button
                              variant="light"
                              className="rounded-circle me-2"
                              style={iconButtonStyle(palette.blue)}
                              onClick={() => handleShowFormModal(item)}
                              title="Edit"
                            >
                              <PencilSquare />
                            </Button>
                          }
                        />
                        <PermissionWrapper
                          required={["productsdelete"]}
                          children={
                            <Button
                              variant="light"
                              className="rounded-circle"
                              style={iconButtonStyle(palette.red)}
                              onClick={() => handleShowDeleteModal(item)}
                              title="Delete"
                            >
                              <Trash />
                            </Button>
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          {processedInventory.length === 0 && !isStockLoading && (
            <div className="text-center py-5" style={{ color: palette.muted }}>
              No items match your criteria.
            </div>
          )}

          <div
            className="pt-3 mt-4 d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3"
            style={{ borderTop: `1px solid ${palette.border}` }}
          >
            <div style={{ color: palette.muted }}>
              Showing{" "}
              {processedInventory.length === 0
                ? 0
                : rowsPerPage === "All"
                  ? 1
                  : (currentPage - 1) * Number(rowsPerPage) + 1}{" "}
              to{" "}
              {rowsPerPage === "All"
                ? processedInventory.length
                : Math.min(currentPage * Number(rowsPerPage), processedInventory.length)}{" "}
              of {processedInventory.length} products
            </div>
            <div className="d-flex flex-wrap gap-4 align-items-center">
              {rowsPerPage !== "All" && totalPages > 1 && (
                <Pagination className="mb-0">
                  <Pagination.Prev
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  />
                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5)
                    .map((pageNumber) => (
                      <Pagination.Item
                        key={pageNumber}
                        active={pageNumber === currentPage}
                        onClick={() => setCurrentPage(pageNumber)}
                      >
                        {pageNumber}
                      </Pagination.Item>
                    ))}
                  <Pagination.Next
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  />
                </Pagination>
              )}

              <div className="d-flex flex-wrap gap-4">
              <div className="text-start text-lg-end">
                <small style={{ color: palette.muted }}>Total Quantity</small>
                <p className="fw-bold h5 mb-0" style={{ color: palette.text }}>
                  {totals.quantity}
                </p>
              </div>
              <div className="text-start text-lg-end">
                <small style={{ color: palette.muted }}>Total Cost Value</small>
                <p className="fw-bold h5 mb-0" style={{ color: palette.text }}>
                  {formatCurrency(totals.stockValue)}
                </p>
              </div>
              <div className="text-start text-lg-end">
                <small style={{ color: palette.muted }}>Total Retail Value</small>
                <p className="fw-bold h5 mb-0" style={{ color: palette.text }}>
                  {formatCurrency(totals.leastValue)}
                </p>
              </div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      <CategoryManagement context="products" />

      <Modal
        show={showFormModal}
        onHide={handleCloseFormModal}
        centered
        scrollable
        size="xl"
        fullscreen="md-down"
        className="inventory-page-modal"
        dialogClassName="inventory-modal-dialog"
        contentClassName="inventory-modal-content"
      >
        <Modal.Header closeButton className="inventory-modal-header">
          <div>
            <Modal.Title style={{ fontWeight: 800, color: palette.text }}>
              {currentItem.itemId ? "Edit Item" : "Add New Item"}
            </Modal.Title>
            <div style={modalSubtitleStyle}>
              Keep product identity, stock and pricing in one clean workflow.
            </div>
          </div>
        </Modal.Header>
        <Form
          className="inventory-modal-form"
          onSubmit={(event) => {
            event.preventDefault();
            handleSaveItem(currentItem);
          }}
        >
          <Modal.Body className="inventory-modal-body">
            <div className="inventory-form-section" style={sectionCardStyle}>
              <div className="inventory-form-section-title" style={sectionTitleStyle}>
                Core Details
              </div>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Branch</Form.Label>
                    <Form.Select
                      required
                      value={currentItem.branchId || ""}
                      onChange={(event) =>
                        setCurrentItem({ ...currentItem, branchId: event.target.value })
                      }
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
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Item Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter item name"
                      required
                      value={currentItem.itemName || ""}
                      onChange={(event) =>
                        setCurrentItem({ ...currentItem, itemName: event.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6} xl={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      required
                      value={currentItem.itemCategoryId || ""}
                      onChange={(event) =>
                        setCurrentItem({ ...currentItem, itemCategoryId: event.target.value })
                      }
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.categoryId} value={category.categoryId}>
                          {category.categoryName}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Model</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., BPR-30"
                      required
                      value={currentItem.itemModel || ""}
                      onChange={(event) =>
                        setCurrentItem({ ...currentItem, itemModel: event.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6} xl={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>SKU / Product Code</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Optional internal code"
                      value={currentItem.itemSku || ""}
                      onChange={(event) =>
                        setCurrentItem({ ...currentItem, itemSku: event.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6} xl={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Barcode</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Optional barcode"
                      value={currentItem.itemBarcode || ""}
                      onChange={(event) =>
                        setCurrentItem({ ...currentItem, itemBarcode: event.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6} xl={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Product Type</Form.Label>
                    <Form.Select
                      value={currentItem.itemProductType || "purchased"}
                      onChange={(event) =>
                        setCurrentItem({ ...currentItem, itemProductType: event.target.value })
                      }
                    >
                      <option value="purchased">Purchased / resale</option>
                      <option value="produced">Produced in-house</option>
                      <option value="service">Service / non-stock</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6} xl={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Brand</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Optional brand"
                      value={currentItem.itemBrand || ""}
                      onChange={(event) =>
                        setCurrentItem({ ...currentItem, itemBrand: event.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="inventory-form-section" style={sectionCardStyle}>
              <div className="inventory-form-section-title" style={sectionTitleStyle}>
                Stock & Pricing
              </div>
              <Row className="g-3">
                <Col md={6} xl={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Quantity</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="0"
                      required
                      value={currentItem.itemQuantity || ""}
                      onChange={(event) =>
                        setCurrentItem({
                          ...currentItem,
                          itemQuantity: parseInt(event.target.value, 10) || 0,
                        })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6} xl={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Unit</Form.Label>
                    <Form.Select
                      value={currentItem.itemUnit || "pcs"}
                      onChange={(event) =>
                        setCurrentItem({ ...currentItem, itemUnit: event.target.value })
                      }
                    >
                      <option value="pcs">Pieces</option>
                      <option value="kg">Kilograms</option>
                      <option value="g">Grams</option>
                      <option value="l">Litres</option>
                      <option value="ml">Millilitres</option>
                      <option value="box">Box</option>
                      <option value="carton">Carton</option>
                      <option value="pack">Pack</option>
                      <option value="set">Set</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6} xl={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Reorder Level</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="0"
                      min="0"
                      value={currentItem.itemReorderLevel || ""}
                      onChange={(event) =>
                        setCurrentItem({
                          ...currentItem,
                          itemReorderLevel: parseInt(event.target.value, 10) || 0,
                        })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6} xl={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Cost Price</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>{currency}</InputGroup.Text>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Optional"
                        value={currentItem.itemStockPrice || ""}
                        onChange={(event) =>
                          setCurrentItem({
                            ...currentItem,
                            itemStockPrice: parseFloat(event.target.value) || 0,
                          })
                        }
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={6} xl={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Retail / Minimum Price</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>{currency}</InputGroup.Text>
                      <Form.Control
                        type="number"
                        step="0.01"
                        required
                        value={currentItem.itemLeastPrice || ""}
                        onChange={(event) =>
                          setCurrentItem({
                            ...currentItem,
                            itemLeastPrice: parseFloat(event.target.value) || 0,
                          })
                        }
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={6} xl={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Wholesale Price</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>{currency}</InputGroup.Text>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Optional"
                        value={currentItem.itemWholesalePrice || ""}
                        onChange={(event) =>
                          setCurrentItem({
                            ...currentItem,
                            itemWholesalePrice: parseFloat(event.target.value) || "",
                          })
                        }
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <div style={pricePreviewStyle}>
                    <span>Retail profit: {formatCurrency(pricePreview.profit)}</span>
                    <span>Margin: {pricePreview.margin.toFixed(1)}%</span>
                    <span>Wholesale profit: {formatCurrency(pricePreview.wholesaleProfit)}</span>
                  </div>
                </Col>
              </Row>
            </div>

            <div className="inventory-form-section" style={sectionCardStyle}>
              <div className="inventory-form-section-title" style={sectionTitleStyle}>
                Attributes
              </div>
              <Row className="g-3">
                <Col md={6} xl={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Condition</Form.Label>
                    <Form.Select
                      value={currentItem.itemCondition || "Good"}
                      onChange={(event) =>
                        setCurrentItem({ ...currentItem, itemCondition: event.target.value })
                      }
                    >
                      <option value="Good">Good</option>
                      <option value="Used">Used</option>
                      <option value="Damaged">Damaged</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6} xl={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Quality</Form.Label>
                    <Form.Select
                      value={currentItem.itemQuality || "New"}
                      onChange={(event) =>
                        setCurrentItem({ ...currentItem, itemQuality: event.target.value })
                      }
                    >
                      <option value="New">New</option>
                      <option value="Original">Original</option>
                      <option value="Second grade">Second grade</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6} xl={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Size</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., 12oz"
                      value={currentItem.itemSize || ""}
                      onChange={(event) =>
                        setCurrentItem({ ...currentItem, itemSize: event.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6} xl={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Supplier</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder={
                        currentItem.itemProductType === "produced"
                          ? "Optional for produced items"
                          : "Supplier name"
                      }
                      value={currentItem.itemSupplier || ""}
                      onChange={(event) =>
                        setCurrentItem({ ...currentItem, itemSupplier: event.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label>Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      placeholder="Add any relevant notes..."
                      value={currentItem.itemNotes || ""}
                      onChange={(event) =>
                        setCurrentItem({ ...currentItem, itemNotes: event.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          </Modal.Body>
          <Modal.Footer className="inventory-modal-footer d-grid d-sm-flex gap-2 justify-content-sm-end">
            <Button
              variant="light"
              onClick={handleCloseFormModal}
              style={toolbarButtonStyle}
              className="w-100 w-sm-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              style={addButtonStyle}
              disabled={isCreating || isUpdateLoading}
              className="w-100 w-sm-auto"
            >
              {currentItem.itemId
                ? isUpdateLoading
                  ? "Updating Item..."
                  : "Update Item"
                : isCreating
                  ? "Saving Item..."
                  : "Save Item"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={showDeleteModal}
        onHide={handleCloseDeleteModal}
        centered
        className="inventory-page-modal"
        dialogClassName="inventory-modal-dialog"
        contentClassName="inventory-modal-content"
      >
        <Modal.Header closeButton className="inventory-modal-header">
          <Modal.Title style={{ fontWeight: 800, color: palette.text }}>
            Confirm Deletion
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="inventory-modal-body">
          Are you sure you want to delete <strong>{itemToDelete?.itemName}</strong>? This action
          cannot be undone.
        </Modal.Body>
        <Modal.Footer className="inventory-modal-footer">
          <Button variant="light" onClick={handleCloseDeleteModal} style={toolbarButtonStyle}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteItem} disabled={isDeleteLoading}>
            {isDeleteLoading ? "Deleting Item..." : "Delete Item"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

function MetricCard({ icon, accent, color, title, value, note }) {
  return (
    <Card
      className="border-0 h-100"
      style={{
        borderRadius: 24,
        backgroundColor: palette.surface,
        boxShadow: palette.shadow,
      }}
    >
      <Card.Body className="p-4">
        <div className="d-flex align-items-start gap-3">
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              backgroundColor: accent,
              color,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <div style={{ color: palette.muted, fontSize: 14 }}>{title}</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: palette.text,
              }}
            >
              {value}
            </div>
            <div style={{ marginTop: 8, color: palette.muted, fontSize: 14 }}>{note}</div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

const toolbarButtonStyle = {
  minHeight: 44,
  padding: "0.65rem 1.1rem",
  borderRadius: 16,
  border: `1px solid ${palette.border}`,
  backgroundColor: "#ffffff",
  color: palette.text,
  fontWeight: 700,
  boxShadow: "none",
};

const addButtonStyle = {
  minHeight: 44,
  padding: "0.65rem 1.15rem",
  borderRadius: 16,
  border: "none",
  backgroundColor: palette.green,
  color: "#ffffff",
  fontWeight: 800,
  boxShadow: "0 12px 24px rgba(47, 143, 87, 0.18)",
};

const controlButtonStyle = {
  ...toolbarButtonStyle,
  minWidth: 110,
};

const searchGroupStyle = {
  borderRadius: 18,
  overflow: "hidden",
  border: `1px solid ${palette.border}`,
  backgroundColor: "#ffffff",
};

const searchAdornmentStyle = {
  backgroundColor: "#ffffff",
  border: "none",
  color: palette.muted,
};

const searchInputStyle = {
  border: "none",
  boxShadow: "none",
  minHeight: 46,
};

const headerCellStyle = {
  color: palette.text,
  fontWeight: 800,
  fontSize: 14,
  whiteSpace: "nowrap",
  backgroundColor: "#ffffff",
  paddingTop: 18,
  paddingBottom: 18,
};

const sortableHeaderStyle = {
  ...headerCellStyle,
  cursor: "pointer",
};

const bodyCellStyle = {
  color: palette.text,
  fontSize: 14,
  whiteSpace: "nowrap",
  paddingTop: 18,
  paddingBottom: 18,
};

const itemAvatarStyle = {
  width: 40,
  height: 40,
  borderRadius: 14,
  backgroundColor: palette.greenSoft,
  color: palette.green,
  display: "grid",
  placeItems: "center",
  fontWeight: 800,
};

const iconButtonStyle = (color) => ({
  width: 38,
  height: 38,
  padding: 0,
  border: `1px solid ${palette.border}`,
  color,
  backgroundColor: "#ffffff",
});

const conditionBadgeStyle = (condition) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "0.45rem 0.8rem",
  borderRadius: 999,
  backgroundColor: condition === "Good" ? palette.greenSoft : palette.amberSoft,
  color: condition === "Good" ? palette.green : "#bc7a11",
  fontWeight: 700,
  fontSize: 13,
});

const qualityBadgeStyle = (quality) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "0.45rem 0.8rem",
  borderRadius: 999,
  backgroundColor: quality === "New" ? palette.blueSoft : "#f1e9ff",
  color: quality === "New" ? palette.blue : "#7c3aed",
  fontWeight: 700,
  fontSize: 13,
});

const modalSubtitleStyle = {
  marginTop: 4,
  color: palette.muted,
  fontSize: 14,
  lineHeight: 1.5,
};

const sectionCardStyle = {
  border: `1px solid ${palette.border}`,
  borderRadius: 20,
  padding: "1rem 1rem 0.35rem",
  marginBottom: "1rem",
  backgroundColor: "#ffffff",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
};

const sectionTitleStyle = {
  marginBottom: "0.95rem",
  color: palette.text,
  fontWeight: 800,
  fontSize: 15,
  letterSpacing: "-0.02em",
};

const pricePreviewStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
  padding: "0.85rem 1rem",
  borderRadius: 14,
  backgroundColor: palette.greenSoft,
  color: palette.green,
  fontSize: 14,
  fontWeight: 800,
};
