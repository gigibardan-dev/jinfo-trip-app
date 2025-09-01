import React from "react";
import Navigation from "@/components/Navigation";
import { CommunicationCenter } from "@/components/communications/CommunicationCenter";

const CommunicationsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation userRole="admin" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CommunicationCenter />
      </div>
    </div>
  );
};

export default CommunicationsPage;