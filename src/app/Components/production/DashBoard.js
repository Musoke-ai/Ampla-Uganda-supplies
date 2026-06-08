import React, { useEffect, useMemo, useRef } from "react";
import Chart from "chart.js/auto";
import { format, parseISO, isValid, subDays } from "date-fns";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  ArrowRight,
  BoxSeam,
  CashStack,
  ChatDots,
  ClipboardCheck,
  ExclamationTriangle,
  Eye,
  FolderPlus,
  PencilSquare,
  PersonWorkspace,
} from "react-bootstrap-icons";

import { selectOrders } from "../../features/api/orderSlice";
import { selectCustomers } from "../../features/api/customers";
import { selectStock } from "../../features/stock/stockSlice";
import { selectSales } from "../../features/api/salesSlice";
import { useSettings } from "../Settings";

const EMPTY_ARRAY = [];

const palette = {
  bg: "#f8fbf8",
  surface: "#ffffff",
  border: "#edf2ee",
  text: "#15202b",
  muted: "#6f7d8c",
  green: "#2f8f57",
  greenSoft: "#e8f5ec",
  greenWash: "#f1faf4",
  orange: "#f59e0b",
  orangeSoft: "#fff3df",
  purple: "#7c3aed",
  purpleSoft: "#f1e9ff",
  red: "#ef4444",
  redSoft: "#ffebeb",
  shadow: "0 12px 32px rgba(15, 23, 42, 0.05)",
};

const cardStyle = {
  borderRadius: 4,
  border: `1px solid ${palette.border}`,
  boxShadow: palette.shadow,
  backgroundColor: palette.surface,
};

const formatMoney = (value) => `UGX ${Number(value || 0).toLocaleString()}`;

const parseDate = (value) => {
  if (!value) return null;
  const parsed = parseISO(value);
  if (isValid(parsed)) return parsed;
  const fallback = new Date(value);
  return isValid(fallback) ? fallback : null;
};

const formatDateTime = (value) => {
  const date = parseDate(value);
  return date ? format(date, "MMM d, yyyy • h:mm a") : "Unknown time";
};

const formatDateOnly = (value) => {
  const date = parseDate(value);
  return date ? format(date, "MMM d, yyyy") : "Unknown date";
};

const SummaryCard = ({ title, value, note, icon, accent, textAccent, to }) => (
  <Paper
    component={NavLink}
    to={to}
    sx={{
      ...cardStyle,
      p: 2.25,
      height: "100%",
      display: "block",
      textDecoration: "none",
      transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 18px 36px rgba(15, 23, 42, 0.08)",
        borderColor: alpha(textAccent, 0.28),
      },
      "&:focus-visible": {
        outline: `3px solid ${alpha(textAccent, 0.18)}`,
        outlineOffset: 2,
      },
    }}
  >
    <Stack direction="row" spacing={1.75} alignItems="flex-start">
      <Avatar
        sx={{
          width: 40,
          height: 40,
          bgcolor: accent,
          color: textAccent,
        }}
      >
        {icon}
      </Avatar>
      <Box>
        <Typography variant="body2" sx={{ color: palette.muted }}>
          {title}
        </Typography>
        <Typography
          variant="h6"
          sx={{ mt: 0.5, fontWeight: 800, color: palette.text, letterSpacing: "-0.02em" }}
        >
          {value}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: textAccent }}>
          {note}
        </Typography>
      </Box>
    </Stack>
  </Paper>
);

const Panel = ({ title, action, children, sx = {} }) => (
  <Paper sx={{ ...cardStyle, p: 2.25, ...sx }}>
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ mb: 2 }}
      spacing={1}
    >
      <Typography variant="h6" sx={{ fontWeight: 800, color: palette.text, fontSize: "1.05rem" }}>
        {title}
      </Typography>
      {action}
    </Stack>
    {children}
  </Paper>
);

