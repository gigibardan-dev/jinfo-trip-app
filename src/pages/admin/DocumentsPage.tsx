import React from "react";
import Navigation from "@/components/Navigation";
import DocumentUploader from "@/components/admin/DocumentUploader";

const DocumentsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation userRole="admin" />
      <div className="pt-14 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DocumentUploader />
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;