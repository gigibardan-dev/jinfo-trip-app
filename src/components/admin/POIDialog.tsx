import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Hotel, Utensils, Camera, Hospital, Bus, ShoppingBag, MapPin } from "lucide-react";
import POIMapPicker from "./POIMapPicker";

interface POI {
  id?: string;
  trip_id: string;
  name: string;
  description?: string;
  lat: number;
  lng: number;
  category: string;
  icon?: string;
  color: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
  is_visible: boolean;
}

interface POIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  existingPOI?: POI;
  onSuccess: () => void;
  mapBounds?: { north: number; south: number; east: number; west: number };
}

const categories = [
  { value: "hotel", label: "Hotel", icon: Hotel, color: "green" },
  { value: "restaurant", label: "Restaurant", icon: Utensils, color: "orange" },
  { value: "attraction", label: "Atracție Turistică", icon: Camera, color: "blue" },
  { value: "emergency", label: "Urgență/Medical", icon: Hospital, color: "red" },
  { value: "transport", label: "Transport", icon: Bus, color: "purple" },
  { value: "shop", label: "Magazine", icon: ShoppingBag, color: "yellow" },
  { value: "other", label: "Altele", icon: MapPin, color: "gray" },
];

const colors = [
  { value: "blue", label: "Albastru", hex: "#3b82f6" },
  { value: "green", label: "Verde", hex: "#22c55e" },
  { value: "red", label: "Roșu", hex: "#ef4444" },
  { value: "orange", label: "Portocaliu", hex: "#f97316" },
  { value: "purple", label: "Mov", hex: "#a855f7" },
  { value: "yellow", label: "Galben", hex: "#eab308" },
  { value: "gray", label: "Gri", hex: "#6b7280" },
];

