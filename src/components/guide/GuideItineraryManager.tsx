import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Edit, 
  Save, 
  X, 
  AlertTriangle,
  Coffee,
  Plane,
  Hotel,
  Camera,
  Car,
  GripVertical,
  Utensils
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface Trip {
  id: string;
  nume: string;
  destinatie: string;
  start_date: string;
  end_date: string;
}

interface ItineraryDay {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
  title: string;
  overview?: string;
}

interface Activity {
  id: string;
  day_id: string;
  title: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  location_name?: string;
  activity_type: string;
  display_order: number;
}

interface GuideItineraryManagerProps {
  tripId: string;
}

const activityTemplates = [
  { title: "Mic dejun", type: "meal", icon: Coffee, time: "08:00" },
  { title: "Check-in hotel", type: "accommodation", icon: Hotel, time: "15:00" },
  { title: "Transfer aeroport", type: "transport", icon: Plane, time: "" },
  { title: "Prânz", type: "meal", icon: Utensils, time: "13:00" },
  { title: "Transport local", type: "transport", icon: Car, time: "" },
  { title: "Vizită obiectiv", type: "attraction", icon: Camera, time: "" },
  { title: "Timp liber la dispoziție", type: "free_time", icon: Clock, time: "" },
  { title: "Excursie opțională", type: "attraction", icon: Camera, time: "" },
];

const activityTypes = [
  { value: "meal", label: "Masă", color: "bg-orange-500", icon: Utensils },
  { value: "transport", label: "Transport", color: "bg-blue-500", icon: Car },
  { value: "attraction", label: "Atracție", color: "bg-green-500", icon: Camera },
  { value: "accommodation", label: "Cazare", color: "bg-purple-500", icon: Hotel },
  { value: "free_time", label: "Timp liber", color: "bg-yellow-500", icon: Clock },
  { value: "custom", label: "Personalizat", color: "bg-gray-500", icon: Plus },
];

