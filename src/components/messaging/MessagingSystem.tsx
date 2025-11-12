import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Send, MessageSquare, Users, User, MessageCircle, ArrowLeft, Check, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useWebPush } from "@/hooks/useWebPush";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";

interface Conversation {
  id: string;
  conversation_type: 'direct' | 'group' | 'broadcast';
  title?: string;
  group_id?: string;
  created_at: string;
  participants?: any[];
  last_message?: any;
  unread_count?: number;
}

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

interface Tourist {
  id: string;
  nume: string;
  prenume: string;
  email: string;
  is_active: boolean;
}

interface Group {
  id: string;
  nume_grup: string;
  is_active: boolean;
}

export const MessagingSystem = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { isSupported, permission, requestPermission, showNotification } = useWebPush();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tourists, setTourists] = useState<Tourist[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatType, setNewChatType] = useState<'direct' | 'group'>('direct');
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasFetchedRef = useRef(false);
  const fetchConversationsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(
    selectedConversation?.id || null,
    user?.id || null
  );

  const isAdmin = profile?.role === 'admin';
  const isGuide = profile?.role === 'guide';
  const canInitiateChat = isAdmin || isGuide;

  // Request notification permission on mount (only on desktop)
  useEffect(() => {
    if (user && isSupported && permission === 'default') {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (!isMobile) {
        requestPermission();
      }
    }
  }, [user, isSupported, permission, requestPermission]);

  // Fetch conversations - cu prevent double call
  useEffect(() => {
    if (user && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchConversations();
    } else if (!user) {
      hasFetchedRef.current = false;
      setLoading(false);
    }
  }, [user]);

  // Fetch tourists & groups - SEPARAT
  useEffect(() => {
    if (user && canInitiateChat) {
      fetchTourists();
      fetchGroups();
    }
  }, [user, canInitiateChat]);

  // Safety net - dacă loading e true mai mult de 5 secunde
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [loading]);

  // Fetch messages când se selectează o conversație
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Real-time notifications for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('new-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload: any) => {
          const newMsg = payload.new as Message;

          if (newMsg.sender_id !== user.id) {
            const { data: senderData } = await supabase
              .from('profiles')
              .select('nume, prenume, email')
              .eq('id', newMsg.sender_id)
              .single();

            const senderName = senderData
              ? `${senderData.nume} ${senderData.prenume}`
              : 'Cineva';

            toast({
              title: "Mesaj nou",
              description: `${senderName}: ${newMsg.content.substring(0, 50)}${newMsg.content.length > 50 ? '...' : ''}`,
              duration: 3000,
            });

            // Push notification doar dacă granted și document hidden
            if (document.hidden && permission === 'granted') {
              showNotification('Mesaj nou', {
                body: `${senderName}: ${newMsg.content.substring(0, 100)}`,
                tag: newMsg.conversation_id,
                requireInteraction: false,
              });
            }

            // Dacă mesajul e în conversația curentă, adaugă-l direct
            if (selectedConversation && newMsg.conversation_id === selectedConversation.id) {
              setMessages(prev => {
                const exists = prev.some(m => m.id === newMsg.id);
                if (exists) return prev;
                
                return [...prev, {
                  ...newMsg,
                  sender: senderData
                }];
              });
              
              // Mark as read instant
              markMessagesAsRead(selectedConversation.id);
            } else {
              // Dacă e în altă conversație, update unread count
              setConversations(prev => 
                prev.map(conv => 
                  conv.id === newMsg.conversation_id
                    ? { ...conv, unread_count: (conv.unread_count || 0) + 1 }
                    : conv
                )
              );
            }

            // Debounced fetch pentru last_message
            fetchConversationsDebounced();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload: any) => {
          // Update mesajele din UI (pentru read receipts)
          if (selectedConversation && payload.new.conversation_id === selectedConversation.id) {
            setMessages(prevMessages =>
              prevMessages.map(msg =>
                msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedConversation, showNotification, toast, permission]);

  // Auto-scroll INSTANT când se deschide conversația
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [selectedConversation?.id]);

  // Auto-scroll SMOOTH când apar mesaje noi
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [messages]);

  const fetchConversationsDebounced = useCallback(() => {
    if (fetchConversationsTimeoutRef.current) {
      clearTimeout(fetchConversationsTimeoutRef.current);
    }

    fetchConversationsTimeoutRef.current = setTimeout(() => {
      fetchConversations();
    }, 300);
  }, []);

  const fetchConversations = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants(
            user_id,
            profiles(nume, prenume, email)
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const conversationsWithUnread = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          return {
            ...conv,
            unread_count: count || 0
          };
        })
      );

      setConversations(conversationsWithUnread);
      
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca conversațiile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles(nume, prenume, email)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(messagesData || []);

      await markMessagesAsDelivered(conversationId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markMessagesAsDelivered = async (conversationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('chat_messages')
        .update({ delivered_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .is('delivered_at', null);
    } catch (error) {
      console.error('Error marking messages as delivered:', error);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false)
        .select();

      if (error) throw error;

      // Update local state INSTANT
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );

      // Debounced fetch pentru sincronizare completă
      if (data && data.length > 0) {
        fetchConversationsDebounced();
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const fetchTourists = async () => {
    if (!canInitiateChat) return;

    try {
      if (isGuide && !isAdmin) {
        const { data: assignments, error: assignError } = await supabase
          .from('guide_assignments')
          .select('trip_id')
          .eq('guide_user_id', user?.id)
          .eq('is_active', true);

        if (assignError) throw assignError;

        if (!assignments || assignments.length === 0) {
          setTourists([]);
          return;
        }

        const tripIds = assignments.map(a => a.trip_id);
        const { data: trips, error: tripsError } = await supabase
          .from('trips')
          .select('group_id')
          .in('id', tripIds)
          .not('group_id', 'is', null);

        if (tripsError) throw tripsError;

        if (!trips || trips.length === 0) {
          setTourists([]);
          return;
        }

        const groupIds = [...new Set(trips.map(t => t.group_id).filter(Boolean))];
        const { data: members, error: membersError } = await supabase
          .from('group_members')
          .select('user_id')
          .in('group_id', groupIds);

        if (membersError) throw membersError;

        if (!members || members.length === 0) {
          setTourists([]);
          return;
        }

        const userIds = [...new Set(members.map(m => m.user_id))];
        const { data, error } = await supabase
          .from('profiles')
          .select('id, nume, prenume, email, is_active')
          .in('id', userIds)
          .eq('is_active', true);

        if (error) throw error;
        setTourists(data || []);
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, nume, prenume, email, is_active')
          .eq('role', 'tourist')
          .eq('is_active', true);

        if (error) throw error;
        setTourists(data || []);
      }
    } catch (error) {
      console.error('Error fetching tourists:', error);
    }
  };

  const fetchGroups = async () => {
    if (!canInitiateChat) return;

    try {
      if (isGuide && !isAdmin) {
        const { data: assignments, error: assignError } = await supabase
          .from('guide_assignments')
          .select('trip_id')
          .eq('guide_user_id', user?.id)
          .eq('is_active', true);

        if (assignError) throw assignError;

        if (!assignments || assignments.length === 0) {
          setGroups([]);
          return;
        }

        const tripIds = assignments.map(a => a.trip_id);
        const { data: trips, error: tripsError } = await supabase
          .from('trips')
          .select('group_id')
          .in('id', tripIds)
          .not('group_id', 'is', null);

        if (tripsError) throw tripsError;

        if (!trips || trips.length === 0) {
          setGroups([]);
          return;
        }

        const groupIds = [...new Set(trips.map(t => t.group_id).filter(Boolean))];
        const { data, error } = await supabase
          .from('tourist_groups')
          .select('id, nume_grup, is_active')
          .in('id', groupIds)
          .eq('is_active', true);

        if (error) throw error;
        setGroups(data || []);
      } else {
        const { data, error } = await supabase
          .from('tourist_groups')
          .select('id, nume_grup, is_active')
          .eq('is_active', true);

        if (error) throw error;
        setGroups(data || []);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const createConversation = async () => {
    if (!selectedRecipient || !user) return;

    try {
      const conversationData = {
        conversation_type: newChatType,
        group_id: newChatType === 'group' ? selectedRecipient : null,
        title: newChatType === 'group' ?
          groups.find(g => g.id === selectedRecipient)?.nume_grup :
          null
      };

      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select()
        .single();

      if (convError) throw convError;

      const participants = [
        { conversation_id: conversation.id, user_id: user.id }
      ];

      if (newChatType === 'direct') {
        participants.push({ conversation_id: conversation.id, user_id: selectedRecipient });
      } else {
        const { data: groupMembers } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', selectedRecipient);

        groupMembers?.forEach(member => {
          if (member.user_id !== user.id) {
            participants.push({ conversation_id: conversation.id, user_id: member.user_id });
          }
        });

        if (isGuide && !isAdmin) {
          const { data: adminProfiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'admin')
            .eq('is_active', true);

          adminProfiles?.forEach(admin => {
            if (!participants.some(p => p.user_id === admin.id)) {
              participants.push({ conversation_id: conversation.id, user_id: admin.id });
            }
          });
        }
      }

      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      toast({
        title: "Succes",
        description: "Conversația a fost creată",
      });

      setIsNewChatOpen(false);
      setSelectedRecipient("");
      fetchConversations();
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut crea conversația",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText || !selectedConversation || !user) return;

    try {
      // Optimistic UI
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content: messageText,
        is_read: false,
        created_at: new Date().toISOString(),
        sender: {
          nume: profile?.nume,
          prenume: profile?.prenume,
          email: profile?.email
        }
      };

      setMessages(prev => [...prev, optimisticMessage]);

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content: messageText
        })
        .select(`
          *,
          sender:profiles(nume, prenume, email)
        `)
        .single();

      if (error) throw error;

      // Înlocuiește mesajul optimistic
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticMessage.id ? data : msg
        )
      );

      fetchConversationsDebounced();
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Șterge mesajul optimistic
      setMessages(prev => 
        prev.filter(msg => !msg.id.startsWith('temp-'))
      );
      
      toast({
        title: "Eroare",
        description: "Nu s-a putut trimite mesajul",
        variant: "destructive",
      });
    }
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title) return conversation.title;

    if (conversation.conversation_type === 'direct') {
      const otherParticipant = conversation.participants?.find(p => p.user_id !== user?.id);
      if (otherParticipant?.profiles) {
        return `${otherParticipant.profiles.nume} ${otherParticipant.profiles.prenume}`;
      }
    }

    return 'Conversație';
  };

  const filteredConversations = conversations.filter(conv =>
    getConversationTitle(conv).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUnreadCount = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    return conversation?.unread_count || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Se încarcă mesajele...</p>
        </div>
      </div>
    );
  }

  // ==================== SUB-COMPONENTS ====================

  const ConversationsList = React.memo(() => (
    <div className="flex flex-col h-full">
      <div className="p-3 sm:p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg sm:text-xl font-bold">Mesaje</h2>
          {canInitiateChat && (
            <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 h-9">
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Nou</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Conversație nouă</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={newChatType} onValueChange={(value: 'direct' | 'group') => setNewChatType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipul conversației" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Mesaj direct
                        </div>
                      </SelectItem>
                      <SelectItem value="group">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Chat de grup
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {newChatType === 'direct' && (
                    <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează turistul" />
                      </SelectTrigger>
                      <SelectContent>
                        {tourists.map(tourist => (
                          <SelectItem key={tourist.id} value={tourist.id}>
                            {tourist.nume} {tourist.prenume}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {newChatType === 'group' && (
                    <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează grupul" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map(group => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.nume_grup}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Button
                    onClick={createConversation}
                    disabled={!selectedRecipient}
                    className="w-full"
                  >
                    Creează conversația
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Caută conversații..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageCircle className="w-12 sm:w-16 h-12 sm:h-16 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2 text-sm sm:text-base">Nicio conversație</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {canInitiateChat
                ? "Începe o conversație nouă folosind butonul de mai sus"
                : "Nu ai nicio conversație momentan"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredConversations.map(conversation => {
              const unreadCount = getUnreadCount(conversation.id);
              const isSelected = selectedConversation?.id === conversation.id;
              const lastMessageTime = conversation.last_message?.created_at
                ? new Date(conversation.last_message.created_at).toLocaleTimeString('ro-RO', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
                : '';

              return (
                <button
                  key={conversation.id}
                  className={cn(
                    "w-full p-3 sm:p-4 text-left transition-all hover:bg-accent/50 active:bg-accent",
                    isSelected && "bg-primary/10 hover:bg-primary/15 active:bg-primary/20"
                  )}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0">
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
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate text-sm sm:text-base">
                            {getConversationTitle(conversation)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {lastMessageTime && (
                            <span className="text-xs text-muted-foreground">
                              {lastMessageTime}
                            </span>
                          )}
                          {unreadCount > 0 && (
                            <Badge variant="default" className="ml-1 h-5 min-w-[20px] flex items-center justify-center px-1.5">
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {conversation.last_message && (
                        <p className="text-xs sm:text-sm text-muted-foreground truncate leading-relaxed">
                          {conversation.last_message.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  ));

  const MessageInput = React.memo(({
    onSend,
    onTypingStart,
    onTypingStop
  }: {
    onSend: (message: string) => void;
    onTypingStart?: () => void;
    onTypingStop?: () => void;
  }) => {
    const [localMessage, setLocalMessage] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isTypingRef = useRef(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalMessage(newValue);

      if (newValue.length > 0 && onTypingStart && !isTypingRef.current) {
        isTypingRef.current = true;
        onTypingStart();
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (newValue.length > 0) {
        typingTimeoutRef.current = setTimeout(() => {
          if (onTypingStop) {
            isTypingRef.current = false;
            onTypingStop();
          }
        }, 3000);
      } else if (onTypingStop) {
        isTypingRef.current = false;
        onTypingStop();
      }
    };

    const handleSend = () => {
      if (localMessage.trim()) {
        onSend(localMessage.trim());
        setLocalMessage("");
        if (onTypingStop) {
          isTypingRef.current = false;
          onTypingStop();
        }
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    return (
      <div className="p-3 sm:p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Input
            ref={inputRef}
            placeholder="Scrie un mesaj..."
            value={localMessage}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="flex-1 h-10 sm:h-11 rounded-full bg-muted/50 border-none focus-visible:ring-2"
          />
          <Button
            onClick={handleSend}
            disabled={!localMessage.trim()}
            size="icon"
            className="flex-shrink-0 rounded-full h-10 w-10 sm:h-11 sm:w-11"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>
    );
  }, () => true);

  const MessagesView = React.memo(() => {
        
  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center p-8">
          <MessageCircle className="w-12 sm:w-16 h-12 sm:h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-semibold mb-2">Selectează o conversație</h3>
          <p className="text-sm text-muted-foreground">
            Alege o conversație din listă pentru a începe să comunici
          </p>
        </div>
      </div>
    );
  }

    return (
      <div className="flex-1 flex flex-col bg-background h-full">
        {/* Chat Header */}
        <div className="p-3 sm:p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9"
              onClick={() => setSelectedConversation(null)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-10 h-10 sm:w-11 sm:h-11">
              <AvatarFallback className={cn(
                "bg-gradient-to-br font-semibold text-white",
                selectedConversation.conversation_type === 'group'
                  ? "from-blue-500 to-purple-500"
                  : "from-green-500 to-teal-500"
              )}>
                {selectedConversation.conversation_type === 'group' ? (
                  <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <User className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate text-sm sm:text-base">
                {getConversationTitle(selectedConversation)}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {selectedConversation.conversation_type === 'group' ? 'Chat de grup' : 'Mesaj direct'}
              </p>
            </div>
          </div>
        </div>

        {/* Messages - SCROLLABLE */}
        <ScrollArea className="flex-1 bg-muted/20">
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
                  const isOwn = message.sender_id === user?.id;
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
                      <div className={cn("flex flex-col gap-0.5 max-w-[80%] sm:max-w-[70%]", isOwn ? "items-end" : "items-start")}>
                        {showSender && (
                          <p className="text-xs font-medium text-muted-foreground px-3 mb-0.5">
                            {message.sender?.nume} {message.sender?.prenume}
                          </p>
                        )}
                        <div
                          className={cn(
                            "rounded-2xl px-3 sm:px-4 py-2 break-words shadow-sm",
                            isOwn
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-background border border-border/50 rounded-bl-md"
                          )}
                        >
                          <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <p className={cn(
                              "text-[10px] sm:text-xs",
                              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {new Date(message.created_at).toLocaleTimeString('ro-RO', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {isOwn && (
                              <span className="text-primary-foreground/70">
                                {message.read_at ? (
                                  <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                                ) : message.delivered_at ? (
                                  <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                                ) : (
                                  <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isOwn && (
                        <Avatar className={cn(
                          "w-7 h-7 sm:w-8 sm:h-8 mb-0.5 flex-shrink-0",
                          !showAvatar && "opacity-0"
                        )}>
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold">
                            {profile?.nume?.[0]}{profile?.prenume?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="px-3 sm:px-4 py-2 bg-muted/20 border-t flex-shrink-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in-0 max-w-4xl mx-auto">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-xs">
                {typingUsers.length === 1
                  ? `${typingUsers[0].name} scrie...`
                  : `${typingUsers.length} persoane scriu...`
                }
              </span>
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="flex-shrink-0">
          <MessageInput
            onSend={sendMessage}
            onTypingStart={profile ? () => startTyping(`${profile.nume} ${profile.prenume}`) : undefined}
            onTypingStop={stopTyping}
          />
        </div>
      </div>
    );
  });

  // ==================== MAIN RENDER ====================

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-[calc(100vh-12rem)] border rounded-xl overflow-hidden shadow-xl bg-background">
        <div className="w-[380px] border-r flex-shrink-0">
          <ConversationsList />
        </div>
        <MessagesView />
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {selectedConversation ? (
          <div className="h-[calc(100vh-8rem)] sm:h-[calc(100vh-10rem)] border rounded-xl overflow-hidden shadow-xl bg-background flex flex-col">
            <MessagesView />
          </div>
        ) : (
          <div className="h-[calc(100vh-8rem)] sm:h-[calc(100vh-10rem)] border rounded-xl overflow-hidden shadow-xl bg-background">
            <ConversationsList />
          </div>
        )}
      </div>
    </>
  );
};