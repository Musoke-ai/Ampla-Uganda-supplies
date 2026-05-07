import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add,
  ChevronRight,
  Close,
  DeleteOutline,
  GridView,
  LockOutlined,
  PauseCircleOutline,
  Remove,
  Search,
  ShoppingCartOutlined,
  ViewList,
} from "@mui/icons-material";

import { selectBranchScope, selectProfile } from "../../auth/authSlice";
import { useSettings } from "../Settings";
import { selectStock, useGetStockQuery } from "../../features/stock/stockSlice";
import { selectBranches, useGetBranchesQuery } from "../../features/api/branchesSlice";
import { selectCustomers, useGetCustomersQuery } from "../../features/api/customers";
import { useMakeSalesMutation } from "../../features/api/salesSlice";
import AmplaReceipt from "../receipts/AmplaReceipt";
import "./PosPage.css";

const HOLD_SALES_STORAGE_KEY = "gemini-pos-held-sales";

const money = (value, currency = "UGX") =>
  `${currency} ${Number(value || 0).toLocaleString()}`;

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const toNumber = (value) => Number(value || 0);
const clampPercent = (value) => Math.min(100, Math.max(0, toNumber(value)));
const toBooleanSetting = (value, fallback = true) => {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "enabled"].includes(String(value).toLowerCase());
};

const getLineTotal = (item) => toNumber(item.saleQuantity) * toNumber(item.salePrice);

const createCartItem = (product, priceType) => {
  const retailPrice = toNumber(product.itemLeastPrice);
  const configuredWholesalePrice = toNumber(product.itemWholesalePrice);
  const wholesalePrice = configuredWholesalePrice > 0 ? configuredWholesalePrice : retailPrice;

  return {
    saleItemId: product.itemId,
    itemId: product.itemId,
    itemName: product.itemName,
    itemModel: product.itemModel,
    itemQuantity: toNumber(product.itemQuantity),
    saleQuantity: 1,
    salePrice: priceType === "retail" ? retailPrice : wholesalePrice,
    priceMode: priceType,
    retailPrice,
    wholesalePrice,
  };
};

