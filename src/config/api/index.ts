import axios, { type AxiosInstance } from "axios";
import { config } from "@/config";
import {
  onRequest,
  onRequestError,
  onResponse,
  onResponseError,
} from "@/config/api/interceptor";

const createApiInstance = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  instance.interceptors.request.use(onRequest, onRequestError);
  instance.interceptors.response.use(onResponse, onResponseError);

  return instance;
};

const createFormDataInstance = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    // Biarkan axios menentukan Content-Type untuk FormData
  });

  instance.interceptors.request.use(onRequest, onRequestError);
  instance.interceptors.response.use(onResponse, onResponseError);
  return instance;
};

// Buat beberapa instance untuk setiap service
export const api = createApiInstance(config.API_BASE_URL);
export const api_ptk = createApiInstance(config.SERVICE_PTK);
export const api_websekolah = createApiInstance(config.SERVICE_WEBSEKOLAH);
export const api_school = createApiInstance(config.SERVICE_SCHOOL);
export const api_ppdb = createApiInstance(config.SERVICE_PPDB);
export const api_berani_cerdas = createApiInstance(
  config.SERVICE_BERANI_CERDAS
);
export const api_opendata = createApiInstance(config.SERVICE_OPENDATA);
export const api_pemetaan = createApiInstance(config.SERVICE_PEMETAAN);

export const api_message = createApiInstance(config.API_MESSAGE_URL);
export const formdata_school = createFormDataInstance(config.SERVICE_SCHOOL);
