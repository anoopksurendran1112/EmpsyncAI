import { useState } from "react";

export function useDeleteCaste() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (caste_id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/settings/manage-caste/?caste_id=${caste_id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete caste");
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