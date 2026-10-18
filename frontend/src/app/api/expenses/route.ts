import { backendProxy, relay } from "@/lib/backend";

export async function POST(request: Request) {
  const body = await request.text();
  const res = await backendProxy("/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  return relay(res);
}