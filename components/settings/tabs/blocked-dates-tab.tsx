"use client";

import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarDays, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { addBlockedDate, removeBlockedDate } from "@/actions/settings";
// Ideally we would fetch appointments for the blocked date to warn the user, 
// but for simplicity we'll just implement the basic add/remove as requested.

export function BlockedDatesTab({ initialData }: { initialData: any[] }) {
  const [blockedDates, setBlockedDates] = useState(initialData);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error("Please select a date");
      return;
    }

    // Check if already blocked
    if (blockedDates.some(b => b.blocked_date === date)) {
      toast.error("This date is already blocked");
      return;
    }

    setIsAdding(true);
    const { data, error } = await addBlockedDate({ blocked_date: date, reason: reason || null });
    setIsAdding(false);

    if (error) {
      toast.error(error);
    } else if (data) {
      toast.success("Date blocked successfully");
      setBlockedDates([...blockedDates, data].sort((a, b) => a.blocked_date.localeCompare(b.blocked_date)));
      setDate("");
      setReason("");
    }
  };

  const handleRemove = async (id: string, dateStr: string) => {
    const confirmed = window.confirm(`Are you sure you want to unblock ${format(parseISO(dateStr), "MMM d, yyyy")}?`);
    if (!confirmed) return;

    const { error } = await removeBlockedDate(id);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Date unblocked successfully");
      setBlockedDates(blockedDates.filter(b => b.id !== id));
    }
  };

  const upcomingBlocked = blockedDates.filter(b => new Date(b.blocked_date) >= new Date(new Date().setHours(0,0,0,0)));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between pb-6 border-b border-border">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
            <CalendarDays className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Blocked Dates</h2>
            <p className="text-sm text-muted-foreground">
              Prevent new appointments from being booked on specific dates.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleAdd} className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Add Blocked Date</h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full sm:w-auto">
            <Input
              type="date"
              label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
              required
            />
          </div>
          <div className="flex-1 w-full">
            <Input
              type="text"
              label="Reason (Optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Public Holiday, Conference"
            />
          </div>
          <Button type="submit" isLoading={isAdding} className="w-full sm:w-auto shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Add Blocked Date
          </Button>
        </div>
      </form>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Upcoming Blocked Dates</h3>
          <span className="text-sm font-medium bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
            {upcomingBlocked.length} dates blocked
          </span>
        </div>

        {upcomingBlocked.length === 0 ? (
          <EmptyState 
            icon={CalendarDays}
            title="No blocked dates"
            description="You have no upcoming blocked dates."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingBlocked.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-4 bg-background border border-border rounded-xl shadow-sm">
                <div>
                  <p className="font-semibold">{format(parseISO(b.blocked_date), "MMMM d, yyyy")}</p>
                  <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                    {b.reason || "No reason provided"}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon-sm" 
                  onClick={() => handleRemove(b.id, b.blocked_date)}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
