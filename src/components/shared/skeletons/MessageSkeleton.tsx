import { Skeleton } from "@/components/ui/skeleton";

interface MessageSkeletonProps {
  count?: number;
}

export const MessageSkeleton = ({ count = 5 }: MessageSkeletonProps) => {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: count }).map((_, i) => {
        const isOwn = i % 2 === 0;
        return (
          <div 
            key={i} 
            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className={`h-16 ${isOwn ? 'w-64' : 'w-56'} rounded-lg`} />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
