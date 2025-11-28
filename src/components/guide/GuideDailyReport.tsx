import React, { useState, useEffect } from "react";
import { Calendar, FileText, Users, CheckCircle, AlertCircle, Save, Plus, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface Trip {
  id: string;
  nume: string;
  destinatie: string;
}

interface Activity {
  id: string;
  title: string;
  activity_type: string;
  start_time?: string;
  end_time?: string;
}

interface DailyReport {
  id?: string;
  trip_id: string;
  guide_user_id: string;
  report_date: string;
  activities_completed: string[];
  issues_encountered?: string;
  solutions_applied?: string;
  notes_for_admin?: string;
  participant_count?: number;
}

interface GuideDailyReportProps {
  tripId: string;
  reportDate?: string;
  onReportSaved?: () => void;
}

const GuideDailyReport: React.FC<GuideDailyReportProps> = ({ 
  tripId, 
  reportDate = new Date().toISOString().split('T')[0],
  onReportSaved
}) => {
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [report, setReport] = useState<DailyReport>({
    trip_id: tripId,
    guide_user_id: user?.id || '',
    report_date: reportDate,
    activities_completed: [],
    issues_encountered: '',
    solutions_applied: '',
    notes_for_admin: '',
    participant_count: undefined,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTripAndData();
    }
  }, [tripId, reportDate, user]);

  const fetchTripAndData = async () => {
    try {
      // Fetch trip details
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('id, nume, destinatie')
        .eq('id', tripId)
        .single();

      if (tripError) throw tripError;
      setTrip(tripData);

      // Fetch today's activities
      const { data: dayData, error: dayError } = await supabase
        .from('itinerary_days')
        .select('id')
        .eq('trip_id', tripId)
        .eq('date', reportDate)
        .single();

      if (dayError && dayError.code !== 'PGRST116') throw dayError;

      if (dayData) {
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('itinerary_activities')
          .select('id, title, activity_type, start_time, end_time')
          .eq('day_id', dayData.id)
          .order('display_order');

        if (activitiesError) throw activitiesError;
        setActivities(activitiesData || []);
      }

      // Fetch existing report
      const { data: reportData, error: reportError } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('trip_id', tripId)
        .eq('guide_user_id', user?.id)
        .eq('report_date', reportDate)
        .maybeSingle();

      if (reportError && reportError.code !== 'PGRST116') throw reportError;

      if (reportData) {
        setReport(reportData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca datele.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivityToggle = (activityId: string, checked: boolean) => {
    setReport(prev => ({
      ...prev,
      activities_completed: checked
        ? [...prev.activities_completed, activityId]
        : prev.activities_completed.filter(id => id !== activityId)
    }));
  };

  const handleSaveReport = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const reportData = {
        ...report,
        guide_user_id: user.id,
      };

      if (report.id) {
        // Update existing report
        const { error } = await supabase
          .from('daily_reports')
          .update(reportData)
          .eq('id', report.id);

        if (error) throw error;
      } else {
        // Create new report
        const { data, error } = await supabase
          .from('daily_reports')
          .insert(reportData)
          .select()
          .single();

        if (error) throw error;
        setReport(prev => ({ ...prev, id: data.id }));
      }

      toast({
        title: "Succes",
        description: "Raportul a fost salvat cu succes.",
      });
      
      if (onReportSaved) {
        onReportSaved();
      }
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut salva raportul.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getActivityTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      meal: "Masă",
      transport: "Transport", 
      attraction: "Atracție",
      accommodation: "Cazare",
      free_time: "Timp liber",
      custom: "Personalizat",
    };
    return types[type] || "Necunoscut";
  };

  const formatTime = (time: string | null) => {
    if (!time) return "";
    return time.substring(0, 5);
  };

  const isToday = reportDate === new Date().toISOString().split('T')[0];
  const isPast = new Date(reportDate) < new Date(new Date().toISOString().split('T')[0]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-1">{trip?.nume}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(reportDate).toLocaleDateString('ro-RO', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isToday && <Badge variant="default">Astăzi</Badge>}
              {isPast && <Badge variant="outline">Trecut</Badge>}
              {report.id && <Badge variant="secondary">Salvat</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Activities Checklist */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30 pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CheckCircle className="h-5 w-5 text-primary" />
              Activități Programate
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Bifează activitățile completate
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nu sunt activități programate.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-2.5 sm:p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      id={activity.id}
                      checked={report.activities_completed.includes(activity.id)}
                      onCheckedChange={(checked) => 
                        handleActivityToggle(activity.id, checked as boolean)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={activity.id}
                        className="text-sm font-medium leading-tight cursor-pointer block"
                      >
                        {activity.title}
                      </label>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {getActivityTypeLabel(activity.activity_type)}
                        </Badge>
                        {(activity.start_time || activity.end_time) && (
                          <span className="text-xs text-muted-foreground">
                            {activity.start_time && formatTime(activity.start_time)}
                            {activity.start_time && activity.end_time && " - "}
                            {activity.end_time && formatTime(activity.end_time)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Issues and Problems - Larger textarea */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30 pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertCircle className="h-5 w-5 text-primary" />
              Probleme Întâmpinate
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Documentează probleme sau situații neașteptate
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <Textarea
              placeholder="Descrie problemele întâmpinate în timpul zilei (opțional)..."
              value={report.issues_encountered || ''}
              onChange={(e) => setReport(prev => ({ ...prev, issues_encountered: e.target.value }))}
              rows={8}
              className="resize-none"
            />
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Soluții Aplicate</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Descrie soluțiile implementate
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <Textarea
              placeholder="Descrie soluțiile aplicate pentru problemele întâmpinate..."
              value={report.solutions_applied || ''}
              onChange={(e) => setReport(prev => ({ ...prev, solutions_applied: e.target.value }))}
              rows={5}
              className="resize-none"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Notă pentru Admin</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Informații importante pentru administrator
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <Textarea
              placeholder="Notă pentru administrator (observații, recomandări)..."
              value={report.notes_for_admin || ''}
              onChange={(e) => setReport(prev => ({ ...prev, notes_for_admin: e.target.value }))}
              rows={5}
              className="resize-none"
            />
          </CardContent>
        </Card>
      </div>

      {/* Participant Count & Progress */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="h-5 w-5 text-primary" />
              Numărul Participanților
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Câți participanți au fost prezenți
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="flex items-center gap-3">
              <Label htmlFor="participant_count" className="text-sm whitespace-nowrap">Participanți:</Label>
              <Input
                id="participant_count"
                type="number"
                min="0"
                value={report.participant_count || ''}
                onChange={(e) => setReport(prev => ({ 
                  ...prev, 
                  participant_count: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                className="w-24"
                placeholder="0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Progress Summary */}
        {activities.length > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Progres
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Activități completate:</span>
                  <span className="font-semibold">
                    {report.activities_completed.length} / {activities.length}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(report.activities_completed.length / activities.length) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {Math.round((report.activities_completed.length / activities.length) * 100)}% finalizat
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button 
          onClick={handleSaveReport} 
          disabled={saving} 
          size="lg"
          className="w-full sm:w-auto"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Se salvează..." : report.id ? "Actualizează Raport" : "Salvează Raport"}
        </Button>
      </div>
    </div>
  );
};

export default GuideDailyReport;