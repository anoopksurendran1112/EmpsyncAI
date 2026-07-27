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
import { User, Lock, Eye, EyeOff, Smartphone, Mail } from "lucide-react"

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
    <div className="min-h-screen bg-[#f4f7f9] flex items-center justify-center p-4 relative overflow-hidden">
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
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-slate-200/50 blur-3xl" />
      </div>

      <Card className="w-full max-w-[420px] z-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border-0 rounded-2xl p-4">
        {/* Logo and Company Name inside Card */}
        <CardHeader className="text-center space-y-3 pb-6">
          <div className="flex justify-center mb-2">
            <Image src="/empsync-logo.png" alt="EmpSync AI" width={72} height={72} className="rounded-xl shadow-sm" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">EmpSync AI</CardTitle>
          <CardDescription className="text-[13px] text-slate-500">Your intelligent employee management platform</CardDescription>
        </CardHeader>

        {/* Sign In Form */}
        {mode === "email" ? (
          <form onSubmit={emailForm.handleSubmit(handleEmailLogin)} className="space-y-4">
            <CardContent className="space-y-4 px-2">
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
            <CardFooter className="flex flex-col gap-4 px-2 pb-2">
              <Button
                type="submit"
                className="w-full h-11 bg-[#006a5d] hover:bg-[#006a5d] text-white font-medium rounded-lg shadow-sm transition-colors"
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
          <form onSubmit={mobileForm.handleSubmit(handleMobileLogin)} className="space-y-4">
            <CardContent className="space-y-4 px-2">
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
            <CardFooter className="flex flex-col gap-4 px-2 pb-2">
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
      </Card>
    </div>
  )
}