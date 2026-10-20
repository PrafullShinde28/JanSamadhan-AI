import axios from 'axios';
import { getApiBaseUrl } from '../utils/network';

const client = axios.create({
  timeout: 60000,
});

// Dynamic request interceptor ensuring every request uses the correct host (localhost or LAN IP)
client.interceptors.request.use((config) => {
  if (!config.baseURL) {
    config.baseURL = getApiBaseUrl();
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = error.response?.data?.message;

    if (!message) {
      if (error.code === 'ECONNABORTED') {
        message = 'The request timed out. Please try again.';
      } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        message = `Unable to reach the backend server at ${getApiBaseUrl()}. Please verify the server is running on port 5000 and accessible across the local network.`;
      } else {
        message = 'We could not complete that request. Please try again.';
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default client;
