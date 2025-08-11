import {
    createSelector,
     createEntityAdapter
    } from '@reduxjs/toolkit';
import { apiSlice } from './apiSlice';
import { tags as commonTags } from './commonTags'

const employeeDailyList = createEntityAdapter({
selectId: (empDailyList) => empDailyList.ID,
sortComparer: (a, b) => b.dailyEmployeeDateCreated.localeCompare(a.dailyEmployeeDateCreated)
})

const initialState = employeeDailyList.getInitialState();

export const extendedEmployeeDailyListApiSlice = apiSlice.injectEndpoints({

    endpoints: builder => ({
        getEmployeeDailyList: builder.query({
            query: () => '/employeedailylist',
            transformResponse:  responseData => {
            return employeeDailyList.setAll(initialState, responseData)
           },
           providesTags: [commonTags.inventory],
        }),
        addEmployeeDailyList: builder.mutation(
            {
                query: payload => ({
                url: '/createemployeedailylist',
                method: 'post',
                body: payload
            }
        ),
        invalidatesTags: [commonTags.inventory],
            }),

            updateEmployeeDailyList: builder.mutation(
                {
                    query: payload => ({
                    
                    url: '/updateemployeedailylist',
                    method: 'post',
                    body: payload
                }
            ),
            invalidatesTags: [commonTags.inventory],
                }),
            payEmployee: builder.mutation(
                {
                    query: payload => ({
                    
                    url: '/payemployee',
                    method: 'post',
                    body: payload
                }
            ),
            invalidatesTags: [commonTags.inventory],
                }),
            deleteEmployeeDailyList: builder.mutation(
                {
                    query: payload => ({
                    
                    url: '/deleteemployeedailylist',
                    method: 'post',
                    body: payload
                }
            ),
            invalidatesTags: [commonTags.inventory],
                }),
    })
})

export const {
    useGetEmployeeDailyListQuery,
    useAddEmployeeDailyListMutation,
    useUpdateEmployeeDailyListMutation,
    usePayEmployeeMutation,
    useDeleteEmployeeDailyListMutation,
} = extendedEmployeeDailyListApiSlice 

//returns the query result object
export const selectEmployeeDailyListResult = extendedEmployeeDailyListApiSlice.endpoints.getEmployeeDailyList.select();

//Creates memoized selector
const selectEmployeesData = createSelector(
    selectEmployeeDailyListResult,
    employeeDailyListResult => employeeDailyListResult.data //normalized state object with ids & entities
)

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
    selectAll: selectEmployeeDailyList,
    selectById: selectEmployeeListById,
    selectIds: selectEmployeeListIds
} = employeeDailyList.getSelectors(state => selectEmployeesData(state) ?? initialState);
