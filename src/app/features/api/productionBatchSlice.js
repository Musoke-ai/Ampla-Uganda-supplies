import { createEntityAdapter, createSelector } from "@reduxjs/toolkit";
import { apiSlice } from "./apiSlice";
import { tags as commonTags } from "./commonTags";

const productionBatchAdapter = createEntityAdapter({
  selectId: (batch) => batch.batchId,
  sortComparer: (a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
});

const initialState = productionBatchAdapter.getInitialState();

export const extendedProductionBatchApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProductionBatches: builder.query({
      query: () => "/production/batches",
      transformResponse: (responseData) =>
        productionBatchAdapter.setAll(initialState, Array.isArray(responseData) ? responseData : []),
      providesTags: [commonTags.inventory],
    }),
    getProductionBatch: builder.query({
      query: (batchId) => `/production/batches/${batchId}`,
      providesTags: [commonTags.inventory],
    }),
    createProductionBatch: builder.mutation({
      query: (payload) => ({
        url: "/production/batches/create",
        method: "post",
        body: payload,
      }),
      invalidatesTags: [commonTags.inventory],
    }),
    updateProductionBatch: builder.mutation({
      query: (payload) => ({
        url: "/production/batches/update",
        method: "post",
        body: payload,
      }),
      invalidatesTags: [commonTags.inventory],
    }),
    deleteProductionBatch: builder.mutation({
      query: (payload) => ({
        url: "/production/batches/delete",
        method: "post",
        body: payload,
      }),
      invalidatesTags: [commonTags.inventory],
    }),
    addProductionBatchMaterial: builder.mutation({
      query: (payload) => ({
        url: "/production/batches/materials",
        method: "post",
        body: payload,
      }),
      invalidatesTags: [commonTags.inventory],
    }),
    addProductionBatchLabor: builder.mutation({
      query: (payload) => ({
        url: "/production/batches/labor",
        method: "post",
        body: payload,
      }),
      invalidatesTags: [commonTags.inventory],
    }),
    addProductionBatchExpense: builder.mutation({
      query: (payload) => ({
        url: "/production/batches/expenses",
        method: "post",
        body: payload,
      }),
      invalidatesTags: [commonTags.inventory],
    }),
    postProductionBatchOutput: builder.mutation({
      query: (payload) => ({
        url: "/production/batches/output",
        method: "post",
        body: payload,
      }),
      invalidatesTags: [commonTags.inventory],
    }),
    updateProductionBatchStatus: builder.mutation({
      query: (payload) => ({
        url: "/production/batches/status",
        method: "post",
        body: payload,
      }),
      invalidatesTags: [commonTags.inventory],
    }),
    updateProductionBatchQuality: builder.mutation({
      query: (payload) => ({
        url: "/production/batches/quality",
        method: "post",
        body: payload,
      }),
      invalidatesTags: [commonTags.inventory],
    }),
  }),
});

export const {
  useGetProductionBatchesQuery,
  useGetProductionBatchQuery,
  useCreateProductionBatchMutation,
  useUpdateProductionBatchMutation,
  useDeleteProductionBatchMutation,
  useAddProductionBatchMaterialMutation,
  useAddProductionBatchLaborMutation,
  useAddProductionBatchExpenseMutation,
  usePostProductionBatchOutputMutation,
  useUpdateProductionBatchStatusMutation,
  useUpdateProductionBatchQualityMutation,
} = extendedProductionBatchApiSlice;

export const selectProductionBatchesResult =
  extendedProductionBatchApiSlice.endpoints.getProductionBatches.select();

const selectProductionBatchesData = createSelector(
  selectProductionBatchesResult,
  (result) => result.data
);

export const {
  selectAll: selectProductionBatches,
  selectById: selectProductionBatchById,
  selectIds: selectProductionBatchIds,
} = productionBatchAdapter.getSelectors((state) => selectProductionBatchesData(state) ?? initialState);
