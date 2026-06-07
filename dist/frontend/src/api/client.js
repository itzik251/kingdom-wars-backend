"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const axios_1 = require("axios");
const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const client = axios_1.default.create({ baseURL: BASE_URL });
client.interceptors.request.use((config) => {
    const token = localStorage.getItem('kw_token');
    if (token)
        config.headers.Authorization = `Bearer ${token}`;
    return config;
});
client.interceptors.response.use((r) => r, (error) => {
    const status = error?.response?.status;
    if (status === 401) {
        localStorage.removeItem('kw_token');
        if (!String(error?.config?.url || '').includes('/auth/login')) {
            window.location.reload();
        }
    }
    return Promise.reject(error);
});
exports.api = {
    get: (url) => client.get(url).then(r => r.data),
    post: (url, data) => client.post(url, data).then(r => r.data),
    delete: (url) => client.delete(url).then(r => r.data),
};
//# sourceMappingURL=client.js.map