import React from "react";
import Navigation from "@/components/Navigation";
import { MessagingSystem } from "@/components/messaging/MessagingSystem";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const GuideMessagesPage = () => {
  const { user, profile } = useAuth();

  if (!user || profile?.role !== "guide") {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Navigation userRole="guide" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Această pagină este disponibilă doar pentru ghizi autentificați.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation userRole="guide" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Mesaje</h1>
          <p className="text-muted-foreground mt-2">
            Comunică cu turiștii din grupurile tale
          </p>
        </div>
        <MessagingSystem />
      </div>
    </div>
  );
};

export default GuideMessagesPage;
