import React from "react";
import Navigation from "@/components/Navigation";
import { MessagingSystem } from "@/components/messaging/MessagingSystem";
import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CommunicationsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation userRole="admin" />
      <div className="pt-14 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 sm:py-8 border-b border-border/50">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-orange-600 via-primary to-red-600 bg-clip-text text-transparent">
                    Comunicări
                  </span>
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Gestionează toate conversațiile și trimite mesaje către turiști și ghizi
                </p>
              </div>
              <Badge variant="secondary" className="text-xs sm:text-sm">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Admin
              </Badge>
            </div>
          </div>
          
          <div className="py-4 sm:py-6">
            <MessagingSystem />
          </div>
        </div>
      </div>
    </div>
  );
};


export default CommunicationsPage;