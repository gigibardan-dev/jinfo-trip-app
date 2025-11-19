import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUnreadMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setUnreadCount(0);
          return;
        }

        // Pasul 1: Găsește conversațiile user-ului curent
        const { data: participations, error: participationsError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id);

        if (participationsError) {
          console.error('Error fetching conversation participations:', participationsError);
          setUnreadCount(0);
          return;
        }

        if (!participations || participations.length === 0) {
          setUnreadCount(0);
          return;
        }

        // Extrage array-ul de conversation_ids
        const conversationIds = participations.map(p => p.conversation_id);

        // Pasul 2: Numără mesajele necitite din acele conversații
        const { count, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .eq('is_read', false)
          .neq('sender_id', user.id);

        if (messagesError) {
          console.error('Error fetching unread messages count:', messagesError);
          setUnreadCount(0);
          return;
        }

        setUnreadCount(count || 0);
      } catch (error) {
        console.error('Error in useUnreadMessages:', error);
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();

    // Real-time subscription pentru updates
    const channel = supabase
      .channel('unread-messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages'
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return unreadCount;
};
