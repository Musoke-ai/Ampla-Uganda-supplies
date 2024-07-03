import {
    createSelector,
     createEntityAdapter
    } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';
import { tags as commonTags } from './commonTags'

const stokAdapter = createEntityAdapter({
selectId: (stok) => stok.stockId,
sortComparer: (a, b) => b.stockCreated.localeCompare(a.stockCreated)
})

const initialState = stokAdapter.getInitialState();

export const extendedStokApiSlice = apiSlice.injectEndpoints({

    endpoints: builder => ({
        getStok: builder.query({
            query: () => '/stock',
            transformResponse:  responseData => {
            return stokAdapter.setAll(initialState, responseData)
           },
           providesTags: [commonTags.inventory],
        }),
        addStok: builder.mutation(
            {
                query: payload => ({
                url: '/addstock',
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
    })
})

export const {
    useGetStokQuery,
    useAddStokMutation,
    useUpdateStokMutation,
    useDeleteStokMutation,
    useMakeSalesMutation,
} = extendedStokApiSlice 

//returns the query result object
export const selectStokResult = extendedStokApiSlice.endpoints.getStok.select();

//Creates memoized selector
const selectStokData = createSelector(
    selectStokResult,
    stokResult => stokResult.data //normalized state object with ids & entities
)

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
    selectAll: selectStok,
    selectById: selectStokById,
    selectIds: selectStokIds
} = stokAdapter.getSelectors(state => selectStokData(state) ?? initialState);
