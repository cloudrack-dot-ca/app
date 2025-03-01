import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    
    try {
      // Try to parse as JSON to get a structured error
      const json = JSON.parse(text);
      throw new Error(json.message || json.error || `${res.status}: ${res.statusText}`);
    } catch (e) {
      // If parsing fails, use the raw text
      throw new Error(`${res.status}: ${text || res.statusText}`);
    }
  }
}

export async function apiRequest(
  methodOrUrl: string,
  urlOrData?: string | unknown,
  data?: unknown | undefined,
): Promise<Response> {
  // Support both (method, url, data) and (url, method, data) formats
  let method: string;
  let url: string;
  let requestData: unknown | undefined;

  if (urlOrData && typeof urlOrData === 'string' && !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(methodOrUrl)) {
    // New format: (url, method?, data?)
    url = methodOrUrl;
    method = urlOrData as string || 'GET';
    requestData = data;
  } else {
    // Old format: (method, url, data?)
    method = methodOrUrl;
    url = urlOrData as string;
    requestData = data;
  }

  const res = await fetch(url, {
    method,
    headers: requestData ? { "Content-Type": "application/json" } : {},
    body: requestData ? JSON.stringify(requestData) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
