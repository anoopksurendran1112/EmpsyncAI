import { useEffect, useState } from "react";

export function useReligions() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings/manage-religion/", {
        credentials: "include",
      });
      const json = await res.json();

      const enriched = await Promise.all(
        (json.data || []).map(async (rel: any) => {
          try {
            const casteRes = await fetch(
              `/api/settings/manage-caste/?religion_id=${rel.id}`,
              { credentials: "include" }
            );
            const casteJson = await casteRes.json();
            return { ...rel, castes: casteJson.data || [] };
          } catch {
            return { ...rel, castes: [] };
          }
        })
      );
      setData({ ...json, data: enriched });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return { data, isLoading, refetch: fetchAll };
}