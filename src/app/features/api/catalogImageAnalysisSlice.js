import { apiSlice } from "./apiSlice";

export const catalogImageAnalysisApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    analyzeCatalogImage: builder.mutation({
      query: ({ image, type, branchId }) => {
        const formData = new FormData();
        formData.append("image", image);
        formData.append("type", type);
        if (branchId) formData.append("branchId", branchId);

        return {
          url: "/catalog/analyze-image",
          method: "post",
          body: formData,
        };
      },
    }),
  }),
});

export const { useAnalyzeCatalogImageMutation } = catalogImageAnalysisApiSlice;