const Dashboard = () => {
  const { settings } = useSettings();
  const stockItems = useSelector(selectStock) ?? EMPTY_ARRAY;
  const customers = useSelector(selectCustomers) ?? EMPTY_ARRAY;
  const sales = useSelector(selectSales) ?? EMPTY_ARRAY;
  const orders = useSelector(selectOrders) ?? EMPTY_ARRAY;

  const salesChartRef = useRef(null);
  const stockChartRef = useRef(null);

  const lowStockThreshold = Number(settings?.lowLevelProducts) || 15;

  const customerMap = useMemo(
    () => new Map(customers.map((customer) => [customer.custId, customer.custName])),
    [customers]
  );
  const productMap = useMemo(
    () => new Map(stockItems.map((item) => [item.itemId, item.itemName])),
    [stockItems]
  );

  const inventoryValue = useMemo(
    () =>
      stockItems.reduce(
        (sum, item) => sum + (Number(item.itemQuantity) || 0) * (Number(item.itemLeastPrice) || 0),
        0
      ),
    [stockItems]
  );

  const todaySales = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return sales
      .filter((sale) => sale.saleDateCreated?.startsWith(today))
      .reduce(
        (sum, sale) => sum + (Number(sale.saleQuantity) || 0) * (Number(sale.salePrice) || 0),
        0
      );
  }, [sales]);

  const ordersInProduction = useMemo(
    () =>
      orders.filter(
        (order) => (Number(order.quantityProduced) || 0) < (Number(order.quantity) || 0)
      ).length,
    [orders]
  );

  const lowStockItems = useMemo(
    () =>
      stockItems
        .filter((item) => {
          const qty = Number(item.itemQuantity) || 0;
          return qty > 0 && qty <= lowStockThreshold;
        })
        .sort((a, b) => (Number(a.itemQuantity) || 0) - (Number(b.itemQuantity) || 0)),
    [lowStockThreshold, stockItems]
  );

  const salesSeries = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => subDays(new Date(), 6 - index));
    return days.map((day) => {
      const key = format(day, "yyyy-MM-dd");
      const value = sales
        .filter((sale) => sale.saleDateCreated?.startsWith(key))
        .reduce(
          (sum, sale) => sum + (Number(sale.saleQuantity) || 0) * (Number(sale.salePrice) || 0),
          0
        );

      return { label: format(day, "MMM d"), value };
    });
  }, [sales]);

  const topProducts = useMemo(() => {
    const grouped = new Map();
    sales.forEach((sale) => {
      const key = sale.saleItemId;
      const current = grouped.get(key) || { revenue: 0, units: 0 };
      current.revenue += (Number(sale.saleQuantity) || 0) * (Number(sale.salePrice) || 0);
      current.units += Number(sale.saleQuantity) || 0;
      grouped.set(key, current);
    });

    return Array.from(grouped.entries())
      .map(([itemId, values]) => ({
        itemId,
        name: productMap.get(itemId) || `Product ${itemId}`,
        revenue: values.revenue,
        units: values.units,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [productMap, sales]);

  const stockSummary = useMemo(() => {
    const inStock = stockItems.filter((item) => (Number(item.itemQuantity) || 0) > lowStockThreshold)
      .length;
    const lowStock = stockItems.filter((item) => {
      const qty = Number(item.itemQuantity) || 0;
      return qty > 0 && qty <= lowStockThreshold;
    }).length;
    const outOfStock = stockItems.filter((item) => (Number(item.itemQuantity) || 0) <= 0).length;
    const inProduction = orders.filter(
      (order) => (Number(order.quantityProduced) || 0) < (Number(order.quantity) || 0)
    ).length;

    return [
      { label: "In Stock", value: inStock, color: palette.green },
      { label: "Low Stock", value: lowStock, color: palette.orange },
      { label: "Out of Stock", value: outOfStock, color: palette.red },
      { label: "In Production", value: inProduction, color: palette.purple },
    ];
  }, [lowStockThreshold, orders, stockItems]);

  const totalStockSummary = stockSummary.reduce((sum, item) => sum + item.value, 0);

  const recentActivity = useMemo(() => {
    const activity = [];

    sales.slice(0, 4).forEach((sale) => {
      activity.push({
        id: `sale-${sale.saleId}`,
        title: "Sale Recorded",
        detail: `${sale.saleQuantity || 0} unit${Number(sale.saleQuantity) > 1 ? "s" : ""} sold`,
        when: sale.saleDateCreated,
        accent: palette.green,
        initials: "S",
      });
    });

    orders.slice(0, 3).forEach((order) => {
      activity.push({
        id: `order-${order.orderId}`,
        title: "Order Updated",
        detail: `${customerMap.get(order.custId) || "Customer"} order in progress`,
        when: order.orderDateUpdated || order.orderDateCreated,
        accent: palette.purple,
        initials: "P",
      });
    });

    stockItems.slice(0, 3).forEach((item) => {
      activity.push({
        id: `stock-${item.itemId}`,
        title: "Stock Updated",
        detail: `${item.itemName || "Product"} at ${item.itemQuantity || 0} units`,
        when: item.itemDateUpdated || item.itemDateCreated,
        accent: "#3b82f6",
        initials: "SS",
      });
    });

    return activity
      .sort((a, b) => (parseDate(b.when)?.getTime() || 0) - (parseDate(a.when)?.getTime() || 0))
      .slice(0, 4);
  }, [customerMap, orders, sales, stockItems]);

  const recentSales = useMemo(
    () =>
      [...sales]
        .sort(
          (a, b) =>
            (parseDate(b.saleDateCreated)?.getTime() || 0) -
            (parseDate(a.saleDateCreated)?.getTime() || 0)
        )
        .slice(0, 5)
        .map((sale) => ({
          id: sale.saleId,
          customer: customerMap.get(sale.custId) || "Retail Walk-in",
          items: Number(sale.saleQuantity) || 0,
          total: (Number(sale.saleQuantity) || 0) * (Number(sale.salePrice) || 0),
          status: "Paid",
          date: sale.saleDateCreated,
        })),
    [customerMap, sales]
  );

  const upcomingTasks = useMemo(() => {
    const stockTasks = lowStockItems.slice(0, 2).map((item, index) => ({
      id: `task-stock-${item.itemId}`,
      title: `Reorder ${item.itemName}`,
      detail: `Qty left: ${item.itemQuantity}`,
      level: index === 0 ? "High" : "Medium",
    }));

    const orderTask = ordersInProduction
      ? [
          {
            id: "task-production",
            title: "Review active production queue",
            detail: `${ordersInProduction} order${ordersInProduction > 1 ? "s" : ""} still in progress`,
            level: "Low",
          },
        ]
      : [];

    return [...stockTasks, ...orderTask].slice(0, 3);
  }, [lowStockItems, ordersInProduction]);

  useEffect(() => {
    if (!salesChartRef.current) return undefined;

    const chart = new Chart(salesChartRef.current, {
      type: "line",
      data: {
        labels: salesSeries.map((entry) => entry.label),
        datasets: [
          {
            data: salesSeries.map((entry) => entry.value),
            borderColor: palette.green,
            backgroundColor: alpha(palette.green, 0.1),
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3.5,
            pointHoverRadius: 4,
            pointBackgroundColor: palette.green,
            pointBorderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: palette.muted },
          },
          y: {
            grid: { color: alpha("#64748b", 0.12) },
            border: { display: false },
            ticks: {
              color: palette.muted,
              callback: (value) => `${Number(value) / 1000}K`,
            },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [salesSeries]);

  useEffect(() => {
    if (!stockChartRef.current) return undefined;

    const chart = new Chart(stockChartRef.current, {
      type: "doughnut",
      data: {
        labels: stockSummary.map((item) => item.label),
        datasets: [
          {
            data: stockSummary.map((item) => item.value),
            backgroundColor: stockSummary.map((item) => item.color),
            borderWidth: 0,
            cutout: "68%",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
      },
    });

    return () => chart.destroy();
  }, [stockSummary]);

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color: palette.text }}>
          Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: palette.muted, mt: 0.5 }}>
          Real-time overview of your operations.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="Inventory Value"
            value={formatMoney(inventoryValue)}
            to="/home/inventory"
            note="↑ 12% vs last week"
            accent={alpha(palette.green, 0.12)}
            textAccent={palette.green}
            icon={<BoxSeam size={18} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="Today's Sales"
            value={formatMoney(todaySales)}
            to="/home/sales"
            note="↑ 8% vs yesterday"
            accent={alpha(palette.orange, 0.14)}
            textAccent={palette.orange}
            icon={<CashStack size={18} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="Orders in Production"
            value={ordersInProduction}
            to="/home/production"
            note="In progress"
            accent={alpha(palette.purple, 0.14)}
            textAccent={palette.purple}
            icon={<PersonWorkspace size={18} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="Low Stock Items"
            value={lowStockItems.length}
            to="/home/inventory"
            note="Needs attention"
            accent={alpha(palette.orange, 0.14)}
            textAccent={palette.orange}
            icon={<ExclamationTriangle size={18} />}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} xl={6}>
          <Panel
            title="Sales Overview"
            action={
              <TextField select size="small" value="week" sx={{ minWidth: 92 }}>
                <MenuItem value="week">This Week</MenuItem>
              </TextField>
            }
            sx={{ height: "100%" }}
          >
            <Box sx={{ height: 260 }}>
              <canvas ref={salesChartRef} />
            </Box>
          </Panel>
        </Grid>

        <Grid item xs={12} md={6} xl={3}>
          <Panel
            title="Top Selling Products"
            action={
              <TextField select size="small" value="week" sx={{ minWidth: 92 }}>
                <MenuItem value="week">This Week</MenuItem>
              </TextField>
            }
            sx={{ height: "100%" }}
          >
            <Stack spacing={1.5}>
              {topProducts.length ? (
                topProducts.map((item) => (
                  <Stack
                    key={item.itemId}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
                      <Avatar
                        variant="rounded"
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: palette.orangeSoft,
                          color: palette.orange,
                          fontSize: "0.8rem",
                          fontWeight: 700,
                        }}
                      >
                        {item.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography
                        variant="body2"
                        sx={{
                          color: palette.text,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.name}
                      </Typography>
                    </Stack>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="body2" sx={{ color: palette.green, fontWeight: 800 }}>
                        {formatMoney(item.revenue)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: palette.muted }}>
                        {item.units} units
                      </Typography>
                    </Box>
                  </Stack>
                ))
              ) : (
                <Typography variant="body2" sx={{ color: palette.muted }}>
                  No product sales data yet.
                </Typography>
              )}
            </Stack>

            <Button
              component={NavLink}
              to="/home/inventory"
              endIcon={<ArrowRight size={15} />}
              sx={{ mt: 2, color: palette.muted, alignSelf: "flex-start" }}
            >
              View all products
            </Button>
          </Panel>
        </Grid>

        <Grid item xs={12} md={6} xl={3}>
          <Panel title="Quick Actions" sx={{ height: "100%" }}>
            <Stack spacing={1.2}>
              <Button
                component={NavLink}
                to="/home/assistant"
                fullWidth
                startIcon={<ChatDots size={16} />}
                sx={{
                  justifyContent: "flex-start",
                  bgcolor: alpha(palette.green, 0.12),
                  color: palette.green,
                  border: `1px solid ${alpha(palette.green, 0.1)}`,
                  "&:hover": { bgcolor: alpha(palette.green, 0.16) },
                }}
              >
                Ask Ampla Copilot
              </Button>
              <Button
                component={NavLink}
                to="/home/inventory"
                fullWidth
                startIcon={<FolderPlus size={16} />}
                sx={{
                  justifyContent: "flex-start",
                  bgcolor: palette.greenWash,
                  color: palette.green,
                  border: `1px solid ${alpha(palette.green, 0.08)}`,
                  "&:hover": { bgcolor: alpha(palette.green, 0.1) },
                }}
              >
                New Product
              </Button>
              <Button
                component={NavLink}
                to="/home/pos"
                fullWidth
                startIcon={<CashStack size={16} />}
                variant="outlined"
                sx={{ justifyContent: "flex-start", borderColor: palette.border, color: palette.text }}
              >
                New Sale
              </Button>
              <Button
                component={NavLink}
                to="/home/stock"
                fullWidth
                startIcon={<ClipboardCheck size={16} />}
                variant="outlined"
                sx={{ justifyContent: "flex-start", borderColor: palette.border, color: palette.text }}
              >
                Record Stock
              </Button>
              <Button
                component={NavLink}
                to="/home/reports"
                fullWidth
                startIcon={<Eye size={16} />}
                variant="outlined"
                sx={{ justifyContent: "flex-start", borderColor: palette.border, color: palette.text }}
              >
                View Reports
              </Button>
            </Stack>
          </Panel>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={4}>
          <Panel title="Recent Activity" sx={{ height: "100%" }}>
            <List disablePadding>
              {recentActivity.length ? (
                recentActivity.map((item) => (
                  <ListItem key={item.id} disableGutters sx={{ py: 1.1 }}>
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: alpha(item.accent, 0.14),
                          color: item.accent,
                          fontSize: "0.72rem",
                          fontWeight: 700,
                        }}
                      >
                        {item.initials}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={item.title}
                      secondary={item.detail}
                      primaryTypographyProps={{
                        color: palette.text,
                        fontWeight: 700,
                        fontSize: "0.92rem",
                      }}
                      secondaryTypographyProps={{
                        color: palette.muted,
                        fontSize: "0.83rem",
                      }}
                    />
                    <Typography variant="caption" sx={{ color: palette.muted, textAlign: "right" }}>
                      {formatDateTime(item.when)}
                    </Typography>
                  </ListItem>
                ))
              ) : (
                <Typography variant="body2" sx={{ color: palette.muted }}>
                  No activity available yet.
                </Typography>
              )}
            </List>
          </Panel>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Panel title="Stock Summary" sx={{ height: "100%" }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <Box sx={{ height: 220, position: "relative" }}>
                  <canvas ref={stockChartRef} />
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      placeItems: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="body2" sx={{ color: palette.muted }}>
                        Total Items
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: palette.text }}>
                        {totalStockSummary}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={7}>
                <Stack spacing={1.5}>
                  {stockSummary.map((item) => (
                    <Stack
                      key={item.label}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: item.color,
                          }}
                        />
                        <Typography variant="body2" sx={{ color: palette.muted }}>
                          {item.label}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ color: palette.text, fontWeight: 700 }}>
                        {item.value} ({totalStockSummary ? Math.round((item.value / totalStockSummary) * 100) : 0}%)
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Panel>
        </Grid>

        <Grid item xs={12} lg={3}>
          <Stack spacing={2}>
            <Panel
              title="Low Stock Alerts"
              action={
                <Button component={NavLink} to="/home/inventory" sx={{ color: palette.muted }}>
                  View all
                </Button>
              }
            >
              <Stack spacing={1.5}>
                {lowStockItems.slice(0, 3).length ? (
                  lowStockItems.slice(0, 3).map((item) => (
                    <Stack key={item.itemId} direction="row" justifyContent="space-between" spacing={1}>
                      <Box minWidth={0}>
                        <Typography variant="body2" sx={{ color: palette.text, fontWeight: 700 }}>
                          {item.itemName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: palette.muted }}>
                          Qty left: {item.itemQuantity}
                        </Typography>
                      </Box>
                      <Chip
                        label="Low"
                        size="small"
                        sx={{
                          bgcolor: palette.redSoft,
                          color: palette.red,
                          fontWeight: 700,
                        }}
                      />
                    </Stack>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: palette.muted }}>
                    No low stock alerts.
                  </Typography>
                )}
              </Stack>
            </Panel>

            <Panel title="Upcoming Tasks">
              <Stack spacing={1.5}>
                {upcomingTasks.length ? (
                  upcomingTasks.map((task) => (
                    <Stack key={task.id} direction="row" justifyContent="space-between" spacing={1}>
                      <Box minWidth={0}>
                        <Typography variant="body2" sx={{ color: palette.text, fontWeight: 700 }}>
                          {task.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: palette.muted }}>
                          {task.detail}
                        </Typography>
                      </Box>
                      <Chip
                        label={task.level}
                        size="small"
                        sx={{
                          bgcolor:
                            task.level === "High"
                              ? palette.redSoft
                              : task.level === "Medium"
                                ? palette.orangeSoft
                                : palette.greenSoft,
                          color:
                            task.level === "High"
                              ? palette.red
                              : task.level === "Medium"
                                ? palette.orange
                                : palette.green,
                          fontWeight: 700,
                        }}
                      />
                    </Stack>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: palette.muted }}>
                    No pending tasks.
                  </Typography>
                )}
              </Stack>
            </Panel>
          </Stack>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} xl={9}>
          <Panel
            title="Recent Sales"
            action={
              <Button component={NavLink} to="/home/sales" sx={{ color: palette.muted }}>
                View all sales
              </Button>
            }
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice No.</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Payment Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentSales.length ? (
                    recentSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{`INV-${String(sale.id).padStart(5, "0")}`}</TableCell>
                        <TableCell>{sale.customer}</TableCell>
                        <TableCell>{sale.items}</TableCell>
                        <TableCell>{formatMoney(sale.total)}</TableCell>
                        <TableCell>
                          <Chip
                            label={sale.status}
                            size="small"
                            sx={{
                              bgcolor: palette.greenSoft,
                              color: palette.green,
                              fontWeight: 700,
                            }}
                          />
                        </TableCell>
                        <TableCell>{formatDateOnly(sale.date)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography sx={{ py: 2, color: palette.muted, textAlign: "center" }}>
                          No recent sales recorded.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Panel>
        </Grid>

        <Grid item xs={12} xl={3}>
          <Panel title="Notes">
            <Stack spacing={1.25}>
              <Typography variant="body2" sx={{ color: palette.muted, lineHeight: 1.7 }}>
                Rebranded packaging received from supplier.
              </Typography>
              <Typography variant="body2" sx={{ color: palette.muted, lineHeight: 1.7 }}>
                Keep maize flour and cooking oil under close reorder watch this week.
              </Typography>
              <Divider />
              <Stack direction="row" spacing={1} alignItems="center">
                <PencilSquare size={15} color={palette.muted} />
                <Typography variant="caption" sx={{ color: palette.muted }}>
                  {format(new Date(), "MMM d, yyyy")} • by admin
                </Typography>
              </Stack>
            </Stack>
          </Panel>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default Dashboard;
