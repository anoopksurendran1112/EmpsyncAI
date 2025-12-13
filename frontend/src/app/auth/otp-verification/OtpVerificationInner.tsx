"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useVerifyLoginOtp } from "@/hooks/useVerifyLoginOtp";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

const otpSchema = z.object({
  otp: z.string().length(6, {
    message: "Your one-time password must be 6 digits.",
  }),
});

type OtpFormValues = z.infer<typeof otpSchema>;

export default function OtpVerificationInner() { 
  const searchParams = useSearchParams();
  const router = useRouter();
  const mobile = searchParams.get("mobile");
  const { setAuthData } = useAuth();

  useEffect(() => {
    if (!mobile) {
      toast.error("Mobile number is missing. Please try again.");
      router.push("/auth/sign-in");
    }
  }, [mobile, router]);

  const otpVerificationMutation = useVerifyLoginOtp();

  const form = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });
  
  function onSubmit(data: OtpFormValues) {
    if (!mobile) return;
    
    otpVerificationMutation.mutate(
      { mobile, otp: data.otp },
      {
        onSuccess: (result) => {
          // Use the data directly from OTP response (skip companies fetch)
          if (result.data && result.data.user) {
            setAuthData(
              result.data.user, 
              result.data.company, 
              result.data.is_admin || false
            );
            toast.success("OTP verified successfully! ✅");
            router.push("/dashboard");
          } else {
            console.error("Missing user data in response:", result);
            toast.error("Authentication data missing");
          }
        },
        onError: (error: any) => {
          toast.error(error?.message || "OTP verification failed");
        },
      }
    );
  }

  if (!mobile) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {/* Logo and Company Name inside Card - Same as sign-in page */}
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Image 
              src="/empsync-logo.png" 
              alt="EmpSync AI" 
              width={80} 
              height={80} 
              className="rounded-lg" 
            />
          </div>
          <CardTitle className="text-2xl font-bold">EmpSync AI</CardTitle>
          <CardDescription>Your intelligent employee management platform</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Enter OTP</h1>
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to {mobile}
            </p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center">
                    <FormLabel>One-Time Password</FormLabel>
                    <FormControl>
                      <InputOTP 
                        maxLength={6} 
                        {...field}
                        disabled={otpVerificationMutation.isPending}
                      >
                        <InputOTPGroup>
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <InputOTPSlot key={i} index={i} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={otpVerificationMutation.isPending}
              >
                {otpVerificationMutation.isPending ? "Verifying..." : "Verify OTP"}
              </Button>
            </form>
          </Form>

          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={() => router.push("/auth/sign-in")}
              className="text-sm text-primary underline"
            >
              Back to Sign In
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}