import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api', // Backend ka base URL
});

// Jab bhi API call hogi, ye check karega ki token hai ya nahi
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;