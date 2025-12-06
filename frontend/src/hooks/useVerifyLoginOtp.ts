import { useMutation } from "@tanstack/react-query";

export function useVerifyLoginOtp() {
  return useMutation({
    mutationFn: async (values: { mobile:string,otp:string }) => {
      const mobileNumber=Number(values.mobile);
      const otpNumber =Number(values.otp);
    
      const res = await fetch("/api/auth/verify-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({mobile:mobileNumber,otp:otpNumber }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Login failed");
      }

      return result;
    },
  });
}
