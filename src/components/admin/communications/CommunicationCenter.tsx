import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Send, 
  Users, 
  User, 
  Globe,
  Calendar,
  Search,
  Filter,
  Bell
} from "lucide-react";

interface Communication {
  id: string;
  title: string;
  message: string;
  type: "notification" | "announcement" | "emergency" | "reminder";
  target: "broadcast" | "individual" | "group";
  targetName?: string;
  sentAt?: string;
  scheduledFor?: string;
  status: "draft" | "sent" | "scheduled";
  readCount?: number;
  totalRecipients?: number;
}

export const CommunicationCenter = () => {
  const [newMessage, setNewMessage] = useState({
    title: "",
    message: "",
    type: "notification" as const,
    target: "broadcast" as const,
    scheduledFor: ""
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Mock data
  const communications: Communication[] = [
    {
      id: "1",
      title: "Actualizare itinerariu Paris",
      message: "Programul pentru mâine a fost actualizat. Vizita la Luvru începe la 14:30.",
      type: "announcement",
      target: "group",
      targetName: "Grup Paris",
      sentAt: "2024-03-15 10:30",
      status: "sent",
      readCount: 18,
      totalRecipients: 24
    },
    {
      id: "2",
      title: "Alertă vreme",
      message: "Se anunță ploi pentru după-amiaza de mâine. Luați umbrelele!",
      type: "emergency",
      target: "broadcast",
      sentAt: "2024-03-15 08:15",
      status: "sent",
      readCount: 156,
      totalRecipients: 200
    },
    {
      id: "3",
      title: "Reminder check-in",
      message: "Nu uitați să faceți check-in la hotel până la ora 15:00.",
      type: "reminder",
      target: "individual",
      targetName: "Ion Popescu",
      scheduledFor: "2024-03-16 12:00",
      status: "scheduled"
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "emergency": return "bg-destructive text-destructive-foreground";
      case "announcement": return "bg-primary text-primary-foreground";
      case "reminder": return "bg-warning text-warning-foreground";
      case "notification": return "bg-accent text-accent-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "emergency": return "Urgență";
      case "announcement": return "Anunț";
      case "reminder": return "Reminder";
      case "notification": return "Notificare";
      default: return type;
    }
  };

  const getTargetIcon = (target: string) => {
    switch (target) {
      case "broadcast": return Globe;
      case "group": return Users;
      case "individual": return User;
      default: return MessageSquare;
    }
  };

  const filteredCommunications = communications.filter(comm => {
    const matchesSearch = comm.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comm.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || comm.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleSendMessage = () => {
    console.log("Sending message:", newMessage);
    // Reset form
    setNewMessage({
      title: "",
      message: "",
      type: "notification",
      target: "broadcast",
      scheduledFor: ""
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Centru Comunicări</h1>
        <Button className="bg-primary">
          <Bell className="w-4 h-4 mr-2" />
          Notificare Urgentă
        </Button>
      </div>

      <Tabs defaultValue="send" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="send">Trimite Mesaj</TabsTrigger>
          <TabsTrigger value="history">Istoric</TabsTrigger>
          <TabsTrigger value="scheduled">Programate</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-6">
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                Mesaj Nou
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tip Mesaj</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={newMessage.type}
                    onChange={(e) => setNewMessage({...newMessage, type: e.target.value as any})}
                  >
                    <option value="notification">Notificare</option>
                    <option value="announcement">Anunț</option>
                    <option value="reminder">Reminder</option>
                    <option value="emergency">Urgență</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Destinatar</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={newMessage.target}
                    onChange={(e) => setNewMessage({...newMessage, target: e.target.value as any})}
                  >
                    <option value="broadcast">Toți turiștii</option>
                    <option value="group">Grup specific</option>
                    <option value="individual">Persoană individuală</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Titlu</label>
                <Input
                  placeholder="Introduceți titlul mesajului..."
                  value={newMessage.title}
                  onChange={(e) => setNewMessage({...newMessage, title: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Mesaj</label>
                <Textarea
                  placeholder="Scrieți mesajul aici..."
                  rows={4}
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({...newMessage, message: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Programează pentru (opțional)</label>
                <Input
                  type="datetime-local"
                  value={newMessage.scheduledFor}
                  onChange={(e) => setNewMessage({...newMessage, scheduledFor: e.target.value})}
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSendMessage} className="bg-primary">
                  <Send className="w-4 h-4 mr-2" />
                  {newMessage.scheduledFor ? "Programează" : "Trimite Acum"}
                </Button>
                <Button variant="outline">
                  Salvează ca Schiță
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle>Istoric Comunicări</CardTitle>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Caută comunicări..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select 
                  className="p-2 border rounded-md"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="all">Toate tipurile</option>
                  <option value="notification">Notificări</option>
                  <option value="announcement">Anunțuri</option>
                  <option value="reminder">Reminder-uri</option>
                  <option value="emergency">Urgențe</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCommunications.map((comm) => {
                  const TargetIcon = getTargetIcon(comm.target);
                  return (
                    <div key={comm.id} className="border rounded-lg p-4 hover:shadow-soft transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{comm.title}</h3>
                          <Badge className={getTypeColor(comm.type)}>
                            {getTypeText(comm.type)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <TargetIcon className="w-4 h-4" />
                          {comm.targetName || (comm.target === "broadcast" ? "Toți" : comm.target)}
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground mb-3">{comm.message}</p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          {comm.sentAt && (
                            <span className="text-muted-foreground">
                              Trimis: {comm.sentAt}
                            </span>
                          )}
                          {comm.scheduledFor && (
                            <span className="text-warning">
                              Programat: {comm.scheduledFor}
                            </span>
                          )}
                        </div>
                        
                        {comm.readCount !== undefined && comm.totalRecipients && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">
                              Citit: {comm.readCount}/{comm.totalRecipients}
                            </span>
                            <div className="w-16 h-2 bg-muted rounded-full">
                              <div 
                                className="h-full bg-success rounded-full"
                                style={{ width: `${(comm.readCount / comm.totalRecipients) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Mesaje Programate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {communications.filter(c => c.status === "scheduled").map((comm) => (
                  <div key={comm.id} className="border rounded-lg p-4 bg-accent/5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{comm.title}</h3>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Editează</Button>
                        <Button size="sm" variant="outline" className="text-destructive">
                          Anulează
                        </Button>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-2">{comm.message}</p>
                    <div className="text-sm text-accent font-medium">
                      Se va trimite: {comm.scheduledFor}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};