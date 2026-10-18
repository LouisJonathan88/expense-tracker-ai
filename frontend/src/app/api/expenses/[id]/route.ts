import { backendProxy, relay } from "@/lib/backend";
import { isValidId } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

function invalidId() {
  return Response.json({ detail: "ID tidak valid." }, { status: 400 });
}

export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  if (!isValidId(id)) return invalidId();

  const body = await request.text();
  const res = await backendProxy(`/expenses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
  });
  return relay(res);
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  if (!isValidId(id)) return invalidId();

  const res = await backendProxy(`/expenses/${id}`, { method: "DELETE" });
  return relay(res);
}