import {
    createSelector,
     createEntityAdapter
    } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';
import { tags as commonTags } from './commonTags'

const categoriesAdapter = createEntityAdapter({
    selectId: (categories) => categories.categoryId,
sortComparer: (a, b) => b.categoryDateCreated.localeCompare(a.categoryDateCreated)
})

const initialState = categoriesAdapter.getInitialState();

export const extendedCatApiSlice = apiSlice.injectEndpoints({

    endpoints: builder => ({
        getCategories: builder.query({
            query: () => '/categories',
            transformResponse:  responseData => {
            return categoriesAdapter.setAll(initialState, responseData)
           },
           providesTags: [commonTags.inventory],
        }),
    })
})

export const {
    useGetCategoriesQuery,
} = extendedCatApiSlice 

//returns the query result object
export const selectCategoriesResult = extendedCatApiSlice.endpoints.getCategories.select();

//Creates memoized selector
const selectCategoriesData = createSelector(
    selectCategoriesResult,
    categoriesResult => categoriesResult.data //normalized state object with ids & entities
)

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
    selectAll: selectCategories,
    selectById: selectCategoriesById,
    selectIds: selectCategoriesIds
} = categoriesAdapter.getSelectors(state => selectCategoriesData(state) ?? initialState);
