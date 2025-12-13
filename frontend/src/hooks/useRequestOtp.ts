import { useMutation } from "@tanstack/react-query";

export function useRequestOtp() {
  return useMutation({
    mutationFn: async (values: { mobile:string }) => {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Login failed");
      }

      return result;
    },
  });
}
