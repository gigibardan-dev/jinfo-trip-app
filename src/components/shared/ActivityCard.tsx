import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Navigation, FileText } from "lucide-react";

interface ActivityCardProps {
  time: string;
  title: string;
  location: string;
  status: "completed" | "upcoming" | "ongoing";
  type: "meal" | "attraction" | "transport" | "accommodation" | string;
  isNext?: boolean;
  onNavigate?: () => void;
  onViewDetails?: () => void;
}

export const ActivityCard = ({
  time,
  title,
  location,
  status,
  type,
  isNext = false,
  onNavigate,
  onViewDetails
}: ActivityCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success text-success-foreground";
      case "upcoming": return "bg-primary text-primary-foreground";
      case "ongoing": return "bg-accent text-accent-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "meal": return "🍽️";
      case "attraction": return "🏛️";
      case "transport": return "✈️";
      case "accommodation": return "🏨";
      default: return "📍";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Completat";
      case "upcoming": return "Urmează";
      case "ongoing": return "În desfășurare";
      default: return status;
    }
  };

  return (
    <Card
      className={`transition-all ${
        isNext 
          ? "border-primary bg-primary/5 shadow-soft" 
          : status === "completed"
          ? "border-success bg-success/5"
          : "border-border"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="text-2xl">{getActivityIcon(type)}</div>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{title}</h3>
              <Badge className={getStatusColor(status)}>
                {getStatusText(status)}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {time}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {location}
              </div>
            </div>
            
            {isNext && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="bg-primary" onClick={onNavigate}>
                  <Navigation className="w-3 h-3 mr-1" />
                  Navigație
                </Button>
                <Button size="sm" variant="outline" onClick={onViewDetails}>
                  <FileText className="w-3 h-3 mr-1" />
                  Detalii
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};