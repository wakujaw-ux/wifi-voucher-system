import client from "./client";

export const dashboardApi = {
  getSummary: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.site_id) params.append("site_id", filters.site_id);

    const response = await client.get(
      `/dashboard/summary?${params.toString()}`,
    );
    return response.data;
  },

  getSalesChart: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.site_id) params.append("site_id", filters.site_id);
    if (filters.days) params.append("days", filters.days);

    const response = await client.get(
      `/dashboard/sales-chart?${params.toString()}`,
    );
    return response.data;
  },

  getVoucherStats: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.site_id) params.append("site_id", filters.site_id);

    const response = await client.get(
      `/dashboard/voucher-stats?${params.toString()}`,
    );
    return response.data;
  },

  getRecentActivity: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.site_id) params.append("site_id", filters.site_id);
    if (filters.limit) params.append("limit", filters.limit);

    const response = await client.get(
      `/dashboard/recent-activity?${params.toString()}`,
    );
    return response.data;
  },

  getTopPackages: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.site_id) params.append("site_id", filters.site_id);
    if (filters.limit) params.append("limit", filters.limit);

    const response = await client.get(
      `/dashboard/top-packages?${params.toString()}`,
    );
    return response.data;
  },
};
