import { apiSlice } from "../api/apiSlice";

export const agentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sendAgentMessage: builder.mutation({
      query: (payload) => ({
        url: "/agent/chat",
        method: "POST",
        body: payload,
      }),
    }),
    getAgentBriefing: builder.query({
      query: ({ period = "today" } = {}) =>
        `/agent/briefing?period=${encodeURIComponent(period)}`,
    }),
    getAgentTools: builder.query({
      query: () => "/agent/tools",
    }),
    getAgentDraft: builder.query({
      query: (draftKey) => `/agent/drafts/${draftKey}`,
    }),
    listAgentDrafts: builder.query({
      query: ({ status = "active", limit = 20 } = {}) =>
        `/agent/drafts?status=${encodeURIComponent(status)}&limit=${encodeURIComponent(limit)}`,
    }),
    confirmAgentDraft: builder.mutation({
      query: (payload) => ({
        url: "/agent/drafts/confirm",
        method: "POST",
        body: payload,
      }),
    }),
    cancelAgentDraft: builder.mutation({
      query: (payload) => ({
        url: "/agent/drafts/cancel",
        method: "POST",
        body: payload,
      }),
    }),
    executeAgentDraft: builder.mutation({
      query: (payload) => ({
        url: "/agent/drafts/execute",
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

export const {
  useSendAgentMessageMutation,
  useGetAgentBriefingQuery,
  useGetAgentToolsQuery,
  useGetAgentDraftQuery,
  useListAgentDraftsQuery,
  useConfirmAgentDraftMutation,
  useCancelAgentDraftMutation,
  useExecuteAgentDraftMutation,
} = agentApiSlice;
