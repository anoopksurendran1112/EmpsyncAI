"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useLogin } from "@/hooks/useLogin"
import { useRouter } from "next/navigation";
import { useRequestOtp } from "@/hooks/useRequestOtp"
import { Company, useAuth } from "@/context/AuthContext"
import Image from "next/image"

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
  const { setAuthData }=useAuth()
  const [mode, setMode] = useState<"email" | "mobile">("email")
  const route=useRouter()

  const loginMutation = useLogin()
  const requestOtpMutation = useRequestOtp()

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "", password: "" },
  })

  const mobileForm = useForm<MobileValues>({
    resolver: zodResolver(mobileSchema),
    defaultValues: { mobile : "" },
  })
  
  async function fetchUserCompanies(){
    const res=await fetch('/api/user/companies')
    if(!res.ok){
      throw new Error('Failed to fetch user companies')
    }
    const data=await res.json()
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

          setAuthData(data.data.user, finalCompany, finalCompany?.is_admin);

          route.push("/dashboard");
        } catch (err) {
          console.error("Error fetching companies:", err);
          // fallback in case fetch fails too
          setAuthData(data.data.user, data.data.company, data.data.company?.is_admin);
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {/* Logo and Company Name inside Card */}
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Image src="/empsync-logo.png" alt="EmpSync AI" width={80} height={80} className="rounded-lg" />
          </div>
          <CardTitle className="text-2xl font-bold">EmpSync AI</CardTitle>
          <CardDescription>Your intelligent employee management platform</CardDescription>
        </CardHeader>

        {/* Sign In Form */}
        {mode === "email" ? (
          <form
            onSubmit={emailForm.handleSubmit(handleEmailLogin)}
            className="space-y-4"
          >
            <CardContent className="space-y-4">
              <Input
                placeholder="Email"
                {...emailForm.register("email")}
              />
              <Input
                type="password"
                placeholder="Password"
                {...emailForm.register("password")}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
              <button
                type="button"
                onClick={() => setMode("mobile")}
                className="text-sm text-primary underline"
              >
                Sign in with mobile instead
              </button>
            </CardFooter>
          </form>
        ) : (
          <form
            onSubmit={mobileForm.handleSubmit(handleMobileLogin)}
            className="space-y-4"
          >
            <CardContent className="space-y-4">
              <Input
                placeholder="Mobile number"
                {...mobileForm.register("mobile")}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={requestOtpMutation.isPending}
              >
                {requestOtpMutation.isPending ? "Sending OTP..." : "Send OTP"}
              </Button>
              <button
                type="button"
                onClick={() => setMode("email")}
                className="text-sm text-primary underline"
              >
                Sign in with email instead
              </button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}