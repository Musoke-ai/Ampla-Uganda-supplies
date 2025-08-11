import {
    createSelector,
     createEntityAdapter
    } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';
import { tags as commonTags } from './commonTags'

const orderAdapter = createEntityAdapter({
selectId: (orders) => orders.orderId,
sortComparer: (a, b) => b.orderDateCreated.localeCompare(a.orderDateCreated)
})

const initialState = orderAdapter.getInitialState();

export const extendedOrderApiSlice = apiSlice.injectEndpoints({

    endpoints: builder => ({
        getOrders: builder.query({
            query: () => '/orders',
            transformResponse:  responseData => {
            return orderAdapter.setAll(initialState, responseData)
           },
           providesTags: [commonTags.inventory],
        }),
        addOrder: builder.mutation(
            {
                query: payload => ({
                url: '/addOrder',
                method: 'post',
                body: payload
            }
        ),
        invalidatesTags: [commonTags.inventory],
            }),

            updateOrder: builder.mutation(
                {
                    query: payload => ({
                    
                    url: '/updateOrder',
                    method: 'post',
                    body: payload
                }
            ),
            invalidatesTags: [commonTags.inventory],
                }),
                deleteOrder: builder.mutation(
                    {
                        query: payload => ({
                        url: '/deleteOrder',
                        method: 'post',
                        body: payload
                    }
                ),
                invalidatesTags: [commonTags.inventory],
                    }),
    })
})

export const {
    useGetOrdersQuery,
    useAddOrderMutation,
    useUpdateOrderMutation,
    useDeleteOrderMutation,
} = extendedOrderApiSlice 

//returns the query result object
export const selectOrdersResult = extendedOrderApiSlice.endpoints.getOrders.select();

//Creates memoized selector
const selectOrdersData = createSelector(
    selectOrdersResult,
    ordersResult => ordersResult.data //normalized state object with ids & entities
)

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
    selectAll: selectOrders,
    selectById: selectOrderById,
    selectIds: selectOrdersIds
} = orderAdapter.getSelectors(state => selectOrdersData(state) ?? initialState);
