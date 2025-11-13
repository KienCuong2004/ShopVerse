export const formatCurrency = (value?: number | null): string => {
  const amount = typeof value === "number" && !Number.isNaN(value) ? value : 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(amount);
};
