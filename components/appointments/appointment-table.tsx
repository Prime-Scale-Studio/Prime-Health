"use client";

import React, { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  CalendarDays,
  FileEdit,
  User,
  MoreVertical,
  Activity,
  CalendarPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import type { AppointmentWithRelations } from "@/actions/appointments";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Status = AppointmentWithRelations["status"];

interface AppointmentTableProps {
  data: AppointmentWithRelations[];
  minimal?: boolean; // For dashboard view (no top bar, no pagination)
  onStatusChange?: (id: string, status: Status) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onViewDetails?: (appointment: AppointmentWithRelations) => void;
  onAddNotes?: (appointment: AppointmentWithRelations) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Config
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_VARIANTS: Record<Status, any> = {
  pending: "pending",
  confirmed: "confirmed",
  completed: "completed",
  cancelled: "cancelled",
  no_show: "no_show",
};

const STATUS_LABELS: Record<Status, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-Show",
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function AppointmentTable({
  data,
  minimal = false,
  onStatusChange,
  onDelete,
  onViewDetails,
  onAddNotes,
}: AppointmentTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter Data
  const filteredData = useMemo(() => {
    return data.filter((appt) => {
      const matchesSearch = appt.patients?.name?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || appt.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  // Bulk Selection
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length && filteredData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map((d) => d.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  // CSV Export
  const exportCsv = () => {
    if (filteredData.length === 0) return;
    const headers = ["Patient", "Service", "Date", "Time", "Status", "Notes"];
    const rows = filteredData.map((d) => [
      d.patients?.name || "Unknown",
      d.services?.name ?? "Custom",
      d.appointment_date,
      `${d.start_time} - ${d.end_time}`,
      d.status,
      `"${(d.doctor_notes ?? "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `appointments_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* ── Top Bar (Hidden in minimal mode) ───────────────────────────────── */}
      {!minimal && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Input
              placeholder="Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              className="h-10 w-full sm:w-64 bg-background"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 border-dashed gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  {statusFilter === "all" ? "All Status" : STATUS_LABELS[statusFilter]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Appointments</DropdownMenuItem>
                {(Object.keys(STATUS_LABELS) as Status[]).map((status) => (
                  <DropdownMenuItem key={status} onClick={() => setStatusFilter(status)}>
                    {STATUS_LABELS[status]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
             {selectedIds.size > 0 && (
               <Badge variant="secondary" className="hidden sm:inline-flex px-3 h-10 rounded-lg">
                 {selectedIds.size} selected
               </Badge>
             )}
             <Button variant="outline" className="h-10 gap-2" onClick={exportCsv} disabled={filteredData.length === 0}>
               <Download className="h-4 w-4" />
               <span className="hidden sm:inline">Export</span>
             </Button>
          </div>
        </div>
      )}

      {/* ── Table Container ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                {!minimal && (
                  <th className="px-4 py-4 w-12">
                    <Checkbox
                      checked={filteredData.length > 0 && selectedIds.size === filteredData.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={minimal ? 5 : 6} className="px-6 py-12">
                    <EmptyState 
                      icon={CalendarDays}
                      title="No appointments found"
                      description={search || statusFilter !== "all" 
                        ? "Try adjusting your filters or search query." 
                        : "You don't have any appointments scheduled yet."}
                    />
                  </td>
                </tr>
              ) : (
                filteredData.map((appt) => {
                  const isSelected = selectedIds.has(appt.id);
                  let formattedDate = appt.appointment_date;
                  try {
                    formattedDate = format(parseISO(appt.appointment_date), "MMM d, yyyy");
                  } catch { /* noop */ }

                  // Convert 24h to 12h nicely
                  const formatTime = (time: string) => {
                     const [h, m] = time.split(':');
                     const hr = parseInt(h, 10);
                     const ampm = hr >= 12 ? 'PM' : 'AM';
                     const hr12 = hr % 12 || 12;
                     return `${hr12}:${m} ${ampm}`;
                  };

                  return (
                    <tr 
                      key={appt.id} 
                      className={cn(
                        "hover:bg-muted/30 transition-colors group",
                        isSelected && "bg-primary/5 hover:bg-primary/5"
                      )}
                    >
                      {!minimal && (
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(appt.id)}
                          />
                        </td>
                      )}
                      
                      {/* Patient */}
                      <td className="px-6 py-3 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <Avatar name={appt.patients?.name} size="sm" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{appt.patients?.name}</span>
                            {appt.patients?.phone && (
                              <span className="text-xs text-muted-foreground">{appt.patients.phone}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Service */}
                      <td className="px-6 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{appt.services?.name ?? "Consultation"}</span>
                          {appt.services?.duration_minutes && (
                            <span className="text-xs text-muted-foreground">{appt.services.duration_minutes} min</span>
                          )}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{formattedDate}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(appt.start_time)}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3">
                        <Badge variant={STATUS_VARIANTS[appt.status]} dot>
                          {STATUS_LABELS[appt.status]}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem icon={<Eye />} onClick={() => onViewDetails?.(appt)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem icon={<FileEdit />} onClick={() => onAddNotes?.(appt)}>
                              Doctor Notes
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider pt-1">Change Status</DropdownMenuLabel>
                            <DropdownMenuItem icon={<CheckCircle2 className="text-emerald-500" />} onClick={() => onStatusChange?.(appt.id, "completed")}>
                              Mark Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem icon={<Clock className="text-amber-500" />} onClick={() => onStatusChange?.(appt.id, "pending")}>
                              Set Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem icon={<User className="text-blue-500" />} onClick={() => onStatusChange?.(appt.id, "confirmed")}>
                              Confirm
                            </DropdownMenuItem>
                            <DropdownMenuItem icon={<XCircle className="text-slate-400" />} onClick={() => onStatusChange?.(appt.id, "cancelled")}>
                              Cancel Appointment
                            </DropdownMenuItem>
                            <DropdownMenuItem icon={<Activity className="text-red-500" />} onClick={() => onStatusChange?.(appt.id, "no_show")}>
                              Mark No-Show
                            </DropdownMenuItem>
                            
                            {onDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem icon={<Trash2 />} destructive onClick={() => onDelete(appt.id)}>
                                  Delete Permanently
                                </DropdownMenuItem>
                              </>
                            )}
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