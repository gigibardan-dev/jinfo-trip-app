# LOVABLE PROMPT - PART 5/6: VIP Circuit Creation & Management

## CONTEXT
SuperAdmins need to create VIP circuits (itineraries) that are:
1. Not visible to regular admins
2. Can be assigned to VIP tourists
3. Have special indicators in the UI

## WHAT TO BUILD

### 1. Update Itinerary Creation Form
Modify existing create/edit itinerary component:

```typescript
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const CreateItineraryForm = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isVIP, setIsVIP] = useState(false);
  // ... other existing fields

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();
      return data;
    }
  });

  const isSuperAdmin = currentUser?.role === 'superadmin';

  const createItinerary = useMutation({
    mutationFn: async () => {
      const itineraryData: any = {
        name,
        description,
        start_date: startDate,
        end_date: endDate,
        privacy_level: isVIP ? 'vip' : 'standard',
        managed_by_superadmin_id: isVIP ? currentUser?.id : null,
        // ... other existing fields
      };

      const { data, error } = await supabase
        .from('itineraries')
        .insert([itineraryData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Circuit Created",
        description: isVIP ? "VIP circuit created successfully" : "Standard circuit created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
      // Reset form...
    },
    onError: (error) => {
      toast({
        title: "Error Creating Circuit",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); createItinerary.mutate(); }}>
      {/* Existing fields: name, description, dates, etc. */}
      
      {/* VIP Toggle - Only for SuperAdmin */}
      {isSuperAdmin && (
        <div className="space-y-4 p-4 border rounded-lg bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="vip-circuit" className="flex items-center gap-2 text-base">
                <Star className="w-5 h-5 text-purple-600 fill-purple-600" />
                <span className="font-semibold text-purple-900">VIP Circuit</span>
              </Label>
              <p className="text-sm text-purple-700 mt-1">
                VIP circuits are only visible to SuperAdmins and assigned VIP tourists
              </p>
            </div>
            <Switch
              id="vip-circuit"
              checked={isVIP}
              onCheckedChange={setIsVIP}
            />
          </div>

          {isVIP && (
            <div className="pl-4 border-l-2 border-purple-400 space-y-2">
              <p className="text-sm font-medium text-purple-900">VIP Features:</p>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>✓ Not visible to regular admins</li>
                <li>✓ Can upload VIP-only documents</li>
                <li>✓ Assign specific VIP tourists</li>
                <li>✓ Priority support included</li>
              </ul>
            </div>
          )}
        </div>
      )}

      <Button type="submit" disabled={createItinerary.isPending}>
        {createItinerary.isPending ? "Creating..." : "Create Circuit"}
      </Button>
    </form>
  );
};
```

### 2. Update Itinerary List to Show VIP Badges
Modify itinerary/circuit list component:

```typescript
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const ItineraryList = () => {
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();
      return data;
    }
  });

  // Fetch itineraries - RLS policies will handle filtering
  const { data: itineraries, isLoading } = useQuery({
    queryKey: ['itineraries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('itineraries')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) return <div>Loading circuits...</div>;

  return (
    <div className="grid gap-4">
      {itineraries?.map((itinerary) => (
        <Card key={itinerary.id} className={itinerary.privacy_level === 'vip' ? 'border-purple-300 bg-purple-50/30' : ''}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold">{itinerary.name}</h3>
                  
                  {itinerary.privacy_level === 'vip' && (
                    <Badge className="bg-purple-600 hover:bg-purple-700 gap-1">
                      <Star className="w-3 h-3 fill-white" />
                      VIP
                    </Badge>
                  )}
                </div>

                <p className="text-muted-foreground mb-3">{itinerary.description}</p>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Start:</span>{' '}
                    <span className="font-medium">{new Date(itinerary.start_date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">End:</span>{' '}
                    <span className="font-medium">{new Date(itinerary.end_date).toLocaleDateString()}</span>
                  </div>
                  {itinerary.privacy_level === 'vip' && currentUser?.role === 'superadmin' && (
                    <div>
                      <span className="text-muted-foreground">VIP Tourists:</span>{' '}
                      <span className="font-medium text-purple-700">
                        {itinerary.tourist_ids?.length || 0}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Existing action buttons */}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {(!itineraries || itineraries.length === 0) && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No circuits found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
```

### 3. Add VIP Circuit Filter to Dashboard
Add filter toggle for VIP circuits:

```typescript
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const CircuitManagement = () => {
  const [privacyFilter, setPrivacyFilter] = useState<'all' | 'standard' | 'vip'>('all');

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();
      return data;
    }
  });

  const isSuperAdmin = currentUser?.role === 'superadmin';

  // Fetch circuits with filter
  const { data: circuits } = useQuery({
    queryKey: ['circuits', privacyFilter],
    queryFn: async () => {
      let query = supabase
        .from('itineraries')
        .select('*')
        .order('created_at', { ascending: false });

      if (privacyFilter !== 'all') {
        query = query.eq('privacy_level', privacyFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Circuit Management</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          Create Circuit
        </Button>
      </div>

      {/* Filter - Only for SuperAdmin */}
      {isSuperAdmin && (
        <Tabs value={privacyFilter} onValueChange={(v: any) => setPrivacyFilter(v)}>
          <TabsList>
            <TabsTrigger value="all">All Circuits</TabsTrigger>
            <TabsTrigger value="standard">Standard</TabsTrigger>
            <TabsTrigger value="vip" className="gap-1">
              <Star className="w-3 h-3 fill-purple-600 text-purple-600" />
              VIP Only
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Circuit List */}
      <ItineraryList circuits={circuits} />
    </div>
  );
};
```

### 4. Add VIP Stats to Dashboard
Update admin dashboard with VIP circuit statistics:

```typescript
// In AdminDashboard component
const { data: circuitStats } = useQuery({
  queryKey: ['circuit-stats'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('itineraries')
      .select('id, privacy_level');
    
    if (error) throw error;
    
    const vipCount = data.filter(c => c.privacy_level === 'vip').length;
    const standardCount = data.filter(c => c.privacy_level === 'standard').length;
    
    return { vipCount, standardCount, total: data.length };
  },
  enabled: currentUser?.role === 'superadmin'
});

// In dashboard cards
{currentUser?.role === 'superadmin' && (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Star className="w-5 h-5 text-purple-500" />
        VIP Circuits
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">VIP</span>
          <span className="font-bold text-lg text-purple-600">
            {circuitStats?.vipCount || 0}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Standard</span>
          <span className="font-bold text-lg">
            {circuitStats?.standardCount || 0}
          </span>
        </div>
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total</span>
            <span className="font-bold text-xl">
              {circuitStats?.total || 0}
            </span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

## SUCCESS CRITERIA
- [ ] SuperAdmin can toggle VIP when creating circuit
- [ ] VIP circuits show purple badge and styling
- [ ] Regular admins DON'T see VIP circuits in list
- [ ] SuperAdmin sees VIP filter tabs
- [ ] Dashboard shows VIP circuit statistics (SuperAdmin only)
- [ ] VIP circuit cards have distinct visual styling
- [ ] Can assign VIP tourists to VIP circuits
- [ ] RLS policies correctly filter based on user role

---

**TEST THIS, THEN I'LL SEND FINAL PART 6!**
