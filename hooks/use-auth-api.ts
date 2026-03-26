"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";
import axios from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://ai-mock-interview-platform-backend.onrender.com/api/v1";

// Returns an axios instance pre-loaded with the current Clerk JWT
export function useAuthApi() {
  const { getToken } = useAuth();

  const authApi = useCallback(async () => {
    const token = await getToken();
    return axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }, [getToken]);

  // Convenience wrappers
  const get = useCallback(
    async (url: string, params?: object) => {
      const instance = await authApi();
      return instance.get(url, { params });
    },
    [authApi]
  );

  const post = useCallback(
    async (url: string, data?: object) => {
      const instance = await authApi();
      return instance.post(url, data);
    },
    [authApi]
  );

  const put = useCallback(
    async (url: string, data?: object) => {
      const instance = await authApi();
      return instance.put(url, data);
    },
    [authApi]
  );

  const patch = useCallback(
    async (url: string) => {
      const instance = await authApi();
      return instance.patch(url);
    },
    [authApi]
  );

  return { get, post, put, patch };
}
