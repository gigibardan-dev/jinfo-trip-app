import { Star } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VIPBadgeProps {
  size?: "sm" | "md" | "lg";
}

export const VIPBadge = ({ size = "sm" }: VIPBadgeProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
            <Star className={`${sizeClasses[size]} text-purple-500 fill-purple-500`} />
            <span className="text-xs font-semibold text-purple-600">VIP</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">Turist VIP</p>
          <p className="text-xs text-muted-foreground">Acces la conținut exclusiv</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
