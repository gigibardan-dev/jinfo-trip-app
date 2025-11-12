import React from "react";
import Navigation from "@/components/Navigation";
import { MessagingSystem } from "@/components/messaging/MessagingSystem";
import { MessageCircle, Users, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";


const MessagesPage = () => {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation userRole="tourist" />
      <div className="pt-14 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="py-6 sm:py-8 border-b border-border/50">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-blue-600 via-primary to-purple-600 bg-clip-text text-transparent">
                    Mesaje
                  </span>
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Comunică cu administratorii și participă la conversațiile de grup
                </p>
              </div>
              
              {/* Optional: Badge pentru unread count total */}
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Chat activ
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Messaging System */}
          <div className="py-4 sm:py-6">
            <MessagingSystem />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;