import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MapSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapConfig: any;
  onConfigUpdated: (config: any) => void;
}

export function MapSettingsDialog({ 
  open, 
  onOpenChange, 
  mapConfig,
  onConfigUpdated 
}: MapSettingsDialogProps) {
  const [zoomMin, setZoomMin] = useState(mapConfig?.zoom_min || 5);
  const [zoomMax, setZoomMax] = useState(mapConfig?.zoom_max || 13);
  const [locations, setLocations] = useState(mapConfig?.locations || []);
  const [newCityName, setNewCityName] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleAddCity = async () => {
    if (!newCityName.trim()) return;
    
    setIsGeocoding(true);
    try {
      // Geocode the city
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(newCityName)}&format=json&limit=1`,
        {
          headers: { 'User-Agent': 'JinfoApp-TravelApp/1.0' }
        }
      );
      
      const data = await response.json();
      
      if (data.length > 0) {
        const newLocation = {
          name: newCityName,
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          display_name: data[0].display_name
        };
        
        setLocations([...locations, newLocation]);
        setNewCityName("");
        
        toast({
          title: "Oraș adăugat",
          description: `${newCityName} a fost adăugat pe hartă`
        });
      } else {
        toast({
          title: "Oraș negăsit",
          description: "Nu am putut găsi acest oraș. Verifică numele.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Eroare",
        description: "Nu am putut geocoda orașul",
        variant: "destructive"
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleRemoveCity = (index: number) => {
    setLocations(locations.filter((_: any, i: number) => i !== index));
  };

  const handleSave = async () => {
    if (locations.length === 0) {
      toast({
        title: "Eroare",
        description: "Adaugă cel puțin un oraș",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // Recalculate bounds
      const lats = locations.map((l: any) => l.lat);
      const lngs = locations.map((l: any) => l.lng);
      
      const latPadding = (Math.max(...lats) - Math.min(...lats)) * 0.1;
      const lngPadding = (Math.max(...lngs) - Math.min(...lngs)) * 0.1;
      
      const bounds = {
        north: Math.max(...lats) + latPadding,
        south: Math.min(...lats) - latPadding,
        east: Math.max(...lngs) + lngPadding,
        west: Math.min(...lngs) - lngPadding
      };

      // Estimate new tile count
      let tileCount = 0;
      for (let zoom = zoomMin; zoom <= zoomMax; zoom++) {
        const n = Math.pow(2, zoom);
        const latTiles = Math.ceil((bounds.north - bounds.south) / 180 * n);
        const lngTiles = Math.ceil((bounds.east - bounds.west) / 360 * n);
        tileCount += latTiles * lngTiles;
      }
      
      const estimatedSizeMB = (tileCount * 25) / 1024;

      // Update database
      const { data, error } = await supabase
        .from('offline_map_configs')
        .update({
          bounds_north: bounds.north,
          bounds_south: bounds.south,
          bounds_east: bounds.east,
          bounds_west: bounds.west,
          zoom_min: zoomMin,
          zoom_max: zoomMax,
          locations: locations,
          tile_count: tileCount,
          estimated_size_mb: parseFloat(estimatedSizeMB.toFixed(2)),
          updated_at: new Date().toISOString()
        })
        .eq('id', mapConfig.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Setări salvate",
        description: `Configurație actualizată. Nou estimat: ${estimatedSizeMB.toFixed(1)} MB`
      });

      onConfigUpdated(data);
      onOpenChange(false);

    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Eroare la salvare",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Estimate storage based on current settings
  let estimatedTiles = 0;
  for (let zoom = zoomMin; zoom <= zoomMax; zoom++) {
    const n = Math.pow(2, zoom);
    estimatedTiles += n * n * 0.01; // Rough estimate
  }
  const estimatedMB = (estimatedTiles * 25) / 1024;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Setări Avansate Hartă</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Zoom Levels */}
          <div className="space-y-4">
            <Label>Nivele Zoom</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Zoom Minim: {zoomMin}
                </Label>
                <Slider
                  value={[zoomMin]}
                  onValueChange={([value]) => setZoomMin(value)}
                  min={3}
                  max={10}
                  step={1}
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Zoom Maxim: {zoomMax}
                </Label>
                <Slider
                  value={[zoomMax]}
                  onValueChange={([value]) => setZoomMax(value)}
                  min={10}
                  max={15}
                  step={1}
                  className="mt-2"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Estimat: ~{estimatedMB.toFixed(1)} MB pentru zoom {zoomMin}-{zoomMax}
            </p>
          </div>

          {/* Locations */}
          <div className="space-y-3">
            <Label>Orașe Incluse</Label>
            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {locations.map((location: any, idx: number) => (
                <Badge key={idx} variant="secondary" className="pr-1">
                  {location.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-2 hover:bg-transparent"
                    onClick={() => handleRemoveCity(idx)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Adaugă oraș manual..."
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCity()}
              />
              <Button
                onClick={handleAddCity}
                disabled={!newCityName.trim() || isGeocoding}
                size="sm"
              >
                {isGeocoding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anulează
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvare...
              </>
            ) : (
              'Salvează Setări'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}