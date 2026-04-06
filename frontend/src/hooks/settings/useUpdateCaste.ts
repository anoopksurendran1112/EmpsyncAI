import { useState } from "react";

export function useUpdateCaste() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async ({ caste_id, name, caste_reservation }: { caste_id: string; name: string; caste_reservation?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/manage-caste/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caste_id, name, caste_reservation }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update caste");
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