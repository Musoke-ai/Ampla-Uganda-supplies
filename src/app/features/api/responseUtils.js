export const extractArray = (response) => {
  if (Array.isArray(response)) return response;

  if (!response || typeof response !== "object") return [];

  const listKeys = [
    "data",
    "items",
    "rows",
    "records",
    "results",
    "products",
    "stock",
    "sales",
    "customers",
    "orders",
    "debts",
    "expenses",
    "employees",
    "branches",
    "categories",
    "rawMaterials",
    "materials",
    "notifications",
    "receipts",
  ];

  for (const key of listKeys) {
    if (Array.isArray(response[key])) return response[key];
  }

  if (response.data && typeof response.data === "object") {
    for (const key of listKeys) {
      if (Array.isArray(response.data[key])) return response.data[key];
    }

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
