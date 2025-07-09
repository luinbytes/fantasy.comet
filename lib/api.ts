import { toast as useToastFunction } from "@/hooks/use-toast"; // Renamed to avoid conflict

export const API_BASE_URL = "https://constelia.ai/api.php";

const RATE_LIMIT_WINDOW_MS = 1000; // 1 second
const MAX_REQUESTS_PER_WINDOW = 5; // 5 requests per second

let requestTimestamps: number[] = [];

export async function callApi(
  apiKey: string,
  params: Record<string, any>,
  toast: ReturnType<typeof useToastFunction>["toast"], // Pass toast as a parameter
  method: "GET" | "POST" = "GET",
  postData?: Record<string, any>
) {

  const now = Date.now();
  requestTimestamps = requestTimestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    toast({
      title: "Rate Limit Exceeded",
      description: "Please slow down. Too many API requests.",
      variant: "destructive",
    });
    return { error: "Rate limit exceeded" };
  }

  requestTimestamps.push(now);

  const url = new URL(API_BASE_URL);
  url.searchParams.append("key", apiKey);
  for (const key in params) {
    url.searchParams.append(key, params[key]);
  }

  const options: RequestInit = { method };

  if (method === "POST" && postData) {
    options.body = new URLSearchParams(postData).toString();
    options.headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
  }

  try {
    const response = await fetch(url.toString(), options);

    // Special handling for getConfiguration, sendCommand (raw text) and getSolution (binary blob)
    if (params.cmd === "getConfiguration" || params.cmd === "sendCommand") {
      const textData = await response.text();
      // Even if it's text, check for common API error patterns if it's not empty
      if (textData.includes("invalid license key") || textData.includes("authorization denied")) {
        toast({
          title: "API Error",
          description: textData,
          variant: "destructive",
        });
        return { error: textData, code: response.status };
      }
      return textData; // Return raw text for getConfiguration and sendCommand
    } else if (params.cmd === "getSolution") {
      // For getSolution, return the raw Blob
      if (!response.ok) {
        const errorText = await response.text();
        toast({
          title: "Download Error",
          description: errorText || `Failed to download solution: HTTP ${response.status}`,
          variant: "destructive",
        });
        return { error: errorText || `Failed to download solution: HTTP ${response.status}`, code: response.status };
      }
      return response.blob(); // Return binary blob for getSolution
    }

    const data = await response.json();

    if (data.code && data.code !== 200) {
      toast({
        title: `API Error: ${data.code}`,
        description: data.message || "An unknown API error occurred.",
        variant: "destructive",
      });
      return { error: data.message || "API error", code: data.code };
    }

    return data;
  } catch (error) {
    toast({
      title: "Network Error",
      description: "Could not connect to the API. Please check your internet connection.",
      variant: "destructive",
    });
    return { error: "Network error" };
  }
}
