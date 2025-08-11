import {
    createSelector,
     createEntityAdapter
    } from '@reduxjs/toolkit';
import { apiSlice } from './apiSlice';
import { tags as commonTags } from './commonTags'

const rawMaterialsIntakeAdapter = createEntityAdapter({
selectId: (rawMaterialsIntake) => rawMaterialsIntake.id,
sortComparer: (a, b) => b.dailyRawmaterialsDateCreated.localeCompare(a.dailyRawmaterialsDateCreated)
})

const initialState = rawMaterialsIntakeAdapter.getInitialState();

export const extendedRawMaterialsIntakeApiSlice = apiSlice.injectEndpoints({

    endpoints: builder => ({
        getRawMaterialsList: builder.query({
            query: () => '/getRawMaterialsLists',
            transformResponse:  responseData => {
                 console.log('Intake response:', responseData); 
            return rawMaterialsIntakeAdapter.setAll(initialState, responseData)
           },
           providesTags: [commonTags.inventory],
        }),
        addRawMaterialList: builder.mutation(
            {
                query: payload => ({
                url: '/createrawmateriallist',
                method: 'post',
                body: payload
            }
        ),
        invalidatesTags: [commonTags.inventory],
            }),

            updateRawMaterialList: builder.mutation(
                {
                    query: payload => ({
                    
                    url: '/updateRawMaterialList',
                    method: 'post',
                    body: payload
                }
            ),
            invalidatesTags: [commonTags.inventory],
                }),
            deleteRawMaterialList: builder.mutation(
                {
                    query: payload => ({
                    
                    url: '/deleteRawMaterialFromList',
                    method: 'post',
                    body: payload
                }
            ),
            invalidatesTags: [commonTags.inventory],
                }),
    })
})

export const {
    useGetRawMaterialsListQuery,
    useAddRawMaterialListMutation,
    useUpdateRawMaterialListMutation,
    useDeleteRawMaterialListMutation,
} = extendedRawMaterialsIntakeApiSlice 

//returns the query result object
export const selectRawMaterialsIntakeResult = extendedRawMaterialsIntakeApiSlice.endpoints.getRawMaterialsList.select();

//Creates memoized selector
const selectRawMaterialsIntakeData = createSelector(
    selectRawMaterialsIntakeResult,
    rawMaterialsIntakeResult => rawMaterialsIntakeResult.data //normalized state object with ids & entities
)

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
    selectAll: selectRawMaterialsIntake,
    selectById: selectRawMaterialIntkeById,
    selectIds: selectRawMaterialsIntakeIds
} = rawMaterialsIntakeAdapter.getSelectors(state => selectRawMaterialsIntakeData(state) ?? initialState);
