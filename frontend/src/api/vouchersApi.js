import client from './client';

export const voucherApi = {
  // Pata vocha zote
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.site_id) params.append('site_id', filters.site_id);
    if (filters.package_id) params.append('package_id', filters.package_id);
    if (filters.batch_id) params.append('batch_id', filters.batch_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const response = await client.get(`/vouchers?${params.toString()}`);
    return response.data;
  },

  // Pata voucher moja
  getOne: async (id) => {
    const response = await client.get(`/vouchers/${id}`);
    return response.data;
  },

  // Pata kwa code
  getByCode: async (code) => {
    const response = await client.get(`/vouchers/code/${code}`);
    return response.data;
  },

  // Stats
  getStats: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.site_id) params.append('site_id', filters.site_id);
    if (filters.package_id) params.append('package_id', filters.package_id);

    const response = await client.get(`/vouchers/stats?${params.toString()}`);
    return response.data;
  },

  // Generate vocha
  generate: async (data) => {
    const response = await client.post('/vouchers/generate', data);
    return response.data;
  },

  // Sell voucher
  sell: async (id, data) => {
    const response = await client.post(`/vouchers/${id}/sell`, data);
    return response.data;
  },

  // Revoke voucher
  revoke: async (id, data) => {
    const response = await client.post(`/vouchers/${id}/revoke`, data);
    return response.data;
  },
};