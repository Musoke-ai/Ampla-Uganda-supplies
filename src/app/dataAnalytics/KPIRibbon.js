import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Modal,
  Tooltip,
  IconButton,
  Grid,
  Select,
  MenuItem,
} from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import CategoryIcon from "@mui/icons-material/Category";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningIcon from "@mui/icons-material/Warning";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useSelector } from "react-redux";
import { selectCategories } from "../features/api/categorySlice";
import {selectSales} from "../features/api/salesSlice";
import { selectStock } from "../features/stock/stockSlice";

const InventoryKPI = () => {

  const sales = useSelector(selectSales);
  const inventory = useSelector(selectStock);
  const categories = useSelector(selectCategories);

  const [chartType, setChartType] = useState("Bar"); // Chart Type Selector
  const [activeModal, setActiveModal] = useState(null);

  // Dummy KPI Data
 const data = generateData(sales, inventory, categories);
 console.log("Metrics: "+JSON.stringify(data));

  //   stockLevelsProduct: [
  //     { name: "Product A", stock: 150 },
  //     { name: "Product B", stock: 120 },
  //     { name: "Product C", stock: 80 },
  //   ],
  //   stockLevelsCategory: [
  //     { name: "Electronics", stock: 300 },
  //     { name: "Apparel", stock: 200 },
  //     { name: "Furniture", stock: 100 },
  //   ],
  //   salesProduct: [
  //     { name: "Product A", sales: 500 },
  //     { name: "Product B", sales: 300 },
  //     { name: "Product C", sales: 200 },
  //   ],
  //   salesCategory: [
  //     { name: "Electronics", sales: 3000 },
  //     { name: "Apparel", sales: 2000 },
  //     { name: "Furniture", sales: 1000 },
  //   ],
  //   profits: [
  //     { name: "Product A", profit: 500 },
  //     { name: "Product B", profit: 300 },
  //     { name: "Product C", profit: 200 },
  //   ],
  //   variance: [
  //     { name: "Product A", variance: 20 },
  //     { name: "Product B", variance: -10 },
  //     { name: "Product C", variance: 5 },
  //   ],
  //   lowStock: [
  //     { name: "Product A", stock: 5 },
  //     { name: "Product B", stock: 3 },
  //   ],
  // };

  // Modal descriptions
  // Modal descriptions
  const modalDescriptions = {
    stockLevelsProduct: "Current stock levels for each product in your inventory.",
    stockLevelsCategory: "Aggregate stock levels for each product category.",
    salesProduct: "Total sales per product, showing which items are selling well.",
    salesCategory: "Sales figures for each product category, useful for high-level analysis.",
    profits: "Net profits made from individual products.",
    variance: "Compares stock levels to sales, highlighting discrepancies.",
    lowStock: "Products with low stock levels requiring restocking.",
  };

  // Close modal handler
  const handleClose = () => setActiveModal(null);

// Colors for pie charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <Box>
      {/* Ribbon Container */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-around",
          flexWrap: "wrap",
          padding: "10px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Tooltip title="Stock Levels (Product Wise)">
          <IconButton color="primary" onClick={() => setActiveModal("stockLevelsProduct")}>
            <InventoryIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Stock Levels (Category Wise)">
          <IconButton color="secondary" onClick={() => setActiveModal("stockLevelsCategory")}>
            <CategoryIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Sales Per Product">
          <IconButton color="success" onClick={() => setActiveModal("salesProduct")}>
            <AttachMoneyIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Sales Per Category">
          <IconButton color="info" onClick={() => setActiveModal("salesCategory")}>
            <TrendingUpIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Profits Made">
          <IconButton color="warning" onClick={() => setActiveModal("profits")}>
            <CompareArrowsIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Variance">
          <IconButton color="error" onClick={() => setActiveModal("variance")}>
            <WarningIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Modal for KPIs */}
      <Modal open={!!activeModal} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxHeight: "80vh",
            overflowY: "auto",
            bgcolor: "background.paper",
            border: "none",
            borderRadius: "10px",
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant="h6" gutterBottom>
            {modalDescriptions[activeModal]}
          </Typography>
          {/* Chart Type Selector */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              size="small"
              variant="outlined"
              sx={{ width: 150 }}
            >
              <MenuItem value="Bar">Bar Chart</MenuItem>
              <MenuItem value="Pie">Pie Chart</MenuItem>
              <MenuItem value="Line">Line Chart</MenuItem>
            </Select>
          </Box>
          {/* Render Relevant Chart */}
          {activeModal && (
            <Box sx={{ textAlign: "center" }}>
              {chartType === "Bar" && (
                <BarChart width={600} height={300} data={data[activeModal]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="stock" fill="#8884d8" />
                </BarChart>
              )}
              {chartType === "Pie" && (
                <PieChart width={600} height={300}>
                  <Pie
                    data={data[activeModal]}
                    dataKey="stock"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    label
                  >
                    {data[activeModal].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              )}
              {chartType === "Line" && (
                <LineChart width={600} height={300} data={data[activeModal]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="stock" stroke="#8884d8" />
                </LineChart>
              )}
            </Box>
          )}
          <Button
            onClick={handleClose}
            variant="contained"
            sx={{ mt: 3, display: "block", margin: "0 auto" }}
          >
            Close
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

function generateData(salesDataset, inventoryDataset, categoriesDataset) {
  // Helper function to find category name by categoryId
  const getCategoryName = (categoryId) =>
    categoriesDataset.find((category) => category.categoryId === categoryId)?.categoryName || "Unknown";

  // Calculate stock levels by product
  const stockLevelsProduct = inventoryDataset.map((item) => ({
    name: item.itemName,
    stock: parseInt(item.itemQuantity),
  }));

  // Calculate stock levels by category
  const stockLevelsCategory = categoriesDataset.map((category) => {
    const categoryStock = inventoryDataset
      .filter((item) => item.itemCategoryId === category.categoryId)
      .reduce((sum, item) => sum + parseInt(item.itemQuantity), 0);
    return { name: category.categoryName, stock: categoryStock };
  });

  // Calculate sales by product
  const salesProduct = inventoryDataset.map((item) => {
    const totalSales = salesDataset
      .filter((sale) => Number(sale.saleItemId) === Number(item.itemId))
      .reduce((sum, sale) => sum + parseInt(sale.salePrice) * parseInt(sale.saleQuantity), 0);
    return { name: item.itemName, sales: totalSales };
  });

  // Calculate sales by category
  const salesCategory = categoriesDataset.map((category) => {
    const totalSales = salesDataset
      .filter((sale) =>
        inventoryDataset.some(
          (item) => item.itemId === sale.saleItemId && item.itemCategoryId === category.categoryId
        )
      )
      .reduce((sum, sale) => sum + parseInt(sale.salePrice) * parseInt(sale.saleQuantity), 0);
    return { name: category.categoryName, sales: totalSales };
  });

  // Calculate profits by product
  const profits = inventoryDataset.map((item) => {
    const totalProfit = salesDataset
      .filter((sale) => sale.saleItemId === item.itemId)
      .reduce(
        (sum, sale) =>
          sum + ((parseInt(sale.salePrice)* parseInt(sale.saleQuantity)) - parseInt(item.itemStockPrice)) * parseInt(sale.saleQuantity),
        0
      );
    return { name: item.itemName, profit: totalProfit };
  });

  // Calculate variance (example: target stock - actual stock)
  const targetStock = 5; // Example threshold
  const variance = inventoryDataset.map((item) => ({
    name: item.itemName,
    variance: targetStock - parseInt(item.itemQuantity),
  }));

  // Identify low-stock products
  const lowStock = inventoryDataset
    .filter((item) => parseInt(item.itemQuantity) < targetStock)
    .map((item) => ({
      name: item.itemName,
      stock: parseInt(item.itemQuantity),
    }));

  return {
    stockLevelsProduct,
    stockLevelsCategory,
    salesProduct,
    salesCategory,
    profits,
    variance,
    lowStock,
  };
}

// Example usage
// const salesDataset = [/* Add your sales data here */];
// const inventoryDataset = [/* Add your inventory data here */];
// const categoriesDataset = [/* Add your categories data here */];

// const data = generateData(salesDataset, inventoryDataset, categoriesDataset);



export default InventoryKPI;
