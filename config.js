export const config = {
    // API 設定
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080',
    
    // API 路徑
    apiEndpoints: {
        videos: '/api/videos',
        search: '/api/search',
        transcripts: '/api/transcripts'
    }
}