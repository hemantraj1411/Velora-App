"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { 
  SparklesIcon, 
  CalendarIcon, 
  ChartBarIcon, 
  BoltIcon, 
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  TrophyIcon,
  UsersIcon,
  XMarkIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  HeartIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function Home() {
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, login, register } = useAuth();
  const router = useRouter();
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (!showAuth) {
      setEmail("");
      setPassword("");
      setName("");
    }
  }, [showAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        await login(email, password);
        toast.success("Welcome back!");
        setShowAuth(false);
        router.push("/dashboard");
      } else {
        if (!name.trim()) {
          toast.error("Please enter your name");
          setLoading(false);
          return;
        }
        await register(name, email, password);
        toast.success("Account created successfully!");
        setShowAuth(false);
        router.push("/dashboard");
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || "Authentication failed";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    window.location.href = `${apiUrl}/auth/google`;
  };

  const closeModal = () => {
    setShowAuth(false);
    setEmail("");
    setPassword("");
    setName("");
    setIsLogin(true);
  };

  const features = [
    { icon: SparklesIcon, title: "AI Task Assistant", desc: "Plan your day with intelligent suggestions", color: "from-purple-500 to-pink-500" },
    { icon: CalendarIcon, title: "Smart Calendar", desc: "Drag-and-drop tasks with Google Sync", color: "from-blue-500 to-cyan-500" },
    { icon: ChartBarIcon, title: "Analytics", desc: "Track productivity with beautiful charts", color: "from-green-500 to-emerald-500" },
    { icon: BoltIcon, title: "Focus Mode", desc: "Pomodoro timer & ambient sounds", color: "from-orange-500 to-red-500" },
  ];

  const stats = [
    { value: "10K+", label: "Active Users", icon: UsersIcon },
    { value: "50K+", label: "Tasks Completed", icon: CheckCircleIcon },
    { value: "98%", label: "Satisfaction", icon: TrophyIcon },
    { value: "24/7", label: "AI Support", icon: ClockIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Video Background */}
      <div className="fixed top-0 left-0 w-full h-full z-0">
        <video
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
        >
          <source src="/imag1.mp4" type="video/mp4" />
          {/* Fallback image if video doesn't load */}
          <div className="w-full h-full bg-gradient-to-br from-purple-900 via-[#0a0f1e] to-indigo-900" />
        </video>
        
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1e]/70 via-[#0a0f1e]/50 to-[#0a0f1e]/80" />
        
        {/* Gradient overlay on edges for smooth blending */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-transparent opacity-60" />
      </div>

      {/* Loading overlay while video loads */}
      {!videoLoaded && (
        <div className="fixed inset-0 z-0 bg-[#0a0f1e] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navbar */}
        <nav className="fixed top-0 w-full z-50 bg-[#0a0f1e]/80 backdrop-blur-md border-b border-[#1a2234]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <Image
                  src="/logoV.png"
                  alt="Velora Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain"
                  priority
                />
                <span className="text-2xl font-bold text-white tracking-tight">
                  Velora
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-medium hover:shadow-lg transition-all transform hover:scale-105"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="flex-1 pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h1 className="text-5xl sm:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                  Track • Understand • Thrive
                </h1>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mt-6 text-xl text-gray-300 max-w-2xl mx-auto"
              >
                AI-powered productivity companion that helps you organize tasks, build habits, and achieve goals.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="mt-8 flex justify-center gap-4"
              >
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold hover:shadow-lg transition-all transform hover:scale-105 inline-flex items-center space-x-2"
                >
                  <span>Start Your Journey</span>
                  <ArrowRightIcon className="h-5 w-5" />
                </button>
              </motion.div>
            </motion.div>

            {/* Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + idx * 0.1 }}
                  className="bg-[#1a2234]/80 backdrop-blur-sm p-6 rounded-2xl border border-[#2a3a4a] hover:border-purple-500/50 hover:bg-[#1a2234] transition-all group cursor-pointer hover:scale-105"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} p-2.5 text-white group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-full w-full" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-gray-400">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Stats Banner */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="mt-20 bg-[#1a2234]/80 backdrop-blur-sm rounded-2xl p-8 border border-[#2a3a4a]"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                {stats.map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.6 + idx * 0.1 }}
                  >
                    <stat.icon className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-white">{stat.value}</div>
                    <div className="text-gray-400">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-[#0a0f1e]/80 backdrop-blur-sm border-t border-[#1a2234] py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center space-x-3">
                <Image
                  src="/logoV.png"
                  alt="Velora Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
                <span className="text-lg font-bold text-white">Velora</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <span>Built with</span>
                <HeartIcon className="h-4 w-4 text-red-400 animate-pulse" />
                <span>by</span>
                <span className="text-white font-semibold">Hemant Malhotra</span>
              </div>
              <div className="text-sm text-gray-500">
                © 2026 Velora. All rights reserved.
              </div>
            </div>
          </div>
        </footer>

        {/* Auth Modal */}
        {showAuth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#1a2234] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[#2a3a4a]"
            >
              <div className="relative h-32 bg-gradient-to-r from-purple-600 to-purple-500">
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 px-8 pb-4">
                  <h2 className="text-2xl font-bold text-white">
                    {isLogin ? "Welcome Back" : "Create Account"}
                  </h2>
                  <p className="text-white/80 text-sm mt-1">
                    {isLogin ? "Sign in to continue to your account" : "Start your productivity journey today"}
                  </p>
                </div>
              </div>

              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#2a3a4a] bg-[#0f1a2a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input
                        type="email"
                        placeholder="hello@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#2a3a4a] bg-[#0f1a2a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#2a3a4a] bg-[#0f1a2a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                    {isLogin && (
                      <div className="text-right mt-1">
                        <button type="button" className="text-xs text-purple-400 hover:underline">
                          Forgot password?
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold hover:shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{isLogin ? "Signing in..." : "Creating account..."}</span>
                      </div>
                    ) : (
                      <span>{isLogin ? "Sign In" : "Create Account"}</span>
                    )}
                  </button>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#2a3a4a]"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-[#1a2234] text-gray-400">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="mt-4 w-full py-2.5 rounded-lg border border-[#2a3a4a] hover:bg-[#1a2234] transition flex items-center justify-center gap-3 text-white"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setName("");
                    }}
                    className="text-sm text-gray-400 hover:text-purple-400 transition"
                  >
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <span className="text-purple-400 font-semibold hover:underline">
                      {isLogin ? "Sign up" : "Sign in"}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}