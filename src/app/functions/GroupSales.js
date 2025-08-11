import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

// Sample sales data
const salesData = [
  { saleId: 33, saleDateCreated: "2023-11-26 08:54:36", salePrice: "280000", saleQuantity: 2 },
  { saleId: 34, saleDateCreated: "2023-11-26 09:19:22", salePrice: "280000", saleQuantity: 1 },
  { saleId: 35, saleDateCreated: "2023-11-26 09:20:21", salePrice: "200000", saleQuantity: 1 },
  { saleId: 36, saleDateCreated: "2023-11-26 09:20:54", salePrice: "200000", saleQuantity: 1 },
  { saleId: 38, saleDateCreated: "2023-11-26 09:48:34", salePrice: "200000", saleQuantity: 3 },
  { saleId: 39, saleDateCreated: "2023-11-26 09:48:34", salePrice: "280000", saleQuantity: 2 },
  { saleId: 40, saleDateCreated: "2023-11-30 11:11:21", salePrice: "330000", saleQuantity: 4 },
  { saleId: 41, saleDateCreated: "2023-11-30 11:23:16", salePrice: "330000", saleQuantity: 3 },
  { saleId: 42, saleDateCreated: "2023-11-30 15:35:34", salePrice: "5000", saleQuantity: 5 },
];

// Helper function to format sales data
const formatSalesDates = (data) => {
  return data.map((sale) => ({
    ...sale,
    saleDateCreated: format(parseISO(sale.saleDateCreated), "yyyy-MM-dd"),
  }));
};

// Grouping functions
const groupByWeek = (data) => {
  return data.reduce((result, sale) => {
    const saleDate = parseISO(sale.saleDateCreated);
    const weekStart = format(startOfWeek(saleDate), "yyyy-MM-dd");
    const weekEnd = format(endOfWeek(saleDate), "yyyy-MM-dd");
    const weekKey = `${weekStart} to ${weekEnd}`;

    if (!result[weekKey]) {
      result[weekKey] = [];
    }
    result[weekKey].push(sale);
    return result;
  }, {});
};

const groupByMonth = (data) => {
  return data.reduce((result, sale) => {
    const month = format(parseISO(sale.saleDateCreated), "yyyy-MM");
    if (!result[month]) {
      result[month] = [];
    }
    result[month].push(sale);
    return result;
  }, {});
};

const groupByYear = (data) => {
  return data.reduce((result, sale) => {
    const year = format(parseISO(sale.saleDateCreated), "yyyy");
    if (!result[year]) {
      result[year] = [];
    }
    result[year].push(sale);
    return result;
  }, {});
};

// Process and group sales data
const formattedSalesData = formatSalesDates(salesData);
const weeklySales = groupByWeek(formattedSalesData);
const monthlySales = groupByMonth(formattedSalesData);
const annualSales = groupByYear(formattedSalesData);

console.log("Weekly Sales:", weeklySales);
console.log("Monthly Sales:", monthlySales);
console.log("Annual Sales:", annualSales);

export default formatSalesDates;
