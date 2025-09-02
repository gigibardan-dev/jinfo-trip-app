import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Euro, 
  Coffee,
  Plane,
  Hotel,
  Camera,
  Car,
  GripVertical,
  AlertTriangle,
  Utensils
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { format, addDays, parseISO } from "date-fns";
import { ro } from "date-fns/locale";

interface ItineraryManagerProps {
  tripId: string;
  tripName: string;
  startDate: string;
  endDate: string;
}

interface ItineraryDay {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
  title: string;
  overview?: string;
  activities: ItineraryActivity[];
}

interface ItineraryActivity {
  id: string;
  day_id: string;
  title: string;
  description?: string;
  activity_type: "custom" | "transport" | "accommodation" | "meal" | "attraction" | "free_time";
  start_time?: string;
  end_time?: string;
  location_name?: string;
  address?: string;
  cost_estimate?: number;
  booking_reference?: string;
  tips_and_notes?: string;
  display_order: number;
}

interface ActivityFormData {
  title: string;
  description: string;
  activity_type: "custom" | "transport" | "accommodation" | "meal" | "attraction" | "free_time";
  start_time: string;
  end_time: string;
  location_name: string;
  address: string;
  cost_estimate: string;
  booking_reference: string;
  tips_and_notes: string;
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

const activityTypeConfig = {
  attraction: { label: "Atracție", color: "bg-blue-500", icon: Camera },
  meal: { label: "Masă", color: "bg-green-500", icon: Utensils },
  transport: { label: "Transport", color: "bg-purple-500", icon: Car },
  accommodation: { label: "Cazare", color: "bg-orange-500", icon: Hotel },
  free_time: { label: "Timp Liber", color: "bg-yellow-500", icon: Clock },
  custom: { label: "Altele", color: "bg-muted", icon: Plus }
};

const ItineraryManager = ({ tripId, tripName, startDate, endDate }: ItineraryManagerProps) => {
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayId, setSelectedDayId] = useState<string>("");
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ItineraryActivity | null>(null);
  const [activityFormData, setActivityFormData] = useState<ActivityFormData>({
    title: "",
    description: "",
    activity_type: "attraction",
    start_time: "",
    end_time: "",
    location_name: "",
    address: "",
    cost_estimate: "",
    booking_reference: "",
    tips_and_notes: ""
  });

  const { profile } = useAuth();
  const { toast } = useToast();

  const selectedDay = days.find(day => day.id === selectedDayId);

  useEffect(() => {
    if (tripId) {
      initializeItinerary();
    }
  }, [tripId, startDate, endDate]);

  const initializeItinerary = async () => {
    await createDaysIfNeeded();
    await fetchItinerary();
  };

  const createDaysIfNeeded = async () => {
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const { data: existingDays } = await supabase
        .from('itinerary_days')
        .select('day_number')
        .eq('trip_id', tripId);

      const existingDayNumbers = existingDays?.map(d => d.day_number) || [];
      const daysToCreate = [];

      for (let i = 1; i <= totalDays; i++) {
        if (!existingDayNumbers.includes(i)) {
          const dayDate = addDays(start, i - 1);
          daysToCreate.push({
            trip_id: tripId,
            day_number: i,
            date: format(dayDate, 'yyyy-MM-dd'),
            title: `Ziua ${i}`,
            overview: null
          });
        }
      }

      if (daysToCreate.length > 0) {
        const { error } = await supabase
          .from('itinerary_days')
          .insert(daysToCreate);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error creating days:', error);
    }
  };

