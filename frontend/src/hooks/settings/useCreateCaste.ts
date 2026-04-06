import { useState } from "react";

export function useCreateCaste() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async ({ religion_id, name, caste_reservation }: { religion_id: string; name: string; caste_reservation?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/manage-caste/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ religion_id, name, caste_reservation }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create caste");
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading, error };
}