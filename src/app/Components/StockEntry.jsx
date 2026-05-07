import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Alert, Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import { BoxArrowInDown, Search, Trash } from "react-bootstrap-icons";
import { toast } from "react-toastify";
import { Button as MuiButton, Chip } from "@mui/material";
import { Download, SaveAlt } from "@mui/icons-material";
import jsPDF from "jspdf";
import "jspdf-autotable";

import { selectStock } from "../features/stock/stockSlice";
import { selectBranchScope } from "../auth/authSlice";
import { selectBranches, useGetBranchesQuery } from "../features/api/branchesSlice";
import { useAddStokMutation } from "../features/api/stockSlice";
import "./StockWorkspace.css";

const palette = {
  surface: "#ffffff",
  border: "#e7efe9",
  text: "#15202b",
  muted: "#6f7d8c",
  green: "#2f8f57",
  greenSoft: "#e8f5ec",
  blue: "#2f80ed",
  blueSoft: "#e8f1ff",
  red: "#ef4444",
  redSoft: "#ffebeb",
  amber: "#f59e0b",
  amberSoft: "#fff4df",
  shadow: "0 12px 32px rgba(15, 23, 42, 0.05)",
};

function StockMetricCard({ title, value, note, accent, color }) {
  return (
    <div
      className="stock-metric-card"
      style={{
        backgroundColor: palette.surface,
        border: `1px solid ${palette.border}`,
        boxShadow: palette.shadow,
      }}
    >
      <div className="stock-metric-icon" style={{ backgroundColor: accent, color }}>
        <BoxArrowInDown size={18} />
      </div>
      <div>
        <div className="stock-metric-title">{title}</div>
        <div className="stock-metric-value">{value}</div>
        <div className="stock-metric-note">{note}</div>
      </div>
    </div>
  );
}

