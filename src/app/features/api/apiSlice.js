import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  logOut,
  setBranchScope,
  setCredentials,
  setPermissions,
  setRoles,
  setUserId,
} from "../../auth/authSlice";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL;

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
};

const applyAuthPayload = (api, authPayload = {}) => {
  const { accessToken, roles, permissions, user_id, branchScope } = authPayload || {};

  if (!accessToken) {
    return false;
  }

  api.dispatch(setCredentials({ accessToken }));
  api.dispatch(setUserId({ user_id }));
  api.dispatch(setRoles({ roles: asArray(roles) }));
  api.dispatch(setPermissions({ permissions: asArray(permissions) }));
  api.dispatch(setBranchScope({ branchScope: branchScope ?? null }));

  return true;
};

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    //send refresh token to get new access token
    const refreshResult = await baseQuery("/refreshtoken", api, extraOptions);
    if (applyAuthPayload(api, refreshResult?.data?.data)) {

      // retry original query with new access token
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logOut());
      return {
        error: refreshResult?.error || {
          status: 401,
          data: refreshResult?.data || {
            message: "Your login has expired. Please log in again.",
          },
        },
      };
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api", //optional
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "inventory",
    "profile",
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
    "Notifications",
    "Imports",
    "CashDrawers"
  ],
  endpoints: (builder) => ({}),
});
