import React from "react";
import Navigation from "@/components/Navigation";
import TouristManager from "@/components/admin/TouristManager";
import GroupManager from "@/components/admin/GroupManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UsersRound } from "lucide-react";

const TouristsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation userRole="admin" />
      <div className="pt-14 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="tourists" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
              <TabsTrigger value="tourists" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Turiști
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex items-center gap-2">
                <UsersRound className="w-4 h-4" />
                Grupuri
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tourists">
              <TouristManager />
            </TabsContent>

            <TabsContent value="groups">
              <GroupManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default TouristsPage;