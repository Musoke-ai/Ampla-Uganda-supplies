import { apiSlice } from "./apiSlice";

export const reportApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReportsCatalog: builder.query({
      query: () => "/reports/catalog",
    }),
    getReportsDashboard: builder.query({
      query: (params = {}) => ({
        url: "/reports/dashboard",
        params,
      }),
    }),
    getSalesReport: builder.query({
      query: (params = {}) => ({
        url: "/reports/sales",
        params,
      }),
    }),
    getSalesProductProfitReport: builder.query({
      query: (params = {}) => ({
        url: "/reports/sales/product-profit",
        params,
      }),
    }),
    getSalesPaidVsCreditReport: builder.query({
      query: (params = {}) => ({
        url: "/reports/sales/paid-vs-credit",
        params,
      }),
    }),
    getInventoryReport: builder.query({
      query: (params = {}) => ({
        url: "/reports/inventory",
        params,
      }),
    }),
    getStockMovementsReport: builder.query({
      query: (params = {}) => ({
        url: "/reports/inventory/stock-movements",
        params,
      }),
    }),
    getPurchaseReport: builder.query({
      query: (params = {}) => ({
        url: "/reports/purchases",
        params,
      }),
    }),
    getSupplierReport: builder.query({
      query: (params = {}) => ({
        url: "/reports/suppliers",
        params,
      }),
    }),
    getRawMaterialReport: builder.query({
      query: (params = {}) => ({
        url: "/reports/raw-materials",
        params,
      }),
    }),
    getProductionReport: builder.query({
      query: (params = {}) => ({
        url: "/reports/production",
        params,
      }),
    }),
    getExpenseReport: builder.query({
      query: (params = {}) => ({
        url: "/reports/expenses",
        params,
      }),
    }),
    getCustomerReport: builder.query({
      query: (params = {}) => ({
        url: "/reports/customers",
        params,
      }),
    }),
    getStaffReport: builder.query({
      query: (params = {}) => ({
        url: "/reports/staff",
        params,
      }),
    }),
    getAuditReport: builder.query({
      query: (params = {}) => ({
        url: "/reports/audit",
        params,
      }),
    }),
    getAlertsReport: builder.query({
      query: (params = {}) => ({
        url: "/reports/alerts",
        params,
      }),
    }),
  }),
});

export const {
  useGetReportsCatalogQuery,
  useGetReportsDashboardQuery,
  useGetSalesReportQuery,
  useGetSalesProductProfitReportQuery,
  useGetSalesPaidVsCreditReportQuery,
  useGetInventoryReportQuery,
  useGetStockMovementsReportQuery,
  useGetPurchaseReportQuery,
  useGetSupplierReportQuery,
  useGetRawMaterialReportQuery,
  useGetProductionReportQuery,
  useGetExpenseReportQuery,
  useGetCustomerReportQuery,
  useGetStaffReportQuery,
  useGetAuditReportQuery,
  useGetAlertsReportQuery,
} = reportApiSlice;
