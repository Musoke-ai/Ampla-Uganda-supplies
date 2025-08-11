import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setCredentials } from "../../auth/authSlice";

const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost/mystock/api",
  // baseUrl: 'https://www.poweredstock.com/api/api',
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    //send refresh token to get new access token
    const refreshResult = await baseQuery("/refreshtoken", api, extraOptions);
    if (refreshResult?.data?.data?.accessToken) {
      // store the new token
      const accessToken = refreshResult?.data?.data?.accessToken;
      api.dispatch(setCredentials({ accessToken }));

      // retry original query with new access token
      result = await baseQuery(args, api, extraOptions);
    } else {
      // refreshResult?.error?.data?.message = "Your login has expired. "

      return refreshResult;
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api", //optional
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Stock",
    "History",
    "Categories",
    "Stok",
    "Debt",
    "Sales",
    "Statistics",
    "User",
    "Customers",
    "RawMaterials",
    "RawMaterialsIntake",
    "Employees",
    "Expenses",
    "EmpDailyList",
    "Orders",
    "Accounts",
    "Notifications"
  ],
  endpoints: (builder) => ({}),
});
