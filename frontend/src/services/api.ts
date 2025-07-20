import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import toast from 'react-hot-toast'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage)
        const token = state?.token
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (error) {
        console.error('Error parsing auth storage:', error)
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    const { response } = error
    
    if (response) {
      const { status, data } = response
      
      switch (status) {
        case 401:
          // Unauthorized - clear auth and redirect to login
          localStorage.removeItem('auth-storage')
          window.location.href = '/auth/login'
          toast.error('登录已过期，请重新登录')
          break
          
        case 403:
          toast.error('权限不足，无法执行此操作')
          break
          
        case 404:
          toast.error('请求的资源不存在')
          break
          
        case 422:
          // Validation errors
          if (data.errors) {
            const errorMessages = Object.values(data.errors).flat()
            errorMessages.forEach((message: any) => toast.error(message))
          } else {
            toast.error(data.message || '请求参数错误')
          }
          break
          
        case 429:
          toast.error('请求过于频繁，请稍后再试')
          break
          
        case 500:
          toast.error('服务器内部错误，请稍后再试')
          break
          
        default:
          toast.error(data.message || '请求失败，请重试')
      }
    } else if (error.code === 'ECONNABORTED') {
      toast.error('请求超时，请检查网络连接')
    } else if (error.message === 'Network Error') {
      toast.error('网络连接失败，请检查网络')
    } else {
      toast.error('未知错误，请重试')
    }
    
    return Promise.reject(error)
  }
)

// Generic API methods
export const apiClient = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.get(url, config).then((response) => response.data),
    
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    api.post(url, data, config).then((response) => response.data),
    
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    api.put(url, data, config).then((response) => response.data),
    
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    api.patch(url, data, config).then((response) => response.data),
    
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.delete(url, config).then((response) => response.data),
}

export default api
