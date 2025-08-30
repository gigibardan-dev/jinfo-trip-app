import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, Plus, Edit, Trash2, Euro } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ItineraryDay {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
  title: string;
  overview: string;
  activities: ItineraryActivity[];
}

interface ItineraryActivity {
  id: string;
  day_id: string;
  title: string;
  description: string;
  activity_type: "custom" | "transport" | "accommodation" | "meal" | "attraction" | "free_time";
  start_time: string;
  end_time: string;
  location_name: string;
  address: string;
  cost_estimate: number;
  booking_reference: string;
  tips_and_notes: string;
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

const ItineraryManager = ({ tripId }: { tripId: string }) => {
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<ItineraryDay | null>(null);
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

  const activityTypes = [
    { value: "attraction", label: "Atracție" },
    { value: "meal", label: "Masă" },
    { value: "transport", label: "Transport" },
    { value: "accommodation", label: "Cazare" },
    { value: "free_time", label: "Timp Liber" },
    { value: "custom", label: "Altele" }
  ];

  useEffect(() => {
    if (tripId) {
      fetchItinerary();
    }
  }, [tripId]);

  const fetchItinerary = async () => {
    try {
      const { data: daysData, error: daysError } = await supabase
        .from('itinerary_days')
        .select('*')
        .eq('trip_id', tripId)
        .order('day_number');

      if (daysError) throw daysError;

      const { data: activitiesData, error: activitiesError } = await supabase
        .from('itinerary_activities')
        .select('*')
        .in('day_id', daysData?.map(d => d.id) || [])
        .order('display_order');

      if (activitiesError) throw activitiesError;

      const daysWithActivities = daysData?.map(day => ({
        ...day,
        activities: activitiesData?.filter(activity => activity.day_id === day.id) || []
      })) || [];

      setDays(daysWithActivities);
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

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDay) return;

    try {
      const activityData = {
        ...activityFormData,
        day_id: selectedDay.id,
        cost_estimate: activityFormData.cost_estimate ? parseFloat(activityFormData.cost_estimate) : null,
        display_order: selectedDay.activities.length + 1
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

  const getActivityTypeLabel = (type: string) => {
    return activityTypes.find(t => t.value === type)?.label || type;
  };

  const getActivityTypeColor = (type: string) => {
    const colors = {
      attraction: 'bg-blue-500',
      meal: 'bg-green-500',
      transport: 'bg-purple-500',
      accommodation: 'bg-orange-500',
      free_time: 'bg-yellow-500',
      custom: 'bg-gray-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  if (loading) {
    return <div className="text-center py-8">Se încarcă itinerarul...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Itinerar</h2>

      <div className="space-y-4">
        {days.map((day) => (
          <Card key={day.id} className="bg-card/95 backdrop-blur-sm border-border/20">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Ziua {day.day_number}: {day.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(day.date).toLocaleDateString('ro-RO', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  {day.overview && (
                    <p className="text-sm mt-2">{day.overview}</p>
                  )}
                </div>
                {profile?.role === 'admin' && (
                  <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        onClick={() => { 
                          setSelectedDay(day); 
                          resetActivityForm(); 
                          setEditingActivity(null); 
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Activitate
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingActivity ? 'Editează Activitatea' : 'Activitate Nouă'}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddActivity} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="title">Titlu</Label>
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
                                {activityTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
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
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {day.activities.map((activity) => (
                  <div key={activity.id} className="border rounded-lg p-4 bg-background/50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`${getActivityTypeColor(activity.activity_type)} text-white`}>
                            {getActivityTypeLabel(activity.activity_type)}
                          </Badge>
                          {activity.start_time && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="w-4 h-4 mr-1" />
                              {activity.start_time}
                              {activity.end_time && ` - ${activity.end_time}`}
                            </div>
                          )}
                        </div>
                        
                        <h4 className="font-medium">{activity.title}</h4>
                        
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                        )}
                        
                        {activity.location_name && (
                          <div className="flex items-center text-sm mt-2">
                            <MapPin className="w-4 h-4 mr-1 text-muted-foreground" />
                            {activity.location_name}
                          </div>
                        )}
                        
                        {activity.cost_estimate && (
                          <div className="flex items-center text-sm mt-1">
                            <Euro className="w-4 h-4 mr-1 text-muted-foreground" />
                            €{activity.cost_estimate}
                          </div>
                        )}

                        {activity.booking_reference && (
                          <p className="text-sm mt-1">
                            <span className="font-medium">Rezervare:</span> {activity.booking_reference}
                          </p>
                        )}

                        {activity.tips_and_notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
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
                ))}
                
                {day.activities.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    Nu există activități planificate pentru această zi
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {days.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Niciun itinerar găsit</h3>
          <p className="text-muted-foreground">
            Itinerarul va fi disponibil după ce administratorul îl va crea.
          </p>
        </div>
      )}
    </div>
  );
};

export default ItineraryManager;