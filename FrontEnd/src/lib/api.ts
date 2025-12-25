export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  // Merge headers properly to avoid overwriting
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const config: RequestInit = {
    credentials: "include",
    ...options,
    headers,
  };

  console.log('🌐 API Request:', {
    url: `${API_BASE_URL}${path}`,
    method: config.method || 'GET',
    headers: config.headers,
  });

  const response = await fetch(`${API_BASE_URL}${path}`, config);
  
  console.log('📨 API Response:', {
    status: response.status,
    statusText: response.statusText,
  });

  return response;
}