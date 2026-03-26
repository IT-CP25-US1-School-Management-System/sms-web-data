import type { AddressRowResponse } from '@/types/address'
import axios, { type AxiosInstance, type AxiosResponse } from 'axios'

const DATA_BASE_URL = import.meta.env.VITE_API_BASE_URL_ADDRESS

export const addressApiInstance: AxiosInstance = axios.create({
  baseURL: DATA_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

addressApiInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    console.error('DATA API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  },
)

export async function listAddressRow<T = Record<string, any>>(
): Promise<AddressRowResponse<T>> {
  const response = await addressApiInstance.get<AddressRowResponse<T>>(
    `/latest/sub_district_with_district_and_province.json`,
  )
  return response.data
}