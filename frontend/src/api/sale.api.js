import client from "./client";

export const saleApi = {
  // Pata mauzo yote
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.site_id) params.append("site_id", filters.site_id);
    if (filters.operator_id) params.append("operator_id", filters.operator_id);
    if (filters.from_date) params.append("from_date", filters.from_date);
    if (filters.to_date) params.append("to_date", filters.to_date);
    if (filters.limit) params.append("limit", filters.limit);
    if (filters.offset) params.append("offset", filters.offset);

    const response = await client.get(`/sales?${params.toString()}`);
    return response.data;
  },

  // Pata mauzo moja
  getOne: async (id) => {
    const response = await client.get(`/sales/${id}`);
    return response.data;
  },

  // Summary
  getSummary: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.site_id) params.append("site_id", filters.site_id);
    if (filters.from_date) params.append("from_date", filters.from_date);
    if (filters.to_date) params.append("to_date", filters.to_date);

    const response = await client.get(`/sales/summary?${params.toString()}`);
    return response.data;
  },
};
