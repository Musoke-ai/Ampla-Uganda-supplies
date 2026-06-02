export const extractArray = (response) => {
  if (Array.isArray(response)) return response;

  if (!response || typeof response !== "object") return [];

  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(response.rows)) return response.rows;
  if (Array.isArray(response.records)) return response.records;
  if (Array.isArray(response.results)) return response.results;

  if (response.data && typeof response.data === "object") {
    if (Array.isArray(response.data.items)) return response.data.items;
    if (Array.isArray(response.data.rows)) return response.data.rows;
    if (Array.isArray(response.data.records)) return response.data.records;
    if (Array.isArray(response.data.results)) return response.data.results;
    if (response.data.entities && typeof response.data.entities === "object") {
      return Object.values(response.data.entities);
    }
  }

  if (response.entities && typeof response.entities === "object") {
    return Object.values(response.entities);
  }

  return [];
};

export const compareDesc = (left, right) =>
  String(right || "").localeCompare(String(left || ""));

export const compareAsc = (left, right) =>
  String(left || "").localeCompare(String(right || ""));
