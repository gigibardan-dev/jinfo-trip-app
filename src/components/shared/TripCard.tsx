import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Users, Eye, Edit, Trash2 } from "lucide-react";
import { memo } from "react";

interface TripCardProps {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate?: string;
  tourists: number;
  status: "draft" | "active" | "confirmed" | "completed" | "cancelled";
  progress?: number;
  coverImage?: string;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

export const TripCard = ({
  id,
  name,
  destination,
  startDate,
  endDate,
  tourists,
  status,
  progress = 0,
  coverImage,
  onView,
  onEdit,
  onDelete,
  isAdmin = false
}: TripCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-success text-success-foreground";
      case "confirmed": return "bg-primary text-primary-foreground";
      case "completed": return "bg-accent text-accent-foreground";
      case "cancelled": return "bg-destructive text-destructive-foreground";
      case "draft": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "În Desfășurare";
      case "confirmed": return "Confirmată";
      case "completed": return "Completată";
      case "cancelled": return "Anulată";
      case "draft": return "Schiță";
      default: return status;
    }
  };

  return (
    <Card className="shadow-soft border-0 hover:shadow-medium transition-all group">
      <CardContent className="p-0">
        {coverImage && (
          <div className="h-32 bg-gradient-ocean rounded-t-lg relative overflow-hidden">
            <img 
              src={coverImage} 
              alt={name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        )}
        
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <h3 className="font-semibold text-lg">{name}</h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mr-1" />
                {destination}
              </div>
            </div>
            <Badge className={getStatusColor(status)}>
              {getStatusText(status)}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {startDate} {endDate && `- ${endDate}`}
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {tourists} turiști
            </div>
          </div>

          {progress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progres</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => onView?.(id)}
            >
              <Eye className="w-3 h-3 mr-1" />
              Vezi
            </Button>
            {isAdmin && (
              <>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onEdit?.(id)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Editează
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onDelete?.(id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(TripCard);