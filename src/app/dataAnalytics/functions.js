import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval,getWeek, isSameMonth, isSameYear,addWeeks, startOfMonth  } from "date-fns";
import CurrencyFormat from 'react-currency-format';

// //function to calculate week number given the year and month
// export const getWeekNumber = (year,month,week) => {
//     // Get the first day of month in year
// const firstDayOfMonthInYear = new Date(year, month, 1); // 2 is for March (0-based)

// // Find the first week of the month in year
// const firstWeekNumber = getWeek(firstDayOfMonthInYear);

// if(Number(week) === 1){
//     return firstWeekNumber;
// }
// else if(Number(week) > 1){
// // Now add those week to get the week
// const weekStartDate = addWeeks(firstDayOfMonthInYear, Number(week)-1);
// const weekNumber = getWeek(weekStartDate);
// return weekNumber;
// }
// else{
//     return 'Invalid week';
// }
// }

export function getWeekNumber(year, month, day) {
  // Create a Date object for the given date
  const date = new Date(year, month - 1, day); // month - 1 because JavaScript months are zero-indexed

  // ISO week starts on Monday; calculate the nearest Thursday to the given date
  const nearestThursday = new Date(date);
  nearestThursday.setDate(date.getDate() + (4 - (date.getDay() || 7)));

  // Calculate the ISO year for the nearest Thursday
  const isoYear = nearestThursday.getFullYear();

  // Find the first Thursday of the ISO year
  const firstThursday = new Date(isoYear, 0, 4);
  firstThursday.setDate(firstThursday.getDate() + (4 - (firstThursday.getDay() || 7)));

  // Calculate the difference in days between the date and the first Thursday
  const diff = (nearestThursday - firstThursday) / (24 * 60 * 60 * 1000);

  // Calculate the week number
  const weekNumber = Math.floor(diff / 7) + 1;

  return weekNumber;
}


export const calculateWeeklySalesPerDay = (data, year, month, week) => {
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklySales = {};
  const weeklyRevenue = {};

  // Initialize sales and revenue for each day
  weekdays.forEach((day) => {
    weeklySales[day] = 0;
    weeklyRevenue[day] = 0;
  });

  data.forEach((sale) => {
    try {
      const saleDate = parseISO(sale.saleDateCreated);

      // Ensure the sale matches the specified year, month, and week
      if (
        isSameYear(saleDate, new Date(year, 0, 1)) &&
        isSameMonth(saleDate, new Date(year, month - 1)) &&
        getWeek(saleDate) === week
      ) {
        const weekday = format(saleDate, "EEE"); // Get day abbreviation (Mon, Tue, etc.)
        if (weekdays.includes(weekday)) {
          weeklySales[weekday] += Number(sale.saleQuantity || 0);
          weeklyRevenue[weekday] += Number(sale.salePrice || 0);
        }
      }
    } catch (error) {
      console.error("Error processing sale:", sale, error);
    }
  });

  // // Filter out empty days if necessary
  // const filteredWeeklySales = Object.fromEntries(
  //   Object.entries(weeklySales).filter(([day, value]) => value > 0)
  // );
  // const filteredWeeklyRevenue = Object.fromEntries(
  //   Object.entries(weeklyRevenue).filter(([day, value]) => value > 0)
  // );

  // Return filtered results
  return { weeklySales, weeklyRevenue};
};


  // Helper function to calculate totals
export const calculateTotals = (data) => {
  const totals = {
    byDay: {},
    byWeekday: {},
    byMonth: {},
    byYear: {},
  };

  data.forEach((sale) => {
    const saleDate = parseISO(sale.saleDateCreated);

    // Totals by day
    const day = format(saleDate, "yyyy-MM-dd");
    totals.byDay[day] = (totals.byDay[day] || 0) + Number(sale.saleQuantity);

    // Totals by weekday
    const weekday = format(saleDate, "EEEE"); // Full weekday name
    totals.byWeekday[weekday] = (totals.byWeekday[weekday] || 0) + Number(sale.saleQuantity);

    // Totals by month
    const month = format(saleDate, "yyyy-MM");
    totals.byMonth[month] = (totals.byMonth[month] || 0) + Number(sale.saleQuantity);

    // Totals by year
    const year = format(saleDate, "yyyy");
    totals.byYear[year] = (totals.byYear[year] || 0) + Number(sale.saleQuantity);
  });

  return totals;
};

//function to calculate total sales available for sale(totalQuntity and total amont)
export function calculateTotal(sales) {
  let totalQuantity = 0;
  let totalCost = 0;

  sales.forEach(({ saleQuantity, salePrice }) => {
    totalQuantity += Number(saleQuantity);
    totalCost += parseFloat(salePrice) * Number(saleQuantity);
  });

  return { totalQuantity, totalCost };
}

export function addCategoryToSales(salesData, products) {
  // Create a map for quick lookup of catId by itemId
  const productMap = new Map(products.map(product => [product?.itemId, product?.itemCategoryId]));

  // Add catId to each sales record
  return salesData.map(sale => ({
    ...sale, // Spread the existing sale properties
    catId: productMap.get(sale.saleItemId) || null, // Match catId or assign null if no match found
  }));
}

