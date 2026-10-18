import client from "./client";

export const settingsApi = {
  getAll: async () => {
    const response = await client.get("/settings");
    return response.data;
  },

  getOne: async (key) => {
    const response = await client.get(`/settings/${key}`);
    return response.data;
  },

  update: async (key, value) => {
    const response = await client.put(`/settings/${key}`, { value });
    return response.data;
  },

  updateBulk: async (settings) => {
    const response = await client.put("/settings", { settings });
    return response.data;
  },
};
