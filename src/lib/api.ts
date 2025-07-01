import axios from "axios";

const API_BASE_URL = process.env.EXPO_PUBLIC_ADDRESS;

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;
