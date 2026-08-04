"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Image from "next/image";
import { ArrowRight, Building2, ShieldCheck, Zap } from "lucide-react";

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden w-full">
      
      {/* ================= LEFT COLUMN: HERO & BRANDING ================= */}
      <div className="w-full md:w-1/2 bg-[#f4f7f9] flex flex-col justify-between p-8 md:p-12 relative overflow-hidden min-h-[45vh] md:min-h-screen">
        {/* Decorative background waves/patterns */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <svg className="absolute top-0 left-0 w-full h-full opacity-[0.03]" xmlns="http://w3.org">
            <defs>
              <pattern id="bg-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 40L40 0H20L0 20M40 40V20L20 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bg-pattern)" />
          </svg>
          <div className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] rounded-full bg-blue-100/40 blur-3xl" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] rounded-full bg-slate-200/50 blur-3xl" />
        </div>

        {/* Brand Header Identity */}
        <div className="z-10 flex items-center gap-3">
          <Image src="/empsync-logo.png" alt="EmpSync AI" width={40} height={40} className="rounded-xl shadow-sm" />
          <span className="text-lg font-bold tracking-tight text-slate-800">EmpSync AI</span>
        </div>

        {/* Interactive Feature Highlights */}
        <div className="z-10 max-w-md my-auto space-y-6 pt-8 md:pt-0">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-800 leading-tight">
              Synchronize Your <span className="text-[#006a5d]">Workforce</span>
            </h1>
            <p className="text-[14px] md:text-[15px] text-slate-600 leading-relaxed">
              Experience the next generation of staff alignment. EmpSync AI maps structures, updates roles, and connects your business operations in real-time.
            </p>
          </div>

          {/* Bulleted Micro-Features */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-slate-700">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-200/60 text-[#006a5d]">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-[13px] font-medium">Real-time internal role provisioning</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-200/60 text-[#006a5d]">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-[13px] font-medium">Predefined organizational groups</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-200/60 text-[#006a5d]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[13px] font-medium">Enterprise grade workspace security</span>
            </div>
          </div>
        </div>

        {/* Copyright Footer */}
        <div className="z-10 text-xs text-slate-400 hidden md:block">
          © {new Date().getFullYear()} EmpSync AI. All rights reserved.
        </div>
      </div>

      {/* ================= RIGHT COLUMN: INTERACTIVE GET STARTED ================= */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white border-t md:border-t-0 md:border-l border-slate-100">
        <div className="w-full max-w-[380px] py-12 md:py-0 text-center md:text-left space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Main Logo Container */}
          <div className="flex justify-center md:justify-start">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#f4f7f9] shadow-inner border border-slate-100">
              <Image src="/empsync-logo.png" alt="EmpSync AI" width={60} height={60} />
            </div>
          </div>

          {/* Heading Messaging */}
          <div className="space-y-2.5">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Welcome to EmpSync AI</h2>
            <p className="text-[13px] text-slate-500 leading-relaxed">
              Your intelligent employee management platform. Ready to access your workspace metrics? Let's connect your profile.
            </p>
          </div>

          {/* Action Trigger Buttons */}
          <div className="space-y-4">
            <Button
              onClick={() => router.push("/auth/sign-in")}
              className="w-full h-12 bg-[#006a5d] hover:bg-[#005248] text-white font-medium rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 group text-sm"
            >
              Get Started
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
            
            <p className="text-[11px] text-slate-400 text-center">
              By connecting your workspace, you agree to our terms of service.
            </p>
          </div>

        </div>
      </div>

    </div>
  )
}