export default function POIDialog({ open, onOpenChange, tripId, existingPOI, onSuccess, mapBounds }: POIDialogProps) {
  const [formData, setFormData] = useState<POI>({
    trip_id: tripId,
    name: "",
    description: "",
    lat: 0,
    lng: 0,
    category: "attraction",
    icon: "camera",
    color: "blue",
    phone: "",
    address: "",
    website: "",
    notes: "",
    is_visible: true,
  });
  const [loading, setLoading] = useState(false);
  const [locationMode, setLocationMode] = useState<"search" | "manual" | "map">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  useEffect(() => {
    if (existingPOI) {
      setFormData(existingPOI);
    } else {
      setFormData({
        trip_id: tripId,
        name: "",
        description: "",
        lat: 0,
        lng: 0,
        category: "attraction",
        icon: "camera",
        color: "blue",
        phone: "",
        address: "",
        website: "",
        notes: "",
        is_visible: true,
      });
    }
  }, [existingPOI, tripId, open]);

  useEffect(() => {
    const category = categories.find(c => c.value === formData.category);
    if (category) {
      // Map category to icon name directly (Lucide icons don't have .name property)
      const iconMap: Record<string, string> = {
        hotel: 'hotel',
        restaurant: 'utensils',
        attraction: 'camera',
        emergency: 'hospital',
        transport: 'bus',
        shop: 'shopping-bag',
        other: 'map-pin',
      };
      
      setFormData(prev => ({ 
        ...prev, 
        icon: iconMap[category.value] || 'map-pin',
        color: category.color 
      }));
    }
  }, [formData.category]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
      
      if (data.length === 0) {
        toast.error("Nu s-au găsit rezultate", {
          description: "Încearcă o căutare diferită sau folosește coordonate manual"
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Eroare la căutare");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectLocation = (result: any) => {
    setFormData(prev => ({
      ...prev,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name,
    }));
    setSearchResults([]);
    toast.success("Locație selectată!");
  };

  const handleMapSelect = (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, lat, lng }));
    setShowMapPicker(false);
    toast.success("Locație selectată de pe hartă!");
  };

  const validateForm = () => {
    if (!formData.name.trim() || formData.name.length < 2) {
      toast.error("Numele trebuie să aibă minim 2 caractere");
      return false;
    }
    
    if (formData.lat < -90 || formData.lat > 90 || formData.lng < -180 || formData.lng > 180) {
      toast.error("Coordonatele nu sunt valide");
      return false;
    }

    if (formData.lat === 0 && formData.lng === 0) {
      toast.error("Te rugăm să selectezi o locație");
      return false;
    }

    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      toast.error("Website-ul trebuie să înceapă cu http:// sau https://");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const poiData = {
        ...formData,
        created_by: user?.id,
      };

      if (existingPOI?.id) {
        const { error } = await supabase
          .from("map_points_of_interest")
          .update(poiData)
          .eq("id", existingPOI.id);

        if (error) throw error;
        toast.success("Punct de interes actualizat!");
      } else {
        const { error } = await supabase
          .from("map_points_of_interest")
          .insert(poiData);

        if (error) throw error;
        toast.success("Punct de interes adăugat!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Save POI error:", error);
      toast.error("Eroare la salvare", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {existingPOI ? "Editează Punct de Interes" : "Adaugă Punct de Interes"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informații Bază */}
            <div className="space-y-4">
              <h3 className="font-semibold">Informații Bază</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Nume *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder='Ex: "Avani Windhoek Hotel"'
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descriere (opțional)</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder='Ex: "Hotel 4* în centrul orașului"'
                  rows={2}
                />
              </div>
            </div>

            {/* Locație */}
            <div className="space-y-4">
              <h3 className="font-semibold">Locație *</h3>
              
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={locationMode === "search" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLocationMode("search")}
                >
                  Caută
                </Button>
                <Button
                  type="button"
                  variant={locationMode === "manual" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLocationMode("manual")}
                >
                  Coordonate
                </Button>
                <Button
                  type="button"
                  variant={locationMode === "map" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setLocationMode("map");
                    setShowMapPicker(true);
                  }}
                >
                  🗺️ Hartă
                </Button>
              </div>

              {locationMode === "search" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Caută locație..."
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={searching}>
                      {searching ? "..." : "🔍"}
                    </Button>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="border rounded-md max-h-40 overflow-y-auto">
                      {searchResults.map((result, index) => (
                        <button
                          key={index}
                          className="w-full text-left p-2 hover:bg-accent text-sm"
                          onClick={() => handleSelectLocation(result)}
                        >
                          {result.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {locationMode === "manual" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lat">Latitudine</Label>
                    <Input
                      id="lat"
                      type="number"
                      step="0.000001"
                      value={formData.lat}
                      onChange={(e) => setFormData(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                      placeholder="-22.5609"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lng">Longitudine</Label>
                    <Input
                      id="lng"
                      type="number"
                      step="0.000001"
                      value={formData.lng}
                      onChange={(e) => setFormData(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                      placeholder="17.0658"
                    />
                  </div>
                </div>
              )}

              {(formData.lat !== 0 || formData.lng !== 0) && (
                <div className="text-sm text-muted-foreground">
                  Coordonate selectate: {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                </div>
              )}
            </div>

            {/* Categorie & Culoare */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categorie *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {cat.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Culoare Marker</Label>
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-10 h-10 rounded-full border-2 ${
                        formData.color === color.value ? "border-primary ring-2 ring-primary ring-offset-2" : "border-border"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Informații Adiționale */}
            <div className="space-y-4">
              <h3 className="font-semibold">Informații Adiționale (opțional)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+264 61 280 000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresă</Label>
                <Input
                  id="address"
                  value={formData.address || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Note Admin (vizibile doar pentru admin)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder='Ex: "Closed Mondays", "Reservation needed"'
                  rows={2}
                />
              </div>
            </div>

            {/* Vizibilitate */}
            <div className="flex items-center justify-between">
              <Label htmlFor="visible" className="cursor-pointer">Vizibil pentru turiști</Label>
              <Switch
                id="visible"
                checked={formData.is_visible}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_visible: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Anulează
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Se salvează..." : "Salvează Punct"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showMapPicker && mapBounds && (
        <POIMapPicker
          open={showMapPicker}
          onOpenChange={setShowMapPicker}
          onSelect={handleMapSelect}
          mapBounds={mapBounds}
          initialLat={formData.lat !== 0 ? formData.lat : undefined}
          initialLng={formData.lng !== 0 ? formData.lng : undefined}
        />
      )}
    </>
  );
}
