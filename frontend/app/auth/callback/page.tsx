"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");
    const error = searchParams.get("error");

    console.log("Callback received:", { token, refreshToken, error });

    if (error) {
      toast.error("Google authentication failed. Please try again.");
      router.push("/");
      return;
    }

    if (token && refreshToken) {
      // Save tokens
      localStorage.setItem("velora_token", token);
      localStorage.setItem("velora_refresh_token", refreshToken);
      
      toast.success("Google login successful!");
      
      // Redirect to dashboard
      router.push("/dashboard");
    } else {
      toast.error("Invalid authentication response");
      router.push("/");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-400">Signing you in...</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}