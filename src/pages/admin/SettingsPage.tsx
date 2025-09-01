import React from "react";
import Navigation from "@/components/Navigation";
import { SettingsPanel } from "@/components/settings/SettingsPanel";

const SettingsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation userRole="admin" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SettingsPanel />
      </div>
    </div>
  );
};

export default SettingsPage;