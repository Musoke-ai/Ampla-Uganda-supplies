import {
    createSelector,
     createEntityAdapter
    } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';
import { tags as commonTags } from './commonTags'

const historyAdapter = createEntityAdapter({
    selectId: (history) => history.historyId,
sortComparer: (a, b) => b.historyDateCreated.localeCompare(a.historyDateCreated)
})

const initialState = historyAdapter.getInitialState();

export const extendedHistoryApiSlice = apiSlice.injectEndpoints({

    endpoints: builder => ({
        getHistory: builder.query({
            query: () => '/retrievals/history',
            transformResponse:  responseData => {
            return historyAdapter.setAll(initialState, responseData)
           },
           providesTags: [commonTags.inventory],
        }),
    })
})

export const {
    useGetHistoryQuery,
} = extendedHistoryApiSlice

//returns the query result object
export const selectHistoryResult = extendedHistoryApiSlice.endpoints.getHistory.select();

//Creates memoized selector
const selectHistoryData = createSelector(
    selectHistoryResult,
    historyResult => historyResult.data //normalized state object with ids & entities
)

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
    selectAll: selectHistory,
    selectById: selectHistoryById,
    selectIds: selectHistoryIds
} = historyAdapter.getSelectors(state => selectHistoryData(state) ?? initialState);