export default function GeminiPos() {
  const { settings } = useSettings();
  const currency = settings?.currency && settings.currency !== "none" ? settings.currency : "UGX";
  const taxRate = toNumber(settings?.taxRate);
  const lowStockThreshold = toNumber(settings?.lowLevelProducts) || 10;
  const minWholesaleOrder = toNumber(settings?.minWholesaleOrder);
  const autoPriceDetermination = Boolean(settings?.autoPriceDetermination);

  const companyProfile = useSelector(selectProfile) ?? {};
  const branchScope = useSelector(selectBranchScope) ?? {};
  const stockItems = useSelector(selectStock) ?? [];
  const customers = useSelector(selectCustomers) ?? [];
  const branches = useSelector(selectBranches) ?? [];
  const canSwitchBranches = Boolean(branchScope?.can_switch_branches);
  const scopedBranchId = branchScope?.effective_branch_id
    ? String(branchScope.effective_branch_id)
    : "";

  useGetBranchesQuery();
  const {
    isLoading: isStockLoading,
    isError: isStockError,
    error: stockError,
  } = useGetStockQuery();
  const {
    isLoading: isCustomersLoading,
    isError: isCustomersError,
    error: customersError,
  } = useGetCustomersQuery();

  const [makeSale, { isLoading: isSubmittingSale }] = useMakeSalesMutation();

  const [selectedBranchId, setSelectedBranchId] = useState(scopedBranchId);
  const [query, setQuery] = useState("");
  const [custId, setCustId] = useState("");
  const [priceType, setPriceType] = useState("retail");
  const [productView, setProductView] = useState("grid");
  const [cart, setCart] = useState([]);
  const [heldSales, setHeldSales] = useState([]);
  const [showHeldSales, setShowHeldSales] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [discountType, setDiscountType] = useState("amount");
  const [discountValue, setDiscountValue] = useState("");
  const [taxType, setTaxType] = useState("none");
  const [taxValue, setTaxValue] = useState("");
  const [creditEndDate, setCreditEndDate] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [lastAdded, setLastAdded] = useState(null);
  const [showAddedNotice, setShowAddedNotice] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, severity: "success", message: "" });
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [debtAlertOpen, setDebtAlertOpen] = useState(false);

  useEffect(() => {
    const savedHeldSales = JSON.parse(localStorage.getItem(HOLD_SALES_STORAGE_KEY) || "[]");
    setHeldSales(savedHeldSales);
  }, []);

  useEffect(() => {
    if (!canSwitchBranches && scopedBranchId && selectedBranchId !== scopedBranchId) {
      setSelectedBranchId(scopedBranchId);
    }
  }, [canSwitchBranches, scopedBranchId, selectedBranchId]);

  useEffect(() => {
    if (canSwitchBranches && !selectedBranchId && scopedBranchId) {
      setSelectedBranchId(scopedBranchId);
    }
  }, [canSwitchBranches, scopedBranchId, selectedBranchId]);

  const branchStockItems = useMemo(() => {
    if (!selectedBranchId) return [];

    return stockItems.filter((item) => String(item.branchId) === String(selectedBranchId));
  }, [selectedBranchId, stockItems]);

  const branchCustomers = useMemo(() => {
    if (!selectedBranchId) return [];

    return customers.filter((customer) => String(customer.branchId) === String(selectedBranchId));
  }, [customers, selectedBranchId]);

  const selectedBranch = useMemo(
    () => branches.find((branch) => String(branch.branchId) === String(selectedBranchId)) || null,
    [branches, selectedBranchId]
  );

  const selectedCustomer = useMemo(
    () => branchCustomers.find((customer) => String(customer.custId) === String(custId)) || null,
    [branchCustomers, custId]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return branchStockItems;

    return branchStockItems.filter((item) =>
      `${item.itemName || ""} ${item.itemModel || ""} ${item.itemSku || ""} ${item.itemBarcode || ""}`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [branchStockItems, query]);

  useEffect(() => {
    if (taxRate > 0 && taxType === "none" && taxValue === "") {
      setTaxType("percent");
      setTaxValue(String(taxRate));
    }
  }, [taxRate, taxType, taxValue]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + getLineTotal(item), 0),
    [cart]
  );
  const discountAmount = useMemo(() => {
    if (discountType === "percent") {
      return subtotal * (clampPercent(discountValue) / 100);
    }

    return Math.min(subtotal, Math.max(0, toNumber(discountValue)));
  }, [discountType, discountValue, subtotal]);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = useMemo(() => {
    if (taxType === "percent") {
      return taxableAmount * (clampPercent(taxValue) / 100);
    }

    if (taxType === "amount") {
      return Math.max(0, toNumber(taxValue));
    }

    return 0;
  }, [taxType, taxValue, taxableAmount]);
  const total = taxableAmount + taxAmount;
  const wholesaleThresholdReached =
    autoPriceDetermination && minWholesaleOrder > 0 && subtotal >= minWholesaleOrder;
  const tenderedAmount = toNumber(amountPaid);
  const changeDue = tenderedAmount - total;
  const dueAmount = Math.max(0, total - tenderedAmount);
  const requiresDueDate = dueAmount > 0;
  const debtSalesAllowed = toBooleanSetting(
    selectedBranch?.allowDebtSales,
    toBooleanSetting(settings?.allowDebtSales, true)
  );
  const discountSummaryLabel =
    discountType === "percent"
      ? `Discount (${clampPercent(discountValue)}%)`
      : "Discount";
  const taxSummaryLabel =
    taxType === "percent"
      ? `Tax (${clampPercent(taxValue)}%)`
      : taxType === "amount"
        ? "Tax"
        : "Tax (0%)";
  const canCheckout = cart.length > 0 && Boolean(custId) && Boolean(selectedBranchId);
  const canCompleteCheckout =
    canCheckout &&
    !isSubmittingSale &&
    (paymentMethod === "Credit" ? true : amountPaid !== "");
  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + toNumber(item.saleQuantity), 0),
    [cart]
  );
  const lowStockCount = useMemo(
    () =>
      branchStockItems.filter((item) => {
        const quantity = toNumber(item.itemQuantity);
        return quantity > 0 && quantity <= lowStockThreshold;
      }).length,
    [branchStockItems, lowStockThreshold]
  );

  useEffect(() => {
    if (wholesaleThresholdReached && priceType !== "wholesale") {
      setPriceType("wholesale");
    }
  }, [priceType, wholesaleThresholdReached]);

  const showFeedback = (severity, message) => {
    setFeedback({ open: true, severity, message });
  };

  const persistHeldSales = (nextHeldSales) => {
    setHeldSales(nextHeldSales);
    localStorage.setItem(HOLD_SALES_STORAGE_KEY, JSON.stringify(nextHeldSales));
  };

  const handleBranchChange = (branchId) => {
    setSelectedBranchId(branchId);
    setCart([]);
    setCustId("");
    setQuery("");
    clearCheckoutState();
  };

  const clearCheckoutState = () => {
    setAmountPaid("");
    setPaymentNote("");
    setPaymentMethod("Cash");
    setCreditEndDate("");
    setShowCheckout(false);
    setDebtAlertOpen(false);
    setCartDrawerOpen(false);
  };

  const resetAdjustments = () => {
    setDiscountType("amount");
    setDiscountValue("");
    setTaxType(taxRate > 0 ? "percent" : "none");
    setTaxValue(taxRate > 0 ? String(taxRate) : "");
  };

  const clearSaleWorkspace = () => {
    setCart([]);
    setCustId("");
    resetAdjustments();
    clearCheckoutState();
  };

  const openCheckout = (quickAmount = "") => {
    if (!cart.length) return;

    if (!custId) {
      showFeedback("warning", "Select a customer before continuing to payment.");
      return;
    }

    setAmountPaid(quickAmount ? String(quickAmount) : String(total));
    setShowCheckout(true);
  };

  const addToCart = (product) => {
    if (!selectedBranchId) {
      showFeedback("warning", "Select the selling branch first.");
      return;
    }

    const availableStock = toNumber(product.itemQuantity);
    if (availableStock <= 0) {
      showFeedback("warning", `${product.itemName} is out of stock.`);
      return;
    }

    setLastAdded({
      itemName: product.itemName,
      salePrice:
        priceType === "retail"
          ? toNumber(product.itemLeastPrice)
          : toNumber(product.itemWholesalePrice) || toNumber(product.itemLeastPrice),
    });
    setShowAddedNotice(true);

    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.saleItemId === product.itemId);

      if (existingItem) {
        if (toNumber(existingItem.saleQuantity) >= availableStock) {
          showFeedback(
            "warning",
            `Cannot add more. Only ${availableStock} of ${product.itemName} available.`
          );
          return currentCart;
        }

        return currentCart.map((item) =>
          item.saleItemId === product.itemId
            ? { ...item, saleQuantity: toNumber(item.saleQuantity) + 1, itemQuantity: availableStock }
            : item
        );
      }

      return [...currentCart, createCartItem(product, priceType)];
    });
  };

  const updateQty = (itemId, change) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.saleItemId !== itemId) return item;

          const maxStock = toNumber(item.itemQuantity);
          const nextQuantity = toNumber(item.saleQuantity) + change;

          if (nextQuantity > maxStock) {
            showFeedback(
              "warning",
              `Cannot add more. Only ${maxStock} of ${item.itemName} available.`
            );
            return item;
          }

          return { ...item, saleQuantity: nextQuantity };
        })
        .filter((item) => toNumber(item.saleQuantity) > 0)
    );
  };

  const updateCartItemPriceMode = (itemId, nextPriceMode) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.saleItemId !== itemId) return item;

        return {
          ...item,
          priceMode: nextPriceMode,
          salePrice: nextPriceMode === "retail" ? toNumber(item.retailPrice) : toNumber(item.wholesalePrice),
        };
      })
    );
  };

  const removeItem = (itemId) => {
    setCart((currentCart) => currentCart.filter((item) => item.saleItemId !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    clearCheckoutState();
  };

  const holdCurrentSale = () => {
    if (!cart.length) return;

    const heldSale = {
      id: Date.now(),
      branchId: selectedBranchId,
      branchName: selectedBranch?.branchName || "",
      custId,
      customerName: selectedCustomer?.custName || "",
      items: cart,
      priceType,
      total,
      discountType,
      discountValue,
      taxType,
      taxValue,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const nextHeldSales = [heldSale, ...heldSales];
    persistHeldSales(nextHeldSales);
    clearSaleWorkspace();
    showFeedback("success", "Sale placed on hold.");
  };

  const resumeHeldSale = (saleId) => {
    const sale = heldSales.find((item) => item.id === saleId);
    if (!sale) return;

    if (canSwitchBranches && sale.branchId) {
      setSelectedBranchId(String(sale.branchId));
    }
    setCart(sale.items);
    setPriceType(sale.priceType || "retail");
    setCustId(sale.custId || "");
    setDiscountType(sale.discountType ?? "amount");
    setDiscountValue(sale.discountValue ?? "");
    setTaxType(sale.taxType ?? (taxRate > 0 ? "percent" : "none"));
    setTaxValue(sale.taxValue ?? (taxRate > 0 ? String(taxRate) : ""));
    persistHeldSales(heldSales.filter((item) => item.id !== saleId));
    setShowHeldSales(false);
    showFeedback("success", "Held sale resumed.");
  };

  const deleteHeldSale = (saleId) => {
    persistHeldSales(heldSales.filter((item) => item.id !== saleId));
  };

  const completeCheckout = async ({ confirmDebt = false } = {}) => {
    if (!selectedBranchId) {
      showFeedback("warning", "Select the selling branch before completing the sale.");
      return;
    }

    if (!selectedCustomer) {
      showFeedback("warning", "Select a customer before completing the sale.");
      return;
    }

    if (tenderedAmount < 0) {
      showFeedback("warning", "Amount paid cannot be negative.");
      return;
    }

    if (dueAmount > 0 && !debtSalesAllowed) {
      showFeedback(
        "warning",
        "Debt sales are disabled for this branch. Collect full payment before completing the sale."
      );
      return;
    }

    if (requiresDueDate && !creditEndDate) {
      showFeedback("warning", "Select a due date for the outstanding balance.");
      return;
    }

    if (dueAmount > 0 && !confirmDebt) {
      setDebtAlertOpen(true);
      return;
    }

    const saleItems = cart.map((item) => ({
      custId,
      saleQuantity: toNumber(item.saleQuantity),
      salePrice: toNumber(item.salePrice),
      saleItemId: item.saleItemId,
    }));

    const saleDetails = {
      branchId: selectedBranchId,
      branchName: selectedBranch?.branchName || "",
      custId,
      customerName: selectedCustomer.custName,
      paymentMethod,
      tenderedAmount,
      discount: discountAmount,
      discountAmount,
      discountType,
      discountValue: discountType === "percent" ? clampPercent(discountValue) : toNumber(discountValue),
      tax: taxAmount,
      taxAmount,
      taxType,
      taxValue: taxType === "percent" ? clampPercent(taxValue) : toNumber(taxValue),
      total,
      dueAmount,
      confirmDebt: dueAmount > 0 && confirmDebt,
      endDate: creditEndDate || null,
      moreInfo: paymentNote,
    };

    try {
      await makeSale({ branchId: selectedBranchId, saleItems, saleDetails }).unwrap();

      setCompletedSale({
        cart: cart.map((item) => ({
          ...item,
          saleQuantity: toNumber(item.saleQuantity),
          salePrice: toNumber(item.salePrice),
        })),
        saleDetails,
        customerName: selectedCustomer.custName,
      });
      setReceiptOpen(true);
      clearCheckoutState();
      showFeedback("success", "Sale completed successfully.");
    } catch (error) {
      const message =
        error?.data?.message || error?.error || "Failed to complete sale. Please try again.";

      if (error?.data?.error === "DebtConfirmationRequired") {
        setDebtAlertOpen(true);
        showFeedback("warning", message);
        return;
      }

      if (error?.data?.error === "DebtSalesDisabled") {
        setDebtAlertOpen(false);
        showFeedback("warning", message);
        return;
      }

      showFeedback("error", message);
    }
  };

  const handleReceiptClose = () => {
    setReceiptOpen(false);
    setCompletedSale(null);
    clearSaleWorkspace();
  };

  const renderProduct = (product) => {
    const availableStock = toNumber(product.itemQuantity);
    const retailPrice = toNumber(product.itemLeastPrice);
    const configuredWholesalePrice = toNumber(product.itemWholesalePrice);
    const wholesalePrice = configuredWholesalePrice > 0 ? configuredWholesalePrice : retailPrice;
    const displayPrice = priceType === "retail" ? retailPrice : wholesalePrice;
    const inCartQty =
      cart.find((item) => item.saleItemId === product.itemId)?.saleQuantity || 0;
    const isOutOfStock = availableStock <= 0;

    if (productView === "list") {
      return (
        <Card key={product.itemId} onClick={() => addToCart(product)} sx={productListCardStyle}>
          <Box sx={productInitialStyle}>{getInitials(product.itemName)}</Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={900}>{product.itemName}</Typography>
            <Typography variant="body2" color="#64748B">
              Model: {product.itemModel || "N/A"}
            </Typography>
          </Box>

          <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
            <Chip
              size="small"
              label={isOutOfStock ? "Out of Stock" : "In Stock"}
              sx={isOutOfStock ? outOfStockChipStyle : stockChipStyle}
            />
            {inCartQty > 0 && (
              <Chip size="small" label={`In cart: ${inCartQty}`} sx={inCartChipStyle} />
            )}
          </Stack>

          <Box>
            <Typography variant="body2" color="#64748B">
              Stock
            </Typography>
            <Typography fontWeight={900}>{availableStock}</Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="#64748B">
              Price
            </Typography>
            <Typography fontWeight={900}>{money(displayPrice, currency)}</Typography>
          </Box>

          <Button
            variant="contained"
            size="small"
            disabled={isOutOfStock}
            sx={greenButton}
            onClick={(event) => {
              event.stopPropagation();
              addToCart(product);
            }}
          >
            Add
          </Button>
        </Card>
      );
    }

    return (
      <Card key={product.itemId} onClick={() => addToCart(product)} sx={productCardStyle}>
        <CardContent>
          <Stack alignItems="center" spacing={1}>
            <Box sx={productInitialStyle}>{getInitials(product.itemName)}</Box>
            <Box textAlign="center">
              <Typography fontWeight={900}>{product.itemName}</Typography>
              <Typography variant="body2" color="#64748B">
                Model: {product.itemModel || "N/A"}
              </Typography>
            </Box>
            <Stack direction="row" gap={1} justifyContent="center" flexWrap="wrap">
              <Chip
                size="small"
                label={isOutOfStock ? "Out of Stock" : "In Stock"}
                sx={isOutOfStock ? outOfStockChipStyle : stockChipStyle}
              />
              {inCartQty > 0 && (
                <Chip size="small" label={`In cart: ${inCartQty}`} sx={inCartChipStyle} />
              )}
            </Stack>
            <Stack direction="row" justifyContent="space-between" width="100%">
              <Typography variant="body2" color="#64748B">
                Qty
              </Typography>
              <Typography fontWeight={900}>{availableStock}</Typography>
            </Stack>
            <Typography fontWeight={900} fontSize={16}>
              {money(displayPrice, currency)}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  if (isStockLoading || isCustomersLoading) {
    return (
      <Box sx={loadingShellStyle}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress sx={{ color: "#2F8F57" }} />
          <Typography color="#64748B">Loading POS data...</Typography>
        </Stack>
      </Box>
    );
  }

  if (isStockError || isCustomersError) {
    const message =
      stockError?.data?.message ||
      customersError?.data?.message ||
      "Could not load POS data. Please refresh and try again.";

    return (
      <Box sx={loadingShellStyle}>
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box className="pos-page-container" sx={pageOuterStyle}>
      <Box sx={pageInnerStyle}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          gap={2}
          mb={3}
        >
          <Box>
            <Typography variant="h4" fontWeight={800} color="#14231B">
              Point of Sale
            </Typography>
            <Typography color="#64748B">
              Monitor stock, sales, and production from one live workspace.
            </Typography>
          </Box>

          <Stack direction="row" gap={1} flexWrap="wrap">
            <Chip label={`${branchStockItems.length} products ready`} sx={chipStyle} />
            <Chip label={`${cart.length} cart lines`} sx={chipStyle} />
            <Chip label={`${heldSales.length} held sales`} sx={chipStyle} />
            <Chip
              label={`${lowStockCount} low stock`}
              sx={{ ...chipStyle, bgcolor: "#FFF4E5", color: "#C77700" }}
            />
          </Stack>
        </Stack>

        <Box sx={mainGridStyle}>
          <Card sx={cardStyle}>
            <Box sx={toolbarStyle}>
              <FormControl fullWidth>
                <Select
                  displayEmpty
                  value={selectedBranchId}
                  onChange={(event) => handleBranchChange(event.target.value)}
                  disabled={!canSwitchBranches}
                >
                  <MenuItem value="">Select selling branch</MenuItem>
                  {branches.map((branch) => (
                    <MenuItem key={branch.branchId} value={String(branch.branchId)}>
                      {branch.branchName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                placeholder="Search products..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControl fullWidth>
                <Select
                  displayEmpty
                  value={custId}
                  onChange={(event) => setCustId(event.target.value)}
                >
                  <MenuItem value="">Select a customer</MenuItem>
                  {branchCustomers.map((customer) => (
                    <MenuItem key={customer.custId} value={String(customer.custId)}>
                      {customer.custName} {customer.custContact ? `- ${customer.custContact}` : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Stack direction="row" gap={1}>
                <IconButton
                  onClick={() => setProductView("grid")}
                  sx={productView === "grid" ? activeIconStyle : plainIconStyle}
                >
                  <GridView />
                </IconButton>
                <IconButton
                  onClick={() => setProductView("list")}
                  sx={productView === "list" ? activeIconStyle : plainIconStyle}
                >
                  <ViewList />
                </IconButton>
              </Stack>

              <Button
                variant="contained"
                onClick={() => setPriceType(priceType === "retail" ? "wholesale" : "retail")}
                sx={greenButton}
              >
                Default: {priceType === "retail" ? "Retail" : "Wholesale"}
              </Button>
            </Box>

            {autoPriceDetermination && minWholesaleOrder > 0 && (
              <Alert severity={wholesaleThresholdReached ? "success" : "info"} sx={{ mt: 2 }}>
                {wholesaleThresholdReached
                  ? `Wholesale pricing is now active for new items because the order reached ${money(
                      minWholesaleOrder,
                      currency
                    )}.`
                  : `Automatic wholesale pricing will activate for new items once the order reaches ${money(
                      minWholesaleOrder,
                      currency
                    )}.`}
              </Alert>
            )}

            {!selectedBranchId && (
              <Alert severity="warning" sx={{ mt: 2, borderRadius: 3 }}>
                Select a branch before adding products to this sale.
              </Alert>
            )}

            <Box sx={{ p: 2 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                gap={1.5}
                mb={2}
              >
                <Box>
                  <Typography fontWeight={900} fontSize={20}>
                    Products for this sale
                  </Typography>
                  <Typography color="#64748B" fontSize={14}>
                    {selectedBranch
                      ? `Live inventory for ${selectedBranch.branchName}.`
                      : "Choose a branch to load sale products."}
                  </Typography>
                </Box>
                <Chip label={`${filteredProducts.length} products showing`} sx={chipStyle} />
              </Stack>

              <Box sx={productView === "grid" ? productGridStyle : productListStyle}>
                {filteredProducts.map(renderProduct)}
              </Box>

              {filteredProducts.length === 0 && (
                <Alert severity="info" sx={{ mt: 2, borderRadius: 3 }}>
                  No products match your search.
                </Alert>
              )}

              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                gap={1}
                mt={3}
              >
                <Typography color="#64748B">
                  Showing 1 to {filteredProducts.length} of {branchStockItems.length} products
                </Typography>
                <Stack direction="row" gap={1}>
                  {[1, 2, 3, 4, 5].map((page) => (
                    <Button key={page} sx={page === 1 ? pagerActive : pagerButton}>
                      {page}
                    </Button>
                  ))}
                </Stack>
              </Stack>
            </Box>
          </Card>

          <Card sx={cartCardStyle}>
            <Box sx={{ p: 2.5, borderBottom: "1px solid #E7EFE9" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                <Typography variant="h6" fontWeight={900}>
                  Current Sale
                </Typography>
                <Stack direction="row" gap={1}>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<PauseCircleOutline />}
                    onClick={() => setShowHeldSales(true)}
                    sx={{ borderRadius: 2 }}
                  >
                    Held ({heldSales.length})
                  </Button>
                  <Button variant="outlined" color="error" onClick={clearCart} sx={{ borderRadius: 2 }}>
                    Clear
                  </Button>
                </Stack>
              </Stack>
            </Box>

            <Box sx={cartItemsStyle}>
              {cart.length === 0 ? (
                <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 250 }} color="#94A3B8">
                  <ShoppingCartOutlined sx={{ fontSize: 46, mb: 1 }} />
                  <Typography>Cart is empty.</Typography>
                </Stack>
              ) : (
                <Stack gap={2}>
                  {cart.map((item) => (
                    <Box key={item.saleItemId} sx={cartItemStyle}>
                      <Box sx={cartInitialStyle}>{getInitials(item.itemName)}</Box>

                      <Box>
                        <Typography fontWeight={900}>{item.itemName}</Typography>
                        <Typography variant="body2" color="#64748B">
                          {item.itemModel || "No model"}
                        </Typography>
                        <Stack direction="row" gap={0.8} mt={0.8} flexWrap="wrap">
                          <Button
                            size="small"
                            onClick={() => updateCartItemPriceMode(item.saleItemId, "retail")}
                            sx={item.priceMode === "retail" ? linePriceToggleActive : linePriceToggle}
                          >
                            Retail
                          </Button>
                          <Button
                            size="small"
                            onClick={() => updateCartItemPriceMode(item.saleItemId, "wholesale")}
                            sx={item.priceMode === "wholesale" ? linePriceToggleActive : linePriceToggle}
                          >
                            Wholesale
                          </Button>
                        </Stack>
                        <Stack direction="row" gap={1.2} mt={0.8} flexWrap="wrap">
                          <Typography variant="caption" color="#64748B">
                            Retail: {money(item.retailPrice, currency)}
                          </Typography>
                          <Typography variant="caption" color="#64748B">
                            Wholesale: {money(item.wholesalePrice, currency)}
                          </Typography>
                        </Stack>
                        <Typography color="#237B49" fontWeight={900}>
                          {money(item.salePrice, currency)}
                        </Typography>
                      </Box>

                      <Stack direction="row" alignItems="center" gap={1} justifyContent="flex-end">
                        <IconButton
                          size="small"
                          onClick={() => updateQty(item.saleItemId, -1)}
                          sx={qtyButton}
                        >
                          <Remove fontSize="small" />
                        </IconButton>
                        <Typography fontWeight={900}>{item.saleQuantity}</Typography>
                        <IconButton
                          size="small"
                          onClick={() => updateQty(item.saleItemId, 1)}
                          sx={qtyButton}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                        <Typography fontWeight={900} minWidth={88} textAlign="right">
                          {money(getLineTotal(item), currency)}
                        </Typography>
                        <IconButton color="error" onClick={() => removeItem(item.saleItemId)}>
                          <DeleteOutline />
                        </IconButton>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>

            <Box sx={{ p: 2.5, bgcolor: "#FBFEFC", borderTop: "1px solid #E7EFE9" }}>
              {selectedCustomer ? (
                <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>
                  Selling to {selectedCustomer.custName}
                </Alert>
              ) : (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 3 }}>
                  Select a customer before charging payment.
                </Alert>
              )}

              <Stack direction="row" gap={1} flexWrap="wrap" mb={2}>
                <Chip
                  label={
                    discountAmount > 0
                      ? `${discountSummaryLabel}: ${money(discountAmount, currency)}`
                      : "No discount"
                  }
                  sx={discountAmount > 0 ? adjustmentChipActive : adjustmentChip}
                />
                <Chip
                  label={
                    taxAmount > 0 ? `${taxSummaryLabel}: ${money(taxAmount, currency)}` : "No tax"
                  }
                  sx={taxAmount > 0 ? adjustmentChipActive : adjustmentChip}
                />
              </Stack>

              <Stack gap={1.1}>
                <TotalRow label="Subtotal" value={money(subtotal, currency)} />
                <TotalRow label={discountSummaryLabel} value={`-${money(discountAmount, currency)}`} danger />
                <TotalRow label={taxSummaryLabel} value={money(taxAmount, currency)} />
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography fontSize={20} fontWeight={900}>
                  Total
                </Typography>
                <Typography fontSize={22} fontWeight={900}>
                  {money(total, currency)}
                </Typography>
              </Stack>

              <Button
                fullWidth
                variant="contained"
                sx={{ ...greenButton, height: 54, fontSize: 16, mb: 1.2 }}
                onClick={() => openCheckout()}
                disabled={!canCheckout}
              >
                Charge Payment
              </Button>
              <Button
                fullWidth
                variant="contained"
                sx={holdButtonStyle}
                onClick={holdCurrentSale}
                disabled={cart.length === 0}
              >
                Hold Sale
              </Button>

              <Stack direction="row" justifyContent="center" gap={0.8} color="#64748B" mt={2}>
                <LockOutlined fontSize="small" />
                <Typography variant="body2">All transactions are secure and encrypted</Typography>
              </Stack>
            </Box>
          </Card>
        </Box>

        <Card sx={{ ...cardStyle, mt: 2, mb: { xs: 10, xl: 0 } }}>
          <Box sx={quickPayStyle}>
            {[5000, 10000, 20000, 50000, 100000].map((amount) => (
              <Button
                key={amount}
                sx={quickAmount}
                onClick={() => openCheckout(amount)}
                disabled={!canCheckout}
              >
                {money(amount, currency)}
              </Button>
            ))}
            <Button
              sx={{ ...quickAmount, color: "#14231B" }}
              onClick={() => openCheckout(total)}
              disabled={!canCheckout}
            >
              Exact Amount
            </Button>
          </Box>
        </Card>
      </Box>

      {cart.length > 0 && (
        <>
          <Box sx={floatingCartFabStyle} onClick={() => setCartDrawerOpen(true)}>
            <Box sx={floatingCartBubble}>{cartItemCount}</Box>
            <ShoppingCartOutlined />
            <Box>
              <Typography fontWeight={900} fontSize={13}>
                Cart
              </Typography>
              <Typography variant="caption">{money(total, currency)}</Typography>
            </Box>
            <ChevronRight fontSize="small" />
          </Box>

          <Box
            sx={{
              ...drawerOverlayStyle,
              opacity: cartDrawerOpen ? 1 : 0,
              pointerEvents: cartDrawerOpen ? "auto" : "none",
            }}
            onClick={() => setCartDrawerOpen(false)}
          />

          <Box
            sx={{
              ...cartDrawerStyle,
              transform: cartDrawerOpen ? "translateX(0)" : "translateX(105%)",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography fontWeight={900} fontSize={22}>
                Quick Cart
              </Typography>
              <IconButton onClick={() => setCartDrawerOpen(false)}>
                <Close />
              </IconButton>
            </Stack>

            <Stack gap={1.2} sx={{ flex: 1, overflowY: "auto", pr: 1, ...scrollbarStyle }}>
              {cart.map((item) => (
                <Box key={item.saleItemId} sx={miniCartItemStyle}>
                  <Box sx={cartInitialStyle}>{getInitials(item.itemName)}</Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={800}>{item.itemName}</Typography>
                    <Typography variant="body2" color="#64748B">
                      {item.saleQuantity} x {money(item.salePrice, currency)}
                    </Typography>
                  </Box>
                  <Typography fontWeight={900}>{money(getLineTotal(item), currency)}</Typography>
                </Box>
              ))}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack direction="row" justifyContent="space-between" mb={2}>
              <Typography fontWeight={900}>Total</Typography>
              <Typography fontWeight={900}>{money(total, currency)}</Typography>
            </Stack>

            <Button
              fullWidth
              variant="contained"
              sx={{ ...greenButton, mb: 1.2 }}
              onClick={() => {
                setCartDrawerOpen(false);
                openCheckout();
              }}
              disabled={!canCheckout}
            >
              Checkout
            </Button>

            <Button fullWidth variant="outlined" onClick={() => setCartDrawerOpen(false)} sx={{ borderRadius: 2.5 }}>
              Continue Shopping
            </Button>
          </Box>
        </>
      )}

      <Snackbar
        open={showAddedNotice}
        autoHideDuration={1800}
        onClose={() => setShowAddedNotice(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setShowAddedNotice(false)}
          sx={{ borderRadius: 3, fontWeight: 800 }}
        >
          {lastAdded?.itemName} added to cart - {money(lastAdded?.salePrice, currency)}
        </Alert>
      </Snackbar>

      <Snackbar
        open={feedback.open}
        autoHideDuration={3000}
        onClose={() => setFeedback((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={feedback.severity}
          variant="filled"
          onClose={() => setFeedback((current) => ({ ...current, open: false }))}
          sx={{ borderRadius: 3, fontWeight: 700 }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={showCheckout}
        onClose={() => !isSubmittingSale && setShowCheckout(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Checkout</DialogTitle>
        <DialogContent dividers>
          <Stack gap={2.2}>
            <Box sx={checkoutTotalStyle}>
              <Typography color="#64748B" fontWeight={800}>
                TOTAL TO PAY
              </Typography>
              <Typography fontSize={34} fontWeight={950} color="#237B49">
                {money(total, currency)}
              </Typography>
              {selectedCustomer && (
                <Typography color="#64748B" mt={1}>
                  Customer: {selectedCustomer.custName}
                </Typography>
              )}
            </Box>

            <FormControl fullWidth>
              <Typography fontWeight={800} mb={0.8}>
                Payment Method
              </Typography>
              <Select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Mobile Money">Mobile Money</MenuItem>
                <MenuItem value="Bank">Bank</MenuItem>
                <MenuItem value="Credit">Credit</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography fontWeight={800} mb={0.8}>
                Amount Paid
              </Typography>
              <TextField
                fullWidth
                type="number"
                value={amountPaid}
                onChange={(event) => setAmountPaid(event.target.value)}
                placeholder="Enter amount paid"
              />
            </Box>

            <Box sx={checkoutAdjustmentGridStyle}>
              <Box sx={checkoutAdjustmentCardStyle}>
                <Typography fontWeight={800} mb={1}>
                  Discount
                </Typography>
                <Stack direction="row" gap={1} mb={1.2}>
                  <Button
                    onClick={() => setDiscountType("amount")}
                    sx={discountType === "amount" ? modeButtonActiveStyle : modeButtonStyle}
                  >
                    Amount
                  </Button>
                  <Button
                    onClick={() => setDiscountType("percent")}
                    sx={discountType === "percent" ? modeButtonActiveStyle : modeButtonStyle}
                  >
                    Percent
                  </Button>
                </Stack>
                <TextField
                  fullWidth
                  type="number"
                  value={discountValue}
                  onChange={(event) => setDiscountValue(event.target.value)}
                  placeholder={discountType === "percent" ? "Enter discount %" : "Enter discount amount"}
                  inputProps={discountType === "percent" ? { min: 0, max: 100 } : { min: 0 }}
                />
              </Box>

              <Box sx={checkoutAdjustmentCardStyle}>
                <Typography fontWeight={800} mb={1}>
                  Tax
                </Typography>
                <Stack direction="row" gap={1} mb={1.2} flexWrap="wrap">
                  <Button
                    onClick={() => setTaxType("none")}
                    sx={taxType === "none" ? modeButtonActiveStyle : modeButtonStyle}
                  >
                    None
                  </Button>
                  <Button
                    onClick={() => setTaxType("percent")}
                    sx={taxType === "percent" ? modeButtonActiveStyle : modeButtonStyle}
                  >
                    Percent
                  </Button>
                  <Button
                    onClick={() => setTaxType("amount")}
                    sx={taxType === "amount" ? modeButtonActiveStyle : modeButtonStyle}
                  >
                    Amount
                  </Button>
                </Stack>
                <TextField
                  fullWidth
                  type="number"
                  value={taxType === "none" ? "" : taxValue}
                  onChange={(event) => setTaxValue(event.target.value)}
                  placeholder={
                    taxType === "amount"
                      ? "Enter tax amount"
                      : taxType === "percent"
                        ? "Enter tax %"
                        : "Tax disabled"
                  }
                  disabled={taxType === "none"}
                  inputProps={taxType === "percent" ? { min: 0, max: 100 } : { min: 0 }}
                />
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
              {[5000, 10000, 20000, 50000, 100000, total].map((amount, index) => (
                <Button
                  key={`${amount}-${index}`}
                  sx={quickAmount}
                  onClick={() => setAmountPaid(String(amount))}
                >
                  {index === 5 ? "Exact" : money(amount, currency)}
                </Button>
              ))}
            </Box>

            {requiresDueDate && (
              <>
                <Alert severity={debtSalesAllowed ? "warning" : "error"} sx={{ borderRadius: 3 }}>
                  {debtSalesAllowed
                    ? "This payment leaves a balance. Completing the sale will require confirmation and record the balance as customer debt."
                    : "Debt sales are disabled for this branch. Collect full payment to complete this sale."}
                </Alert>
                <TextField
                  fullWidth
                  type="date"
                  label="Balance due date"
                  value={creditEndDate}
                  onChange={(event) => setCreditEndDate(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText="Required for any sale that leaves an outstanding balance."
                  disabled={!debtSalesAllowed}
                />
              </>
            )}

            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Payment note / reference"
              value={paymentNote}
              onChange={(event) => setPaymentNote(event.target.value)}
            />

            <Box sx={checkoutSummaryStyle}>
              <TotalRow label="Subtotal" value={money(subtotal, currency)} />
              <TotalRow label={discountSummaryLabel} value={`-${money(discountAmount, currency)}`} danger />
              <TotalRow label={taxSummaryLabel} value={money(taxAmount, currency)} />
              <Divider />
              <TotalRow
                label={changeDue >= 0 ? "Change" : "Balance Due"}
                value={money(Math.abs(changeDue), currency)}
                danger={changeDue < 0}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setShowCheckout(false)}
            sx={{ borderRadius: 2, fontWeight: 800 }}
            disabled={isSubmittingSale}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={greenButton}
            onClick={completeCheckout}
            disabled={!canCompleteCheckout}
          >
            {isSubmittingSale ? "Completing..." : "Complete Sale"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={debtAlertOpen}
        onClose={() => !isSubmittingSale && setDebtAlertOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Record Balance As Debt?</DialogTitle>
        <DialogContent dividers>
          <Stack gap={2}>
            <Alert severity="warning" sx={{ borderRadius: 3 }}>
              The customer has paid less than the sale total. Confirming will complete the sale
              and record the remaining balance as customer debt.
            </Alert>

            <Box sx={checkoutSummaryStyle}>
              <TotalRow label="Sale total" value={money(total, currency)} />
              <TotalRow label="Amount paid" value={money(tenderedAmount, currency)} />
              <Divider />
              <TotalRow label="Debt balance" value={money(dueAmount, currency)} danger />
              <TotalRow
                label="Due date"
                value={creditEndDate ? new Date(creditEndDate).toLocaleDateString() : "Required"}
                danger={!creditEndDate}
              />
            </Box>

            {selectedCustomer ? (
              <Typography color="#64748B">
                Debt will be linked to {selectedCustomer.custName}.
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDebtAlertOpen(false)}
            sx={{ borderRadius: 2, fontWeight: 800 }}
            disabled={isSubmittingSale}
          >
            Review Payment
          </Button>
          <Button
            variant="contained"
            sx={greenButton}
            onClick={() => completeCheckout({ confirmDebt: true })}
            disabled={isSubmittingSale || !creditEndDate}
          >
            {isSubmittingSale ? "Completing..." : "Confirm Debt & Complete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showHeldSales}
        onClose={() => setShowHeldSales(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Held Sales</DialogTitle>
        <DialogContent dividers>
          {heldSales.length === 0 ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 5 }} color="#94A3B8">
              <PauseCircleOutline sx={{ fontSize: 44, mb: 1 }} />
              <Typography>No held sales yet.</Typography>
            </Stack>
          ) : (
            <Stack gap={1.5}>
              {heldSales.map((sale) => (
                <Box key={sale.id} sx={heldSaleItemStyle}>
                  <Box>
                    <Typography fontWeight={900}>
                      {sale.customerName || "Selected customer"}
                    </Typography>
                    <Typography variant="body2" color="#64748B">
                      {sale.items.length} items - {sale.time}
                    </Typography>
                  </Box>
                  <Typography fontWeight={900}>{money(sale.total, currency)}</Typography>
                  <Stack direction="row" gap={1}>
                    <Button size="small" variant="contained" sx={greenButton} onClick={() => resumeHeldSale(sale.id)}>
                      Resume
                    </Button>
                    <IconButton color="error" onClick={() => deleteHeldSale(sale.id)}>
                      <DeleteOutline />
                    </IconButton>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowHeldSales(false)} sx={{ borderRadius: 2, fontWeight: 800 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <AmplaReceipt
        show={receiptOpen}
        onClose={handleReceiptClose}
        companyInfo={companyProfile}
        customerName={completedSale?.customerName}
        cart={completedSale?.cart || []}
        saleDetails={completedSale?.saleDetails || {}}
      />
    </Box>
  );
}

function TotalRow({ label, value, danger }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography color="#64748B">{label}</Typography>
      <Typography fontWeight={700} color={danger ? "#EF4444" : "#334155"}>
        {value}
      </Typography>
    </Stack>
  );
}

const scrollbarStyle = {
  scrollbarWidth: "thin",
  scrollbarColor: "#c3d4c8 #eef5f0",
  "&::-webkit-scrollbar": {
    width: 8,
    height: 8,
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "#eef5f0",
    borderRadius: 999,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "#c3d4c8",
    borderRadius: 999,
    border: "2px solid #eef5f0",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    backgroundColor: "#9bb8a3",
  },
};

const loadingShellStyle = {
  minHeight: "70vh",
  display: "grid",
  placeItems: "center",
  p: 3,
};

const pageOuterStyle = {
  minHeight: "100vh",
  overflowY: "auto",
  overflowX: "hidden",
  bgcolor: "#F8FCF9",
  p: { xs: 2, md: 3 },
};

const pageInnerStyle = {
  maxWidth: 1500,
  mx: "auto",
  width: "100%",
  minHeight: "100%",
  pr: { xs: 0, md: 1 },
  pb: { xs: 12, md: 8 },
  ...scrollbarStyle,
};

const mainGridStyle = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", lg: "1fr", xl: "1fr 420px" },
  gap: 2.5,
};

const toolbarStyle = {
  p: 2,
  borderBottom: "1px solid #E7EFE9",
  display: "grid",
  gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr auto auto" },
  gap: 1.5,
};

const productGridStyle = {
  display: "grid",
  gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(3, 1fr)", xl: "repeat(4, 1fr)" },
  gap: 1.2,
};

const productListStyle = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 1,
};

const productListCardStyle = {
  p: 1.2,
  display: "grid",
  gridTemplateColumns: { xs: "48px 1fr", md: "52px minmax(180px, 1fr) 90px 80px 130px 80px" },
  gap: 1.5,
  alignItems: "center",
  borderRadius: 2.5,
  border: "1px solid #E7EFE9",
  boxShadow: "0 6px 18px rgba(15,23,42,.035)",
  cursor: "pointer",
  transition: ".2s ease",
  "&:hover": { transform: "translateY(-2px)", borderColor: "rgba(47,143,87,.35)", bgcolor: "#FBFEFC" },
};

const checkoutTotalStyle = {
  p: 2,
  borderRadius: 3,
  bgcolor: "#E8F5EC",
  border: "1px solid #D7EBDD",
  textAlign: "center",
};

const checkoutSummaryStyle = {
  display: "grid",
  gap: 1.1,
  p: 2,
  borderRadius: 3,
  bgcolor: "#FBFEFC",
  border: "1px solid #E7EFE9",
};

const checkoutAdjustmentGridStyle = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
  gap: 1.5,
};

const checkoutAdjustmentCardStyle = {
  p: 2,
  borderRadius: 3,
  bgcolor: "#FBFEFC",
  border: "1px solid #E7EFE9",
};

const floatingCartFabStyle = {
  display: { xs: "flex", xl: "none" },
  position: "fixed",
  right: 18,
  bottom: 18,
  zIndex: 1300,
  bgcolor: "#14231B",
  color: "#fff",
  borderRadius: "18px",
  px: 2,
  py: 1.4,
  gap: 1.2,
  alignItems: "center",
  boxShadow: "0 18px 50px rgba(0,0,0,.28)",
  cursor: "pointer",
};

const floatingCartBubble = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  bgcolor: "#2F8F57",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
  fontSize: 12,
};

const drawerOverlayStyle = {
  display: { xs: "block", xl: "none" },
  position: "fixed",
  inset: 0,
  bgcolor: "rgba(15,23,42,.35)",
  zIndex: 1390,
  transition: ".25s",
};

const cartDrawerStyle = {
  display: { xs: "flex", xl: "none" },
  flexDirection: "column",
  position: "fixed",
  top: 0,
  right: 0,
  width: "92%",
  maxWidth: 420,
  height: "100vh",
  bgcolor: "#fff",
  zIndex: 1400,
  p: 2.5,
  transition: ".3s ease",
  boxShadow: "-20px 0 50px rgba(15,23,42,.18)",
};

const miniCartItemStyle = {
  display: "grid",
  gridTemplateColumns: "52px 1fr auto",
  gap: 1,
  alignItems: "center",
  p: 1,
  border: "1px solid #E7EFE9",
  borderRadius: 3,
};

const heldSaleItemStyle = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "1fr auto auto" },
  gap: 1.5,
  alignItems: "center",
  p: 1.5,
  borderRadius: 3,
  border: "1px solid #E7EFE9",
  bgcolor: "#FBFEFC",
};

const cartCardStyle = {
  borderRadius: 4,
  border: "1px solid #E7EFE9",
  boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)",
  overflow: "hidden",
  alignSelf: "start",
  position: { xl: "sticky" },
  top: 20,
  maxHeight: { xl: "calc(100vh - 120px)" },
  display: "flex",
  flexDirection: "column",
};

const cartItemsStyle = {
  p: 2.5,
  minHeight: 250,
  maxHeight: "50vh",
  overflowY: "auto",
  flex: 1,
  ...scrollbarStyle,
};

const cartItemStyle = {
  display: "grid",
  gridTemplateColumns: { xs: "54px 1fr", sm: "54px 1fr auto" },
  gap: 1.5,
  alignItems: "center",
};

const quickPayStyle = {
  p: 2,
  display: "grid",
  gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(6, 1fr)" },
  gap: 1.5,
};

const cardStyle = {
  borderRadius: 4,
  border: "1px solid #E7EFE9",
  boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)",
  overflow: "hidden",
};

const greenButton = {
  borderRadius: 2.5,
  bgcolor: "#2F8F57",
  fontWeight: 800,
  textTransform: "none",
  boxShadow: "0 10px 25px rgba(47,143,87,.22)",
  "&:hover": { bgcolor: "#267347" },
};

const chipStyle = {
  bgcolor: "#E8F5EC",
  color: "#237B49",
  fontWeight: 800,
  px: 1,
};

const activeIconStyle = {
  bgcolor: "#2F8F57",
  color: "white",
  borderRadius: 2,
  "&:hover": { bgcolor: "#267347" },
};

const plainIconStyle = {
  bgcolor: "#F4FAF5",
  color: "#64748B",
  borderRadius: 2,
};

const productCardStyle = {
  borderRadius: 2.5,
  border: "1px solid #E7EFE9",
  boxShadow: "0 6px 18px rgba(15,23,42,.04)",
  cursor: "pointer",
  minHeight: 190,
  transition: ".2s ease",
  "& .MuiCardContent-root": { padding: "14px !important" },
  "&:hover": { transform: "translateY(-4px)", borderColor: "rgba(47,143,87,.35)" },
};

const productInitialStyle = {
  width: 52,
  height: 52,
  borderRadius: 2,
  bgcolor: "#E8F5EC",
  border: "1px solid #D7EBDD",
  color: "#237B49",
  display: "grid",
  placeItems: "center",
  fontSize: 16,
  fontWeight: 900,
};

const cartInitialStyle = {
  width: 52,
  height: 52,
  borderRadius: 2.5,
  bgcolor: "#E8F5EC",
  border: "1px solid #D7EBDD",
  color: "#237B49",
  display: "grid",
  placeItems: "center",
  fontSize: 16,
  fontWeight: 900,
};

const qtyButton = {
  width: 30,
  height: 30,
  border: "1px solid #E7EFE9",
  borderRadius: 2,
};

const adjustmentChip = {
  bgcolor: "#F4FAF5",
  color: "#486353",
  border: "1px solid #E7EFE9",
  fontWeight: 800,
};

const adjustmentChipActive = {
  ...adjustmentChip,
  bgcolor: "#E8F5EC",
  color: "#237B49",
  borderColor: "#D7EBDD",
};

const holdButtonStyle = {
  height: 54,
  borderRadius: 2.5,
  bgcolor: "#9AA3AF",
  fontWeight: 800,
  "&:hover": { bgcolor: "#7E8794" },
};

const quickAmount = {
  height: 54,
  borderRadius: 2.5,
  bgcolor: "#FFFFFF",
  border: "1px solid #E7EFE9",
  color: "#237B49",
  fontWeight: 900,
  textTransform: "none",
  "&:hover": { bgcolor: "#E8F5EC" },
};

const modeButtonStyle = {
  flex: 1,
  minWidth: 0,
  borderRadius: 2.5,
  border: "1px solid #E7EFE9",
  bgcolor: "#FFFFFF",
  color: "#486353",
  fontWeight: 800,
  textTransform: "none",
  "&:hover": { bgcolor: "#F4FAF5" },
};

const modeButtonActiveStyle = {
  ...modeButtonStyle,
  bgcolor: "#E8F5EC",
  color: "#237B49",
  borderColor: "#D7EBDD",
};

const linePriceToggle = {
  minWidth: 0,
  px: 1.25,
  py: 0.45,
  borderRadius: 999,
  border: "1px solid #DCE8DF",
  bgcolor: "#FFFFFF",
  color: "#64748B",
  fontWeight: 800,
  fontSize: 11,
  lineHeight: 1,
  textTransform: "none",
  "&:hover": { bgcolor: "#F4FAF5" },
};

const linePriceToggleActive = {
  ...linePriceToggle,
  bgcolor: "#E8F5EC",
  color: "#237B49",
  borderColor: "#CFE5D6",
};

const pagerButton = {
  minWidth: 36,
  borderRadius: 2,
  color: "#64748B",
  fontWeight: 800,
};

const pagerActive = {
  ...pagerButton,
  bgcolor: "#2F8F57",
  color: "white",
  "&:hover": { bgcolor: "#267347" },
};

const stockChipStyle = {
  bgcolor: "#DFF3E6",
  color: "#237B49",
  fontWeight: 800,
};

const outOfStockChipStyle = {
  bgcolor: "#FFE5E5",
  color: "#D94A4A",
  fontWeight: 800,
};

const inCartChipStyle = {
  bgcolor: "#2F8F57",
  color: "#FFFFFF",
  fontWeight: 900,
};
