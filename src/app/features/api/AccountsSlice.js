import {
    createSelector,
     createEntityAdapter
    } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';
import { tags as commonTags } from './commonTags'

const accountsAdapter = createEntityAdapter({
selectId: (accounts) => accounts.id,
// sortComparer: (a, b) => b.created_at.localeCompare(a.created_at)
// sortComparer: (a, b) => b.created_at.localeCompare(a.created_at)
})

const initialState = accountsAdapter.getInitialState();

export const extendedAccountsApiSlice = apiSlice.injectEndpoints({

    endpoints: builder => ({
        getAccounts: builder.query({
            query: () => '/getUsers',
            transformResponse:  responseData => {
                console.log("Accounts: "+Object.keys(responseData[0]));
            return accountsAdapter.setAll(initialState, responseData)
           },
           providesTags: [commonTags.inventory, commonTags.profile],
        }),
        getStaffOverview: builder.query({
            query: () => '/staff/overview',
            transformResponse: (responseData) => responseData?.data ?? { users: [], summary: {} },
            providesTags: ['Accounts'],
        }),
        getStaffActivity: builder.query({
            query: (userId) => `/staff/${userId}/activity`,
            transformResponse: (responseData) => responseData?.data ?? { activity: [], logins: [] },
            providesTags: (_result, _error, userId) => [{ type: 'Accounts', id: `activity-${userId}` }],
        }),
        updateStaffStatus: builder.mutation({
            query: payload => ({
                url: '/staff/status',
                method: 'post',
                body: payload
            }),
            invalidatesTags: ['Accounts', commonTags.inventory],
        }),
        uploadStaffDocuments: builder.mutation({
            query: payload => ({
                url: '/staff/documents',
                method: 'post',
                body: payload
            }),
            invalidatesTags: ['Accounts', commonTags.inventory],
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
        changePassword: builder.mutation(
            {
                query: payload => ({
                url: '/changePassword',
                method: 'post',
                body: payload
            }
        ),
        invalidatesTags: [commonTags.inventory],
            }),
        editAccount: builder.mutation(
            {
                query: payload => ({
                url: '/updateUserRoles',
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
                deleteUser: builder.mutation(
                    {
                        query: payload => ({
                        url: '/deleteUser',
                        method: 'post',
                        body: payload
                    }
                ),
                invalidatesTags: [commonTags.inventory],
                    }),
    })
})

export const {
    useGetAccountsQuery,
    useGetStaffOverviewQuery,
    useGetStaffActivityQuery,
    useUpdateStaffStatusMutation,
    useUploadStaffDocumentsMutation,
    useAddOrderMutation,
    useChangePasswordMutation,
    useEditAccountMutation,
    useUpdateOrderMutation,
    useDeleteOrderMutation,
    useDeleteUserMutation,
} = extendedAccountsApiSlice 

//returns the query result object
export const selectAccountsResult = extendedAccountsApiSlice.endpoints.getAccounts.select();

//Creates memoized selector
const selectAccountsData = createSelector(
    selectAccountsResult,
    AccountsResult => AccountsResult.data //normalized state object with ids & entities
)

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
    selectAll: selectAccounts,
    selectById: selectAccountsById,
    selectIds: selectAccountsIds
} = accountsAdapter.getSelectors(state => selectAccountsData(state) ?? initialState);
