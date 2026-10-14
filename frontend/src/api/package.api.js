
import { create } from "axios";
import client from "./client";
import { data } from "react-router-dom";


export const packageApi = {
// Pata packages zote
getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.site_id) params.append('site_id', filters.site_id);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active);

    const response = await client.get(`/packages?${params.toString()}`);
    return response.data;
},

// Pata package moja
getOne: async (id) => {
    const response = await client.get(`/packages/${id}`);
    return response.data;
}, 

// Unda package
create: async (data) => {
    const response = await client.post('/packages', data);
    return response.data;
},

// Sahihisha package
update: async (id, data) => {
    const response = await client.put(`/packages/${id}`, data);
    return response.data;
},

// Futa package
remove: async (id) => {
    const response = await client.delete(`/packages/${id}`);
    return response.data;
},
};