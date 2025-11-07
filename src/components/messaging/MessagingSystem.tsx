import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Search, Send, MessageSquare, Users, User, MessageCircle, ArrowLeft, Menu, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [tourists, setTourists] = useState<Tourist[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatType, setNewChatType] = useState<'direct' | 'group'>('direct');
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = profile?.role === 'admin';
  const isGuide = profile?.role === 'guide';
  const canInitiateChat = isAdmin || isGuide;

  useEffect(() => {
    if (user) {
      fetchConversations();
      if (canInitiateChat) {
        fetchTourists();
        fetchGroups();
      }
    }
  }, [user, canInitiateChat]);

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
        (payload: any) => {
          const newMsg = payload.new as Message;
          
          // If message is not from current user
          if (newMsg.sender_id !== user.id) {
            // Show notification
            toast({
              title: "Mesaj nou",
              description: "Ai primit un mesaj nou",
              duration: 3000,
            });

            // Update conversations list
            fetchConversations();

            // If message is in current conversation, update messages
            if (selectedConversation && newMsg.conversation_id === selectedConversation.id) {
              fetchMessages(selectedConversation.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
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
      setConversations(conversationsData || []);
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
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      fetchConversations(); // Refresh to update unread counts
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const fetchTourists = async () => {
    if (!canInitiateChat) return;
    
    try {
      // If guide, only fetch tourists from assigned groups
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
        // Admin can see all tourists
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
      // If guide, only fetch groups from assigned trips
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
        // Admin can see all groups
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

      // Add participants
      const participants = [
        { conversation_id: conversation.id, user_id: user.id }
      ];

      if (newChatType === 'direct') {
        participants.push({ conversation_id: conversation.id, user_id: selectedRecipient });
      } else {
        // For group conversations, add all group members
        const { data: groupMembers } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', selectedRecipient);

        groupMembers?.forEach(member => {
          if (member.user_id !== user.id) {
            participants.push({ conversation_id: conversation.id, user_id: member.user_id });
          }
        });
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage("");
      fetchMessages(selectedConversation.id);
      fetchConversations();
      setIsMobileMenuOpen(false); // Close mobile menu after sending
    } catch (error) {
      console.error('Error sending message:', error);
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
    // This would need to be calculated from the database
    // For now returning 0, but should be implemented with proper query
    return 0;
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

  const ConversationsList = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Mesaje</h2>
          {canInitiateChat && (
            <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Conversație nouă</span>
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
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Nicio conversație</h3>
            <p className="text-sm text-muted-foreground">
              {canInitiateChat 
                ? "Începe o conversație nouă folosind butonul de mai sus" 
                : "Nu ai nicio conversație momentan"}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map(conversation => {
              const unreadCount = getUnreadCount(conversation.id);
              const isSelected = selectedConversation?.id === conversation.id;
              
              return (
                <button
                  key={conversation.id}
                  className={cn(
                    "w-full p-4 text-left transition-colors hover:bg-muted/50",
                    isSelected && "bg-primary/10 hover:bg-primary/15"
                  )}
                  onClick={() => {
                    setSelectedConversation(conversation);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10">
                        {conversation.conversation_type === 'group' ? (
                          <Users className="w-6 h-6 text-primary" />
                        ) : (
                          <User className="w-6 h-6 text-primary" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold truncate">
                          {getConversationTitle(conversation)}
                        </p>
                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-auto flex-shrink-0">
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {conversation.conversation_type === 'group' ? (
                            <>
                              <Users className="w-3 h-3 mr-1" />
                              Grup
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3 mr-1" />
                              Direct
                            </>
                          )}
                        </Badge>
                        {conversation.last_message && (
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.last_message.content}
                          </p>
                        )}
                      </div>
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
          <div className="text-center p-8">
            <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Selectează o conversație</h3>
            <p className="text-muted-foreground">
              Alege o conversație din listă pentru a începe să comunici
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col bg-background">
        {/* Chat Header */}
        <div className="p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSelectedConversation(null)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary/10">
                {selectedConversation.conversation_type === 'group' ? (
                  <Users className="w-5 h-5 text-primary" />
                ) : (
                  <User className="w-5 h-5 text-primary" />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">
                {getConversationTitle(selectedConversation)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedConversation.conversation_type === 'group' ? 'Chat de grup' : 'Mesaj direct'}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Niciun mesaj încă</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Fii primul care trimite un mesaj!
                </p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => {
                  const isOwn = message.sender_id === user?.id;
                  const showSender = !isOwn && (
                    index === 0 || 
                    messages[index - 1].sender_id !== message.sender_id
                  );

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-2 items-end",
                        isOwn ? "justify-end" : "justify-start"
                      )}
                    >
                      {!isOwn && (
                        <Avatar className="w-8 h-8 mb-1">
                          <AvatarFallback className="text-xs bg-primary/10">
                            {message.sender?.nume?.[0]}{message.sender?.prenume?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
                        {showSender && (
                          <p className="text-xs font-medium text-muted-foreground px-3">
                            {message.sender?.nume} {message.sender?.prenume}
                          </p>
                        )}
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2 max-w-[75%] sm:max-w-md break-words",
                            isOwn
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted rounded-bl-sm"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className={cn(
                            "text-xs mt-1",
                            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {new Date(message.created_at).toLocaleTimeString('ro-RO', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      {isOwn && (
                        <Avatar className="w-8 h-8 mb-1">
                          <AvatarFallback className="text-xs bg-primary">
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

        {/* Message Input */}
        <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Input
              placeholder="Scrie un mesaj..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim()}
              size="icon"
              className="flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-[calc(100vh-12rem)] border rounded-lg overflow-hidden shadow-lg bg-background">
        <div className="w-[380px] border-r flex-shrink-0">
          <ConversationsList />
        </div>
        <MessagesView />
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {selectedConversation ? (
          <div className="h-[calc(100vh-10rem)] border rounded-lg overflow-hidden shadow-lg bg-background">
            <MessagesView />
          </div>
        ) : (
          <div className="h-[calc(100vh-10rem)] border rounded-lg overflow-hidden shadow-lg bg-background">
            <ConversationsList />
          </div>
        )}
      </div>
    </>
  );
};