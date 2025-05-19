import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    // timeout: 10000  // 可選：添加請求超時設定
})

// 可選：添加請求攔截器
// api.interceptors.request.use(config => {
//     // 在發送請求前做些什麼
//     return config
// })

// 可選：添加響應攔截器
// api.interceptors.response.use(
//     response => response,
//     error => Promise.reject(error)
// )

export const healthCheck = () => api.get('/health')
export const searchVideos = (query) => api.get('/api/search', { params: { q: query } })

export default api
