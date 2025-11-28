import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MessageSquare, Users, User, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  conversation_type: 'direct' | 'group' | 'broadcast';
  title?: string;
  group_id?: string;
  created_at: string;
  updated_at: string;
  conversation_participants?: any[];
  last_message?: any;
  unread_count?: number;
}

interface ConversationListProps {
  selectedConversationId: string | null;
  onSelectConversation: (conversation: Conversation) => void;
  currentUserId: string;
  canInitiateChat: boolean;
  isAdmin: boolean;
  isGuide: boolean;
  onNewMessageInCurrentConversation?: () => void;
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

export const ConversationList = ({
  selectedConversationId,
  onSelectConversation,
  currentUserId,
  canInitiateChat,
  isAdmin,
  isGuide,
  onNewMessageInCurrentConversation,
}: ConversationListProps) => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatType, setNewChatType] = useState<'direct' | 'group'>('direct');
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [tourists, setTourists] = useState<Tourist[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    if (currentUserId) {
      fetchConversations();
      if (canInitiateChat) {
        fetchTourists();
        fetchGroups();
      }
    }
  }, [currentUserId, canInitiateChat]);

  // Real-time subscription for new messages / read status
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('conversation-list-updates')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages'
        },
        (payload: any) => {
          try {
            const convId = payload.new?.conversation_id;
            if (convId && convId === selectedConversationId) {
              onNewMessageInCurrentConversation?.();
            }
          } catch (e) {
            console.error('[ConversationList] Error handling INSERT payload', e);
          }
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'chat_messages'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, selectedConversationId, onNewMessageInCurrentConversation]);


  const fetchConversations = async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    try {
      // First get conversations where user is participant
      const { data: myParticipations, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId);

      if (partError) throw partError;

      if (!myParticipations || myParticipations.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversationIds = myParticipations.map(p => p.conversation_id);

      // Get full conversation data with participants
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants(
            user_id,
            profiles(id, nume, prenume, email, role)
          )
        `)
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get last messages for each conversation
      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          // Get unread count
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', currentUserId);

          // Get last message
          const { data: lastMsg } = await supabase
            .from('chat_messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...conv,
            unread_count: count || 0,
            last_message: lastMsg
          };
        })
      );

      setConversations(conversationsWithDetails);
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

  const fetchTourists = async () => {
    try {
      if (isGuide && !isAdmin) {
        const { data: assignments } = await supabase
          .from('guide_assignments')
          .select('trip_id')
          .eq('guide_user_id', currentUserId)
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
      console.error('Error fetching tourists:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      if (isGuide && !isAdmin) {
        const { data: assignments } = await supabase
          .from('guide_assignments')
          .select('trip_id')
          .eq('guide_user_id', currentUserId)
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
      console.error('Error fetching groups:', error);
    }
  };

  const createConversation = async () => {
    if (!selectedRecipient || !currentUserId) return;

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
        { conversation_id: conversation.id, user_id: currentUserId }
      ];

      if (newChatType === 'direct') {
        participants.push({ conversation_id: conversation.id, user_id: selectedRecipient });
      } else {
        const { data: groupMembers } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', selectedRecipient);

        groupMembers?.forEach(member => {
          if (member.user_id !== currentUserId) {
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

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title) return conversation.title;

    if (conversation.conversation_type === 'direct') {
      const otherParticipant = conversation.conversation_participants?.find((p: any) => p.user_id !== currentUserId);
      if (otherParticipant?.profiles) {
        return `${otherParticipant.profiles.nume} ${otherParticipant.profiles.prenume}`;
      }
      return 'Conversație privată';
    }

    return 'Conversație privată';
  };

  const getConversationSubtitle = (conversation: Conversation) => {
    if (conversation.conversation_type === 'group') {
      const participants = conversation.conversation_participants || [];
      const participantCount = participants.length;
      
      // Count tourists and guide
      const tourists = participants.filter((p: any) => p.profiles?.role === 'tourist').length;
      const guides = participants.filter((p: any) => p.profiles?.role === 'guide').length;
      
      if (tourists > 0 && guides > 0) {
        return `${tourists} turist${tourists !== 1 ? 'i' : ''} + ${guides} ghid${guides !== 1 ? 'i' : ''}`;
      } else {
        return `${participantCount} participant${participantCount !== 1 ? 'i' : ''}`;
      }
    }

    if (conversation.conversation_type === 'direct') {
      const otherParticipant = conversation.conversation_participants?.find((p: any) => p.user_id !== currentUserId);
      if (otherParticipant?.profiles) {
        const otherRole = otherParticipant.profiles.role;
        
        // For admin/guide viewing
        if (isAdmin || isGuide) {
          if (otherRole === 'admin') {
            return 'Chat cu Administrator';
          } else if (otherRole === 'guide') {
            return 'Chat cu Ghid';
          } else if (otherRole === 'tourist') {
            return 'Chat cu Turist';
          }
        } else {
          // For tourist viewing
          if (otherRole === 'admin') {
            return 'Conversație cu Administratorul';
          } else if (otherRole === 'guide') {
            return 'Conversație cu Ghidul';
          }
        }
      }
    }

    return '';
  };

  const filteredConversations = conversations.filter(conv => {
    const title = getConversationTitle(conv).toLowerCase();
    const subtitle = getConversationSubtitle(conv).toLowerCase();
    const search = searchTerm.toLowerCase();
    return title.includes(search) || subtitle.includes(search);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Se încarcă conversațiile...</p>
        </div>
      </div>
    );
  }

  return (
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
              const unreadCount = conversation.unread_count || 0;
              const isSelected = selectedConversationId === conversation.id;
              const lastMessageTime = conversation.last_message?.created_at
                ? new Date(conversation.last_message.created_at).toLocaleTimeString('ro-RO', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : null;

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
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
                          {getConversationSubtitle(conversation) && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {getConversationSubtitle(conversation)}
                            </p>
                          )}
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
};
