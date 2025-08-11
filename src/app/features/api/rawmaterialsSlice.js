import {
    createSelector,
     createEntityAdapter
    } from '@reduxjs/toolkit';
import { apiSlice } from './apiSlice';
import { tags as commonTags } from './commonTags'

const rawMaterialsAdapter = createEntityAdapter({
selectId: (rawMaterials) => rawMaterials.materialId,
sortComparer: (a, b) => b.rawMaterialDateCreated.localeCompare(a.rawMaterialDateCreated)
})

const initialState = rawMaterialsAdapter.getInitialState();

export const extendedRawMaterialsApiSlice = apiSlice.injectEndpoints({

    endpoints: builder => ({
        getRawMaterials: builder.query({
            query: () => '/rawmaterials',
            transformResponse:  responseData => {
            return rawMaterialsAdapter.setAll(initialState, responseData)
           },
           providesTags: [commonTags.inventory],
        }),
        addRawMaterial: builder.mutation(
            {
                query: payload => ({
                url: '/addrawmaterial',
                method: 'post',
                body: payload
            }
        ),
        invalidatesTags: [commonTags.inventory],
            }),

            updateRawMaterial: builder.mutation(
                {
                    query: payload => ({
                    
                    url: '/updaterawmaterial',
                    method: 'post',
                    body: payload
                }
            ),
            invalidatesTags: [commonTags.inventory],
                }),
            deleteRawMaterial: builder.mutation(
                {
                    query: payload => ({
                    
                    url: '/deleterawmaterial',
                    method: 'post',
                    body: payload
                }
            ),
            invalidatesTags: [commonTags.inventory],
                }),
    })
})

export const {
    useGetRawMaterialsQuery,
    useAddRawMaterialMutation,
    useUpdateRawMaterialMutation,
    useDeleteRawMaterialMutation,
} = extendedRawMaterialsApiSlice 

//returns the query result object
export const selectRawMaterialsResult = extendedRawMaterialsApiSlice.endpoints.getRawMaterials.select();

//Creates memoized selector
const selectRawMaterialsData = createSelector(
    selectRawMaterialsResult,
    rawMaterialsResult => rawMaterialsResult.data //normalized state object with ids & entities
)

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
    selectAll: selectRawMaterials,
    selectById: selectRawMaterialById,
    selectIds: selectRawMaterialsIds
} = rawMaterialsAdapter.getSelectors(state => selectRawMaterialsData(state) ?? initialState);
