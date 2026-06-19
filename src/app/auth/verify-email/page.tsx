// src/app/auth/verify-email/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { ROUTES } from "@/config/routes";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Memverifikasi email Anda...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token verifikasi tidak ditemukan.");
      return;
    }

    (async () => {
      try {
        const res = await apiClient.get(
          `${ROUTES.api.auth.verifyEmail}?token=${token}`
        );
        if (res.success) {
          setStatus("success");
          setMessage(res.message ?? "Email berhasil diverifikasi!");
        } else {
          setStatus("error");
          setMessage(res.message ?? "Verifikasi gagal.");
        }
      } catch {
        setStatus("error");
        setMessage("Terjadi kesalahan saat verifikasi. Silakan coba lagi.");
      }
    })();
  }, [token]);

  return (
    <div className="py-8 text-center">
      {status === "loading" && (
        <>
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-brand-600" />
          <h2 className="mt-4 text-lg font-semibold text-slate-800">
            Memverifikasi...
          </h2>
          <p className="mt-2 text-sm text-slate-500">{message}</p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h2 className="mt-4 text-lg font-semibold text-emerald-800">
            Email Terverifikasi!
          </h2>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
          <Link
            href="/auth/login"
            className="mt-6 inline-block rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            Lanjut ke Masuk
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="mx-auto h-12 w-12 text-red-400" />
          <h2 className="mt-4 text-lg font-semibold text-red-800">
            Verifikasi Gagal
          </h2>
          <p className="mt-2 text-sm text-red-600">{message}</p>
          <Link
            href="/auth/login"
            className="mt-6 inline-block text-sm font-medium text-brand-600 hover:underline"
          >
            Kembali ke Masuk
          </Link>
        </>
      )}
    </div>
  );
}
