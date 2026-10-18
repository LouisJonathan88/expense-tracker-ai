import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ExpenseLoading() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-64" />
      </div>
    </AppShell>
  );
}