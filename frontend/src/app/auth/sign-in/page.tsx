"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useLogin } from "@/hooks/useLogin"
import { useRouter } from "next/navigation"
import { useRequestOtp } from "@/hooks/useRequestOtp"
import { useAuth } from "@/context/AuthContext"
import Image from "next/image"
import { User, Lock, Eye, EyeOff, Smartphone, Mail, ShieldCheck, Building2, Zap } from "lucide-react";


const emailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})
const mobileSchema = z.object({
  mobile: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit number"),
})

type EmailValues = z.infer<typeof emailSchema>
type MobileValues = z.infer<typeof mobileSchema>

export default function SignInPage() {
  const { setAuthData } = useAuth()
  const [mode, setMode] = useState<"email" | "mobile">("email")
  const [showPassword, setShowPassword] = useState(false)
  const route = useRouter()

  const loginMutation = useLogin()
  const requestOtpMutation = useRequestOtp()

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "", password: "" },
  })

  const mobileForm = useForm<MobileValues>({
    resolver: zodResolver(mobileSchema),
    defaultValues: { mobile: "" },
  })

  async function fetchUserCompanies() {
    const res = await fetch('/api/companies')
    if (!res.ok) {
      throw new Error('Failed to fetch user companies')
    }
    const data = await res.json()
    return data
  }

  const handleEmailLogin = (values: EmailValues) => {
    loginMutation.mutate(values, {
      onSuccess: async (data) => {
        try {
          const companies = await fetchUserCompanies();

          // pick the first admin company
          const adminCompany = companies?.data?.find(
            (comp: any) => comp.is_admin === true
          );

          // fallback: use login response company if no admin company found
          const finalCompany = adminCompany || data.data.company;

          setAuthData(data.data.user, finalCompany, data.data.is_admin);

          route.push("/dashboard");
        } catch (err) {
          console.error("Error fetching companies:", err);
          // fallback in case fetch fails too
          setAuthData(data.data.user, data.data.company, data.data.is_admin);
          route.push("/dashboard");
        }
      },
      onError: (error: any) => {
        alert("Login failed: " + error.message);
      },
    });
  };

  const handleMobileLogin = (values: MobileValues) => {
    requestOtpMutation.mutate(values, {
      onSuccess: () => {
        alert("OTP sent to " + values.mobile);
        route.push("/auth/otp-verification?mobile=" + values.mobile);
      },
      onError: (error: any) => {
        alert("Failed to send OTP: " + error.message);
      },
    });

    console.log("Send OTP to", values.mobile);
  };

  return (
<div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden w-full">
      
      {/* ================= LEFT COLUMN: HERO & BRANDING ================= */}
      <div className="w-full md:w-1/2 bg-[#f4f7f9] flex flex-col justify-between p-8 md:p-12 relative overflow-hidden min-h-[45vh] md:min-h-screen">
        {/* Decorative background waves/patterns */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <svg className="absolute top-0 left-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
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

      {/* ================= RIGHT COLUMN: INTERACTIVE INTERFACE ================= */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white border-t md:border-t-0 md:border-l border-slate-100">
        <div className="w-full max-w-[380px] py-6 md:py-0">
          
          {mode === "email" ? (
            <form onSubmit={emailForm.handleSubmit(handleEmailLogin)} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <CardHeader className="p-0 space-y-1.5 pb-4">
                <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800">Sign In</CardTitle>
                <CardDescription className="text-[13px] text-slate-500">Access your intelligent workspace account</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 p-0">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <Input
                    placeholder="testadmin@gmail.com"
                    {...emailForm.register("email")}
                    className="pl-10 h-11 bg-[#f8fafc] border-slate-200 text-sm focus-visible:ring-[#134e5e] focus-visible:ring-1 focus-visible:border-[#134e5e] rounded-lg"
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••"
                    {...emailForm.register("password")}
                    className="pl-10 pr-11 h-11 bg-[#f8fafc] border-slate-200 text-sm focus-visible:ring-[#134e5e] focus-visible:ring-1 focus-visible:border-[#134e5e] rounded-lg"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4 p-0 pt-2">
                <Button
                  type="submit"
                  className="w-full h-11 bg-[#006a5d] hover:bg-[#005248] text-white font-medium rounded-lg shadow-sm transition-colors"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
                
                <div className="relative w-full my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white text-slate-400">or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMode("mobile")}
                  className="flex items-center justify-center gap-2 w-full text-[13px] font-medium text-[#134e5e] hover:text-[#0d3642] transition-colors"
                >
                  <Smartphone className="w-4 h-4" />
                  Sign in with mobile instead
                </button>
              </CardFooter>
            </form>
          ) : (
            <form onSubmit={mobileForm.handleSubmit(handleMobileLogin)} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <CardHeader className="p-0 space-y-1.5 pb-4">
                <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800">Sign In</CardTitle>
                <CardDescription className="text-[13px] text-slate-500">Access your intelligent workspace account</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 p-0">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Smartphone className="w-4 h-4 text-slate-400" />
                  </div>
                  <Input
                    placeholder="Mobile number"
                    {...mobileForm.register("mobile")}
                    className="pl-10 h-11 bg-[#f8fafc] border-slate-200 text-sm focus-visible:ring-[#134e5e] focus-visible:ring-1 focus-visible:border-[#134e5e] rounded-lg"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4 p-0 pt-2">
                <Button
                  type="submit"
                  className="w-full h-11 bg-[#064b4d] hover:bg-[#043335] text-white font-medium rounded-lg shadow-sm transition-colors"
                  disabled={requestOtpMutation.isPending}
                >
                  {requestOtpMutation.isPending ? "Sending OTP..." : "Send OTP"}
                </Button>

                <div className="relative w-full my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white text-slate-400">or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMode("email")}
                  className="flex items-center justify-center gap-2 w-full text-[13px] font-medium text-[#134e5e] hover:text-[#0d3642] transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Sign in with email instead
                </button>
              </CardFooter>
            </form>
          )}
        </div>
      </div>

    </div>
  )
}