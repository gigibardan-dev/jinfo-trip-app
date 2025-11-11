import React from "react";
import Navigation from "@/components/Navigation";
import { MessagingSystem } from "@/components/messaging/MessagingSystem";

const MessagesPage = () => {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation userRole="tourist" />
      <div className="pt-14 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Mesaje</h1>
            <p className="text-muted-foreground mt-2">
              Comunică cu administratorii și participă la conversațiile de grup
            </p>
          </div>
          <MessagingSystem />
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;