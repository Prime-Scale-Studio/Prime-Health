"use client";

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ClinicProfileTab } from "./tabs/clinic-profile-tab";
import { AvailabilityTab } from "./tabs/availability-tab";
import { BlockedDatesTab } from "./tabs/blocked-dates-tab";
import { NotificationsTab } from "./tabs/notifications-tab";
import { Building2, Clock, CalendarX, Bell } from "lucide-react";

interface SettingsClientProps {
  initialClinic: any;
  initialAvailability: any[];
  initialBlockedDates: any[];
}

export function SettingsClient({
  initialClinic,
  initialAvailability,
  initialBlockedDates,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState("profile");
  
  // A simple mechanism to warn about unsaved changes could be added here,
  // but for simplicity and to match the prompt's request without over-engineering context,
  // we'll pass a generic warning to the user if they try to leave the page with dirty forms.
  // We can achieve this by having each tab register its dirty state if needed, 
  // or simply rely on standard browser beforeunload events handled within the tabs.

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/30 p-1 h-auto gap-1 justify-start w-max rounded-xl border border-border/50 overflow-x-auto">
          <TabsTrigger 
            value="profile"
            className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-muted-foreground font-medium transition-all"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Clinic
          </TabsTrigger>
          <TabsTrigger 
            value="availability"
            className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-muted-foreground font-medium transition-all"
          >
            <Clock className="h-4 w-4 mr-2" />
            Availability
          </TabsTrigger>
          <TabsTrigger 
            value="blocked-dates"
            className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-muted-foreground font-medium transition-all"
          >
            <CalendarX className="h-4 w-4 mr-2" />
            Blocked Dates
          </TabsTrigger>
          <TabsTrigger 
            value="notifications"
            className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-muted-foreground font-medium transition-all"
          >
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>

        </TabsList>

        <div className="mt-6">
          <Card className="shadow-sm border-border bg-card/50">
            <CardContent className="p-0">
              <TabsContent value="profile" className="m-0 focus-visible:outline-none p-6">
                <ClinicProfileTab initialData={initialClinic} />
              </TabsContent>
              
              <TabsContent value="availability" className="m-0 focus-visible:outline-none p-6">
                <AvailabilityTab initialData={initialAvailability} />
              </TabsContent>
              
              <TabsContent value="blocked-dates" className="m-0 focus-visible:outline-none p-6">
                <BlockedDatesTab initialData={initialBlockedDates} />
              </TabsContent>
              
              <TabsContent value="notifications" className="m-0 focus-visible:outline-none p-6">
                <NotificationsTab initialData={initialClinic} />
              </TabsContent>
              

            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
}
