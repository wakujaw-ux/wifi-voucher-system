import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';


const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});
// ===================================================
// REQUEST INTERCEPTOR - Ongeza token kwenye kila request
// ======================================================
client.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// ==================================================================
// RESPONSE INTERCEPTOR - Kushughulikia makosa
// ==================================================================
client.interceptors.response.use(
    (response) => response,
    (error) => {
        // 401 Unauthorized - token imeisha au si sahihi
        if (error.response?.status === 401) {
            // Futa token na mpeleke kwenye login
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Kama hatuko kwenye login page, mpeleke
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        // Rudisha error kwa caller
        return Promise.reject(error);
    }
);

export default client;