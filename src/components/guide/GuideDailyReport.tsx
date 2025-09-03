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
}

const GuideDailyReport: React.FC<GuideDailyReportProps> = ({ 
  tripId, 
  reportDate = new Date().toISOString().split('T')[0] 
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
  const [newIssue, setNewIssue] = useState('');
  const [customIssues, setCustomIssues] = useState<string[]>([]);

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
        // Extract custom issues from text
        if (reportData.issues_encountered) {
          const lines = reportData.issues_encountered.split('\n').filter(line => line.trim());
          const activityIds = activities.map(a => a.id);
          const customLines = lines.filter(line => !activityIds.includes(line));
          setCustomIssues(customLines);
        }
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

  const handleAddCustomIssue = () => {
    if (newIssue.trim()) {
      setCustomIssues(prev => [...prev, newIssue.trim()]);
      setNewIssue('');
    }
  };

  const handleRemoveCustomIssue = (index: number) => {
    setCustomIssues(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveReport = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Combine issues
      const allIssues = [...customIssues].join('\n');

      const reportData = {
        ...report,
        issues_encountered: allIssues || null,
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Raport Zilnic</h1>
          <p className="text-muted-foreground">
            {trip?.nume} - {new Date(reportDate).toLocaleDateString('ro-RO', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isToday && (
            <Badge variant="default">Astăzi</Badge>
          )}
          {isPast && (
            <Badge variant="outline">Trecut</Badge>
          )}
          {report.id && (
            <Badge variant="secondary">Salvat</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Activities Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Activități Programate
            </CardTitle>
            <CardDescription>
              Bifează activitățile completate pentru această zi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nu sunt activități programate pentru această zi.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={activity.id}
                      checked={report.activities_completed.includes(activity.id)}
                      onCheckedChange={(checked) => 
                        handleActivityToggle(activity.id, checked as boolean)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <label
                        htmlFor={activity.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {activity.title}
                      </label>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {getActivityTypeLabel(activity.activity_type)}
                        </Badge>
                        {(activity.start_time || activity.end_time) && (
                          <span>
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

        {/* Issues and Problems */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Probleme Întâmpinate
            </CardTitle>
            <CardDescription>
              Documentează orice probleme sau situații neașteptate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {customIssues.map((issue, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <span className="flex-1 text-sm">{issue}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveCustomIssue(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Descrie o problemă..."
                value={newIssue}
                onChange={(e) => setNewIssue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomIssue()}
              />
              <Button onClick={handleAddCustomIssue} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Soluții Aplicate</CardTitle>
            <CardDescription>
              Descrie soluțiile implementate pentru problemele întâmpinate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Descrie soluțiile aplicate..."
              value={report.solutions_applied || ''}
              onChange={(e) => setReport(prev => ({ ...prev, solutions_applied: e.target.value }))}
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notă pentru Admin</CardTitle>
            <CardDescription>
              Informații importante pentru administrator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Notă pentru administrator..."
              value={report.notes_for_admin || ''}
              onChange={(e) => setReport(prev => ({ ...prev, notes_for_admin: e.target.value }))}
              rows={4}
            />
          </CardContent>
        </Card>
      </div>

      {/* Participant Count */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Numărul Participanților
          </CardTitle>
          <CardDescription>
            Numărul de participanți prezenți în această zi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="participant_count">Participanți prezenți:</Label>
            <Input
              id="participant_count"
              type="number"
              min="0"
              value={report.participant_count || ''}
              onChange={(e) => setReport(prev => ({ 
                ...prev, 
                participant_count: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              className="w-32"
              placeholder="0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button onClick={handleSaveReport} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Se salvează..." : report.id ? "Actualizează Raport" : "Salvează Raport"}
        </Button>
      </div>

      {/* Progress Summary */}
      {activities.length > 0 && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Progres activități: {report.activities_completed.length} din {activities.length} completate
            ({Math.round((report.activities_completed.length / activities.length) * 100)}%)
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default GuideDailyReport;