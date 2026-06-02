import { apiSlice } from "./apiSlice";
import { tags as commonTags } from "./commonTags";

export const importApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getImportHistory: builder.query({
      query: () => "/imports/history",
      transformResponse: (response) => response?.data ?? [],
      providesTags: ["Imports"],
    }),
    getImportMappings: builder.query({
      query: (type) => `/imports/mappings${type ? `?type=${type}` : ""}`,
      transformResponse: (response) => response?.data ?? [],
      providesTags: ["Imports"],
    }),
    uploadImportBatch: builder.mutation({
      query: (payload) => ({
        url: "/imports/upload",
        method: "post",
        body: payload,
      }),
      invalidatesTags: ["Imports"],
    }),
    validateImportBatch: builder.mutation({
      query: ({ batchId, mapping, options }) => ({
        url: `/imports/${batchId}/validate`,
        method: "post",
        body: { mapping, options },
      }),
      invalidatesTags: ["Imports"],
    }),
    updateImportRow: builder.mutation({
      query: ({ batchId, rowId, rawData }) => ({
        url: `/imports/${batchId}/rows/${rowId}`,
        method: "post",
        body: { rawData },
      }),
      invalidatesTags: ["Imports"],
    }),
    confirmImportBatch: builder.mutation({
      query: (batchId) => ({
        url: `/imports/${batchId}/confirm`,
        method: "post",
      }),
      invalidatesTags: ["Imports", commonTags.inventory],
    }),
  }),
});

export const {
  useGetImportHistoryQuery,
  useGetImportMappingsQuery,
  useUploadImportBatchMutation,
  useUpdateImportRowMutation,
  useValidateImportBatchMutation,
  useConfirmImportBatchMutation,
} = importApiSlice;
