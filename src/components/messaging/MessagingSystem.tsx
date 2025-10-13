import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Send, MessageSquare, Users, User, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
    }
  }, [selectedConversation]);

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
      fetchConversations(); // Refresh to update last message
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

  if (loading) {
    return <div>Se încarcă...</div>;
  }

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-1/3 border-r bg-muted/20">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Mesaje</h3>
            {canInitiateChat && (
              <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Nou
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Conversație nouă</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Select value={newChatType} onValueChange={(value: 'direct' | 'group') => setNewChatType(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipul conversației" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direct">Mesaj direct</SelectItem>
                        <SelectItem value="group">Chat de grup</SelectItem>
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

                    <Button onClick={createConversation} disabled={!selectedRecipient}>
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
          {filteredConversations.map(conversation => (
            <div
              key={conversation.id}
              className={`p-3 border-b cursor-pointer hover:bg-muted/30 ${
                selectedConversation?.id === conversation.id ? 'bg-primary/10' : ''
              }`}
              onClick={() => setSelectedConversation(conversation)}
            >
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback>
                    {conversation.conversation_type === 'group' ? (
                      <Users className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{getConversationTitle(conversation)}</p>
                  <p className="text-sm text-muted-foreground">
                    {conversation.conversation_type === 'group' ? 'Chat de grup' : 'Mesaj direct'}
                  </p>
                </div>
                {conversation.conversation_type === 'group' && (
                  <Badge variant="secondary" className="ml-auto">
                    <Users className="w-3 h-3" />
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-muted/10">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback>
                    {selectedConversation.conversation_type === 'group' ? (
                      <Users className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{getConversationTitle(selectedConversation)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.conversation_type === 'group' ? 'Chat de grup' : 'Mesaj direct'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.sender_id !== user?.id && (
                        <p className="text-xs font-medium mb-1">
                          {message.sender?.nume} {message.sender?.prenume}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(message.created_at).toLocaleTimeString('ro-RO', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Scrie un mesaj..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 min-h-[40px] max-h-[120px]"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Selectează o conversație</h3>
              <p className="text-muted-foreground">
                Alege o conversație din listă pentru a începe să comunici
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};