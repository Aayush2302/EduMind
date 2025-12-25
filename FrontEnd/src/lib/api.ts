import { getAuthToken } from '@/services/authService';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  // Get token from localStorage
  const token = getAuthToken();
  
  // Merge headers properly to avoid overwriting
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {})
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    credentials: "include", // Still send cookies if backend uses them
    ...options,
    headers,
  };

  console.log('🌐 API Request:', {
    url: `${API_BASE_URL}${path}`,
    method: config.method || 'GET',
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
    headers: config.headers,
  });

  const response = await fetch(`${API_BASE_URL}${path}`, config);
  
  console.log('📨 API Response:', {
    status: response.status,
    statusText: response.statusText,
    url: response.url,
  });

  // If unauthorized, log more details
  if (response.status === 401) {
    const errorData = await response.clone().json().catch(() => null);
    console.error('🚫 Unauthorized Error:', {
      message: errorData?.message || response.statusText,
      hasToken: !!token,
      path,
    });
  }

  return response;
}

export async function getCurrentUser() {
  const response = await apiFetch('/api/auth/verify-token', {
    method: 'POST',
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.user || data.userContext;
}

// Helper function to check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

// Helper to debug auth state
export function debugAuthState() {
  const token = getAuthToken();
  console.log('🔐 Auth Debug:', {
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 30) + '...' : 'none',
    tokenLength: token?.length || 0,
    localStorage: {
      authToken: localStorage.getItem('authToken'),
      user: localStorage.getItem('user'),
    },
    cookies: document.cookie,
  });
}