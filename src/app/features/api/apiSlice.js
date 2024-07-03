import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const baseQuery = fetchBaseQuery({
    baseUrl: 'http://localhost/mystock/api',
    // baseUrl: 'https://www.poweredstock.com/api/api',
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
        const token = getState().auth.token
        if (token) {
            headers.set("authorization", `Bearer ${token}`)
        }
        return headers
    }
})

export const apiSlice = createApi({
    reducerPath: 'api',//optional
    baseQuery,
    tagTypes:['Stock','History','Categories','Stok','Debt','Sales','Statistics','User'],
    endpoints: builder => ({})
})