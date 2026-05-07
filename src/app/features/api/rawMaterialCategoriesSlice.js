import {
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import { apiSlice } from "./apiSlice";
import { tags as commonTags } from "./commonTags";

const rawMaterialCategoriesAdapter = createEntityAdapter({
  selectId: (category) => category.categoryId,
  sortComparer: (a, b) => (a.categoryName || "").localeCompare(b.categoryName || ""),
});

const initialState = rawMaterialCategoriesAdapter.getInitialState();

export const extendedRawMaterialCategoriesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRawMaterialCategories: builder.query({
      query: () => "/rawmaterialcategories",
      transformResponse: (responseData) =>
        rawMaterialCategoriesAdapter.setAll(initialState, Array.isArray(responseData) ? responseData : []),
      providesTags: [commonTags.inventory],
    }),
    addRawMaterialCategory: builder.mutation({
      query: (payload) => ({
        url: "/addrawmaterialcategory",
        method: "post",
        body: payload,
      }),
      invalidatesTags: [commonTags.inventory],
    }),
    updateRawMaterialCategory: builder.mutation({
      query: (payload) => ({
        url: "/updaterawmaterialcategory",
        method: "post",
        body: payload,
      }),
      invalidatesTags: [commonTags.inventory],
    }),
    deleteRawMaterialCategory: builder.mutation({
      query: (payload) => ({
        url: "/deleterawmaterialcategory",
        method: "post",
        body: payload,
      }),
      invalidatesTags: [commonTags.inventory],
    }),
  }),
});

export const {
  useGetRawMaterialCategoriesQuery,
  useAddRawMaterialCategoryMutation,
  useUpdateRawMaterialCategoryMutation,
  useDeleteRawMaterialCategoryMutation,
} = extendedRawMaterialCategoriesApiSlice;

export const selectRawMaterialCategoriesResult =
  extendedRawMaterialCategoriesApiSlice.endpoints.getRawMaterialCategories.select();

const selectRawMaterialCategoriesData = createSelector(
  selectRawMaterialCategoriesResult,
  (rawMaterialCategoriesResult) => rawMaterialCategoriesResult.data
);

export const {
  selectAll: selectRawMaterialCategories,
  selectById: selectRawMaterialCategoryById,
  selectIds: selectRawMaterialCategoryIds,
} = rawMaterialCategoriesAdapter.getSelectors(
  (state) => selectRawMaterialCategoriesData(state) ?? initialState
);
