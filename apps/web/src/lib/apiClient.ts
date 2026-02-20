import axios from 'axios';
import { auth } from './firebase';
import { config } from '../config';

const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
});

apiClient.interceptors.request.use(async (req) => {
  const token = await auth.currentUser?.getIdToken();
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default apiClient;
