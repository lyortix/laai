import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-60" />
      </div>
      <Skeleton className="h-[180px] rounded-xl" />
      <Skeleton className="h-[300px] rounded-xl" />
    </div>
  );
}