const StockEntry = () => {
  useGetBranchesQuery();
  const [addStock, { isLoading, isError, error }] = useAddStokMutation();
  const products = useSelector(selectStock) ?? [];
  const branches = useSelector(selectBranches) ?? [];
  const branchScope = useSelector(selectBranchScope);
  const currentBranchId = branchScope?.effective_branch_id ? String(branchScope.effective_branch_id) : "";
  const canSwitchBranches = Boolean(branchScope?.can_switch_branches);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockItems, setStockItems] = useState([]);
  const [notes, setNotes] = useState("");
  const [branchId, setBranchId] = useState("");

  useEffect(() => {
    if (currentBranchId && !branchId) {
      setBranchId(currentBranchId);
    }
  }, [branchId, currentBranchId]);

  const selectedIds = useMemo(
    () => new Set(stockItems.map((item) => item.itemId)),
    [stockItems]
  );

  const filteredProducts = useMemo(
    () =>
      products.filter((product) =>
        (branchId ? String(product.branchId || "") === String(branchId) : true) &&
        String(product.itemName || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ),
    [branchId, products, searchTerm]
  );

  const totalReorderQuantity = useMemo(
    () => stockItems.reduce((sum, item) => sum + (Number(item.stockItemQuantity) || 0), 0),
    [stockItems]
  );

  const totalProjectedStock = useMemo(
    () =>
      stockItems.reduce(
        (sum, item) =>
          sum +
          (Number(item.oldStock) || 0) +
          (Number(item.stockItemQuantity) || 0),
        0
      ),
    [stockItems]
  );

  const handleAddStockItem = (product) => {
    if (selectedIds.has(product.itemId)) return;

    setStockItems((currentItems) => [
      ...currentItems,
      {
        ...product,
        stockItemQuantity: 1,
        oldStock: Number(product.itemQuantity) || 0,
        stockItem: product.itemId,
      },
    ]);
  };

  const handleRemoveStockItem = (productId) => {
    setStockItems((currentItems) => currentItems.filter((item) => item.itemId !== productId));
  };

  const handleQuantityChange = (productId, quantity) => {
    const normalizedQuantity = Math.max(1, Number(quantity) || 1);
    setStockItems((currentItems) =>
      currentItems.map((item) =>
        item.itemId === productId
          ? { ...item, stockItemQuantity: normalizedQuantity }
          : item
      )
    );
  };

  const handleClearList = () => {
    setStockItems([]);
    setNotes("");
    setBranchId(currentBranchId);
  };

  const handleExportPDF = () => {
    if (!stockItems.length || !branchId) return;

    const doc = new jsPDF();
    doc.text("New Stock Reorder", 14, 15);
    doc.autoTable({
      startY: 22,
      head: [["Product", "Current Stock", "Reordered Qty", "Projected Stock"]],
      body: stockItems.map((item) => [
        item.itemName,
        item.oldStock,
        item.stockItemQuantity,
        (Number(item.oldStock) || 0) + (Number(item.stockItemQuantity) || 0),
      ]),
      headStyles: {
        fillColor: [47, 143, 87],
      },
    });

    if (notes.trim()) {
      doc.text("Notes", 14, doc.lastAutoTable.finalY + 14);
      doc.text(notes, 14, doc.lastAutoTable.finalY + 22);
    }

    doc.save("new-stock-reorder.pdf");
  };

  const handleAddStock = async () => {
    if (!stockItems.length || !branchId) return;

    try {
      await addStock({ branchId, stockItems }).unwrap();
      toast.success("Stock added successfully.");
      setStockItems([]);
      setNotes("");
      setBranchId(currentBranchId);
    } catch (err) {
      toast.error(
        err?.data?.message || err?.message || "An error occurred while adding stock."
      );
    }
  };

  return (
    <div className="stock-entry-shell">
      <div className="stock-entry-metrics">
        <StockMetricCard
          title="Selected Products"
          value={stockItems.length}
          note="Items queued for this stock session"
          accent={palette.greenSoft}
          color={palette.green}
        />
        <StockMetricCard
          title="Total Reorder Qty"
          value={totalReorderQuantity}
          note="Total quantity to be added"
          accent={palette.blueSoft}
          color={palette.blue}
        />
      </div>

      <Row className="g-4">
        <Col xl={5}>
          <section className="stock-card-panel stock-catalog-panel">
            <div className="stock-card-head stock-card-head-split">
              <div>
                <h3 className="stock-section-title">Product Catalog</h3>
                <p className="stock-section-copy">
                  Search available products, then add them into the current stock reorder list.
                </p>
              </div>
              <Chip
                label={`${filteredProducts.length} product${filteredProducts.length === 1 ? "" : "s"}`}
                className="stock-soft-chip"
              />
            </div>

            <InputGroup className="stock-search-group mb-3">
              <InputGroup.Text className="stock-search-icon">
                <Search />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search for a product..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="stock-search-input"
              />
            </InputGroup>

              <Form.Select
                className="mb-3"
                value={branchId}
                disabled={!canSwitchBranches}
                onChange={(event) => {
                  setBranchId(event.target.value);
                  setStockItems([]);
                }}
              >
                <option value="">Select branch</option>
                {branches.map((branch) => (
                  <option key={branch.branchId} value={branch.branchId}>
                    {branch.branchName}
                  </option>
                ))}
              </Form.Select>

            {!branchId ? (
              <div className="stock-inline-empty mb-3">
                Select a branch before adding products to this stock batch.
              </div>
            ) : null}

            <div className="stock-catalog-list">
              {filteredProducts.length ? (
                filteredProducts.map((product) => {
                  const currentStock = Number(product.itemQuantity) || 0;
                  const isSelected = selectedIds.has(product.itemId);

                  return (
                    <div key={product.itemId} className="stock-catalog-item">
                      <div className="stock-catalog-copy">
                        <strong>{product.itemName}</strong>
                        <span>
                          Current stock:{" "}
                          <b className={currentStock > 0 ? "" : "text-danger"}>{currentStock}</b>
                        </span>
                      </div>
                      <div className="stock-catalog-actions">
                        <Chip
                          label={currentStock > 0 ? "Available" : "Empty"}
                          className={currentStock > 0 ? "stock-soft-chip stock-soft-chip-green" : "stock-soft-chip stock-soft-chip-red"}
                        />
                      <MuiButton
                        variant={isSelected ? "outlined" : "contained"}
                        size="small"
                        onClick={() => handleAddStockItem(product)}
                        disabled={isSelected || !branchId}
                        sx={isSelected ? stockDisabledButtonStyle : stockAddButtonStyle}
                      >
                        {isSelected ? "Added" : "Add"}
                      </MuiButton>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="stock-inline-empty">
                  No products match your search.
                </div>
              )}
            </div>
          </section>
        </Col>

        <Col xl={7}>
          <section className="stock-card-panel">
            <div className="stock-card-head stock-card-head-split">
              <div>
                <h3 className="stock-section-title">New Stock Reorder</h3>
                <p className="stock-section-copy">
                  Set the reorder quantity for each selected product before saving the stock entry.
                </p>
              </div>
              <div className="stock-head-chips">
                <Chip label={`${stockItems.length} selected`} className="stock-soft-chip stock-soft-chip-green" />
                <Chip label={`Qty ${totalReorderQuantity}`} className="stock-soft-chip stock-soft-chip-blue" />
              </div>
            </div>

            <div className="stock-batch-layout">
              <div className="stock-batch-list-panel">
                {stockItems.length ? (
                  <div className="stock-batch-list">
                    {stockItems.map((item) => {
                      const projectedStock =
                        (Number(item.oldStock) || 0) + (Number(item.stockItemQuantity) || 0);

                      return (
                        <article key={item.itemId} className="stock-batch-item">
                          <div className="stock-batch-main">
                            <div className="stock-batch-product">
                              <div className="stock-batch-product-name">{item.itemName}</div>
                            </div>

                            <div className="stock-batch-stats">
                              <div className="stock-batch-stat">
                                <span>Current</span>
                                <strong>{item.oldStock}</strong>
                              </div>
                              <div className="stock-batch-stat">
                                <span>Projected</span>
                                <strong>{projectedStock}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="stock-batch-controls">
                            <div className="stock-batch-qty">
                              <label className="stock-batch-label">Reorder Qty</label>
                              <Form.Control
                                type="number"
                                min={1}
                                value={item.stockItemQuantity}
                                onChange={(event) =>
                                  handleQuantityChange(item.itemId, event.target.value)
                                }
                              />
                            </div>
                            <Button
                              variant="light"
                              className="stock-remove-button"
                              onClick={() => handleRemoveStockItem(item.itemId)}
                            >
                              <Trash size={15} />
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="stock-inline-empty stock-inline-empty-tall">
                    No products added yet. Pick items from the catalog to start a new stock entry.
                  </div>
                )}
              </div>

              <aside className="stock-batch-side-panel">
                <div className="stock-batch-summary-card">
                  <div className="stock-batch-summary-title">Batch Summary</div>
                  <div className="stock-batch-summary-grid">
                    <div className="stock-batch-summary-item">
                      <span>Products</span>
                      <strong>{stockItems.length}</strong>
                    </div>
                    <div className="stock-batch-summary-item">
                      <span>Reorder Qty</span>
                      <strong>{totalReorderQuantity}</strong>
                    </div>
                    <div className="stock-batch-summary-item">
                      <span>Projected Total</span>
                      <strong>{totalProjectedStock}</strong>
                    </div>
                  </div>
                </div>

                <div className="stock-notes-panel stock-notes-panel-compact">
                  <Form.Group>
                    <Form.Label className="stock-notes-label">Batch Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={8}
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Add any remarks for this stock reorder batch..."
                    />
                  </Form.Group>
                </div>

                <div className="stock-side-actions">
                  <MuiButton
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={handleExportPDF}
                    disabled={!stockItems.length || !branchId}
                    sx={stockSecondaryButtonStyle}
                  >
                    Export PDF
                  </MuiButton>
                  <MuiButton
                    variant="outlined"
                    onClick={handleClearList}
                    disabled={!stockItems.length && !notes}
                    sx={stockSecondaryButtonStyle}
                  >
                    Clear Batch
                  </MuiButton>
                  <MuiButton
                    variant="contained"
                    startIcon={<SaveAlt />}
                    onClick={handleAddStock}
                    disabled={isLoading || !stockItems.length || !branchId}
                    sx={stockSaveButtonStyle}
                  >
                    {isLoading ? "Saving Stock..." : "Save Stock"}
                  </MuiButton>
                </div>
              </aside>
            </div>
          </section>

          {isError && (
            <Alert variant="danger" className="mt-3">
              {error?.status} {error?.data?.message || "Unable to save stock."}
            </Alert>
          )}
        </Col>
      </Row>
    </div>
  );
};

const stockAddButtonStyle = {
  minHeight: 38,
  borderRadius: "12px",
  textTransform: "none",
  fontWeight: 700,
  backgroundColor: palette.green,
  boxShadow: "none",
  "&:hover": {
    backgroundColor: "#27794a",
    boxShadow: "none",
  },
};

const stockDisabledButtonStyle = {
  minHeight: 38,
  borderRadius: "12px",
  textTransform: "none",
  fontWeight: 700,
  borderColor: palette.border,
  color: palette.muted,
};

const stockSecondaryButtonStyle = {
  minHeight: 42,
  borderRadius: "14px",
  px: 2,
  textTransform: "none",
  fontWeight: 700,
  borderColor: palette.border,
  color: palette.text,
  backgroundColor: "#ffffff",
  "&:hover": {
    borderColor: palette.green,
    backgroundColor: palette.greenSoft,
  },
};

const stockSaveButtonStyle = {
  minHeight: 46,
  borderRadius: "14px",
  px: 2.5,
  textTransform: "none",
  fontWeight: 700,
  backgroundColor: palette.green,
  boxShadow: "0 12px 24px rgba(47, 143, 87, 0.18)",
  "&:hover": {
    backgroundColor: "#27794a",
    boxShadow: "0 14px 28px rgba(47, 143, 87, 0.24)",
  },
};

export default StockEntry;
