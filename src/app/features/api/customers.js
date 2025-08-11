import {
    createSelector,
     createEntityAdapter
    } from '@reduxjs/toolkit';
import { apiSlice } from './apiSlice';
import { tags as commonTags } from './commonTags'

const customersAdapter = createEntityAdapter({
    selectId: (customers) => customers.custId,
sortComparer: (a, b) => b.custDateCreated.localeCompare(a.custDateCreated)
})

const initialState = customersAdapter.getInitialState();

export const extendedCustomersApiSlice = apiSlice.injectEndpoints({

    endpoints: builder => ({
        getCustomers: builder.query({
            query: () => '/getcustomers',
            transformResponse:  responseData => {
            return customersAdapter.setAll(initialState, responseData)
           },
           providesTags: [commonTags.inventory],
        }),
        createCustomer: builder.mutation(
            {
                query: payload => ({
                
                url: '/addcustomer',
                method: 'post',
                body: payload
            }
        ),
        invalidatesTags: [commonTags.inventory],
            }),
            updateCustomer: builder.mutation(
                {
                    query: payload => ({
                    
                    url: '/updatecustomer',
                    method: 'post',
                    body: payload
                }
            ),
            invalidatesTags: [commonTags.inventory],
                }),
                deleteCustomer: builder.mutation(
                    {
                        query: payload => ({
                        
                        url: '/deletecustomer',
                        method: 'post',
                        body: payload
                    }
                ),
                invalidatesTags: [commonTags.inventory],
                    }),
    })
})

export const {
    useGetCustomersQuery,
    useCreateCustomerMutation,
    useUpdateCustomerMutation,
    useDeleteCustomerMutation,
} = extendedCustomersApiSlice

//returns the query result object
export const selectCustomersResult = extendedCustomersApiSlice.endpoints.getCustomers.select();

//Creates memoized selector
const selectCustomersData = createSelector(
    selectCustomersResult,
    customersResult => customersResult.data //normalized state object with ids & entities
)

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
    selectAll: selectCustomers,
    selectById: selectCustomerById,
    selectIds: selectCustomerIds
} = customersAdapter.getSelectors(state => selectCustomersData(state) ?? initialState);
