import {
    createSelector,
     createEntityAdapter
    } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';
import { tags as commonTags } from './commonTags'

const statisticsAdapter = createEntityAdapter({
    selectId: (statistics) => statistics.statId,
sortComparer: (a, b) => b.statDateCreated.localeCompare(a.statDateCreated)
})

const initialState = statisticsAdapter.getInitialState();

export const extendedStatsApiSlice = apiSlice.injectEndpoints({

    endpoints: builder => ({
        getStatistics: builder.query({
            query: () => '/retrievals/statistics',
            transformResponse:  responseData => {
            return statisticsAdapter.setAll(initialState, responseData)
           },
           providesTags: [commonTags.inventory],
        }),
    })
})

export const {
    useGetStatisticsQuery,
} = extendedStatsApiSlice 

//returns the query result object
export const selectStatisticsResult = extendedStatsApiSlice.endpoints.getStatistics.select();

//Creates memoized selector
const selectStatisticsData = createSelector(
    selectStatisticsResult,
    statisticsResult => statisticsResult.data //normalized state object with ids & entities
)

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
    selectAll: selectStatistics,
    selectById: selectStatisticsById,
    selectIds: selectStatisticsIds
} = statisticsAdapter.getSelectors(state => selectStatisticsData(state) ?? initialState);
