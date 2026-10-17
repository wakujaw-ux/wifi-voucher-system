import client from "./client";

export const userApi = {
  // Pata users zote
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.site_id) params.append("site_id", filters.site_id);
    if (filters.role) params.append("role", filters.role);
    if (filters.is_active !== undefined)
      params.append("is_active", filters.is_active);
    if (filters.limit) params.append("limit", filters.limit);
    if (filters.offset) params.append("offset", filters.offset);

    const response = await client.get(`/users?${params.toString()}`);
    return response.data;
  },

  // Pata user mmoja
  getOne: async (id) => {
    const response = await client.get(`/users/${id}`);
    return response.data;
  },

  // Unda user
  create: async (data) => {
    const response = await client.post("/users", data);
    return response.data;
  },

  // Sasisha user
  update: async (id, data) => {
    const response = await client.put(`/users/${id}`, data);
    return response.data;
  },

  // Badilisha password
  changePassword: async (id, newPassword) => {
    const response = await client.post(`/users/${id}/change-password`, {
      new_password: newPassword,
    });
    return response.data;
  },

  // Futa user
  remove: async (id) => {
    const response = await client.delete(`/users/${id}`);
    return response.data;
  },
};
