import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MessageSquare, Users, User, MessageCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useWebPush } from "@/hooks/useWebPush";
import { MessageInput } from "./MessageInput";

interface Conversation {
  id: string;
  conversation_type: 'direct' | 'group' | 'broadcast';
  title?: string;
  group_id?: string;
  created_at: string;
  updated_at: string;
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
  const selectedConversationRef = useRef<Conversation | null>(null);
  const lastMessagesLengthRef = useRef(0);

  const isAdmin = profile?.role === 'admin';
  const isGuide = profile?.role === 'guide';
  const canInitiateChat = isAdmin || isGuide;

  // Update ref când se schimbă selectedConversation
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Request notification permission (desktop only)
  useEffect(() => {
    if (user && isSupported && permission === 'default') {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (!isMobile) {
        requestPermission();
      }
    }
  }, [user, isSupported, permission, requestPermission]);

  // Fetch conversations once
  useEffect(() => {
    if (user && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchConversations();
    } else if (!user) {
      hasFetchedRef.current = false;
      setLoading(false);
    }
  }, [user]);

  // Fetch tourists & groups
  useEffect(() => {
    if (user && canInitiateChat) {
      fetchTourists();
      fetchGroups();
    }
  }, [user, canInitiateChat]);

  // Safety loading timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) setLoading(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Fetch messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      // Mark as read after a short delay to ensure messages are loaded
      const timer = setTimeout(() => {
        markMessagesAsRead(selectedConversation.id);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedConversation]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user) return;


