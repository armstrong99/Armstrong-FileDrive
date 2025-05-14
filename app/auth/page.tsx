"use client";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { FaArrowRight } from "react-icons/fa";

export default function SignInPage() {
  const handleSignIn = async () => {
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-base-content/70 mb-8">
            Sign in to access your dashboard and manage your files
          </p>

          <div className="w-full max-w-xs">
            <button
              onClick={handleSignIn}
              className="btn btn-outline w-full hover:bg-base-200 transition-all"
            >
              <FcGoogle className="text-xl mr-2" />
              Continue with Google
              <FaArrowRight className="ml-2" />
            </button>
          </div>

          <p className="text-sm text-base-content/50 mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
