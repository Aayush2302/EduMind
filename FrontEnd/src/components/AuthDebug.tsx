/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/services/authService';
import { debugAuthState } from '@/lib/api';
import { getAuthToken } from '@/services/authService';

/**
 * Temporary component to debug authentication issues
 * Remove this once auth is working
 */
export function AuthDebug() {
  const [authInfo, setAuthInfo] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setError(null);
    
    // Get auth token
    const token = getAuthToken();
    
    // Get cookies
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      acc[name] = value;
      return acc;
    }, {} as Record<string, string>);

    // Get localStorage
    const localStorageData = {
      authToken: localStorage.getItem('authToken'),
      user: localStorage.getItem('user'),
    };

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err: any) {
      setError(err.message || 'Failed to verify user');
      console.error('Failed to get current user:', err);
    }

    setAuthInfo({
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 30)}...` : 'No token',
      tokenLength: token?.length || 0,
      cookies,
      localStorage: localStorageData,
      hasCookies: document.cookie.length > 0,
      cookieCount: Object.keys(cookies).length,
    });
  };

  const handleClearAuth = () => {
    localStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    checkAuth();
  };

  return (
    <Card className="p-6 mb-6 bg-yellow-50 border-yellow-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-yellow-900">
            🔍 Authentication Debug Info
          </h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={checkAuth}>
              Refresh
            </Button>
            <Button size="sm" variant="destructive" onClick={handleClearAuth}>
              Clear Auth
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            ❌ Error: {error}
          </div>
        )}

        <div className="space-y-3 text-sm">
          <div>
            <strong className="text-yellow-900">Authentication Status:</strong>
            <div className="mt-1 p-2 bg-white rounded">
              {authInfo?.hasToken ? (
                <span className="text-green-600">✅ Token Found</span>
              ) : (
                <span className="text-red-600">❌ No Token (This is the problem!)</span>
              )}
            </div>
          </div>

          <div>
            <strong className="text-yellow-900">Current User:</strong>
            <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto max-h-32">
              {user ? JSON.stringify(user, null, 2) : 'Not logged in or token invalid'}
            </pre>
          </div>

          <div>
            <strong className="text-yellow-900">Token Info:</strong>
            <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto">
              {authInfo ? JSON.stringify({
                hasToken: authInfo.hasToken,
                tokenPreview: authInfo.tokenPreview,
                tokenLength: authInfo.tokenLength
              }, null, 2) : 'Loading...'}
            </pre>
          </div>

          <div>
            <strong className="text-yellow-900">localStorage:</strong>
            <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto">
              {authInfo?.localStorage ? JSON.stringify(authInfo.localStorage, null, 2) : '{}'}
            </pre>
          </div>

          <div>
            <strong className="text-yellow-900">Cookies ({authInfo?.cookieCount || 0}):</strong>
            <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto max-h-32">
              {authInfo?.cookies && Object.keys(authInfo.cookies).length > 0
                ? JSON.stringify(authInfo.cookies, null, 2)
                : 'No cookies'}
            </pre>
          </div>

          <div className="pt-2 border-t border-yellow-200">
            <p className="text-xs text-yellow-800">
              💡 <strong>What to check:</strong>
            </p>
            <ul className="text-xs text-yellow-700 space-y-1 mt-1 ml-4 list-disc">
              <li>After login, check if "authToken" appears in localStorage</li>
              <li>Token should be sent in Authorization: Bearer header</li>
              <li>Backend should read from Authorization header or cookie</li>
              <li>Check browser Network tab for the token in request headers</li>
            </ul>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            debugAuthState();
            console.log('Check console for detailed auth info');
          }}
        >
          Log to Console
        </Button>
      </div>
    </Card>
  );
}