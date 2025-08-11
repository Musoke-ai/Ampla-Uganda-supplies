import {
    createSelector,
     createEntityAdapter
    } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';
import { tags as commonTags } from './commonTags'

const notificationsAdapter = createEntityAdapter({
    selectId: (notifications) => notifications.id,
sortComparer: (a, b) => b.created_at.localeCompare(a.created_at)
})

const initialState = notificationsAdapter.getInitialState();

export const extendedNotificationsApiSlice = apiSlice.injectEndpoints({

    endpoints: builder => ({
        getNotifications: builder.query({
            query: () => '/fetchNotifications',
            transformResponse:  responseData => {
            return notificationsAdapter.setAll(initialState, responseData)
           },
           providesTags: [commonTags.inventory],
        }),
        updateNotification: builder.mutation(
            {
                query: payload => ({
                url: '/updateNotification',
                method: 'post',
                body: payload
            }
        ),
        invalidatesTags: [commonTags.inventory],
            }),
        deleteNotification: builder.mutation(
            {
                query: payload => ({
                url: '/deleteNotification',
                method: 'post',
                body: payload
            }
        ),
        invalidatesTags: [commonTags.inventory],
            }),
    })
})

export const {
    useGetNotificationsQuery,
    useUpdateNotificationMutation,
    useDeleteNotificationMutation
} = extendedNotificationsApiSlice 

//returns the query result object
export const selectNotificationsResult = extendedNotificationsApiSlice.endpoints.getNotifications.select();

//Creates memoized selector
const selectNotificationsData = createSelector(
    selectNotificationsResult,
    NotificationsResult => NotificationsResult.data //normalized state object with ids & entities
)

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
    selectAll: selectNotifications,
    selectById: selectNotificationById,
    selectIds: selectNotificationsIds
} = notificationsAdapter.getSelectors(state => selectNotificationsData(state) ?? initialState);
