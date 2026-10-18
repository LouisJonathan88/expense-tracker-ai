import type { Expense, ExpenseInput, ScanDraft } from "@/types/expense";

async function readError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail) && data.detail[0]?.msg) {
      return String(data.detail[0].msg).replace(/^Value error, /, "");
    }
  } catch {
  }
  return "Terjadi kesalahan, coba lagi.";
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    if (
      err instanceof DOMException &&
      (err.name === "TimeoutError" || err.name === "AbortError")
    ) {
      throw new Error("Permintaan terlalu lama. Coba lagi.");
    }
    throw new Error("Tidak bisa terhubung ke server.");
  }

  
  if (res.status === 401) {
    // Navigasi penuh disengaja: muat ulang dari server agar state klien yang basi ikut hilang
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- navigasi penuh disengaja
    window.location.href = `${window.location.origin}/login?expired=1`;
    throw new Error("Sesi berakhir.");
  }
  if (!res.ok) throw new Error(await readError(res));
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function createExpense(input: ExpenseInput): Promise<Expense> {
  return request<Expense>("/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function scanReceipt(file: File): Promise<ScanDraft> {
  const form = new FormData();
  form.append("file", file);
  return request<ScanDraft>("/api/expenses/scan", {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(60_000),
  });
}

export function updateExpense(
  id: number,
  input: ExpenseInput,
): Promise<Expense> {
  return request<Expense>(`/api/expenses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function deleteExpense(id: number): Promise<void> {
  return request<void>(`/api/expenses/${id}`, { method: "DELETE" });
}
