import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({ baseURL: BASE_URL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('kw_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 the saved token is stale/invalid — clear it and reload so the app
// re-authenticates through Telegram instead of getting stuck.
client.interceptors.response.use(
  (r) => r,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      localStorage.removeItem('kw_token');
      // Avoid an infinite reload loop on the login endpoint itself.
      if (!String(error?.config?.url || '').includes('/auth/login')) {
        window.location.reload();
      }
    }
    return Promise.reject(error);
  },
);

export const api = {
  get: (url: string) => client.get(url).then(r => r.data),
  post: (url: string, data?: any) => client.post(url, data).then(r => r.data),
  patch: (url: string, data?: any) => client.patch(url, data).then(r => r.data),
  delete: (url: string) => client.delete(url).then(r => r.data),
};