//Function to calculate total amount, quantity and sales % per each category
export function calculateSalesByCategoryWithPrice(salesData) {
  // Initialize an object to store category totals
  const categoryTotals = {};

  // Calculate total quantity and cost for each category
  salesData.forEach(sale => {
    const { catId, saleQuantity, salePrice } = sale;

    if (!catId) return; // Skip if catId is missing or null

    if (!categoryTotals[catId]) {
      categoryTotals[catId] = { totalQuantity: 0, totalAmount: 0 };
    }

    categoryTotals[catId].totalQuantity += Number(saleQuantity);
    categoryTotals[catId].totalAmount += Number(saleQuantity) * parseFloat(salePrice);
  });

  // Calculate grand totals for percentages
  const grandTotals = Object.values(categoryTotals).reduce(
    (totals, category) => {
      totals.totalQuantity += category.totalQuantity;
      totals.totalAmount += category.totalAmount;
      return totals;
    },
    { totalQuantity: 0, totalAmount: 0 }
  );

  // Add percentage calculations to each category
  Object.keys(categoryTotals).forEach(catId => {
    const category = categoryTotals[catId];
    category.quantityPercentage = ((category.totalQuantity / grandTotals.totalQuantity) * 100).toFixed(2);
    category.amountPercentage = ((category.totalAmount / grandTotals.totalAmount) * 100).toFixed(2);
  });

  return categoryTotals;
}

//function to add category names to the data frame according to their category ids
export function addCategoryNames(categoryTotals, categories) {
  // Loop through the categoryTotals keys to enrich data with category names
  Object.keys(categoryTotals).forEach(catId => {
    const category = categories.find(c => c.categoryId === catId);
    if (category) {
      categoryTotals[catId].categoryName = category.categoryName;
    } else {
      categoryTotals[catId].categoryName = "Unknown"; // Fallback for missing categories
    }
  });

  return categoryTotals;
}

//function to group sales data by SRID

export function groupSalesBySRIDWithCustomer(salesData, customerData) {
  // Create a mapping of custId to custName
  const customerMap = {};
  customerData.forEach((customer) => {
    customerMap[customer.custId] = customer.custName;
  });

  // Group sales by SR_ID
  const groupedSales = {};

  salesData.forEach((sale) => {
    const { SR_ID, salePrice, saleQuantity, custId, saleDateCreated } = sale;

    if (!groupedSales[SR_ID]) {
      groupedSales[SR_ID] = {
        totalCost: 0,
        totalQuantity: 0,
        SR_ID: SR_ID,
        customer: customerMap[custId] || "Unknown", // Assign customer name or default to "Unknown"
        formattedSaleDate: format(new Date(saleDateCreated), "dd/MM/yyyy"), // Format the date
      };
    }

    // Accumulate totals
    groupedSales[SR_ID].totalCost += Number(salePrice) * Number(saleQuantity);
    groupedSales[SR_ID].totalQuantity += Number(saleQuantity);
  });

  // Convert grouped sales object into an array
  return Object.values(groupedSales);
}


export function calculateInventoryMetrics(inventoryData) {
  // Initialize totals
  let totalQuantity = 0;
  let totalCost = 0;

  // Iterate through the items
  inventoryData.forEach(item => {
      // Convert itemQuantity and itemStockPrice to numbers and accumulate totals
      const quantity = parseInt(item.itemQuantity, 10) || 0;
      const cost = parseInt(item.itemLeastPrice, 10) || 0;
      
      totalQuantity += quantity;
      totalCost += quantity * cost; // Multiply quantity by stock price
  });

  return {
      totalQuantity,
      totalCost
  };
}
export function calculateSalesMetricsToday(salesData) {
  // Initialize totals
  let totalQuantity = 0;
  let totalCost = 0;
  const today =  format(new Date(),"MM/dd/yyyy");//get the date for today

  // Iterate through the items
  salesData.forEach(item => {
    const quantity = parseInt(item.saleQuantity, 10) || 0;
    const cost = parseInt(item.salePrice, 10) || 0;
    const saleDate = parseISO(item?.saleDateCreated)
    // Totals by today
    const date = format(saleDate, "MM/dd/yyyy");
    // console.log("itemDate: "+item.itemLeastPrice);
    console.log("itemDate: "+date);
    console.log("itemDate2: "+today);
    if( today === date){
     // Convert itemQuantity and itemStockPrice to numbers and accumulate totals
     totalQuantity += quantity;
     totalCost += quantity * cost; // Multiply quantity by stock price
    }
  });

  return {
      totalQuantity,
      totalCost
  };
}

export const formatCurrencyWithScale = (amount) => {
  if (amount >= 1_000_000) {
    return { formatted: `${(amount / 1_000_000).toFixed(1)}M` }; // Format in millions
  } else if (amount >= 1_000) {
    return { formatted: `${(amount / 1_000).toFixed(1)}K` }; // Format in thousands
  }
  return {
    formatted: (
      <CurrencyFormat
        value={amount}
        displayType={'text'}
        thousandSeparator={true}
        // prefix={'UGX '}
      />
    ),
  }; // No scaling
};




