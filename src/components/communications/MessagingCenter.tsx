import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageSquare, Users, Broadcast, Plus, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  recipient_id?: string;
  group_id?: string;
  message_type: 'individual' | 'group' | 'broadcast';
  content: string;
  is_read: boolean;
  created_at: string;
  sender: {
    nume: string;
    prenume: string;
    role: string;
  };
  recipient?: {
    nume: string;
    prenume: string;
  };
  group?: {
    nume_grup: string;
  };
}

interface Tourist {
  id: string;
  nume: string;
  prenume: string;
  email: string;
}

interface Group {
  id: string;
  nume_grup: string;
}

const MessagingCenter = () => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [tourists, setTourists] = useState<Tourist[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [messageType, setMessageType] = useState<'individual' | 'group' | 'broadcast'>('individual');
  const [messageContent, setMessageContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchTourists();
      fetchGroups();
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(nume, prenume, role),
          recipient:profiles!recipient_id(nume, prenume),
          group:tourist_groups!group_id(nume_grup)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTourists = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nume, prenume, email')
        .eq('role', 'tourist')
        .eq('is_active', true);

      if (error) throw error;
      setTourists(data || []);
    } catch (error) {
      console.error('Error fetching tourists:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('tourist_groups')
        .select('id, nume_grup')
        .eq('is_active', true);

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageContent.trim()) {
      toast({
        title: "Error",
        description: "Message content cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (messageType === 'individual' && !selectedRecipient) {
      toast({
        title: "Error",
        description: "Please select a recipient",
        variant: "destructive",
      });
      return;
    }

    if (messageType === 'group' && !selectedGroup) {
      toast({
        title: "Error",
        description: "Please select a group",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const messageData = {
        sender_id: user?.id,
        content: messageContent,
        message_type: messageType,
        recipient_id: messageType === 'individual' ? selectedRecipient : null,
        group_id: messageType === 'group' ? selectedGroup : null,
      };

      const { error } = await supabase.from('messages').insert([messageData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message sent successfully",
      });

      setMessageContent("");
      setSelectedRecipient("");
      setSelectedGroup("");
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'individual': return <MessageSquare className="w-4 h-4" />;
      case 'group': return <Users className="w-4 h-4" />;
      case 'broadcast': return <Broadcast className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'individual': return "bg-primary text-primary-foreground";
      case 'group': return "bg-accent text-accent-foreground";
      case 'broadcast': return "bg-secondary text-secondary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = searchTerm === "" || 
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender.nume.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender.prenume.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === "all" || message.message_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading messages...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Communication Center</h1>
          <p className="text-muted-foreground">Manage communications with tourists and groups</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send New Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Message Type</label>
                <Select value={messageType} onValueChange={(value: 'individual' | 'group' | 'broadcast') => setMessageType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual Message</SelectItem>
                    <SelectItem value="group">Group Message</SelectItem>
                    <SelectItem value="broadcast">Broadcast Message</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {messageType === 'individual' && (
                <div>
                  <label className="text-sm font-medium">Recipient</label>
                  <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tourist" />
                    </SelectTrigger>
                    <SelectContent>
                      {tourists.map((tourist) => (
                        <SelectItem key={tourist.id} value={tourist.id}>
                          {tourist.nume} {tourist.prenume}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {messageType === 'group' && (
                <div>
                  <label className="text-sm font-medium">Group</label>
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.nume_grup}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Type your message..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={4}
                />
              </div>

              <Button onClick={sendMessage} disabled={sending} className="w-full">
                <Send className="w-4 h-4 mr-2" />
                {sending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Messages</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                  <SelectItem value="broadcast">Broadcast</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No messages found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterType !== "all" 
                  ? "Try adjusting your search or filter criteria" 
                  : "Start by sending your first message"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredMessages.map((message) => (
            <Card key={message.id} className="hover:shadow-soft transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getMessageTypeColor(message.message_type)}>
                        {getMessageTypeIcon(message.message_type)}
                        <span className="ml-1 capitalize">{message.message_type}</span>
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        From: {message.sender.nume} {message.sender.prenume}
                      </span>
                      {message.recipient && (
                        <span className="text-sm text-muted-foreground">
                          To: {message.recipient.nume} {message.recipient.prenume}
                        </span>
                      )}
                      {message.group && (
                        <span className="text-sm text-muted-foreground">
                          Group: {message.group.nume_grup}
                        </span>
                      )}
                    </div>
                    <p className="text-foreground mb-3">{message.content}</p>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(message.created_at), 'PPp')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MessagingCenter;