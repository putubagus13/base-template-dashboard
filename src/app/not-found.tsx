// src/app/not-found.tsx
"use client";

import Link from "next/link";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100">
          <FileQuestion className="h-10 w-10 text-slate-400" />
        </div>

        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
          404 — Page not found
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Oops, we lost that page
        </h1>
        <p className="mt-3 text-slate-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => history.back()}
            className="cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Link href="/dashboard">
            <Button>
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
