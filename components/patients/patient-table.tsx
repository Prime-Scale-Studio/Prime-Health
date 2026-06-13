"use client";

import React, { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Search, MoreVertical, Eye, Trash2, UserPlus, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import type { Database } from "@/types/supabase";

type Patient = Database["public"]["Tables"]["patients"]["Row"];

interface PatientTableProps {
  data: Patient[];
  onViewDetails: (patient: Patient) => void;
  onDelete: (id: string) => Promise<void>;
  onAddPatient: () => void;
}

export function PatientTable({
  data,
  onViewDetails,
  onDelete,
  onAddPatient,
}: PatientTableProps) {
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    return data.filter((p) => {
      const term = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(term) ||
        (p.phone && p.phone.includes(term)) ||
        (p.email && p.email.toLowerCase().includes(term))
      );
    });
  }, [data, search]);

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Input
          placeholder="Search patients by name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="h-10 w-full sm:max-w-md bg-background"
        />
        <div className="text-sm text-muted-foreground font-medium hidden sm:block">
          {filteredData.length} patient{filteredData.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 rounded-2xl border border-border bg-card overflow-hidden shadow-sm flex flex-col min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-center">Total Visits</th>
                <th className="px-6 py-4">Last Visit</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16">
                    <EmptyState 
                      icon={UserPlus}
                      title="No patients found"
                      description={search 
                        ? "We couldn't find any patients matching your search." 
                        : "Your patient directory is empty. Start by adding a new patient."}
                      actionLabel={!search ? "Add First Patient" : undefined}
                      onAction={!search ? onAddPatient : undefined}
                    />
                  </td>
                </tr>
              ) : (
                filteredData.map((patient) => {
                  let lastVisit = "Never";
                  if (patient.last_appointment_at) {
                    try {
                      lastVisit = format(parseISO(patient.last_appointment_at), "MMM d, yyyy");
                    } catch { /* noop */ }
                  }

                  return (
                    <tr 
                      key={patient.id} 
                      className="hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => onViewDetails(patient)}
                    >
                      {/* Patient Name & Avatar */}
                      <td className="px-6 py-4 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <Avatar name={patient.name} size="md" />
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">{patient.name}</span>
                            {patient.gender && (
                              <span className="text-xs text-muted-foreground capitalize">{patient.gender.replace(/_/g, ' ')}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          {patient.phone ? (
                            <span className="font-medium text-foreground flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {patient.phone}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">No phone</span>
                          )}
                          {patient.email && (
                            <span className="text-xs text-muted-foreground">{patient.email}</span>
                          )}
                        </div>
                      </td>

                      {/* Total Visits */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-2 rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {patient.total_appointments || 0}
                        </span>
                      </td>

                      {/* Last Visit */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-muted-foreground">
                          {lastVisit}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()} // Prevent row click
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Patient Actions</DropdownMenuLabel>
                            <DropdownMenuItem 
                              icon={<Eye />} 
                              onClick={(e) => { e.stopPropagation(); onViewDetails(patient); }}
                            >
                              View Full Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              icon={<Trash2 />} 
                              destructive 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                if(confirm("Are you sure you want to delete this patient? All their appointments will also be deleted.")) {
                                  onDelete(patient.id);
                                }
                              }}
                            >
                              Delete Patient
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
