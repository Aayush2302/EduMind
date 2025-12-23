import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcryptjs";
import { User } from "../../models/User.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Cookie configuration
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
};

// Refresh token cookie (longer expiry)
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/'
};

// Helper function to extract token from request
const extractTokenFromRequest = (req: Request): string | null => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const parts = authHeader.split(' ');
        return parts.length > 1 && parts[1] ? parts[1] : null;
    }
    
    const googleIdToken = req.headers['x-google-id-token'] as string;
    if (googleIdToken) {
        return googleIdToken;
    }
    
    const cookieToken = req.cookies?.authToken;
    if (cookieToken) {
        return cookieToken;
    }
    
    const bodyToken = req.body?.token;
    if (bodyToken) {
        return bodyToken;
    }
    
    return null;
};

// Helper function to set authentication cookies
const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
    res.cookie('authToken', accessToken, COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    console.log('🍪 Authentication cookies set');
};

// Helper function to clear authentication cookies
const clearAuthCookies = (res: Response) => {
    res.clearCookie('authToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    console.log('🍪 Authentication cookies cleared');
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('=== Google Login Request Started ===');
        console.log('Request headers (auth-related):', {
            authorization: req.headers.authorization,
            'x-google-id-token': req.headers['x-google-id-token'],
            cookie: req.headers.cookie
        });
        
        const token = extractTokenFromRequest(req);

        if (!token) {
            console.error('❌ No token provided');
            res.status(400).json({
                message: "Google ID token is required",
                error: "Provide token in Authorization header, X-Google-Id-Token header, or request body"
            });
            return;
        }

        console.log('🔍 Token received (first 50 chars):', token.substring(0, 50) + '...');

        // Verify Google ID token
        console.log('🔐 Verifying Google ID token...');
        if (!process.env.GOOGLE_CLIENT_ID) {
            console.error('❌ GOOGLE_CLIENT_ID not configured');
            throw new Error("GOOGLE_CLIENT_ID not configured");
        }

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        console.log('📋 Google payload received');

        if (!payload) {
            console.error('❌ Invalid Google token - no payload');
            throw new Error("Invalid Google token - no payload received");
        }

        const { sub, email, email_verified } = payload;

        console.log('📊 Extracted fields:', { sub, email, email_verified });

        if (!sub) {
            console.error('❌ Missing sub (Google ID) in payload');
            throw new Error("Missing Google ID in token payload");
        }

        if (!email) {
            console.error('❌ Missing email in payload');
            throw new Error("Missing email in token payload");
        }

        // Check if user exists with Google ID
        console.log('🔍 Checking if user exists with Google ID:', sub);
        let user = await User.findOne({ 'authProviders.google.googleId': sub });
        
        if (!user) {
            console.log('👤 User not found with Google ID, checking email...');
            
            // Check if email exists with any provider
            user = await User.findOne({ email });
            
            if (user) {
                // Email exists - check if it's already linked to Google
                if (user.authProviders?.google?.googleId) {
                    console.log('⚠️ Email exists with different Google account');
                    res.status(409).json({
                        message: "Email already registered with different Google account"
                    });
                    return;
                }
                
                // Email exists with local auth - link Google account
                console.log('🔗 Linking Google account to existing user...');
                user.authProviders = user.authProviders || {};
                user.authProviders.google = { googleId: sub };
                await user.save();
                console.log('✅ Google account linked successfully');
            } else {
                // Create new user with Google auth
                console.log('📝 Creating new user with Google auth...');
                user = await User.create({
                    email,
                    authProviders: {
                        google: { googleId: sub }
                    },
                    role: 'student',
                    status: 'active'
                });
                console.log('✅ New user created successfully with ID:', user._id);
            }
        } else {
            console.log('✅ Existing user found');
        }

        // Check if user is blocked
        if (user.status === 'blocked') {
            console.log('🚫 User is blocked');
            res.status(403).json({
                message: "Account has been blocked. Please contact support."
            });
            return;
        }

        // Create JWT payload
        const jwtPayload = {
            id: user._id,
            email: user.email,
            role: user.role,
            status: user.status,
            type: 'access'
        };

        const refreshPayload = {
            id: user._id,
            email: user.email,
            type: 'refresh'
        };

        console.log('🔐 Creating JWT tokens...');

        if (!process.env.JWT_SECRET) {
            console.error('❌ JWT_SECRET not configured');
            throw new Error("JWT_SECRET not configured");
        }

        const accessToken = jwt.sign(jwtPayload, process.env.JWT_SECRET!, {
            expiresIn: "15m"
        });

        const refreshToken = jwt.sign(refreshPayload, process.env.JWT_SECRET!, {
            expiresIn: "30d"
        });

        console.log('✅ JWT tokens created successfully');

        setAuthCookies(res, accessToken, refreshToken);

        const responseData = {
            message: "Login successful",
            tokens: {
                access: accessToken,
                refresh: refreshToken
            },
            user: jwtPayload,
            userContext: {
                userId: user._id,
                email: user.email,
                role: user.role,
                status: user.status,
                authProvider: 'google'
            }
        };

        console.log('📤 Sending successful response');
        res.status(200).json(responseData);

        console.log('=== Google Login Request Completed Successfully ===');

    } catch (err: any) {
        console.error('=== Google Login Error ===');
        console.error('Error message:', err.message);

        clearAuthCookies(res);

        let statusCode = 500;
        if (err.message?.includes('Token is required') || err.message?.includes('Missing')) {
            statusCode = 400;
        } else if (err.message?.includes('Invalid token') || err.message?.includes('audience')) {
            statusCode = 401;
        } else if (err.message?.includes('already registered')) {
            statusCode = 409;
        }

        res.status(statusCode).json({
            message: "Login failed",
            error: err.message || "Internal Server Error",
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });

        console.log('=== Google Login Request Failed ===');
    }
};

