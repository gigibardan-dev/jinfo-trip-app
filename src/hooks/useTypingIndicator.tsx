import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface TypingUser {
  user_id: string;
  name: string;
}

export const useTypingIndicator = (conversationId: string | null, userId: string | null) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingUsersRef = useRef<TypingUser[]>([]); // ← ADAUGĂ ASTA

  useEffect(() => {
    if (!conversationId || !userId) {
      return;
    }

    const channel = supabase.channel(`typing:${conversationId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typing: TypingUser[] = [];
        
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          presences.forEach((presence) => {
            if (presence.user_id !== userId && presence.typing) {
              typing.push({
                user_id: presence.user_id,
                name: presence.name,
              });
            }
          });
        });
        
        // ✅ DOAR UPDATE DACĂ S-A SCHIMBAT EFECTIV
        const typingChanged = JSON.stringify(typingUsersRef.current) !== JSON.stringify(typing);
        if (typingChanged) {
          console.log('🔄 Typing users changed:', typing); // Debug
          typingUsersRef.current = typing;
          setTypingUsers(typing);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            typing: false,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, userId]);

  const startTyping = useCallback(async (userName: string) => {
    if (!channelRef.current || !userId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    await channelRef.current.track({
      user_id: userId,
      name: userName,
      typing: true,
      online_at: new Date().toISOString(),
    });

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [userId]); // ← ATENȚIE: stopTyping NU e în dependency!

  const stopTyping = useCallback(async () => {
    if (!channelRef.current || !userId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    await channelRef.current.track({
      user_id: userId,
      typing: false,
      online_at: new Date().toISOString(),
    });
  }, [userId]);

  return {
    typingUsers,
    startTyping,
    stopTyping,
  };
};