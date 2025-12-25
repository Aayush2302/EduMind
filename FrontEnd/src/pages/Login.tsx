/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { signin, googleSignIn } from "@/services/authService";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const LoginForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log('🔐 Starting email/password login...');
      const response = await signin({ email, password });
      
      console.log('✅ Login successful');
      console.log('📦 Response:', {
        hasTokens: !!response.tokens,
        hasUser: !!response.user,
        tokenPreview: response.tokens?.access?.substring(0, 30) + '...'
      });
      
      // Store user info in localStorage (optional, for UI display)
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
        console.log('👤 User info stored');
      }
      
      // Token is already stored by authService.signin()
      
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      toast.error(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsGoogleLoading(true);
    
    try {
      console.log('🎯 Google Login Success!');
      console.log('📦 Credential Response:', credentialResponse);
      console.log('🔑 ID Token exists:', !!credentialResponse.credential);
      
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }
      
      const response = await googleSignIn(credentialResponse.credential);
      
      console.log('✅ Google sign in successful');
      console.log('📦 Response:', {
        hasTokens: !!response.tokens,
        hasUser: !!response.user,
        tokenPreview: response.tokens?.access?.substring(0, 30) + '...'
      });
      
      // Store user info in localStorage (optional, for UI display)
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
        console.log('👤 User info stored');
      }
      
      // Token is already stored by authService.googleSignIn()
      
      toast.success("Signed in with Google!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error('❌ Google Sign In Error:', error);
      toast.error(error.message || "Google sign in failed");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error('❌ Google authentication failed');
    toast.error("Google sign in failed");
    setIsGoogleLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-semibold text-foreground">
            EduMind
          </Link>
          <p className="text-text-secondary mt-2">Sign in to your account</p>
        </div>

        {/* Google Sign-in Button */}
        <div className="mb-4">
          {isGoogleLoading ? (
            <Button className="w-full" disabled>
              Signing in with Google...
            </Button>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              size="large"
              text="continue_with"
              shape="rectangular"
              logo_alignment="left"
              width="100%"
            />
          )}
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-text-muted">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm text-text-secondary">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm text-text-secondary">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            variant="hero-primary"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          Don't have an account?{" "}
          <Link to="/register" className="text-text-secondary hover:text-foreground">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

const Login = () => {
  if (!GOOGLE_CLIENT_ID) {
    console.warn("⚠️ Google Client ID not configured");
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LoginForm />
    </GoogleOAuthProvider>
  );
};

export default Login;