  const fetchItinerary = async () => {
    try {
      setLoading(true);
      
      const { data: daysData, error: daysError } = await supabase
        .from('itinerary_days')
        .select('*')
        .eq('trip_id', tripId)
        .order('day_number');

      if (daysError) throw daysError;

      if (daysData?.length > 0) {
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('itinerary_activities')
          .select('*')
          .in('day_id', daysData.map(d => d.id))
          .order('display_order');

        if (activitiesError) throw activitiesError;

        const daysWithActivities = daysData.map(day => ({
          ...day,
          activities: (activitiesData?.filter(activity => activity.day_id === day.id) || [])
            .sort((a, b) => {
              if (a.display_order !== b.display_order) {
                return a.display_order - b.display_order;
              }
              if (a.start_time && b.start_time) {
                return a.start_time.localeCompare(b.start_time);
              }
              return 0;
            })
        }));

        setDays(daysWithActivities);
        
        if (!selectedDayId && daysWithActivities.length > 0) {
          setSelectedDayId(daysWithActivities[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching itinerary:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut încărca itinerarul.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !selectedDay) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const newActivities = Array.from(selectedDay.activities);
    const [reorderedItem] = newActivities.splice(sourceIndex, 1);
    newActivities.splice(destinationIndex, 0, reorderedItem);

    // Update display_order for all activities
    const updates = newActivities.map((activity, index) => ({
      id: activity.id,
      display_order: index + 1
    }));

    try {
      // Optimistic update
      setDays(prev => prev.map(day => 
        day.id === selectedDay.id 
          ? { ...day, activities: newActivities.map((activity, index) => ({ ...activity, display_order: index + 1 })) }
          : day
      ));

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
      // Revert optimistic update
      fetchItinerary();
      toast({
        title: "Eroare",
        description: "Nu s-a putut actualiza ordinea activităților.",
        variant: "destructive",
      });
    }
  };

  const addTemplateActivity = async (template: typeof activityTemplates[0]) => {
    if (!selectedDay) return;

    const newActivity = {
      title: template.title,
      description: "",
      activity_type: template.type as any,
      start_time: template.time,
      end_time: "",
      location_name: "",
      address: "",
      cost_estimate: "",
      booking_reference: "",
      tips_and_notes: ""
    };

    setActivityFormData(newActivity);
    setEditingActivity(null);
    setShowActivityDialog(true);
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDay) return;

    try {
      const activityData = {
        ...activityFormData,
        day_id: selectedDay.id,
        cost_estimate: activityFormData.cost_estimate ? parseFloat(activityFormData.cost_estimate) : null,
        display_order: editingActivity ? editingActivity.display_order : selectedDay.activities.length + 1,
        start_time: activityFormData.start_time || null,
        end_time: activityFormData.end_time || null,
        description: activityFormData.description || null,
        location_name: activityFormData.location_name || null,
        address: activityFormData.address || null,
        booking_reference: activityFormData.booking_reference || null,
        tips_and_notes: activityFormData.tips_and_notes || null
      };

      if (editingActivity) {
        const { error } = await supabase
          .from('itinerary_activities')
          .update(activityData)
          .eq('id', editingActivity.id);

        if (error) throw error;
        toast({
          title: "Succes",
          description: "Activitatea a fost actualizată.",
        });
      } else {
        const { error } = await supabase
          .from('itinerary_activities')
          .insert([activityData]);

        if (error) throw error;
        toast({
          title: "Succes",
          description: "Activitatea a fost adăugată.",
        });
      }

      setShowActivityDialog(false);
      setEditingActivity(null);
      resetActivityForm();
      fetchItinerary();
    } catch (error) {
      console.error('Error saving activity:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut salva activitatea.",
        variant: "destructive",
      });
    }
  };

  const handleEditActivity = (activity: ItineraryActivity) => {
    setEditingActivity(activity);
    setActivityFormData({
      title: activity.title,
      description: activity.description || "",
      activity_type: activity.activity_type,
      start_time: activity.start_time || "",
      end_time: activity.end_time || "",
      location_name: activity.location_name || "",
      address: activity.address || "",
      cost_estimate: activity.cost_estimate?.toString() || "",
      booking_reference: activity.booking_reference || "",
      tips_and_notes: activity.tips_and_notes || ""
    });
    setShowActivityDialog(true);
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm("Ești sigur că vrei să ștergi această activitate?")) return;

    try {
      const { error } = await supabase
        .from('itinerary_activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Activitatea a fost ștearsă.",
      });
      fetchItinerary();
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge activitatea.",
        variant: "destructive",
      });
    }
  };

  const resetActivityForm = () => {
    setActivityFormData({
      title: "",
      description: "",
      activity_type: "attraction",
      start_time: "",
      end_time: "",
      location_name: "",
      address: "",
      cost_estimate: "",
      booking_reference: "",
      tips_and_notes: ""
    });
  };

  const checkMissingEssentials = useCallback((dayActivities: ItineraryActivity[]) => {
    const types = dayActivities.map(a => a.activity_type);
    const warnings = [];
    
    if (!types.includes('meal')) {
      warnings.push('Lipsesc mesele');
    }
    if (!types.includes('accommodation') && !types.includes('transport')) {
      warnings.push('Lipsește cazarea');
    }
    
    return warnings;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Calendar className="w-8 h-8 mx-auto mb-2 animate-pulse" />
          <p>Se încarcă itinerarul...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Itinerar - {tripName}</h2>
          <p className="text-muted-foreground">
            {format(parseISO(startDate), 'dd MMM yyyy', { locale: ro })} - {format(parseISO(endDate), 'dd MMM yyyy', { locale: ro })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Lista zilelor */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Zile Circuit</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {days.map((day) => {
                  const warnings = checkMissingEssentials(day.activities);
                  return (
                    <button
                      key={day.id}
                      onClick={() => setSelectedDayId(day.id)}
                      className={`w-full text-left p-3 border-b transition-colors hover:bg-muted/50 ${
                        selectedDayId === day.id ? 'bg-muted border-r-2 border-r-primary' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Ziua {day.day_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(day.date), 'dd MMM', { locale: ro })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {day.activities.length} activități
                          </p>
                        </div>
                        {warnings.length > 0 && (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Area - Timeline */}
        <div className="lg:col-span-3">
          {selectedDay ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        {selectedDay.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(selectedDay.date), 'EEEE, dd MMMM yyyy', { locale: ro })}
                      </p>
                    </div>
                    {profile?.role === 'admin' && (
                      <div className="flex gap-2">
                        <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              onClick={() => { 
                                resetActivityForm(); 
                                setEditingActivity(null); 
                              }}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Activitate
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                {editingActivity ? 'Editează Activitatea' : 'Activitate Nouă'}
                              </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSaveActivity} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="title">Titlu *</Label>
                                  <Input
                                    id="title"
                                    value={activityFormData.title}
                                    onChange={(e) => setActivityFormData({ ...activityFormData, title: e.target.value })}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="activity_type">Tip Activitate</Label>
                                  <Select 
                                    value={activityFormData.activity_type} 
                                    onValueChange={(value) => setActivityFormData({ ...activityFormData, activity_type: value as any })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(activityTypeConfig).map(([value, config]) => (
                                        <SelectItem key={value} value={value}>
                                          {config.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="description">Descriere</Label>
                                <Textarea
                                  id="description"
                                  value={activityFormData.description}
                                  onChange={(e) => setActivityFormData({ ...activityFormData, description: e.target.value })}
                                  rows={2}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="start_time">Ora Start</Label>
                                  <Input
                                    id="start_time"
                                    type="time"
                                    value={activityFormData.start_time}
                                    onChange={(e) => setActivityFormData({ ...activityFormData, start_time: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="end_time">Ora Sfârșit</Label>
                                  <Input
                                    id="end_time"
                                    type="time"
                                    value={activityFormData.end_time}
                                    onChange={(e) => setActivityFormData({ ...activityFormData, end_time: e.target.value })}
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="location_name">Locație</Label>
                                  <Input
                                    id="location_name"
                                    value={activityFormData.location_name}
                                    onChange={(e) => setActivityFormData({ ...activityFormData, location_name: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="cost_estimate">Cost Estimat (EUR)</Label>
                                  <Input
                                    id="cost_estimate"
                                    type="number"
                                    step="0.01"
                                    value={activityFormData.cost_estimate}
                                    onChange={(e) => setActivityFormData({ ...activityFormData, cost_estimate: e.target.value })}
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="address">Adresă</Label>
                                <Input
                                  id="address"
                                  value={activityFormData.address}
                                  onChange={(e) => setActivityFormData({ ...activityFormData, address: e.target.value })}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="booking_reference">Referință Rezervare</Label>
                                <Input
                                  id="booking_reference"
                                  value={activityFormData.booking_reference}
                                  onChange={(e) => setActivityFormData({ ...activityFormData, booking_reference: e.target.value })}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="tips_and_notes">Notițe și Sfaturi</Label>
                                <Textarea
                                  id="tips_and_notes"
                                  value={activityFormData.tips_and_notes}
                                  onChange={(e) => setActivityFormData({ ...activityFormData, tips_and_notes: e.target.value })}
                                  rows={2}
                                />
                              </div>

                              <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowActivityDialog(false)}>
                                  Anulează
                                </Button>
                                <Button type="submit">
                                  {editingActivity ? 'Actualizează' : 'Adaugă'}
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                {profile?.role === 'admin' && (
                  <CardContent className="border-b">
                    <div>
                      <Label className="text-sm font-medium">Template-uri Rapide</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {activityTemplates.map((template, index) => {
                          const IconComponent = template.icon;
                          return (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => addTemplateActivity(template)}
                              className="h-8"
                            >
                              <IconComponent className="w-3 h-3 mr-1" />
                              {template.title}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Warnings */}
              {(() => {
                const warnings = checkMissingEssentials(selectedDay.activities);
                return warnings.length > 0 && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <strong>Atenție:</strong> {warnings.join(', ')}
                    </AlertDescription>
                  </Alert>
                );
              })()}

              {/* Activities Timeline */}
              <Card>
                <CardContent className="p-4">
                  {selectedDay.activities.length > 0 ? (
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="activities">
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-3"
                          >
                            {selectedDay.activities.map((activity, index) => {
                              const config = activityTypeConfig[activity.activity_type];
                              const IconComponent = config.icon;
                              
                              return (
                                <Draggable 
                                  key={activity.id} 
                                  draggableId={activity.id} 
                                  index={index}
                                  isDragDisabled={profile?.role !== 'admin'}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`border rounded-lg p-4 bg-background transition-shadow ${
                                        snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'
                                      }`}
                                    >
                                      <div className="flex gap-3">
                                        {/* Drag Handle */}
                                        {profile?.role === 'admin' && (
                                          <div 
                                            {...provided.dragHandleProps}
                                            className="flex items-center text-muted-foreground hover:text-foreground cursor-grab"
                                          >
                                            <GripVertical className="w-4 h-4" />
                                          </div>
                                        )}

                                        {/* Time Indicator */}
                                        <div className="flex flex-col items-center min-w-[60px]">
                                          {activity.start_time ? (
                                            <>
                                              <span className="text-sm font-medium">
                                                {activity.start_time}
                                              </span>
                                              {activity.end_time && (
                                                <span className="text-xs text-muted-foreground">
                                                  {activity.end_time}
                                                </span>
                                              )}
                                            </>
                                          ) : (
                                            <span className="text-xs text-muted-foreground">
                                              Flexibil
                                            </span>
                                          )}
                                        </div>

                                        {/* Activity Content */}
                                        <div className="flex-1">
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-2">
                                                <Badge className={`${config.color} text-white`}>
                                                  <IconComponent className="w-3 h-3 mr-1" />
                                                  {config.label}
                                                </Badge>
                                              </div>
                                              
                                              <h4 className="font-medium mb-1">{activity.title}</h4>
                                              
                                              {activity.description && (
                                                <p className="text-sm text-muted-foreground mb-2">
                                                  {activity.description}
                                                </p>
                                              )}
                                              
                                              {activity.location_name && (
                                                <div className="flex items-center text-sm mb-1">
                                                  <MapPin className="w-4 h-4 mr-1 text-muted-foreground" />
                                                  {activity.location_name}
                                                </div>
                                              )}
                                              
                                              <div className="flex gap-4 text-sm text-muted-foreground">
                                                {activity.cost_estimate && (
                                                  <div className="flex items-center">
                                                    <Euro className="w-4 h-4 mr-1" />
                                                    €{activity.cost_estimate}
                                                  </div>
                                                )}
                                                
                                                {activity.booking_reference && (
                                                  <span>
                                                    Rezervare: {activity.booking_reference}
                                                  </span>
                                                )}
                                              </div>

                                              {activity.tips_and_notes && (
                                                <p className="text-sm text-muted-foreground mt-2 italic border-l-2 border-muted pl-2">
                                                  {activity.tips_and_notes}
                                                </p>
                                              )}
                                            </div>
                                            
                                            {profile?.role === 'admin' && (
                                              <div className="flex gap-1 ml-4">
                                                <Button 
                                                  size="sm" 
                                                  variant="ghost" 
                                                  onClick={() => handleEditActivity(activity)}
                                                >
                                                  <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                  size="sm" 
                                                  variant="ghost" 
                                                  onClick={() => handleDeleteActivity(activity.id)}
                                                  className="text-destructive hover:text-destructive"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nu există activități</h3>
                      <p className="text-muted-foreground mb-4">
                        Adaugă prima activitate pentru această zi
                      </p>
                      {profile?.role === 'admin' && (
                        <Button onClick={() => setShowActivityDialog(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Adaugă Activitate
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Selectează o zi</h3>
                <p className="text-muted-foreground">
                  Alege o zi din sidebar pentru a vedea itinerarul
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {days.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Niciun itinerar găsit</h3>
          <p className="text-muted-foreground">
            Itinerarul va fi disponibil după ce se vor crea zilele circuitului.
          </p>
        </div>
      )}
    </div>
  );
};

export default ItineraryManager;