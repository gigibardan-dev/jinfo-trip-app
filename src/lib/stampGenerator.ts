import { supabase } from "@/integrations/supabase/client";

interface Activity {
  id: string;
  title: string;
  description: string | null;
  activity_type: string;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  day_id: string;
}

interface StampKeyword {
  keywords: string[];
  rarity: 'legendary' | 'rare' | 'common';
  icon: string;
  points: number;
}

// Definim keywords pentru detectare automată
const STAMP_KEYWORDS: StampKeyword[] = [
  // LEGENDARY (200 points)
  {
    keywords: ['safari', 'wonder', 'monument', 'unesco', 'national park', 'mountain', 'volcano', 'temple', 'cathedral', 'palace', 'pyramid', 'taj mahal', 'machu picchu', 'petra', 'colosseum'],
    rarity: 'legendary',
    icon: '🏆',
    points: 200
  },
  // RARE (50 points)
  {
    keywords: ['museum', 'gallery', 'castle', 'fort', 'fortress', 'beach', 'lake', 'waterfall', 'viewpoint', 'cultural', 'historical', 'sanctuary', 'reserve', 'canyon', 'desert'],
    rarity: 'rare',
    icon: '⭐',
    points: 50
  },
  // COMMON (10 points)
  {
    keywords: ['hotel', 'restaurant', 'lunch', 'dinner', 'breakfast', 'transport', 'shopping', 'market', 'check-in', 'check-out', 'transfer', 'drive'],
    rarity: 'common',
    icon: '📍',
    points: 10
  }
];

// Icon mapping bazat pe keywords
const ICON_MAPPING: { keywords: string[]; icon: string }[] = [
  { keywords: ['safari', 'wildlife', 'animal', 'game drive', 'lion', 'elephant'], icon: '🦁' },
  { keywords: ['mountain', 'hiking', 'climb', 'peak', 'summit', 'kilimanjaro'], icon: '🏔️' },
  { keywords: ['beach', 'ocean', 'sea', 'coast', 'island', 'snorkeling'], icon: '🏖️' },
  { keywords: ['monument', 'landmark', 'colosseum', 'tower', 'statue', 'memorial'], icon: '🏛️' },
  { keywords: ['museum', 'gallery', 'culture', 'art', 'exhibition'], icon: '🎭' },
  { keywords: ['food', 'restaurant', 'lunch', 'dinner', 'meal', 'cuisine'], icon: '🍽️' },
  { keywords: ['temple', 'mosque', 'church', 'cathedral', 'shrine', 'religious'], icon: '🕌' },
  { keywords: ['park', 'garden', 'nature', 'forest', 'jungle', 'botanical'], icon: '🌿' },
  { keywords: ['waterfall', 'falls', 'cascade'], icon: '💧' },
  { keywords: ['volcano', 'volcanic', 'crater'], icon: '🌋' },
  { keywords: ['castle', 'palace', 'fort', 'fortress'], icon: '🏰' },
  { keywords: ['market', 'shopping', 'bazaar', 'souk'], icon: '🛍️' },
  { keywords: ['sunset', 'sunrise', 'viewpoint', 'scenic'], icon: '🌅' },
  { keywords: ['desert', 'sand', 'dune', 'sahara'], icon: '🏜️' },
  { keywords: ['canyon', 'gorge', 'valley'], icon: '⛰️' },
];

/**
 * Detectează rarity și points bazat pe keywords din text
 */
function detectRarityAndPoints(text: string): { rarity: 'legendary' | 'rare' | 'common'; points: number } {
  const lowerText = text.toLowerCase();
  
  for (const category of STAMP_KEYWORDS) {
    for (const keyword of category.keywords) {
      if (lowerText.includes(keyword)) {
        return { rarity: category.rarity, points: category.points };
      }
    }
  }
  
  // Default: common
  return { rarity: 'common', points: 10 };
}

/**
 * Detectează icon potrivit bazat pe keywords din text
 */
function detectIcon(text: string): string {
  const lowerText = text.toLowerCase();
  
  for (const mapping of ICON_MAPPING) {
    for (const keyword of mapping.keywords) {
      if (lowerText.includes(keyword)) {
        return mapping.icon;
      }
    }
  }
  
  // Default icon
  return '📍';
}

/**
 * Extrage nume pentru stamp din title și description
 */
