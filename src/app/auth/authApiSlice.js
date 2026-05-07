
import { apiSlice } from "../features/api/apiSlice";
import { logOut, setCredentials, setRoles, setProfile, setPermissions, setUserId, setBranchScope } from "./authSlice";
import {tags as commonTags } from '../features/api/commonTags'

export const authApiSlice = apiSlice.injectEndpoints({
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
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    const { accessToken, roles, permissions, user_id, branchScope } = data?.data || {};
                    dispatch(setCredentials({ accessToken }));
                    dispatch(setUserId({ user_id }));
                    dispatch(setRoles({ roles: Array.isArray(roles) ? roles : [roles] }));
                    dispatch(setPermissions({ permissions: Array.isArray(permissions) ? permissions : [permissions] }));
                    dispatch(setBranchScope({ branchScope: branchScope ?? null }));
                } catch (err) {
                }
            },
            invalidatesTags: [commonTags.profile],
        }),
        getProfile: builder.query({
            query: () => '/profile',
              async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data }  =
                    await queryFulfilled
                    dispatch(setProfile({data}))
                    if (data?.branchScope) {
                        dispatch(setBranchScope({ branchScope: data.branchScope }));
                    }
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
        getSettings: builder.query({
            query: () => '/settings',
            providesTags: [commonTags.profile],
        }),
        updateSettings: builder.mutation({
            query: settingsPayload => ({
                url:'/settings',
                method: 'POST',
                body: { ...settingsPayload }
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
                    const { accessToken, roles, permissions, user_id, branchScope } = data?.data || {}
                    dispatch(setCredentials({ accessToken }))
                    dispatch(setUserId({ user_id }))
                    //make sure always the roles is an array
                    dispatch(setRoles({ roles: Array.isArray(roles) ? roles : [roles] }));
                    dispatch(setPermissions({ permissions: Array.isArray(permissions) ? permissions : [permissions] }));
                    dispatch(setBranchScope({ branchScope: branchScope ?? null }));
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
    useGetSettingsQuery,
    useSendLogoutMutation,
    useUpdateProfileMutation,
    useUpdateSettingsMutation,
    useUpLoadLogoMutation,
    useRefreshMutation,
} = authApiSlice
