import { useMutation } from "@tanstack/react-query";

export function useLogin() {
  return useMutation({
    mutationFn: async (values: { email: string; password: string }) => {
      const res = await fetch("/api/auth/sign-in", {
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