function extractStampName(title: string, description: string | null): string {
  // Folosește title-ul, eventual îmbunătățit cu keywords din description
  let name = title;
  
  // Capitalizează prima literă a fiecărui cuvânt
  name = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return name;
}

/**
 * Auto-generează stamps din activities pentru un trip
 */
export async function autoGenerateStamps(tripId: string): Promise<{ 
  success: boolean; 
  stampsCreated: number;
  error?: string;
}> {
  try {
    console.log('[StampGenerator] Starting auto-generation for trip:', tripId);
    
    // STEP 1: Fetch toate activities pentru acest trip
    const { data: days, error: daysError } = await supabase
      .from('itinerary_days')
      .select(`
        id,
        itinerary_activities (
          id,
          title,
          description,
          activity_type,
          location_name,
          latitude,
          longitude
        )
      `)
      .eq('trip_id', tripId);
    
    if (daysError) throw daysError;
    if (!days || days.length === 0) {
      console.log('[StampGenerator] No itinerary days found for trip');
      return { success: true, stampsCreated: 0 };
    }
    
    // STEP 2: Flatten activities din toate zilele
    const allActivities: (Activity & { day_id: string })[] = [];
    for (const day of days) {
      const activities = day.itinerary_activities as any[];
      if (activities && activities.length > 0) {
        activities.forEach(activity => {
          allActivities.push({
            ...activity,
            day_id: day.id
          });
        });
      }
    }
    
    if (allActivities.length === 0) {
      console.log('[StampGenerator] No activities found');
      return { success: true, stampsCreated: 0 };
    }
    
    console.log(`[StampGenerator] Found ${allActivities.length} activities to process`);
    
    // STEP 3: Fetch existing stamps pentru acest trip (evitare duplicate)
    const { data: existingStamps, error: existingError } = await supabase
      .from('poi_stamps')
      .select('name')
      .eq('trip_id', tripId);
    
    if (existingError) throw existingError;
    
    const existingNames = new Set(existingStamps?.map(s => s.name.toLowerCase()) || []);
    
    // STEP 4: Procesează fiecare activity și creează stamps
    const stampsToCreate = [];
    
    for (const activity of allActivities) {
      const fullText = `${activity.title} ${activity.description || ''} ${activity.location_name || ''}`;
      const stampName = extractStampName(activity.title, activity.description);
      
      // Skip dacă există deja stamp cu același nume
      if (existingNames.has(stampName.toLowerCase())) {
        console.log(`[StampGenerator] Skipping duplicate: ${stampName}`);
        continue;
      }
      
      // Detectează rarity și icon
      const { rarity, points } = detectRarityAndPoints(fullText);
      const icon = detectIcon(fullText);
      
      stampsToCreate.push({
        trip_id: tripId,
        itinerary_day_id: activity.day_id,
        name: stampName,
        description: activity.description,
        stamp_icon: icon,
        rarity,
        points_value: points,
        location_lat: activity.latitude,
        location_lng: activity.longitude
      });
      
      existingNames.add(stampName.toLowerCase());
    }
    
    // STEP 5: Insert stamps în batch
    if (stampsToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('poi_stamps')
        .insert(stampsToCreate);
      
      if (insertError) throw insertError;
      
      console.log(`[StampGenerator] Created ${stampsToCreate.length} stamps successfully`);
    }
    
    return {
      success: true,
      stampsCreated: stampsToCreate.length
    };
    
  } catch (error) {
    console.error('[StampGenerator] Error:', error);
    return {
      success: false,
      stampsCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Re-generează stamps pentru un trip (șterge existentele și creează noi)
 */
export async function regenerateStamps(tripId: string): Promise<{
  success: boolean;
  stampsCreated: number;
  error?: string;
}> {
  try {
    console.log('[StampGenerator] Regenerating stamps for trip:', tripId);
    
    // STEP 1: Șterge stamps existente
    const { error: deleteError } = await supabase
      .from('poi_stamps')
      .delete()
      .eq('trip_id', tripId);
    
    if (deleteError) throw deleteError;
    
    // STEP 2: Generează stamps noi
    return await autoGenerateStamps(tripId);
    
  } catch (error) {
    console.error('[StampGenerator] Regenerate error:', error);
    return {
      success: false,
      stampsCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
