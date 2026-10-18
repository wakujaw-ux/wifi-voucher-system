import client from "./client";

export const expenseApi = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.site_id) params.append("site_id", filters.site_id);
    if (filters.category) params.append("category", filters.category);
    if (filters.from_date) params.append("from_date", filters.from_date);
    if (filters.to_date) params.append("to_date", filters.to_date);
    if (filters.limit) params.append("limit", filters.limit);
    if (filters.offset) params.append("offset", filters.offset);

    const response = await client.get(`/expenses?${params.toString()}`);
    return response.data;
  },

  getOne: async (id) => {
    const response = await client.get(`/expenses/${id}`);
    return response.data;
  },

  getSummary: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.site_id) params.append("site_id", filters.site_id);
    if (filters.from_date) params.append("from_date", filters.from_date);
    if (filters.to_date) params.append("to_date", filters.to_date);

    const response = await client.get(`/expenses/summary?${params.toString()}`);
    return response.data;
  },

  create: async (data) => {
    const response = await client.post("/expenses", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await client.put(`/expenses/${id}`, data);
    return response.data;
  },

  remove: async (id) => {
    const response = await client.delete(`/expenses/${id}`);
    return response.data;
  },
};
