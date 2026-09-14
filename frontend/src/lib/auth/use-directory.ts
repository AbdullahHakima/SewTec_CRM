"use client";
import { useEffect, useState } from "react";
import { apiClient } from "@/infrastructure/http/api-client";
import { useAuth } from "./auth-context";
export function useDirectory() {
  const { user } = useAuth();
  const [people, setPeople] = useState<{id: string; fullName: string}[]>([]);
  useEffect(() => {
    let active = true;
    if (user) apiClient.get<{id: string; fullName: string}[]>("/users/directory").then(result => { if (active) setPeople(result); }).catch(() => { if (active) setPeople([user]); });
    return () => { active = false; };
  }, [user]);
  return { user, people };
}
