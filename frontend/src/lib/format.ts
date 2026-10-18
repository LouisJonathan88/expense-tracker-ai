const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatRupiah(value: string | number): string {
  return rupiah.format(Number(value));
}

export function formatTanggal(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatBulan(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}