import React from "react";
import Navigation from "@/components/Navigation";
import TouristManager from "@/components/admin/TouristManager";

const TouristsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation userRole="admin" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TouristManager />
      </div>
    </div>
  );
};

export default TouristsPage;