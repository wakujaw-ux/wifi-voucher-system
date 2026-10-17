import client from "./client";

const buildParams = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.site_id) params.append("site_id", filters.site_id);
  if (filters.from_date) params.append("from_date", filters.from_date);
  if (filters.to_date) params.append("to_date", filters.to_date);
  if (filters.group_by) params.append("group_by", filters.group_by);
  return params.toString();
};

export const reportApi = {
  sales: async (filters = {}) => {
    const response = await client.get(`/reports/sales?${buildParams(filters)}`);
    return response.data;
  },

  vouchers: async (filters = {}) => {
    const response = await client.get(
      `/reports/vouchers?${buildParams(filters)}`,
    );
    return response.data;
  },

  revenue: async (filters = {}) => {
    const response = await client.get(
      `/reports/revenue?${buildParams(filters)}`,
    );
    return response.data;
  },

  sessions: async (filters = {}) => {
    const response = await client.get(
      `/reports/sessions?${buildParams(filters)}`,
    );
    return response.data;
  },

  expenses: async (filters = {}) => {
    const response = await client.get(
      `/reports/expenses?${buildParams(filters)}`,
    );
    return response.data;
  },

  profitLoss: async (filters = {}) => {
    const response = await client.get(
      `/reports/profit-loss?${buildParams(filters)}`,
    );
    return response.data;
  },
};
