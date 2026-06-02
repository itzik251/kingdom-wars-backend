import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({ baseURL: BASE_URL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('kw_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const api = {
  get: (url: string) => client.get(url).then(r => r.data),
  post: (url: string, data?: any) => client.post(url, data).then(r => r.data),
  delete: (url: string) => client.delete(url).then(r => r.data),
};
