import { apiFetch } from '@/lib/api';

export interface AuthResponse {
  message: string;
  tokens: {
    access: string;
    refresh: string;
  };
  user: {
    id: string;
    email: string;
    role: string;
    status: string;
  };
  userContext: {
    userId: string;
    email: string;
    role: string;
    status: string;
    authProvider: 'local' | 'google';
  };
}

export interface SignupData {
  email: string;
  password: string;
  name?: string;
}

export interface SigninData {
  email: string;
  password: string;
}

// Sign up with email/password
export async function signup(data: SignupData): Promise<AuthResponse> {
  const response = await apiFetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Signup failed');
  }

  return response.json();
}

// Sign in with email/password
export async function signin(data: SigninData): Promise<AuthResponse> {
  const response = await apiFetch('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Sign in failed');
  }

  return response.json();
}

// Google Sign in - FIXED: Send token in the correct header
export async function googleSignIn(googleIdToken: string): Promise<AuthResponse> {
  console.log('🔵 Sending Google ID token to backend...');
  console.log('🔍 Token preview:', googleIdToken.substring(0, 50) + '...');
  
  const response = await apiFetch('/api/auth/google-signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Google-Id-Token': googleIdToken,
    },
    body: JSON.stringify({ token: googleIdToken }), // Also send in body as backup
  });

  console.log('📡 Response status:', response.status);

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ Backend error:', error);
    throw new Error(error.message || 'Google sign in failed');
  }

  const data = await response.json();
  console.log('✅ Google sign in successful');
  return data;
}

// Verify token
export async function verifyToken(): Promise<boolean> {
  try {
    const response = await apiFetch('/api/auth/verify-token', {
      method: 'POST',
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

// Logout
export async function logout(): Promise<void> {
  const response = await apiFetch('/api/auth/signout', {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }
}

// Get current user from token (stored in cookie)
export async function getCurrentUser() {
  const response = await apiFetch('/api/auth/verify-token', {
    method: 'POST',
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.user;
}