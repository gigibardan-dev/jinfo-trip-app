import { Crown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SuperAdminBadgeProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const SuperAdminBadge = ({ size = "sm", showText = false }: SuperAdminBadgeProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
            <Crown className={`${sizeClasses[size]} text-amber-500`} />
            {showText && (
              <span className="text-xs font-semibold text-amber-600">SUPER</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">SuperAdmin</p>
          <p className="text-xs text-muted-foreground">Acces complet la sistem</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
