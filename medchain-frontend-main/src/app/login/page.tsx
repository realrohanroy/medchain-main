"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, ShieldCheck, Activity, Loader2, Mail, Lock, User, Hospital, AlertCircle } from "lucide-react";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function AuthPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor'>('patient');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) {
            console.warn(
                "Warning: NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable is missing. " +
                "Google OAuth login button has been disabled/hidden to prevent broken OAuth flows."
            );
        }
    }, []);

    const toggleAuthMode = () => {
        setIsLogin(!isLogin);
        setError(null);
        setSuccessMessage(null);
    };

    const navigateToDashboard = (role: string) => {
        const dashboardRole = role === 'DOCTOR' ? 'doctor' : 'patient';
        document.cookie = `auth_token=jwt-${dashboardRole}; path=/; max-age=3600`;
        localStorage.setItem('user_role', role);
        router.push(`/dashboard/${dashboardRole}`);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (isLogin) {
                // Login: no role needed — backend returns the user's actual role
                const res = await authApi.login({ email, password });
                navigateToDashboard(res.role);
            } else {
                // Register: send selected role
                const nameParts = name.trim().split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';
                await authApi.register({
                    email,
                    password,
                    role: selectedRole === 'doctor' ? 'DOCTOR' : 'PATIENT',
                    first_name: firstName,
                    last_name: lastName,
                });
                
                // Do NOT auto-login. Toggle to login mode and show success message.
                setIsLogin(true);
                setSuccessMessage("Registration successful! Please sign in with your credentials.");
                setIsLoading(false);
            }
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: Record<string, unknown>; status?: number } };
            if (axiosError.response?.data) {
                const data = axiosError.response.data;
                const msg = data.detail || data.error || data.email || data.password || JSON.stringify(data);
                setError(String(msg));
                
                // Switch mode if necessary:
                if (isLogin && String(msg).includes("register first")) {
                    setIsLogin(false);
                } else if (!isLogin && String(msg).includes("already exists")) {
                    setIsLogin(true);
                }
            } else {
                setError('Connection failed. Is the backend server running on port 8000?');
            }
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
        if (!credentialResponse.credential) {
            setError('Google sign-in failed: no credential received.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const res = await authApi.googleLogin({
                credential: credentialResponse.credential,
                flow: isLogin ? 'login' : 'register',
                // Only send role when registering (new user sign-up via Google)
                ...((!isLogin) && { role: selectedRole === 'doctor' ? 'DOCTOR' : 'PATIENT' }),
            });
            
            if (isLogin) {
                navigateToDashboard(res.role);
            } else {
                // If it was register flow, it created the user.
                // Switch to login and prompt them to login.
                setIsLogin(true);
                setSuccessMessage("Google registration successful! Please sign in with Google to continue.");
                setIsLoading(false);
            }
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: Record<string, unknown>; status?: number } };
            if (axiosError.response?.data) {
                const data = axiosError.response.data;
                const msg = data.detail || data.error || JSON.stringify(data);
                setError(String(msg));
                
                if (isLogin && String(msg).includes("register first")) {
                    setIsLogin(false);
                } else if (!isLogin && String(msg).includes("already exists")) {
                    setIsLogin(true);
                }
            } else {
                setError('Google sign-in failed. Please try again.');
            }
            setIsLoading(false);
        }
    };


    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || "disabled"}>
            <div className="min-h-screen grid lg:grid-cols-2 bg-primary">
                {/* LEFT SIDE - Branding & Medical Imagery */}
                <div className="hidden lg:flex flex-col justify-between p-12 text-primary-foreground relative overflow-hidden">
                    {/* Abstract shapes / medical UI feel */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-16">
                            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                                <Stethoscope className="h-8 w-8 text-white" />
                            </div>
                            <span className="font-bold text-3xl tracking-tight text-white">Medchain</span>
                        </div>

                        <div className="space-y-6 max-w-lg mt-12">
                            <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
                                The Future of Secure <br /> Electronic Health Records.
                            </h1>
                            <p className="text-white/80 text-lg leading-relaxed">
                                Medical data ownership powered by Polygon blockchain architecture. Access your history securely, grant permissions transparently, and verify immutability without trusting centralized silos.
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 grid grid-cols-2 gap-6 mt-16 pb-8">
                        <div className="space-y-2">
                            <ShieldCheck className="h-6 w-6 text-white/80" />
                            <h3 className="font-semibold text-white">Military Grade</h3>
                            <p className="text-sm text-white/60">AES-256-GCM client-side encryption.</p>
                        </div>
                        <div className="space-y-2">
                            <Activity className="h-6 w-6 text-white/80" />
                            <h3 className="font-semibold text-white">Always Verifiable</h3>
                            <p className="text-sm text-white/60">IPFS pinning + smart contract tracking.</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE - Auth Flow */}
                <div className="flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 relative">

                    {/* Mobile Heading */}
                    <div className="flex lg:hidden items-center gap-3 mb-8 justify-center z-10">
                        <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                            <Stethoscope className="h-8 w-8 text-white" />
                        </div>
                        <span className="font-bold text-3xl tracking-tight text-white">Medchain</span>
                    </div>

                    <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">

                        {/* The 3D Card Container */}
                        <Card className="w-full bg-card border-border shadow-[0_12px_40px_-15px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] hover:-translate-y-1">
                            <CardHeader className="space-y-4 pb-4">
                                <div className="flex flex-col text-center space-y-1.5">
                                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                                        {isLogin ? "Welcome Back" : "Create an Account"}
                                    </CardTitle>
                                    <CardDescription className="text-base text-muted-foreground">
                                        {isLogin
                                            ? "Enter your credentials to access your account"
                                            : "Sign up to join the decentralized network"}
                                    </CardDescription>
                                </div>

                                {/* Role Selection Tabs — ONLY shown during Registration */}
                                {!isLogin && (
                                    <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedRole('patient')}
                                            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${selectedRole === 'patient'
                                                ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10'
                                                }`}
                                        >
                                            <User className="w-4 h-4" />
                                            Patient
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedRole('doctor')}
                                            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${selectedRole === 'doctor'
                                                ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10'
                                                }`}
                                        >
                                            <Hospital className="w-4 h-4" />
                                            Provider
                                        </button>
                                    </div>
                                )}
                            </CardHeader>

                            <CardContent>
                                <form onSubmit={handleFormSubmit} className="space-y-4">
                                    {!isLogin && (
                                        <div className="space-y-2 relative">
                                            <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                                                Full Name
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input id="name" required placeholder="John Doe" className="pl-10 h-11" value={name} onChange={(e) => setName(e.target.value)} />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2 relative">
                                        <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input id="email" type="email" required placeholder="name@example.com" className="pl-10 h-11" value={email} onChange={(e) => setEmail(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="space-y-2 relative">
                                        <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input id="password" type="password" required placeholder="••••••••" className="pl-10 h-11" value={password} onChange={(e) => setPassword(e.target.value)} />
                                        </div>
                                    </div>

                                    <Button type="submit" variant="default" className="w-full h-11 mt-2 text-base font-semibold shadow-md active:scale-[0.98] transition-all" disabled={isLoading}>
                                        {isLoading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            isLogin ? "Sign In" : "Create Account"
                                        )}
                                    </Button>

                                    {error && (
                                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-[13px] font-medium text-red-600">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    {successMessage && (
                                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl text-[13px] font-medium text-green-600">
                                            <ShieldCheck className="w-4 h-4 shrink-0" />
                                            {successMessage}
                                        </div>
                                    )}
                                </form>

                                <div className="relative my-6 text-center">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-border" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-card px-2 text-muted-foreground font-medium">Or continue with</span>
                                    </div>
                                </div>

                                {/* Google OAuth Button */}
                                <div className="flex justify-center w-full">
                                    {GOOGLE_CLIENT_ID ? (
                                        <GoogleLogin
                                            onSuccess={handleGoogleSuccess}
                                            onError={() => setError('Google sign-in was cancelled or failed.')}
                                            size="large"
                                            width="100%"
                                            text={isLogin ? "signin_with" : "signup_with"}
                                            shape="rectangular"
                                            theme="outline"
                                        />
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full h-11 text-base font-semibold opacity-50 cursor-not-allowed"
                                            disabled
                                        >
                                            Google login unavailable
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-center border-t border-border bg-muted/30 py-4">
                                <p className="text-sm text-muted-foreground">
                                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                                    <button
                                        onClick={toggleAuthMode}
                                        className="font-semibold text-primary hover:text-primary/80 hover:underline transition-colors border-none bg-transparent"
                                    >
                                        {isLogin ? "Register now" : "Log in"}
                                    </button>
                                </p>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
}
