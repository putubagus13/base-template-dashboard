// src/app/auth/layout.tsx
import type { Metadata } from "next";
import { STT_TGD_LOGO } from "../../../public";
import Image from "next/image";

export const metadata: Metadata = {
  title: { template: "%s | Autentikasi", default: "Autentikasi" },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <div className="flex min-h-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-brand-50 px-4 py-12">
    //   <div className="w-full max-w-md">
    //     {/* Brand mark */}
    //     <div className="mb-8 flex justify-center">
    //       <div className="flex items-center gap-2.5">
    //         <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 shadow-md shadow-brand-600/30">
    //           <span className="text-lg font-bold text-white">D</span>
    //         </div>
    //         <span className="text-xl font-semibold text-slate-900">Dashboard</span>
    //       </div>
    //     </div>

    //     <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
    //       {children}
    //     </div>

    //     <p className="mt-6 text-center text-xs text-slate-400">
    //       © {new Date().getFullYear()} Your Company. All rights reserved.
    //     </p>
    //   </div>
    // </div>
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0">
        {/* Main Gradient */}
        <div className="absolute inset-0 bg-white" />

        {/* Decorative Orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-brand-500/20 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-lotus-500/20 blur-3xl rounded-full" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-blossom-500/10 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(to right, blue 1px, transparent 1px),
              linear-gradient(to bottom, blue 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 ">
            <Image
              src={STT_TGD_LOGO.src}
              alt="Logo"
              className="object-contain"
              width={100}
              height={100}
            />
          </div>
          <h1 className="font-display text-2xl font-bold text-brand-700">
            STT. Tunas Guna Dharma
          </h1>
          <p className="text-brand-700 text-sm mt-1">
            Sistem Manajemen Organisasi
          </p>
        </div>
        <div className="bg-white rounded-3xl shadow-2xl shadow-brand-900/40 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
