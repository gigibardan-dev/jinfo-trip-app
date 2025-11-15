import React from "react";
import Navigation from "@/components/Navigation";
import DocumentUploader from "@/components/admin/DocumentUploader";
import OfflineCacheManager from "@/components/admin/OfflineCacheManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, HardDrive } from "lucide-react";

const DocumentsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation userRole="admin" />
      <div className="pt-14 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="documents" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="documents" className="gap-2">
                <FileText className="w-4 h-4" />
                Gestionare Documente
              </TabsTrigger>
              <TabsTrigger value="cache" className="gap-2">
                <HardDrive className="w-4 h-4" />
                Cache Offline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documents">
              <DocumentUploader />
            </TabsContent>

            <TabsContent value="cache">
              <OfflineCacheManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;