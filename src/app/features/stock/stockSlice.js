import {
    createSelector,
     createEntityAdapter
    } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';
import {tags as commonTags } from '../api/commonTags'

const stockAdapter = createEntityAdapter({
    selectId: (stock) => stock.itemId,
sortComparer: (a, b) => b.itemDateCreated.localeCompare(a.itemDateCreated)
})

const initialState = stockAdapter.getInitialState();

export const extendedApiSlice = apiSlice.injectEndpoints({

    endpoints: builder => ({
        getStock: builder.query({
            query: () => '/retrievals',
            transformResponse:  responseData => {
            return stockAdapter.setAll(initialState, responseData)
           },
           providesTags: [commonTags.inventory],
        //    providesTags: (result, error, arg) => [
        //     {
        //         type: 'Stock', id:"LIST"
        //     },
        //     ...result.ids.map(id => ({type: 'Stock', id }))
        //    ]
        }),
        getStockById: builder.query({
            query: id => `retrievals/${id}`,
            transformResponse: responseData => {
                return stockAdapter.setAll(initialState, responseData);
            },
            providesTags: [commonTags.inventory],
            // providesTags: (result, error, arg) => [
            //     {
            //         type: 'Stock', id:"LIST"
            //     },
            //     ...result.ids.map(id => ({type: 'Stock', id }))
            //    ]
        }),
        addStock: builder.mutation(
            {
                query: payload => ({
                url: '/entries/addstock',
                method: 'post',
                body: payload
            }
        ),
        invalidatesTags: [commonTags.inventory],
            }),

            updateStock: builder.mutation(
                {
                    query: payload => ({
                    
                    url: '/entries/updateItem',
                    method: 'post',
                    body: payload
                }
            ),
            invalidatesTags: [commonTags.inventory],
                }),
          
                deleteStock: builder.mutation(
                    {
                        query: payload => (
                        
                            {
                        url: `/entries/deleteItem/${payload.itemId}`,
                        method: 'post',
                    }
                        ),
                invalidatesTags: [commonTags.inventory],
                    }),
    })
})

export const {
    useGetStockQuery,
    useGetStockByIdQuery,
    useAddStockMutation,
    useUpdateStockMutation,
    useDeleteStockMutation,
} = extendedApiSlice 

//returns the query result object
export const selectStockResult = extendedApiSlice.endpoints.getStock.select();

//Creates memoized selector
const selectStockData = createSelector(
    selectStockResult,
    stockResult => stockResult.data //normalized state object with ids & entities
)

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
    selectAll: selectStock,
    selectById: selectStockById,
    selectIds: selectStockIds
} = stockAdapter.getSelectors(state => selectStockData(state) ?? initialState);