const GuideItineraryManager: React.FC<GuideItineraryManagerProps> = ({ tripId }) => {
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [activities, setActivities] = useState<{ [key: string]: Activity[] }>({});
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    location_name: "",
    activity_type: "custom",
  });

  useEffect(() => {
    fetchTripAndItinerary();
  }, [tripId]);

  const fetchTripAndItinerary = async () => {
    try {
      // Fetch trip details
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (tripError) throw tripError;
      setTrip(tripData);

      // Fetch itinerary days
      const { data: daysData, error: daysError } = await supabase
        .from('itinerary_days')
        .select('*')
        .eq('trip_id', tripId)
        .order('day_number');

      if (daysError) throw daysError;
      setDays(daysData || []);

      // Fetch activities for all days
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('itinerary_activities')
        .select('*')
        .in('day_id', (daysData || []).map(day => day.id))
        .order('display_order');

      if (activitiesError) throw activitiesError;

      // Group activities by day
      const groupedActivities: { [key: string]: Activity[] } = {};
      (activitiesData || []).forEach(activity => {
        if (!groupedActivities[activity.day_id]) {
          groupedActivities[activity.day_id] = [];
        }
        groupedActivities[activity.day_id].push(activity);
      });
      setActivities(groupedActivities);

      // Set first day as selected
      if (daysData && daysData.length > 0) {
        setSelectedDay(daysData[0].id);
      }
    } catch (error) {
      console.error('Error fetching itinerary:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut încărca itinerariul.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canEditDay = (date: string) => {
    const dayDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dayDate >= today;
  };

  const handleAddActivity = async () => {
    if (!selectedDay || !newActivity.title.trim()) {
      toast({
        title: "Eroare",
        description: "Titlul activității este obligatoriu.",
        variant: "destructive",
      });
      return;
    }

    const selectedDayData = days.find(day => day.id === selectedDay);
    if (!selectedDayData || !canEditDay(selectedDayData.date)) {
      toast({
        title: "Eroare",
        description: "Nu poți adăuga activități în trecut.",
        variant: "destructive",
      });
      return;
    }

    try {
      const maxOrder = Math.max(0, ...(activities[selectedDay] || []).map(a => a.display_order));
      
      const { data, error } = await supabase
        .from('itinerary_activities')
        .insert({
          day_id: selectedDay,
          title: newActivity.title,
          description: newActivity.description || null,
          start_time: newActivity.start_time || null,
          end_time: newActivity.end_time || null,
          location_name: newActivity.location_name || null,
          activity_type: newActivity.activity_type as "transport" | "accommodation" | "custom" | "meal" | "attraction" | "free_time",
          display_order: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;

      setActivities(prev => ({
        ...prev,
        [selectedDay]: [...(prev[selectedDay] || []), data],
      }));

      setNewActivity({
        title: "",
        description: "",
        start_time: "",
        end_time: "",
        location_name: "",
        activity_type: "custom",
      });
      setIsAddDialogOpen(false);

      toast({
        title: "Succes",
        description: "Activitatea a fost adăugată cu succes.",
      });
    } catch (error) {
      console.error('Error adding activity:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut adăuga activitatea.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateActivity = async (activity: Activity) => {
    const dayData = days.find(day => day.id === activity.day_id);
    if (!dayData || !canEditDay(dayData.date)) {
      toast({
        title: "Eroare",
        description: "Nu poți modifica activități din trecut.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('itinerary_activities')
        .update({
          title: activity.title,
          description: activity.description,
          start_time: activity.start_time,
          end_time: activity.end_time,
          location_name: activity.location_name,
          activity_type: activity.activity_type as "transport" | "accommodation" | "custom" | "meal" | "attraction" | "free_time",
        })
        .eq('id', activity.id);

      if (error) throw error;

      setActivities(prev => ({
        ...prev,
        [activity.day_id]: prev[activity.day_id].map(a => 
          a.id === activity.id ? activity : a
        ),
      }));

      setEditingActivity(null);
      toast({
        title: "Succes",
        description: "Activitatea a fost actualizată cu succes.",
      });
    } catch (error) {
      console.error('Error updating activity:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut actualiza activitatea.",
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !selectedDay) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const dayData = days.find(day => day.id === selectedDay);
    if (!dayData || !canEditDay(dayData.date)) {
      toast({
        title: "Eroare",
        description: "Nu poți reordona activități din trecut.",
        variant: "destructive",
      });
      return;
    }

    const dayActivities = activities[selectedDay] || [];
    const newActivities = Array.from(dayActivities);
    const [reorderedItem] = newActivities.splice(sourceIndex, 1);
    newActivities.splice(destinationIndex, 0, reorderedItem);

    const updates = newActivities.map((activity, index) => ({
      id: activity.id,
      display_order: index + 1
    }));

    try {
      // Optimistic update
      setActivities(prev => ({
        ...prev,
        [selectedDay]: newActivities.map((activity, index) => ({ 
          ...activity, 
          display_order: index + 1 
        }))
      }));

      // Update database
      for (const update of updates) {
        const { error } = await supabase
          .from('itinerary_activities')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast({
        title: "Succes",
        description: "Ordinea activităților a fost actualizată.",
      });
    } catch (error) {
      console.error('Error reordering activities:', error);
      fetchTripAndItinerary();
      toast({
        title: "Eroare",
        description: "Nu s-a putut actualiza ordinea activităților.",
        variant: "destructive",
      });
    }
  };

  const addTemplateActivity = (template: typeof activityTemplates[0]) => {
    const dayData = days.find(day => day.id === selectedDay);
    if (!dayData || !canEditDay(dayData.date)) {
      toast({
        title: "Eroare",
        description: "Nu poți adăuga activități în trecut.",
        variant: "destructive",
      });
      return;
    }

    setNewActivity({
      title: template.title,
      description: "",
      start_time: template.time,
      end_time: "",
      location_name: "",
      activity_type: template.type,
    });
    setIsAddDialogOpen(true);
  };

  const getActivityTypeInfo = (type: string) => {
    return activityTypes.find(t => t.value === type) || activityTypes.find(t => t.value === "custom")!;
  };

  const formatTime = (time: string | null) => {
    if (!time) return "";
    return time.substring(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!trip) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Nu s-au putut încărca detaliile circuitului.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Gestionare Itinerariu</h1>
        <p className="text-muted-foreground">
          {trip.nume} - {trip.destinatie}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with days */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="font-semibold text-lg mb-4">Zilele circuitului</h3>
          {days.map((day) => {
            const isEditable = canEditDay(day.date);
            const activityCount = activities[day.id]?.length || 0;
            
            return (
              <Card
                key={day.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedDay === day.id ? "border-primary shadow-md" : ""
                } ${!isEditable ? "opacity-60" : ""}`}
                onClick={() => setSelectedDay(day.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">Ziua {day.day_number}</div>
                    {!isEditable && (
                      <Badge variant="secondary" className="text-xs">
                        Trecut
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">
                    {new Date(day.date).toLocaleDateString('ro-RO', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </div>
                  <div className="text-sm font-medium">{day.title}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {activityCount} {activityCount === 1 ? 'activitate' : 'activități'}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main content area */}
        <div className="lg:col-span-3">
          {selectedDay ? (
            <div className="space-y-4">
              {(() => {
                const day = days.find(d => d.id === selectedDay);
                const dayActivities = activities[selectedDay] || [];
                const isEditable = day && canEditDay(day.date);

                return (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold">
                            {day?.title} - Ziua {day?.day_number}
                          </h2>
                          <p className="text-muted-foreground">
                            {day && new Date(day.date).toLocaleDateString('ro-RO', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        {isEditable && (
                          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                              <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Adaugă Activitate
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Adaugă Activitate Nouă</DialogTitle>
                              <DialogDescription>
                                Completează detaliile pentru noua activitate.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="title">Titlu *</Label>
                                <Input
                                  id="title"
                                  value={newActivity.title}
                                  onChange={(e) => setNewActivity(prev => ({ ...prev, title: e.target.value }))}
                                  placeholder="Titlul activității"
                                />
                              </div>
                              <div>
                                <Label htmlFor="type">Tip activitate</Label>
                                <Select
                                  value={newActivity.activity_type}
                                  onValueChange={(value) => setNewActivity(prev => ({ ...prev, activity_type: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {activityTypes.map(type => (
                                      <SelectItem key={type.value} value={type.value}>
                                        <div className="flex items-center gap-2">
                                          <div className={`w-3 h-3 rounded-full ${type.color}`} />
                                          {type.label}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="start_time">Ora început</Label>
                                  <Input
                                    id="start_time"
                                    type="time"
                                    value={newActivity.start_time}
                                    onChange={(e) => setNewActivity(prev => ({ ...prev, start_time: e.target.value }))}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="end_time">Ora sfârșit</Label>
                                  <Input
                                    id="end_time"
                                    type="time"
                                    value={newActivity.end_time}
                                    onChange={(e) => setNewActivity(prev => ({ ...prev, end_time: e.target.value }))}
                                  />
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="location">Locație</Label>
                                <Input
                                  id="location"
                                  value={newActivity.location_name}
                                  onChange={(e) => setNewActivity(prev => ({ ...prev, location_name: e.target.value }))}
                                  placeholder="Locația activității"
                                />
                              </div>
                              <div>
                                <Label htmlFor="description">Descriere</Label>
                                <Textarea
                                  id="description"
                                  value={newActivity.description}
                                  onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                                  placeholder="Descrierea activității"
                                  rows={3}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={handleAddActivity} className="flex-1">
                                  Adaugă Activitate
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setIsAddDialogOpen(false)}
                                >
                                  Anulează
                                </Button>
                              </div>
                            </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>

                    {/* Template-uri rapide */}
                    {isEditable && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Template-uri Rapide</CardTitle>
                          <CardDescription>Adaugă rapid activități comune</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {activityTemplates.map((template, idx) => {
                              const Icon = template.icon;
                              return (
                                <Button
                                  key={idx}
                                  variant="outline"
                                  className="h-auto p-3 flex-col items-center gap-2"
                                  onClick={() => addTemplateActivity(template)}
                                >
                                  <Icon className="h-5 w-5" />
                                  <span className="text-xs text-center">{template.title}</span>
                                </Button>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {!isEditable && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Nu poți modifica activitățile din trecut. Doar zilele viitoare pot fi editate.
                        </AlertDescription>
                      </Alert>
                    )}

                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="activities">
                        {(provided) => (
                          <div 
                            {...provided.droppableProps} 
                            ref={provided.innerRef}
                            className="space-y-3"
                          >
                            {dayActivities.length === 0 ? (
                              <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                                  <h3 className="text-lg font-semibold mb-2">Nicio activitate programată</h3>
                                  <p className="text-muted-foreground text-center">
                                    {isEditable ? "Adaugă prima activitate pentru această zi." : "Nu sunt activități programate pentru această zi."}
                                  </p>
                                </CardContent>
                              </Card>
                            ) : (
                              dayActivities.map((activity, index) => {
                                const typeInfo = getActivityTypeInfo(activity.activity_type);
                                const isEditing = editingActivity?.id === activity.id;

                                return (
                                  <Draggable
                                    key={activity.id}
                                    draggableId={activity.id}
                                    index={index}
                                    isDragDisabled={!isEditable}
                                  >
                                    {(provided) => (
                                      <Card
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className="hover:shadow-md transition-shadow"
                                      >
                                        <CardContent className="p-4">
                                          <div className="flex items-center gap-3">
                                            {isEditable && (
                                              <div {...provided.dragHandleProps}>
                                                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                                              </div>
                                            )}
                                            <div className="flex-1">
                                              {isEditing ? (
                                                <div className="space-y-4">
                                                  <div>
                                                    <Label>Titlu</Label>
                                                    <Input
                                                      value={editingActivity.title}
                                                      onChange={(e) => setEditingActivity(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                                                    />
                                                  </div>
                                                  <div>
                                                    <Label>Tip</Label>
                                                    <Select
                                                      value={editingActivity.activity_type}
                                                      onValueChange={(value) => setEditingActivity(prev => prev ? ({ ...prev, activity_type: value }) : null)}
                                                    >
                                                      <SelectTrigger>
                                                        <SelectValue />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        {activityTypes.map(type => (
                                                          <SelectItem key={type.value} value={type.value}>
                                                            <div className="flex items-center gap-2">
                                                              <div className={`w-3 h-3 rounded-full ${type.color}`} />
                                                              {type.label}
                                                            </div>
                                                          </SelectItem>
                                                        ))}
                                                      </SelectContent>
                                                    </Select>
                                                  </div>
                                                  <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                      <Label>Ora început</Label>
                                                      <Input
                                                        type="time"
                                                        value={editingActivity.start_time || ""}
                                                        onChange={(e) => setEditingActivity(prev => prev ? ({ ...prev, start_time: e.target.value }) : null)}
                                                      />
                                                    </div>
                                                    <div>
                                                      <Label>Ora sfârșit</Label>
                                                      <Input
                                                        type="time"
                                                        value={editingActivity.end_time || ""}
                                                        onChange={(e) => setEditingActivity(prev => prev ? ({ ...prev, end_time: e.target.value }) : null)}
                                                      />
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <Label>Locație</Label>
                                                    <Input
                                                      value={editingActivity.location_name || ""}
                                                      onChange={(e) => setEditingActivity(prev => prev ? ({ ...prev, location_name: e.target.value }) : null)}
                                                    />
                                                  </div>
                                                  <div>
                                                    <Label>Descriere</Label>
                                                    <Textarea
                                                      value={editingActivity.description || ""}
                                                      onChange={(e) => setEditingActivity(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                                                      rows={3}
                                                    />
                                                  </div>
                                                  <div className="flex gap-2">
                                                    <Button
                                                      size="sm"
                                                      onClick={() => handleUpdateActivity(editingActivity)}
                                                    >
                                                      <Save className="h-4 w-4 mr-1" />
                                                      Salvează
                                                    </Button>
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => setEditingActivity(null)}
                                                    >
                                                      <X className="h-4 w-4 mr-1" />
                                                      Anulează
                                                    </Button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="flex items-start justify-between">
                                                  <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-3">
                                                      <div className={`w-4 h-4 rounded-full ${typeInfo.color}`} />
                                                      <div className="font-semibold text-lg">{activity.title}</div>
                                                      <Badge variant="outline">{typeInfo.label}</Badge>
                                                    </div>
                                                    
                                                    {(activity.start_time || activity.end_time) && (
                                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Clock className="h-4 w-4" />
                                                        <span>
                                                          {activity.start_time && formatTime(activity.start_time)}
                                                          {activity.start_time && activity.end_time && " - "}
                                                          {activity.end_time && formatTime(activity.end_time)}
                                                        </span>
                                                      </div>
                                                    )}
                                                    
                                                    {activity.location_name && (
                                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <MapPin className="h-4 w-4" />
                                                        <span>{activity.location_name}</span>
                                                      </div>
                                                    )}
                                                    
                                                    {activity.description && (
                                                      <p className="text-sm text-muted-foreground mt-2">
                                                        {activity.description}
                                                      </p>
                                                    )}
                                                  </div>
                                                  
                                                  {isEditable && (
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => setEditingActivity(activity)}
                                                    >
                                                      <Edit className="h-4 w-4" />
                                                    </Button>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    )}
                                  </Draggable>
                              );
                            })
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                      </Droppable>
                    </DragDropContext>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selectează o zi</h3>
                <p className="text-muted-foreground text-center">
                  Alege o zi din sidebar pentru a vedea și gestiona activitățile.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuideItineraryManager;