
import { apiSlice } from "../features/api/apiSlice";
import {tags as commonTags } from '../features/api/commonTags'

export const sharedAccountApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        register: builder.mutation({
            query: credentials => ({
                url:'/register',
                method: 'POST',
                body: { ...credentials }
            }),
            providesTags: [commonTags.profile],
        }),
        login: builder.mutation({
            query: credentials => ({
                url:'/login',
                method: 'POST',
                body: { ...credentials }
            }),
            invalidatesTags: [commonTags.profile],
        }),
        getProfile: builder.query({
            query: () => '/profile',
              async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data }  =
                    await queryFulfilled
                    dispatch(setProfile({data}))
                } catch (err) {
                  
                }
            },
           providesTags: [commonTags.profile,commonTags.inventory],
        }),
        updateProfile: builder.mutation({
            query: credentials => ({
                url:'/updateprofile',
                method: 'POST',
                body: { ...credentials }
            }),
            invalidatesTags: [commonTags.profile],
        }),
        upLoadLogo: builder.mutation({
            query: logo => ({
                url:'/uploadlogo',
                method: 'POST',
                body: {...logo}
            }),
            invalidatesTags: [commonTags.profile],
        }),
        sendLogout: builder.mutation({
            query: () => ({
                url: '/logout',
                method: 'POST'
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled
                    dispatch(logOut())
                    dispatch(apiSlice.util.resetApiState())
                } catch (err) {
                 
                }
            },
            invalidatesTags: [commonTags.profile],
        }),
        refresh: builder.mutation({
            query: () => ({
                url: '/refreshtoken',
                method: 'GET'
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled
                    const { accessToken } = data.data
                    dispatch(setCredentials({ accessToken }))
                } catch (err) {
                    console.log(err)
                }
            },
            invalidatesTags: [commonTags.profile],
        }),

    }) 
})

export const {
    useRegisterMutation,
    useLoginMutation,
    useGetProfileQuery,
    useSendLogoutMutation,
    useUpdateProfileMutation,
    useUpLoadLogoMutation,
    useRefreshMutation,
} = sharedAccountApiSlice