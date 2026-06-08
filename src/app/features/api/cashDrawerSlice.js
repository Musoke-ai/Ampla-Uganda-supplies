import { apiSlice } from "./apiSlice";
import { tags as commonTags } from "./commonTags";

const cashDrawerTags = ["CashDrawers"];

export const cashDrawerApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getActiveCashDrawer: builder.query({
      query: ({ branchId } = {}) => {
        const params = new URLSearchParams();
        if (branchId) params.set("branchId", branchId);
        const query = params.toString();
        return `/cash-drawers/active${query ? `?${query}` : ""}`;
      },
      transformResponse: (response) => response?.data?.drawer ?? response?.drawer ?? null,
      providesTags: cashDrawerTags,
    }),
    getCashDrawerHistory: builder.query({
      query: ({ branchId } = {}) => {
        const params = new URLSearchParams();
        if (branchId) params.set("branchId", branchId);
        const query = params.toString();
        return `/cash-drawers/history${query ? `?${query}` : ""}`;
      },
      transformResponse: (response) => response?.data ?? [],
      providesTags: cashDrawerTags,
    }),
    openCashDrawer: builder.mutation({
      query: (payload) => ({
        url: "/cash-drawers/open",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: cashDrawerTags,
    }),
    recordCashDrawerMovement: builder.mutation({
      query: (payload) => ({
        url: "/cash-drawers/movement",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: cashDrawerTags,
    }),
    recordCashDrawerExpense: builder.mutation({
      query: (payload) => ({
        url: "/cash-drawers/expense",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [...cashDrawerTags, commonTags.inventory],
    }),
    closeCashDrawer: builder.mutation({
      query: (payload) => ({
        url: "/cash-drawers/close",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: cashDrawerTags,
    }),
  }),
});

export const {
  useGetActiveCashDrawerQuery,
  useGetCashDrawerHistoryQuery,
  useOpenCashDrawerMutation,
  useRecordCashDrawerMovementMutation,
  useRecordCashDrawerExpenseMutation,
  useCloseCashDrawerMutation,
} = cashDrawerApiSlice;
