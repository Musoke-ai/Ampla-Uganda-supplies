export const parseCurrencyInput = (value) => {
  if (value === null || value === undefined) return "";

  const normalized = String(value).replace(/,/g, "").trim();
  if (!normalized) return "";

  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : "";
};

export const formatNumberWithSeparators = (value, options = {}) => {
  const numeric = Number(String(value ?? "").replace(/,/g, ""));

  if (!Number.isFinite(numeric)) return "";

  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  });
};

export const formatCurrency = (value, currency = "UGX", options = {}) => {
  const label = currency && currency !== "none" ? currency : "UGX";
  return `${label} ${formatNumberWithSeparators(value || 0, options)}`;
};

export const formatCurrencyInputValue = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  return formatNumberWithSeparators(value);
};
