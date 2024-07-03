import {
    createSelector,
     createEntityAdapter
    } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';
import { tags as commonTags } from './commonTags'

const userAdapter = createEntityAdapter({
selectId: (user) => user.busId
})

const initialState = userAdapter.getInitialState();

export const extendedUserApiSlice = apiSlice.injectEndpoints({

    endpoints: builder => ({
        getProfile: builder.query({
            query: () => '/profile',
            transformResponse:  responseData => {
            return userAdapter.setAll(initialState, responseData)
           },
        //    providesTags: [commonTags.inventory],
        }),
        updateProfile: builder.mutation(
            {
                query: payload => ({
                url: '/profileupdate',
                method: 'post',
                body: payload
            }
        ),
        // invalidatesTags: [commonTags.inventory],
            }),
    })
})

export const {
    useGetProfileQuery,
    useUpdateProfileMutation,
} = extendedUserApiSlice 

//returns the query result object
export const selectUserResult = extendedUserApiSlice.endpoints.getProfile.select();

//Creates memoized selector
const selectUserData = createSelector(
    selectUserResult,
    userResult => userResult.data //normalized state object with ids & entities
)

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
    selectAll: selectUser
} = userAdapter.getSelectors(state => selectUserData(state) ?? initialState);
