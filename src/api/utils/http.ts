import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export class HttpClient {
    async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response: AxiosResponse<T> = await axios.get(url, config);
            return response.data;
        } catch (error: any) {
            console.error(`HTTP GET error: ${error.message}`, error.response?.data || '');
            throw error;
        }
    }

    async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response: AxiosResponse<T> = await axios.post(url, data, config);
            return response.data;
        } catch (error: any) {
            console.error(`HTTP POST error: ${error.message}`, error.response?.data || '');
            throw error;
        }
    }
}

export const httpClient = new HttpClient();
