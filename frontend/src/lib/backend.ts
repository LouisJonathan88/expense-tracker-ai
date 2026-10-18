import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function backendFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const session = await auth();
  if (!session?.accessToken) {
    redirect("/login");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${session.accessToken}`);

  const res = await fetch(`${process.env.API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  if (res.status === 401) {
    redirect("/login?expired=1");
  }
  return res;
}

export async function backendProxy(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const session = await auth();
  if (!session?.accessToken) {
    return Response.json({ detail: "Sesi berakhir, silakan masuk lagi." }, { status: 401 });
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${session.accessToken}`);

  try {
    return await fetch(`${process.env.API_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    return Response.json({ detail: "Server tidak bisa dihubungi." }, { status: 502 });
  }
}

export function relay(res: Response): Response {
  if (res.status === 204 || res.status === 205 || res.status === 304) {
    return new Response(null, { status: res.status });
  }
  return new Response(res.body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/json",
    },
  });
}