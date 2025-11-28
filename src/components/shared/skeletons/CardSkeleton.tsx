import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CardSkeletonProps {
  count?: number;
}

export const CardSkeleton = ({ count = 1 }: CardSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </Card>
      ))}
    </>
  );
};
