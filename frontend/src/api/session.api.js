import client from "./client";

export const sessionApi = {
  // Active sessions
  getActive: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.site_id) params.append("site_id", filters.site_id);
    if (filters.limit) params.append("limit", filters.limit);

    const response = await client.get(`/sessions/active?${params.toString()}`);
    return response.data;
  },

  // All sessions (history)
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.site_id) params.append("site_id", filters.site_id);
    if (filters.status) params.append("status", filters.status);
    if (filters.from_date) params.append("from_date", filters.from_date);
    if (filters.to_date) params.append("to_date", filters.to_date);
    if (filters.limit) params.append("limit", filters.limit);
    if (filters.offset) params.append("offset", filters.offset);

    const response = await client.get(`/sessions?${params.toString()}`);
    return response.data;
  },

  // Get one
  getOne: async (id) => {
    const response = await client.get(`/sessions/${id}`);
    return response.data;
  },

  // Stats
  getStats: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.site_id) params.append("site_id", filters.site_id);
    if (filters.from_date) params.append("from_date", filters.from_date);
    if (filters.to_date) params.append("to_date", filters.to_date);

    const response = await client.get(`/sessions/stats?${params.toString()}`);
    return response.data;
  },

  // Disconnect
  disconnect: async (id, data = {}) => {
    const response = await client.post(`/sessions/${id}/disconnect`, data);
    return response.data;
  },

  // Expire stale
  expireStale: async () => {
    const response = await client.post("/sessions/expire-stale");
    return response.data;
  },
};
