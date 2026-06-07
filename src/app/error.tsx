// src/app/error.tsx
"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-slate-500">
          An unexpected error occurred. Our team has been notified.
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-left">
            <p className="text-xs font-semibold uppercase text-red-600">Error Details</p>
            <p className="mt-1 font-mono text-xs text-red-800 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-1 font-mono text-xs text-red-500">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button onClick={() => (window.location.href = "/dashboard")}>
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
