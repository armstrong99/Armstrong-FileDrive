// app/auth/error/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { FaExclamationTriangle, FaHome, FaSignInAlt } from "react-icons/fa";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const rawError = searchParams.get("error");

  // Decode the URI component and clean up the string
  const decodedError = rawError
    ? decodeURIComponent(rawError)
        .replace(/%20/g, " ") // Convert %20 to spaces
        .replace(/%22/g, '"') // Convert %22 to quotes
        .replace(/%0A/g, "\n") // Convert %0A to newlines
    : "Unknown error occurred";

  // User-friendly error messages mapping
  const errorMessages: Record<string, string> = {
    "Invalid `prisma.user.upsert()` invocation":
      "Account creation failed. Please try again.",
    "Error converting field `createdAt`":
      "Database error. Our team has been notified.",
    OAuthAccountNotLinked: "This email is already linked to another account.",
    Default: "Something went wrong during authentication.",
  };

  // Find the most relevant error message
  let userMessage = errorMessages.Default;
  for (const [key, value] of Object.entries(errorMessages)) {
    if (decodedError.includes(key)) {
      userMessage = value;
      break;
    }
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="text-error flex justify-center mb-4">
            <FaExclamationTriangle className="text-5xl" />
          </div>
          <h1 className="text-2xl font-bold text-center">
            Authentication Error
          </h1>

          {/* User-friendly message */}
          <div className="alert alert-error mt-4">
            <div>
              <span>{userMessage}</span>
            </div>
          </div>

          {/* Raw error details - collapsible */}
          <details className="collapse collapse-arrow bg-base-200 mt-4">
            <summary className="collapse-title text-sm font-medium">
              Technical Details
            </summary>
            <div className="collapse-content">
              <pre className="whitespace-pre-wrap text-xs p-2 bg-neutral rounded">
                {decodedError}
              </pre>
            </div>
          </details>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 w-full mt-6">
            <Link href="/auth" className="btn btn-primary">
              <FaSignInAlt className="mr-2" />
              Try Again
            </Link>
            <Link href="/" className="btn btn-ghost">
              <FaHome className="mr-2" />
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