export const verifyToken = (req: Request, res: Response): void => {
    try {
        console.log('=== Token Verification Started ===');
        
        const token = extractTokenFromRequest(req);
        
        if (!token) {
            console.error('❌ No token provided');
            res.status(401).json({ 
                message: 'Token missing',
                error: 'Provide token in Authorization header or cookie'
            });
            return;
        }

        console.log('🔍 Token received (first 50 chars):', token.substring(0, 50) + '...');

        if (!process.env.JWT_SECRET) {
            console.error('❌ JWT_SECRET not configured');
            res.status(500).json({ message: 'Server configuration error' });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        console.log('✅ Token verified successfully');

        res.status(200).json({ 
            valid: true, 
            user: decoded,
            userContext: decoded
        });
        console.log('=== Token Verification Completed Successfully ===');

    } catch (err: any) {
        console.error('=== Token Verification Error ===');
        console.error('Error message:', err.message);

        res.status(401).json({ 
            message: 'Invalid token', 
            error: err.message,
            type: err.name 
        });
        console.log('=== Token Verification Failed ===');
    }
};

export const signup = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('=== Signup Request Started ===');
        
        const { email, password } = req.body;

        if (!email || !password) {
            console.error('❌ Missing required fields');
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }

        // Validate password strength
        if (password.length < 8) {
            res.status(400).json({ message: 'Password must be at least 8 characters long' });
            return;
        }

        console.log('🔍 Checking for existing user with email:', email);
        const existing = await User.findOne({ email });
        if (existing) {
            console.log('⚠️ Email already registered');
            res.status(409).json({ message: 'Email already registered' });
            return;
        }

        // Hash password
        console.log('🔐 Hashing password...');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        console.log('👤 Creating new user...');
        const user = await User.create({ 
            email, 
            authProviders: {
                local: { passwordHash }
            },
            role: 'student',
            status: 'active'
        });
        console.log('✅ User created successfully with ID:', user._id);

        const accessPayload = { 
            id: user._id, 
            email: user.email,
            role: user.role,
            status: user.status,
            type: 'access'
        };

        const refreshPayload = {
            id: user._id,
            email: user.email,
            type: 'refresh'
        };

        console.log('🔐 Creating JWT tokens...');

        if (!process.env.JWT_SECRET) {
            console.error('❌ JWT_SECRET not configured');
            throw new Error("JWT_SECRET not configured");
        }

        const accessToken = jwt.sign(accessPayload, process.env.JWT_SECRET!, { expiresIn: '15m' });
        const refreshToken = jwt.sign(refreshPayload, process.env.JWT_SECRET!, { expiresIn: '30d' });
        console.log('✅ JWT tokens created successfully');

        setAuthCookies(res, accessToken, refreshToken);

        res.status(201).json({ 
            message: 'Signup successful', 
            tokens: {
                access: accessToken,
                refresh: refreshToken
            },
            user: accessPayload,
            userContext: {
                userId: user._id,
                email: user.email,
                role: user.role,
                status: user.status,
                authProvider: 'local'
            }
        });
        console.log('=== Signup Request Completed Successfully ===');

    } catch (err: any) {
        console.error('=== Signup Error ===');
        console.error('Error message:', err.message);

        clearAuthCookies(res);

        if (err.code === 11000) {
            console.error('💥 Duplicate key error - email already exists');
            res.status(409).json({ message: 'Email already registered' });
        } else {
            res.status(500).json({ message: 'Signup failed', error: err.message });
        }
        console.log('=== Signup Request Failed ===');
    }
};

