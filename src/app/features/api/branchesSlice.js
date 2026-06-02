import {
  createSelector,
  createEntityAdapter,
} from "@reduxjs/toolkit";
import { apiSlice } from "./apiSlice";
import { tags as commonTags } from "./commonTags";
import { setBranchScope } from "../../auth/authSlice";
import { compareDesc, extractArray } from "./responseUtils";

const branchesAdapter = createEntityAdapter({
  selectId: (branch) => branch.branchId,
  sortComparer: (a, b) => compareDesc(a.branchDateCreated, b.branchDateCreated),
});

const initialState = branchesAdapter.getInitialState();

export const extendedBranchesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBranches: builder.query({
      query: () => "/branches",
      transformResponse: (responseData) =>
        branchesAdapter.setAll(initialState, extractArray(responseData)),
      providesTags: [commonTags.inventory],
    }),
    addBranch: builder.mutation({
      query: (payload) => ({
        url: "/addbranch",
        method: "post",
        body: payload,
      }),
      invalidatesTags: [commonTags.inventory],
    }),
    updateBranch: builder.mutation({
      query: (payload) => ({
        url: "/updatebranch",
        method: "post",
        body: payload,
      }),
      invalidatesTags: [commonTags.inventory],
    }),
    deleteBranch: builder.mutation({
      query: (payload) => ({
        url: "/deletebranch",
        method: "post",
        body: payload,
      }),
      invalidatesTags: [commonTags.inventory],
    }),
    switchBranch: builder.mutation({
      query: (payload) => ({
        url: "/switchbranch",
        method: "post",
        body: payload,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.scope) {
            dispatch(setBranchScope({ branchScope: data.scope }));
          }
        } catch (error) {
        }
      },
      invalidatesTags: [commonTags.inventory, commonTags.profile],
    }),
  }),
});

export const {
  useGetBranchesQuery,
  useAddBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
  useSwitchBranchMutation,
} = extendedBranchesApiSlice;

export const selectBranchesResult =
  extendedBranchesApiSlice.endpoints.getBranches.select();

const selectBranchesData = createSelector(
  selectBranchesResult,
  (branchesResult) => branchesResult.data
);

export const {
  selectAll: selectBranches,
  selectById: selectBranchById,
  selectIds: selectBranchIds,
} = branchesAdapter.getSelectors(
  (state) => selectBranchesData(state) ?? initialState
);
