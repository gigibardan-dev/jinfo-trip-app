import { Skeleton } from "@/components/ui/skeleton";

interface ListSkeletonProps {
  count?: number;
  showAvatar?: boolean;
}

export const ListSkeleton = ({ count = 5, showAvatar = false }: ListSkeletonProps) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          {showAvatar && <Skeleton className="h-12 w-12 rounded-full" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      ))}
    </div>
  );
};