export const signin = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('=== Signin Request Started ===');
        
        const { email, password } = req.body;

        if (!email || !password) {
            console.error('❌ Missing email or password');
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }

        console.log('🔍 Looking for user with email:', email);
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('❌ User not found');
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        // Check if user is blocked
        if (user.status === 'blocked') {
            console.log('🚫 User is blocked');
            res.status(403).json({
                message: "Account has been blocked. Please contact support."
            });
            return;
        }

        // Check if user has local auth
        if (!user.authProviders?.local?.passwordHash) {
            console.log('❌ User has no local auth (likely OAuth user)');
            res.status(401).json({ 
                message: 'Invalid credentials',
                hint: 'This account uses Google Sign-In'
            });
            return;
        }

        console.log('🔐 Comparing passwords...');
        const isMatch = await bcrypt.compare(password, user.authProviders.local.passwordHash);
        
        if (!isMatch) {
            console.log('❌ Password mismatch');
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        console.log('✅ Password match');

        const accessPayload = { 
            id: user._id, 
            email: user.email,
            role: user.role,
            status: user.status,
            type: 'access'
        };

        const refreshPayload = {
            id: user._id,
            email: user.email,
            type: 'refresh'
        };

        console.log('🔐 Creating JWT tokens...');

        if (!process.env.JWT_SECRET) {
            console.error('❌ JWT_SECRET not configured');
            throw new Error("JWT_SECRET not configured");
        }

        const accessToken = jwt.sign(accessPayload, process.env.JWT_SECRET!, { expiresIn: '15m' });
        const refreshToken = jwt.sign(refreshPayload, process.env.JWT_SECRET!, { expiresIn: '30d' });
        console.log('✅ JWT tokens created successfully');

        setAuthCookies(res, accessToken, refreshToken);

        res.status(200).json({ 
            message: 'Login successful', 
            tokens: {
                access: accessToken,
                refresh: refreshToken
            },
            user: accessPayload,
            userContext: {
                userId: user._id,
                email: user.email,
                role: user.role,
                status: user.status,
                authProvider: 'local'
            }
        });
        console.log('=== Signin Request Completed Successfully ===');

    } catch (err: any) {
        console.error('=== Signin Error ===');
        console.error('Error message:', err.message);

        clearAuthCookies(res);

        res.status(500).json({ message: 'Login failed', error: err.message });
        console.log('=== Signin Request Failed ===');
    }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('=== Logout Request Started ===');
        
        const token = extractTokenFromRequest(req);
        
        if (!token) {
            console.log('⚠️ No token provided');
            clearAuthCookies(res);
            res.status(200).json({ 
                message: 'Logout successful',
                note: 'No active session found'
            });
            return;
        }

        console.log('🔍 Token received for logout');

        try {
            if (!process.env.JWT_SECRET) {
                console.error('❌ JWT_SECRET not configured');
                throw new Error("JWT_SECRET not configured");
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
            console.log('🔐 Token verified, user:', decoded.email);

            clearAuthCookies(res);

            res.status(200).json({
                message: 'Logout successful',
                user: {
                    email: decoded.email
                },
                loggedOutAt: new Date().toISOString()
            });

        } catch (tokenError: any) {
            console.log('⚠️ Token verification failed during logout:', tokenError.message);
            
            clearAuthCookies(res);
            
            res.status(200).json({
                message: 'Logout successful',
                note: 'Session was already invalid or expired'
            });
        }

        console.log('=== Logout Request Completed Successfully ===');

    } catch (err: any) {
        console.error('=== Logout Error ===');
        console.error('Error message:', err.message);

        clearAuthCookies(res);

        res.status(200).json({
            message: 'Logout successful',
            note: 'Session ended despite server error'
        });
        console.log('=== Logout Request Completed (with errors) ===');
    }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('=== Token Refresh Request Started ===');
        
        const refreshToken = req.cookies?.refreshToken || extractTokenFromRequest(req);
        
        if (!refreshToken) {
            console.error('❌ No refresh token provided');
            clearAuthCookies(res);
            res.status(401).json({ message: 'Refresh token missing' });
            return;
        }

        console.log('🔍 Refresh token received');

        if (!process.env.JWT_SECRET) {
            console.error('❌ JWT_SECRET not configured');
            res.status(500).json({ message: 'Server configuration error' });
            return;
        }

        let decoded: any;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!);
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }
            console.log('✅ Refresh token is valid');
        } catch (err: any) {
            console.error('❌ Refresh token verification failed:', err.message);
            clearAuthCookies(res);
            res.status(401).json({ message: 'Invalid refresh token' });
            return;
        }

        console.log('👤 Refreshing tokens for user:', decoded.email);

        const user = await User.findById(decoded.id);
        if (!user) {
            console.error('❌ User not found in database');
            clearAuthCookies(res);
            res.status(401).json({ message: 'User not found' });
            return;
        }

        // Check if user is blocked
        if (user.status === 'blocked') {
            console.log('🚫 User is blocked');
            clearAuthCookies(res);
            res.status(403).json({
                message: "Account has been blocked. Please contact support."
            });
            return;
        }

        const newAccessPayload = {
            id: user._id,
            email: user.email,
            role: user.role,
            status: user.status,
            type: 'access'
        };

        const newRefreshPayload = {
            id: user._id,
            email: user.email,
            type: 'refresh'
        };

        console.log('🔐 Creating new JWT tokens...');
        const newAccessToken = jwt.sign(newAccessPayload, process.env.JWT_SECRET!, { expiresIn: '15m' });
        const newRefreshToken = jwt.sign(newRefreshPayload, process.env.JWT_SECRET!, { expiresIn: '30d' });

        setAuthCookies(res, newAccessToken, newRefreshToken);

        console.log('✅ Tokens refreshed successfully');

        res.status(200).json({
            message: 'Tokens refreshed successfully',
            tokens: {
                access: newAccessToken,
                refresh: newRefreshToken
            },
            user: newAccessPayload,
            userContext: {
                userId: user._id,
                email: user.email,
                role: user.role,
                status: user.status,
                authProvider: user.authProviders?.google ? 'google' : 'local'
            },
            refreshedAt: new Date().toISOString()
        });

        console.log('=== Token Refresh Request Completed Successfully ===');

    } catch (err: any) {
        console.error('=== Token Refresh Error ===');
        console.error('Error message:', err.message);

        clearAuthCookies(res);

        res.status(500).json({ 
            message: 'Token refresh failed', 
            error: err.message 
        });
        console.log('=== Token Refresh Request Failed ===');
    }
};

export const authHealthCheck = (req: Request, res: Response): void => {
    res.status(200).json({
        service: 'Authentication Service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        features: {
            googleOAuth: true,
            emailPassword: true,
            cookieSupport: true,
            tokenRefresh: true,
            microserviceReady: true,
            multiProviderAuth: true,
            accountLinking: true,
            statusManagement: true
        }
    });
};