    const channel = supabase
      .channel('public:chat_messages', {
        config: {
          broadcast: { self: true }, // Important pentru a primi propriile tale mesaje
        }
      })
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages'
        },
        async (payload: any) => {
          const newMsg = payload.new as Message;

          // Fetch sender info
          const { data: senderData } = await supabase
            .from('profiles')
            .select('nume, prenume, email')
            .eq('id', newMsg.sender_id)
            .single();


          const senderName = senderData
            ? `${senderData.nume} ${senderData.prenume}`
            : 'Cineva';

          // Get current conversation from ref
          const currentConversation = selectedConversationRef.current;
          
          // Show toast DOAR pentru mesaje de la alții ȘI dacă NU ești în conversația respectivă
          if (newMsg.sender_id !== user.id && 
              (!currentConversation || newMsg.conversation_id !== currentConversation.id)) {
            toast({
              title: "Mesaj nou",
              description: `${senderName}: ${newMsg.content.substring(0, 50)}${newMsg.content.length > 50 ? '...' : ''}`,
              duration: 3000,
            });

            // Push notification
            if (typeof document !== 'undefined' && document.hidden && permission === 'granted') {
              showNotification('Mesaj nou', {
                body: `${senderName}: ${newMsg.content.substring(0, 100)}`,
                tag: newMsg.conversation_id,
                requireInteraction: false,
              });
            }
          }

          // CRITICAL: Adaugă mesajul în conversația curentă
          if (currentConversation && newMsg.conversation_id === currentConversation.id) {
            
            setMessages(prev => {
              
              const exists = prev.some(m => m.id === newMsg.id);
              if (exists) {
                return prev;
              }
              
              const updatedMessages = [...prev, { 
                ...newMsg, 
                sender: senderData 
              }];
              
              return updatedMessages;
            });

            // Mark as read instant dacă e de la altcineva
            if (newMsg.sender_id !== user.id) {
              setTimeout(async () => {
                try {
                  await supabase
                    .from('chat_messages')
                    .update({
                      is_read: true,
                      read_at: new Date().toISOString()
                    })
                    .eq('conversation_id', currentConversation.id)
                    .neq('sender_id', user.id)
                    .eq('is_read', false);

                  // Update DOAR unread count, NU last_message
                  setConversations(prev =>
                    prev.map(conv =>
                      conv.id === currentConversation.id
                        ? { ...conv, unread_count: 0 }
                        : conv
                    )
                  );
                } catch (error) {
                }
              }, 500);
            }
            
            // ⚠️ KEY FIX: Update last_message DUPĂ scroll (delay 200ms)
            // Asta permite scroll-ului să se facă ÎNAINTE de re-render
            setTimeout(() => {
              setConversations(prev =>
                prev.map(conv => {
                  if (conv.id === currentConversation.id) {
                    return {
                      ...conv,
                      last_message: { 
                        content: newMsg.content, 
                        created_at: newMsg.created_at 
                      },
                      updated_at: newMsg.created_at
                    };
                  }
                  return conv;
                })
              );
            }, 200); // Delay pentru a nu perturba scroll-ul
          } else {
            // Mesaj în ALTĂ conversație - update last_message + unread
            setConversations(prev =>
              prev.map(conv => {
                if (conv.id === newMsg.conversation_id) {
                  return {
                    ...conv,
                    last_message: { 
                      content: newMsg.content, 
                      created_at: newMsg.created_at 
                    },
                    updated_at: newMsg.created_at,
                    unread_count: (conv.unread_count || 0) + 1
                  };
                }
                return conv;
              }).sort((a, b) => {
                const timeA = new Date(a.updated_at).getTime();
                const timeB = new Date(b.updated_at).getTime();
                return timeB - timeA;
              })
            );
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
        }
        if (status === 'SUBSCRIBED') {
        } else if (status === 'CHANNEL_ERROR') {
        } else if (status === 'TIMED_OUT') {
        } else if (status === 'CLOSED') {
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]); // Doar user în dependencies!

  // Auto-scroll to bottom - DOAR când apar mesaje NOI
  useEffect(() => {
    const hasNewMessage = messages.length > lastMessagesLengthRef.current;
    
    if (!hasNewMessage || messages.length === 0 || !messagesEndRef.current) {
      lastMessagesLengthRef.current = messages.length;
      return;
    }

    const scrollToBottom = () => {
      const endElement = messagesEndRef.current;
      if (!endElement) return;

      let parent = endElement.parentElement;
      let attempts = 0;

      while (parent && attempts < 10) {
        const style = window.getComputedStyle(parent);
        const overflowY = style.overflowY;

        if (overflowY === 'scroll' || overflowY === 'auto') {
          parent.scrollTop = parent.scrollHeight;
          break;
        }

        parent = parent.parentElement;
        attempts++;
      }
    };

    const timeoutId = setTimeout(scrollToBottom, 100);
    lastMessagesLengthRef.current = messages.length;

    return () => clearTimeout(timeoutId);
  }, [messages.length]);

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
    } catch (error) {
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

      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );

      if (data && data.length > 0) {
        fetchConversationsDebounced();
      }
    } catch (error) {
    }
  };

  const fetchTourists = async () => {
    if (!canInitiateChat) return;

    try {
      if (isGuide && !isAdmin) {
        const { data: assignments } = await supabase
          .from('guide_assignments')
          .select('trip_id')
          .eq('guide_user_id', user?.id)
          .eq('is_active', true);

        if (!assignments || assignments.length === 0) {
          setTourists([]);
          return;
        }

        const tripIds = assignments.map(a => a.trip_id);
        const { data: trips } = await supabase
          .from('trips')
          .select('group_id')
          .in('id', tripIds)
          .not('group_id', 'is', null);

        if (!trips || trips.length === 0) {
          setTourists([]);
          return;
        }

        const groupIds = [...new Set(trips.map(t => t.group_id).filter(Boolean))];
        const { data: members } = await supabase
          .from('group_members')
          .select('user_id')
          .in('group_id', groupIds);

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
    }
  };

  const fetchGroups = async () => {
    if (!canInitiateChat) return;

    try {
      if (isGuide && !isAdmin) {
        const { data: assignments } = await supabase
          .from('guide_assignments')
          .select('trip_id')
          .eq('guide_user_id', user?.id)
          .eq('is_active', true);

        if (!assignments || assignments.length === 0) {
          setGroups([]);
          return;
        }

        const tripIds = assignments.map(a => a.trip_id);
        const { data: trips } = await supabase
          .from('trips')
          .select('group_id')
          .in('id', tripIds)
          .not('group_id', 'is', null);

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
    }
  };

  const createConversation = async () => {
    if (!selectedRecipient || !user) return;

    try {
      const conversationData = {
        conversation_type: newChatType,
        group_id: newChatType === 'group' ? selectedRecipient : null,
        title: newChatType === 'group'
          ? groups.find(g => g.id === selectedRecipient)?.nume_grup
          : null
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
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content: messageText
        });

      if (error) throw error;

      setTimeout(() => {
        fetchMessages(selectedConversation.id);
      }, 500);

      fetchConversationsDebounced();
    } catch (error) {
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

  const ConversationsList = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 sm:p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
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
                : null;

              return (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={cn(
                    "w-full p-3 sm:p-4 text-left transition-all hover:bg-muted/50",
                    isSelected && "bg-muted/80 border-l-4 border-primary"
                  )}
                >
                  <div className="flex gap-3 items-start">
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
  );

  const MessagesView = () => {
    if (!selectedConversation) {
      return (
        <div className="flex-1 flex items-center justify-center bg-muted/20">
          <div className="text-center p-4 sm:p-8">
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
              className="lg:hidden h-9 w-9 flex-shrink-0"
              onClick={() => setSelectedConversation(null)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0">
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
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="flex-shrink-0">
          <MessageInput onSend={sendMessage} />
        </div>
      </div>
    );
  };

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

      {/* Mobile Layout - DESIGN-UL TĂU PĂSTRAT */}
      <div className="lg:hidden">
        {selectedConversation ? (
          <div className="fixed inset-0 top-14 bottom-16 border-t bg-background flex flex-col z-10">
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