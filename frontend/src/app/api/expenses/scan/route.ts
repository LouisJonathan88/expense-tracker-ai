import { backendProxy, relay } from "@/lib/backend";

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ detail: "Permintaan tidak valid." }, { status: 400 });
  }

  const res = await backendProxy("/expenses/scan", {
    method: "POST",
    body: formData,
  });
  return relay(res);
}