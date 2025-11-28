import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Edit, Trash2, Eye, Settings, RefreshCw, Loader2, Sparkles, Hotel, Utensils, Camera, Hospital, Bus, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MapPreviewDialog } from "../MapPreviewDialog";
import { MapSettingsDialog } from "../MapSettingsDialog";
import POIDialog from "../POIDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TripMapConfigProps {
  tripId: string;
  tripData: {
    id: string;
    destinatie: string;
    tara: string;
  };
  mapConfig: any;
  onConfigUpdated: (config: any) => void;
}

const TripMapConfig = ({ tripId, tripData, mapConfig, onConfigUpdated }: TripMapConfigProps) => {
  const [pointsOfInterest, setPointsOfInterest] = useState<any[]>([]);
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);
  const [showMapPreview, setShowMapPreview] = useState(false);
  const [showMapSettings, setShowMapSettings] = useState(false);
  const [showPOIDialog, setShowPOIDialog] = useState(false);
  const [editingPOI, setEditingPOI] = useState<any>(null);
  const [deletingPOI, setDeletingPOI] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (tripId) {
      fetchPOIs(tripId);
    }
  }, [tripId]);

  const fetchPOIs = async (tripId: string) => {
    try {
      const { data, error } = await supabase
        .from('map_points_of_interest')
        .select('*')
        .eq('trip_id', tripId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPointsOfInterest(data || []);
    } catch (error) {
      console.error('Error fetching POIs:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, any> = {
      hotel: Hotel,
      restaurant: Utensils,
      attraction: Camera,
      emergency: Hospital,
      transport: Bus,
      shop: ShoppingBag,
      other: MapPin,
    };
    return iconMap[category] || MapPin;
  };

  const handleDeletePOI = async () => {
    if (!deletingPOI) return;

    try {
      const { error } = await supabase
        .from('map_points_of_interest')
        .delete()
        .eq('id', deletingPOI.id);

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Punctul de interes a fost șters.",
      });

      fetchPOIs(tripId);
    } catch (error: any) {
      console.error('Error deleting POI:', error);
      toast({
        title: "Eroare",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingPOI(null);
    }
  };

  const handleGenerateMapConfig = async () => {
    setIsGeneratingMap(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://zbepoxajjdxhkwotfelh.supabase.co/functions/v1/auto-geocode-trip`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ trip_id: tripId })
        }
      );
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      toast({
        title: "Hartă configurată cu succes!",
        description: `Detectate ${result.locations.length} locații. Storage estimat: ${result.config.estimated_size_mb} MB`
      });
      
      onConfigUpdated(result.config);
      
    } catch (error: any) {
      console.error('Error generating map config:', error);
      toast({
        title: "Eroare la generare hartă",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingMap(false);
    }
  };

  return (
    <div className="space-y-6">
      {mapConfig ? (
        <>
          {/* Map Config Summary */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <h4 className="text-sm font-medium mb-2">Orașe Detectate</h4>
              <p className="text-2xl font-bold">
                {mapConfig.locations?.length || 0}
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="text-sm font-medium mb-2">Dimensiune Estimată</h4>
              <p className="text-2xl font-bold">
                {mapConfig.estimated_size_mb?.toFixed(1) || 0} MB
              </p>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMapPreview(true)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview Hartă
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMapSettings(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Setări Avansate
            </Button>
            <Button
              type="button"
              onClick={handleGenerateMapConfig}
              disabled={isGeneratingMap}
            >
              {isGeneratingMap ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Se generează...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-generează Config
                </>
              )}
            </Button>
          </div>

          {/* POI Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Puncte de Interes Custom
              </h3>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setEditingPOI(null);
                  setShowPOIDialog(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adaugă POI
              </Button>
            </div>

            {pointsOfInterest.length > 0 ? (
              <div className="space-y-2">
                {pointsOfInterest.map((poi) => {
                  const CategoryIcon = getCategoryIcon(poi.category);
                  return (
                    <Card key={poi.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-2 rounded-lg bg-${poi.color}-100`}>
                            <CategoryIcon className={`w-4 h-4 text-${poi.color}-600`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{poi.name}</h4>
                              {!poi.is_visible && (
                                <Badge variant="secondary" className="text-xs">Ascuns</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {poi.lat.toFixed(4)}, {poi.lng.toFixed(4)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingPOI(poi);
                              setShowPOIDialog(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingPOI(poi)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-6 border border-dashed rounded-lg">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Nu există puncte de interes adăugate încă
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-4">
            Nu există configurație de hartă offline pentru acest circuit.
          </p>
          <Button
            type="button"
            onClick={handleGenerateMapConfig}
            disabled={isGeneratingMap}
          >
            {isGeneratingMap ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Se generează...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generează Configurație Hartă
              </>
            )}
          </Button>
        </Card>
      )}

      {/* Map Preview Dialog */}
      {mapConfig && (
        <MapPreviewDialog
          open={showMapPreview}
          onOpenChange={setShowMapPreview}
          mapConfig={mapConfig}
          tripId={tripId}
        />
      )}

      {/* Map Settings Dialog */}
      {mapConfig && (
        <MapSettingsDialog
          open={showMapSettings}
          onOpenChange={setShowMapSettings}
          mapConfig={mapConfig}
          onConfigUpdated={onConfigUpdated}
        />
      )}

      {/* POI Dialog */}
      {mapConfig && (
        <POIDialog
          open={showPOIDialog}
          onOpenChange={setShowPOIDialog}
          tripId={tripId}
          existingPOI={editingPOI}
          onSuccess={() => {
            fetchPOIs(tripId);
            setShowPOIDialog(false);
            setEditingPOI(null);
          }}
          mapBounds={
            mapConfig
              ? {
                  north: mapConfig.bounds_north,
                  south: mapConfig.bounds_south,
                  east: mapConfig.bounds_east,
                  west: mapConfig.bounds_west,
                }
              : undefined
          }
        />
      )}

      {/* Delete POI Confirmation */}
      <AlertDialog open={!!deletingPOI} onOpenChange={() => setDeletingPOI(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ștergi punctul de interes?</AlertDialogTitle>
            <AlertDialogDescription>
              Sigur vrei să ștergi "{deletingPOI?.name}"? Această acțiune nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePOI} className="bg-destructive hover:bg-destructive/90">
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TripMapConfig;
