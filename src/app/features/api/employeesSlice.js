import {
    createSelector,
     createEntityAdapter
    } from '@reduxjs/toolkit';
import { apiSlice } from './apiSlice';
import { tags as commonTags } from './commonTags'

const employeesAdapter = createEntityAdapter({
selectId: (employees) => employees.empID,
sortComparer: (a, b) => b.empDateCreated.localeCompare(a.empDateCreated)
})

const initialState = employeesAdapter.getInitialState();

export const extendedEmployeesApiSlice = apiSlice.injectEndpoints({

    endpoints: builder => ({
        getEmployees: builder.query({
            query: () => '/employees',
            transformResponse:  responseData => {
            return employeesAdapter.setAll(initialState, responseData)
           },
           providesTags: [commonTags.inventory],
        }),
        addEmployee: builder.mutation(
            {
                query: payload => ({
                url: '/addemployee',
                method: 'post',
                body: payload
            }
        ),
        invalidatesTags: [commonTags.inventory],
            }),

            updateEmployee: builder.mutation(
                {
                    query: payload => ({
                    
                    url: '/updateemployee',
                    method: 'post',
                    body: payload
                }
            ),
            invalidatesTags: [commonTags.inventory],
                }),
            deleteEmployee: builder.mutation(
                {
                    query: payload => ({
                    
                    url: '/deleteemployee',
                    method: 'post',
                    body: payload
                }
            ),
            invalidatesTags: [commonTags.inventory],
                }),
    })
})

export const {
    useGetEmployeesQuery,
    useAddEmployeeMutation,
    useUpdateEmployeeMutation,
    useDeleteEmployeeMutation,
} = extendedEmployeesApiSlice 

//returns the query result object
export const selectEmployeesResult = extendedEmployeesApiSlice.endpoints.getEmployees.select();

//Creates memoized selector
const selectEmployeesData = createSelector(
    selectEmployeesResult,
    employeesResult => employeesResult.data //normalized state object with ids & entities
)

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
    selectAll: selectEmployees,
    selectById: selectEmployeeById,
    selectIds: selectEmployeesIds
} = employeesAdapter.getSelectors(state => selectEmployeesData(state) ?? initialState);
