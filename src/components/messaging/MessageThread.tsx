import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, MessageCircle, Users, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { MessageInput } from "./MessageInput";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  delivered_at?: string;
  read_at?: string;
  created_at: string;
  sender?: any;
}

interface Conversation {
  id: string;
  conversation_type: 'direct' | 'group' | 'broadcast';
  title?: string;
  group_id?: string;
  participants?: any[];
}

interface MessageThreadProps {
  conversation: Conversation;
  currentUserId: string;
  onMessagesRead?: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

export const MessageThread = ({
  conversation,
  currentUserId,
  onMessagesRead,
  onBack,
  showBackButton = false
}: MessageThreadProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (conversation?.id) {
      fetchMessages();
    }
  }, [conversation?.id]);

  // Periodic refresh as safety net in case realtime misses an event
  useEffect(() => {
    if (!conversation?.id) return;

    const interval = setInterval(() => {
      console.log('[MessageThread] Polling refresh for conversation', conversation.id);
      fetchMessages();
    }, 4000);

    return () => clearInterval(interval);
  }, [conversation?.id]);

  // 🔧 FIX BUG 1 - Mark messages as read when conversation loads or changes
  useEffect(() => {
    if (!conversation?.id || !currentUserId) return;

    const markMessagesAsRead = async () => {
      try {
        // Fetch unread message IDs
        const { data: unreadMessages } = await supabase
          .from('chat_messages')
          .select('id')
          .eq('conversation_id', conversation.id)
          .eq('is_read', false)
          .neq('sender_id', currentUserId);

        if (unreadMessages && unreadMessages.length > 0) {
          const messageIds = unreadMessages.map(m => m.id);
          
          // Mark as read
          const { error } = await supabase
            .from('chat_messages')
            .update({ 
              is_read: true,
              read_at: new Date().toISOString()
            })
            .in('id', messageIds);

          if (error) {
            console.error('Error marking messages as read:', error);
            return;
          }

          // Update local state
          setMessages(prev => 
            prev.map(msg => 
              messageIds.includes(msg.id) 
                ? { ...msg, is_read: true, read_at: new Date().toISOString() }
                : msg
            )
          );

          // Notify parent
          onMessagesRead?.();
        }
      } catch (error) {
        console.error('Error in markMessagesAsRead:', error);
      }
    };

    // Delay slightly to ensure messages are loaded
    const timer = setTimeout(markMessagesAsRead, 300);
    return () => clearTimeout(timer);
  }, [conversation?.id, currentUserId, onMessagesRead]);

  // 🔧 FIX BUG 2 - Scroll to bottom when messages change
  useLayoutEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      // Use scrollTop for immediate, reliable scroll
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!conversation?.id) return;

    console.log('[MessageThread] Subscribing to realtime for conversation', conversation.id);

    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        async (payload: any) => {
          console.log('[MessageThread] Realtime INSERT received', payload);
          const newMsg = payload.new as Message;

          try {
            // Fetch sender info
            const { data: senderData, error: senderError } = await supabase
              .from('profiles')
              .select('nume, prenume, email')
              .eq('id', newMsg.sender_id)
              .single();

            if (senderError) {
              console.error('[MessageThread] Error loading sender for realtime msg', senderError);
            }

            // Add message to list (at the end for chronological order)
            setMessages(prev => {
              const exists = prev.some(m => m.id === newMsg.id);
              if (exists) return prev;
              return [...prev, { ...newMsg, sender: senderData }];
            });

            // Auto-mark as read if it's from someone else
            if (newMsg.sender_id !== currentUserId) {
              setTimeout(async () => {
                try {
                  const { error } = await supabase
                    .from('chat_messages')
                    .update({
                      is_read: true,
                      read_at: new Date().toISOString()
                    })
                    .eq('id', newMsg.id);

                  if (error) {
                    console.error('[MessageThread] Error auto-marking message as read:', error);
                  } else {
                    onMessagesRead?.();
                  }
                } catch (error) {
                  console.error('[MessageThread] Exception auto-marking message as read:', error);
                }
              }, 500);
            }
          } catch (error) {
            console.error('[MessageThread] Error handling realtime message:', error);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[MessageThread] Removing realtime channel for conversation', conversation.id);
      supabase.removeChannel(channel);
    };
  }, [conversation?.id, currentUserId, onMessagesRead]);


  const fetchMessages = async () => {
    if (!conversation?.id) return;

    setLoading(true);
    try {
      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles(nume, prenume, email)
        `)
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true }); // ASC for chronological order

      if (error) throw error;
      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca mesajele",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText || !conversation?.id || !currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: currentUserId,
          content: messageText
        })
        .select(`
          *,
          sender:profiles(nume, prenume, email)
        `)
        .single();

      if (error) throw error;

      // Optimistic update - add message immediately to local state
      if (data) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === data.id);
          if (exists) return prev;
          return [...prev, data];
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut trimite mesajul",
        variant: "destructive",
      });
    }
  };

  const getConversationTitle = () => {
    if (conversation.title) return conversation.title;

    if (conversation.conversation_type === 'direct') {
      const otherParticipant = conversation.participants?.find(p => p.user_id !== currentUserId);
      if (otherParticipant?.profiles) {
        return `${otherParticipant.profiles.nume} ${otherParticipant.profiles.prenume}`;
      }
    }

    return 'Conversație';
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Se încarcă mesajele...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      {/* Chat Header */}
      <div className="p-3 sm:p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              onClick={onBack}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <Avatar className="w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0">
            <AvatarFallback className={cn(
              "bg-gradient-to-br font-semibold text-white",
              conversation.conversation_type === 'group'
                ? "from-blue-500 to-purple-500"
                : "from-green-500 to-teal-500"
            )}>
              {conversation.conversation_type === 'group' ? (
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <User className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate text-sm sm:text-base">
              {getConversationTitle()}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {conversation.conversation_type === 'group' ? 'Chat de grup' : 'Mesaj direct'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages - SCROLLABLE CONTAINER */}
      <div 
        ref={messagesContainerRef} 
        className="flex-1 bg-muted/20 overflow-y-auto"
      >
        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 max-w-4xl mx-auto min-h-full">
          {messages.length === 0 ? (
            <div className="text-center py-8 sm:py-12 flex items-center justify-center min-h-[300px]">
              <div>
                <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground font-medium">Niciun mesaj încă</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Fii primul care trimite un mesaj!
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isOwn = message.sender_id === currentUserId;
                const showSender = !isOwn && (
                  index === 0 ||
                  messages[index - 1].sender_id !== message.sender_id
                );
                const showAvatar = index === messages.length - 1 ||
                  messages[index + 1]?.sender_id !== message.sender_id;

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2 items-end animate-in fade-in-0 slide-in-from-bottom-2",
                      isOwn ? "justify-end" : "justify-start"
                    )}
                  >
                    {!isOwn && (
                      <Avatar className={cn(
                        "w-7 h-7 sm:w-8 sm:h-8 mb-0.5 flex-shrink-0",
                        !showAvatar && "opacity-0"
                      )}>
                        <AvatarFallback className="text-xs bg-gradient-to-br from-green-500 to-teal-500 text-white font-semibold">
                          {message.sender?.nume?.[0]}{message.sender?.prenume?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn(
                      "flex flex-col gap-0.5 max-w-[85%] sm:max-w-[70%]",
                      isOwn && "items-end"
                    )}>
                      {showSender && !isOwn && (
                        <span className="text-xs text-muted-foreground px-3 mb-0.5">
                          {message.sender?.nume} {message.sender?.prenume}
                        </span>
                      )}
                      <div className={cn(
                        "px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl",
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      )} style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                        <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>
                          {message.content}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground px-3">
                        {new Date(message.created_at).toLocaleTimeString('ro-RO', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
              {/* Invisible div at the end for scroll target */}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0">
        <MessageInput onSend={sendMessage} />
      </div>
    </div>
  );
};
