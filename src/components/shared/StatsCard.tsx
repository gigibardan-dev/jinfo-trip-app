import React, { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  change?: string;
  icon: React.ReactElement;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
}

export const StatsCard = ({
  title,
  value,
  description,
  change,
  icon,
  iconColor = "text-primary",
  trend = "neutral"
}: StatsCardProps) => {
  const getTrendColor = () => {
    switch (trend) {
      case "up": return "text-success";
      case "down": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  return (
    <Card className="shadow-soft border-0 hover:shadow-medium transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {React.cloneElement(icon, { className: `w-5 h-5 ${iconColor}` })}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {change && (
          <p className={`text-xs mt-1 ${getTrendColor()}`}>
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(StatsCard);