import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  MapPin, 
  Calendar, 
  FileText, 
  Wifi, 
  WifiOff, 
  Clock,
  Camera,
  Users,
  AlertCircle,
  Phone,
  MessageCircle,
  Trophy
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import DOMPurify from 'dompurify';

interface UserTrip {
  id: string;
  nume: string;
  destinatie: string;
  tara: string;
  start_date: string;
  end_date: string;
  status: string;
  descriere?: string;
  tourist_groups?: {
    nume_grup: string;
  };
}

interface GroupInfo {
  id: string;
  nume_grup: string;
  member_count: number;
}

interface DocumentStats {
  total: number;
  cached: number;
}

interface GuideInfo {
  id: string;
  nume: string;
  prenume: string;
  telefon?: string;
  email: string;
}

const TouristDashboard = () => {
  const [currentTrip, setCurrentTrip] = useState<UserTrip | null>(null);
  const [userGroups, setUserGroups] = useState<GroupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayActivities, setTodayActivities] = useState<any[]>([]);
  const [groupMemberCount, setGroupMemberCount] = useState(0);
  const unreadMessages = useUnreadMessages();
  const [documentStats, setDocumentStats] = useState<DocumentStats>({ total: 0, cached: 0 });
  const [assignedGuide, setAssignedGuide] = useState<GuideInfo | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [newDocumentsCount, setNewDocumentsCount] = useState(0);
  const [stampsStats, setStampsStats] = useState<{ total: number; collected: number }>({ total: 0, collected: 0 });
  
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && profile?.role === 'tourist') {
      fetchUserData();
    }
  }, [user, profile]);

  const fetchUserData = async () => {
    // STEP 1: Load cached data INSTANTLY (before any fetch)
    const cached = localStorage.getItem('cached_trip_data');
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        console.log('[TouristDashboard] Loading from cache instantly:', timestamp);
        
        // Set data IMMEDIATELY - user sees dashboard instantly
        if (data.currentTrip) setCurrentTrip(data.currentTrip);
        if (data.userGroups) setUserGroups(data.userGroups);
        if (data.todayActivities) setTodayActivities(data.todayActivities);
        if (data.groupMemberCount !== undefined) setGroupMemberCount(data.groupMemberCount);
        if (data.documentStats) setDocumentStats(data.documentStats);
        if (data.assignedGuide) setAssignedGuide(data.assignedGuide);
        if (data.newDocumentsCount !== undefined) setNewDocumentsCount(data.newDocumentsCount);
        if (data.stampsStats) setStampsStats(data.stampsStats);
        
        // IMPORTANT: We do NOT skip the fetch!
        // Cache only provides instant UI, fetch ALWAYS runs for fresh data
      } catch (error) {
        console.error('[TouristDashboard] Cache error:', error);
      }
    }

    // STEP 2: Fetch fresh data in parallel
    setLoading(true);
    
    try {
      // Variables to store fresh data for cache (declare at top of try block)
      let freshGroupMemberCount = 0;
      let freshTodayActivities: any[] = [];
      let freshDocumentStats = { total: 0, cached: 0 };
      let freshNewDocumentsCount = 0;
      let freshAssignedGuide: GuideInfo | null = null;
      let freshStampsStats = { total: 0, collected: 0 };

      // Fetch ALL data in PARALLEL with Promise.allSettled
      const results = await Promise.allSettled([
        // Fetch 1: Group members
        supabase
          .from('group_members')
          .select(`
            group_id,
            tourist_groups (
              id,
              nume_grup
            )
          `)
          .eq('user_id', user!.id),
      ]);

      const [groupResult] = results;

      if (groupResult.status === 'fulfilled' && !groupResult.value.error) {
        const memberGroups = groupResult.value.data;
        
        if (memberGroups && memberGroups.length > 0) {
          const groupIds = memberGroups.map(g => g.group_id);
          
          // Fetch trips and related data in parallel
          const tripResults = await Promise.allSettled([
            // Fetch 2: Trips
            supabase
              .from('trips')
              .select(`
                *,
                tourist_groups (
                  nume_grup
                )
              `)
              .in('group_id', groupIds)
              .in('status', ['active', 'confirmed'])
              .order('start_date', { ascending: true }),
          ]);

          const [tripsResult] = tripResults;

          if (tripsResult.status === 'fulfilled' && !tripsResult.value.error) {
            const trips = tripsResult.value.data;
            const activeTrip = trips?.find(trip => trip.status === 'active') || trips?.[0];
            setCurrentTrip(activeTrip || null);

            if (activeTrip) {
              const today = new Date().toISOString().split('T')[0];
              
              // Fetch all trip-related data in parallel
              const tripDataResults = await Promise.allSettled([
                // Fetch 3: Group member count
                supabase
                  .from('group_members')
                  .select('*', { count: 'exact', head: true })
                  .eq('group_id', activeTrip.group_id),
                
                // Fetch 4: Today's itinerary days
                supabase
                  .from('itinerary_days')
                  .select('id')
                  .eq('trip_id', activeTrip.id)
                  .eq('date', today),
                
                // Fetch 5: Total documents
                supabase
                  .from('documents')
                  .select('id', { count: 'exact', head: true })
                  .eq('trip_id', activeTrip.id),
                
                // Fetch 6: Cached documents
                supabase
                  .from('offline_cache_status')
                  .select('resource_id', { count: 'exact', head: true })
                  .eq('user_id', user!.id)
                  .eq('resource_type', 'documents')
                  .eq('trip_id', activeTrip.id),
                
                // Fetch 7: New documents (last 7 days)
                (async () => {
                  const sevenDaysAgo = new Date();
                  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                  return supabase
                    .from('documents')
                    .select('id', { count: 'exact', head: true })
                    .eq('trip_id', activeTrip.id)
                    .gte('upload_date', sevenDaysAgo.toISOString());
                })(),
                
                // Fetch 8: Guide assignments
                supabase
                  .from('guide_assignments')
                  .select('guide_user_id')
                  .eq('trip_id', activeTrip.id)
                  .eq('is_active', true)
                  .limit(1),
              ]);

              const [countResult, daysResult, docsResult, cachedDocsResult, newDocsResult, guideAssignResult] = tripDataResults;

              // Process group member count
              if (countResult.status === 'fulfilled' && !countResult.value.error) {
                const count = countResult.value.count;
                if (count !== null) {
                  freshGroupMemberCount = count;
                  setGroupMemberCount(count);
                }
              }

              // Process today's activities
              if (daysResult.status === 'fulfilled' && !daysResult.value.error) {
                const itineraryDays = daysResult.value.data;
                if (itineraryDays && itineraryDays.length > 0) {
                  const { data: activities } = await supabase
                    .from('itinerary_activities')
                    .select('*')
                    .eq('day_id', itineraryDays[0].id)
                    .order('display_order');
                  
                  freshTodayActivities = activities || [];
                  setTodayActivities(freshTodayActivities);
                }
              }

              // Process document stats
              const totalCount = docsResult.status === 'fulfilled' && !docsResult.value.error ? docsResult.value.count || 0 : 0;
              const cachedCount = cachedDocsResult.status === 'fulfilled' && !cachedDocsResult.value.error ? cachedDocsResult.value.count || 0 : 0;
              const newCount = newDocsResult.status === 'fulfilled' && !newDocsResult.value.error ? newDocsResult.value.count || 0 : 0;
              
              freshDocumentStats = { total: totalCount, cached: cachedCount };
              freshNewDocumentsCount = newCount;
              setDocumentStats(freshDocumentStats);
              setNewDocumentsCount(freshNewDocumentsCount);

              // Process guide info
              if (guideAssignResult.status === 'fulfilled' && !guideAssignResult.value.error) {
                const assignments = guideAssignResult.value.data;
                if (assignments && assignments.length > 0) {
                  const guideUserId = assignments[0].guide_user_id;
                  const { data: guideProfile } = await supabase
                    .from('profiles')
                    .select('id, nume, prenume, telefon, email')
                    .eq('id', guideUserId)
                    .single();
                  
                  if (guideProfile) {
                    freshAssignedGuide = guideProfile;
                    setAssignedGuide(guideProfile);
                  }
                }
              }
              
              // Fetch 9: Stamps stats
              const { data: allStamps, error: stampsError } = await supabase
                .from('poi_stamps')
                .select('id')
                .eq('trip_id', activeTrip.id);
              
              const { data: collectedStampsData, error: collectedError } = await supabase
                .from('tourist_collected_stamps')
                .select('id')
                .eq('tourist_id', profile!.id)
                .eq('trip_id', activeTrip.id);
              
              if (!stampsError && !collectedError) {
                freshStampsStats = {
                  total: allStamps?.length || 0,
                  collected: collectedStampsData?.length || 0
                };
                setStampsStats(freshStampsStats);
              }
            }

            const groupsInfo = memberGroups.map(mg => ({
              id: mg.group_id,
              nume_grup: mg.tourist_groups.nume_grup,
              member_count: 0
            }));
            setUserGroups(groupsInfo);

            // STEP 3: Update cache with FRESH data (not old state)
            const freshData = {
              currentTrip: activeTrip || null,
              userGroups: groupsInfo,
              todayActivities: freshTodayActivities,
              groupMemberCount: freshGroupMemberCount,
              documentStats: freshDocumentStats,
              assignedGuide: freshAssignedGuide,
              newDocumentsCount: freshNewDocumentsCount,
              stampsStats: freshStampsStats
            };

            localStorage.setItem('cached_trip_data', JSON.stringify({
              data: freshData,
              timestamp: new Date().toISOString()
            }));
            
            console.log('[TouristDashboard] Fresh data fetched and cached');
          }
        }
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
      // Only show error if we don't have cache
      if (!cached) {
        toast({
          title: "Eroare",
          description: "Nu s-au putut încărca informațiile călătoriei.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentStats = async (tripId: string) => {
    try {
      // Total documents for this trip
      const { count: totalCount } = await supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('trip_id', tripId);

      // Cached documents for this user in offline_cache_status table
      const { count: cachedCount } = await supabase
        .from('offline_cache_status')
        .select('resource_id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('resource_type', 'documents')
        .eq('trip_id', tripId);

      setDocumentStats({
        total: totalCount || 0,
        cached: cachedCount || 0
      });

      // Count new documents (uploaded in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: newDocsCount } = await supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('trip_id', tripId)
        .gte('upload_date', sevenDaysAgo.toISOString());

      setNewDocumentsCount(newDocsCount || 0);
    } catch (error) {
      console.error('[DocumentStats] Error:', error);
    }
  };

  const fetchAssignedGuide = async (tripId: string) => {
    try {
      // Step 1: Get guide_user_id from guide_assignments
      const { data: assignments, error: assignError } = await supabase
        .from('guide_assignments')
        .select('guide_user_id')
        .eq('trip_id', tripId)
        .eq('is_active', true)
        .limit(1);

      if (assignError) {
        console.error('[GuideInfo] Assignment query error:', assignError);
        return;
      }

      if (!assignments || assignments.length === 0) {
        return;
      }

      const guideUserId = assignments[0].guide_user_id;

      // Step 2: Get guide profile
      const { data: guideProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, nume, prenume, telefon, email')
        .eq('id', guideUserId)
        .single();

      if (profileError) {
        console.error('[GuideInfo] Profile query error:', profileError);
        return;
      }

      if (guideProfile) {
        setAssignedGuide(guideProfile);
      }
    } catch (error) {
      console.error('[GuideInfo] Error:', error);
    }
  };

  const handleCallGuide = () => {
    if (assignedGuide?.telefon) {
      window.location.href = `tel:${assignedGuide.telefon}`;
    }
  };

  const handleWhatsAppGuide = () => {
    if (assignedGuide?.telefon) {
      const phone = assignedGuide.telefon.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${phone}`, '_blank');
    }
  };

  const calculateTripProgress = () => {
    if (!currentTrip) return 0;
    
    const start = new Date(currentTrip.start_date).getTime();
    const end = new Date(currentTrip.end_date).getTime();
    const now = new Date().getTime();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    return Math.round(((now - start) / (end - start)) * 100);
  };

  const getTripDay = () => {
    if (!currentTrip) return { current: 0, total: 0 };
    
    const start = new Date(currentTrip.start_date);
    const end = new Date(currentTrip.end_date);
    const now = new Date();
    
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const currentDay = Math.min(
      Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))),
      totalDays
    );
    
    return { current: currentDay, total: totalDays };
  };

  const quickActions = [
    { label: "Hărți Offline", icon: MapPin, color: "success", path: "/maps" },
    { label: "Check-in", icon: Camera, color: "warning", path: "/checkin" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success text-success-foreground";
      case "upcoming": return "bg-primary text-primary-foreground";
      case "ongoing": return "bg-accent text-accent-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "meal": return "🍽️";
      case "attraction": return "🏛️";
      case "transport": return "🚢";
      case "accommodation": return "🏨";
      case "free_time": return "🎯";
      case "custom": return "📍";
      default: return "📍";
    }
  };

  const getOfflineStatusBadge = (status: string) => {
    switch (status) {
      case "synced": return "bg-success text-success-foreground";
      case "partial": return "bg-warning text-warning-foreground";
      case "outdated": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return <div className="text-center py-8">Se încarcă informațiile călătoriei...</div>;
  }

  // No active trip found
  if (!currentTrip) {
    return (
      <div className="space-y-6 md:px-8 lg:px-16">
        <Card className="shadow-medium border-0">
          <CardContent className="p-8 text-center">
            <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Nicio călătorie activă</h2>
            <p className="text-muted-foreground mb-4">
              {userGroups.length === 0 
                ? "Nu faci parte din niciun grup de călătorie."
                : "Grupurile tale nu au călătorii active momentan."
              }
            </p>
            {userGroups.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Grupurile tale: {userGroups.map(g => g.nume_grup).join(", ")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const tripDay = getTripDay();
  const progress = calculateTripProgress();

  return (
    <div className="space-y-6 md:px-8 lg:px-16">
      {/* Trip Header - REAL DATA */}
      <Card className="shadow-medium border-0 bg-gradient-hero text-primary-foreground">
        <CardContent className="p-4">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            {/* Main Info - Stacked vertically on mobile */}
            <div className="flex-1 space-y-4">
              {/* Title */}
              <h1 className="text-2xl lg:text-3xl font-bold leading-tight">
                {currentTrip.nume}
              </h1>
              
              {/* Destination - Separate line on mobile */}
              <div className="flex items-center gap-2 text-primary-foreground/90">
                <MapPin className="w-5 h-5 flex-shrink-0" />
                <span className="text-base lg:text-lg font-medium">
                  {currentTrip.destinatie}, {currentTrip.tara}
                </span>
              </div>
              
              {/* Trip Day - Separate line on mobile */}
              <div className="flex items-center gap-2 text-primary-foreground/90">
                <Calendar className="w-5 h-5 flex-shrink-0" />
                <span className="text-base lg:text-lg font-medium">
                  Ziua {tripDay.current} din {tripDay.total}
                </span>
              </div>
            </div>
            
            {/* Status Badge - Right side on desktop, below on mobile */}
            <div className="flex items-center justify-start lg:justify-end">
              <Badge variant="secondary" className="bg-white/20 dark:bg-black/20 text-primary-foreground border-0 px-4 py-2">
                <Wifi className="w-4 h-4 mr-2" />
                Online
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        {quickActions.map((action, index) => (
          <Link key={index} to={action.path}>
            <Button
              variant="outline"
              className="h-16 w-full flex flex-col gap-2 hover:shadow-medium transition-all"
            >
              <action.icon className="w-5 h-5" />
              <span className="text-xs">{action.label}</span>
            </Button>
          </Link>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Programul de Azi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nu există activități programate pentru astăzi</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayActivities.map((activity, index) => (
                    <div
                      key={activity.id}
                      className="border rounded-lg p-4 px-2.5 sm:px-4 transition-all hover:shadow-soft"
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-2xl">{getActivityIcon(activity.activity_type)}</div>
                        
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{activity.title}</h3>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {activity.start_time && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {activity.start_time.substring(0, 5)}
                              </div>
                            )}
                            {activity.location_name && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {activity.location_name}
                              </div>
                            )}
                          </div>

                          {activity.description && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {activity.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trip Progress - REAL DATA */}
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="text-lg">Progres Călătorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Ziua {tripDay.current} din {tripDay.total}</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-ocean rounded-full transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="text-sm text-muted-foreground mb-1">Status</div>
                  <Badge className={
                    currentTrip.status === 'active' ? 'bg-success text-success-foreground' :
                    currentTrip.status === 'confirmed' ? 'bg-primary text-primary-foreground' :
                    'bg-muted text-muted-foreground'
                  }>
                    {currentTrip.status === 'active' ? 'În desfășurare' :
                     currentTrip.status === 'confirmed' ? 'Confirmat' : currentTrip.status}
                  </Badge>
                </div>

                <div className="pt-2 border-t">
                  <div className="text-sm text-muted-foreground mb-1">Grup</div>
                  <div className="font-medium">{currentTrip.tourist_groups?.nume_grup}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guide Widget - NEW! */}
          {assignedGuide && (
            <Card className="shadow-soft border-0">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Ghidul Tău
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-lg font-semibold">
                      {assignedGuide.nume} {assignedGuide.prenume}
                    </p>
                    {assignedGuide.telefon && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" />
                        {assignedGuide.telefon}
                      </p>
                    )}
                  </div>

                  {assignedGuide.telefon && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCallGuide}
                        className="w-full"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Sună
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleWhatsAppGuide}
                        className="w-full text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                    </div>
                  )}

                  {!assignedGuide.telefon && (
                    <p className="text-xs text-muted-foreground">
                      Contact telefonic indisponibil
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Group Info */}
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="text-lg">Informații Grup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Membri totali</span>
                  <span className="font-medium">{groupMemberCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mesaje noi</span>
                  <Badge variant="secondary">{unreadMessages}</Badge>
                </div>
                
                <Button variant="outline" className="w-full mt-4">
                  Vezi Grup Complet
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stamps Collection Widget */}
          {stampsStats.total > 0 && (
            <Link to="/checkin">
              <Card className="shadow-soft border-0 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-amber-500/10 to-background">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-600" />
                    Colecția Ta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Stamps colectate</span>
                      <span className="font-semibold text-lg">{stampsStats.collected}/{stampsStats.total}</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      Vezi Colecția 🏆
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Documents Status */}
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Documente
                
                {/* Badge pentru documente noi */}
                {newDocumentsCount > 0 && (
                  <div className="ml-auto bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg animate-pulse">
                    {newDocumentsCount > 9 ? '9+' : newDocumentsCount}
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total documente</span>
                  <span className="font-semibold">{documentStats.total}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Salvate offline</span>
                  <Badge variant="secondary">{documentStats.cached}</Badge>
                </div>

                <Link to="/documents">
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Vezi Toate Documentele
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Real Trip Description - if available */}
      {currentTrip.descriere && (
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Despre acest circuit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div 
                className={`prose prose-sm max-w-none overflow-hidden transition-all duration-300 ${
                  isDescriptionExpanded ? 'max-h-[2000px]' : 'max-h-[10.5rem]'
                }`}
                style={{
                  lineHeight: '1.5rem', // 1.5rem per line
                  // 7 lines * 1.5rem = 10.5rem
                }}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentTrip.descriere) }}
              />
              
              {/* Gradient fade-out overlay when collapsed */}
              {!isDescriptionExpanded && currentTrip.descriere.length > 300 && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent pointer-events-none"
                  style={{
                    background: 'linear-gradient(to top, hsl(var(--card)) 0%, transparent 100%)'
                  }}
                />
              )}
            </div>
            
            {/* Show button only if content is long enough */}
            {currentTrip.descriere.length > 300 && (
              <div className="mt-4 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="text-primary hover:text-primary/80"
                >
                  {isDescriptionExpanded ? (
                    <>
                      <span>Arată mai puțin</span>
                      <svg 
                        className="ml-2 w-4 h-4 transition-transform" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>Citește mai mult</span>
                      <svg 
                        className="ml-2 w-4 h-4 transition-transform" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TouristDashboard;