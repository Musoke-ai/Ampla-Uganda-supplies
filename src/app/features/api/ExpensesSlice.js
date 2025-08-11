import {
    createSelector,
     createEntityAdapter
    } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';
import { tags as commonTags } from './commonTags'

const expensesAdapter = createEntityAdapter({
selectId: (expenses) => expenses.id,
sortComparer: (a, b) => b.expenseDateCreated.localeCompare(a.expenseDateCreated)
})

const initialState = expensesAdapter.getInitialState();

export const extendedExpensesApiSlice = apiSlice.injectEndpoints({

    endpoints: builder => ({
        getExpenses: builder.query({
            query: () => '/expenses',
            transformResponse:  responseData => {
            return expensesAdapter.setAll(initialState, responseData)
           },
           providesTags: [commonTags.inventory],
        }),
        addExpense: builder.mutation(
            {
                query: payload => ({
                url: '/addexpense',
                method: 'post',
                body: payload
            }
        ),
        invalidatesTags: [commonTags.inventory],
            }),

            updateExpense: builder.mutation(
                {
                    query: payload => ({
                    
                    url: '/updateexpense',
                    method: 'post',
                    body: payload
                }
            ),
            invalidatesTags: [commonTags.inventory],
                }),
            deleteExpense: builder.mutation(
                {
                    query: payload => ({
                    
                    url: '/deleteexpense',
                    method: 'post',
                    body: payload
                }
            ),
            invalidatesTags: [commonTags.inventory],
                }),
    })
})

export const {
    useGetExpensesQuery,
    useAddExpenseMutation,
    useUpdateExpenseMutation,
    useDeleteExpenseMutation,
} = extendedExpensesApiSlice 

//returns the query result object
export const selectExpensesResult = extendedExpensesApiSlice.endpoints.getExpenses.select();

//Creates memoized selector
const selectExpensesData = createSelector(
    selectExpensesResult,
    expensesResult => expensesResult.data //normalized state object with ids & entities
)

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
    selectAll: selectExpenses,
    selectById: selectExpenseById,
    selectIds: selectExpensesIds
} = expensesAdapter.getSelectors(state => selectExpensesData(state) ?? initialState);
