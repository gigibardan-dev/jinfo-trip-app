import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface POIMapPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (lat: number, lng: number) => void;
  mapBounds: { north: number; south: number; east: number; west: number };
  initialLat?: number;
  initialLng?: number;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function POIMapPicker({ open, onOpenChange, onSelect, mapBounds, initialLat, initialLng }: POIMapPickerProps) {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );

  const center: [number, number] = [
    (mapBounds.north + mapBounds.south) / 2,
    (mapBounds.east + mapBounds.west) / 2,
  ];

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedPosition([lat, lng]);
  };

  const handleConfirm = () => {
    if (selectedPosition) {
      onSelect(selectedPosition[0], selectedPosition[1]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>📍 Selectează Locația pe Hartă</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Click pe hartă unde vrei să adaugi punctul de interes
          </p>
        </DialogHeader>

        <div className="h-[500px] w-full rounded-lg overflow-hidden border">
          <MapContainer
            center={center}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onLocationSelect={handleLocationSelect} />
            {selectedPosition && <Marker position={selectedPosition} />}
          </MapContainer>
        </div>

        {selectedPosition && (
          <div className="text-sm text-muted-foreground">
            Coordonate selectate: <span className="font-mono">{selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}</span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anulează
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedPosition}>
            Confirmă Locația
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
