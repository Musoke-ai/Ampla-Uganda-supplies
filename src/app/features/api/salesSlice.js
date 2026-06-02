import {
    createSelector,
     createEntityAdapter
    } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';
import { tags as commonTags } from './commonTags'
import { compareDesc, extractArray } from './responseUtils';

const salesAdapter = createEntityAdapter({
    selectId: (sales) => sales.saleId,
sortComparer: (a, b) => compareDesc(a.saleDateCreated, b.saleDateCreated)
})

const initialState = salesAdapter.getInitialState();

export const extendedSalesApiSlice = apiSlice.injectEndpoints({

    endpoints: builder => ({
        getSales: builder.query({
            query: () => '/retrievals/sales',
            transformResponse:  responseData => {
            return salesAdapter.setAll(initialState, extractArray(responseData))
           },
           providesTags: [commonTags.inventory],
        }),
        getReceipts: builder.query({
            query: ({ dateFrom, dateTo } = {}) => {
                const params = new URLSearchParams();
                if (dateFrom) params.set('date_from', dateFrom);
                if (dateTo) params.set('date_to', dateTo);
                const query = params.toString();
                return `/retrievals/receipts${query ? `?${query}` : ''}`;
            },
            transformResponse: responseData => extractArray(responseData),
            providesTags: [commonTags.inventory],
        }),
        makeSales: builder.mutation(
            {
                query: payload => ({
                
                url: 'entries/sales',
                method: 'post',
                body: payload
            }
        ),
        invalidatesTags: [commonTags.inventory],
            }),
        cancelSales: builder.mutation(
            {
                query: payload => ({
                url: 'entries/cancelsale',
                method: 'post',
                body: payload
            }
        ),
        invalidatesTags: [commonTags.inventory],
            }),
    })
})

export const {
    useGetSalesQuery,
    useGetReceiptsQuery,
    useMakeSalesMutation,
    useCancelSalesMutation
} = extendedSalesApiSlice 

//returns the query result object
export const selectSalesResult = extendedSalesApiSlice.endpoints.getSales.select();

//Creates memoized selector
const selectSalesData = createSelector(
    selectSalesResult,
    salesResult => salesResult.data //normalized state object with ids & entities
)

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
    selectAll: selectSales,
    selectById: selectSalesById,
    selectIds: selectSalesIds
} = salesAdapter.getSelectors(state => selectSalesData(state) ?? initialState);
