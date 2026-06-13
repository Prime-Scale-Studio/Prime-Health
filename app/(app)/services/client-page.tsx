"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, Clock, IndianRupee, GripVertical, Settings2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AddServiceModal } from "@/components/services/add-service-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { toggleServiceActive, deleteService } from "@/actions/services";
import type { Database } from "@/types/supabase";

type Service = Database["public"]["Tables"]["services"]["Row"];

export function ServicesPageClient({
  initialServices,
}: {
  initialServices: Service[];
}) {
  const router = useRouter();
  const [services, setServices] = useState(initialServices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);

  const handleSuccess = () => {
    router.refresh();
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    // Optimistic UI update
    setServices(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
    
    const res = await toggleServiceActive(id);
    if (res.error) {
      toast.error(res.error);
      // Revert on error
      setServices(initialServices);
    } else {
      toast.success(currentStatus ? "Service deactivated" : "Service activated");
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service? It cannot be undone.")) return;
    
    setServices(prev => prev.filter(s => s.id !== id));
    const res = await deleteService(id);
    if (res.error) {
      toast.error(res.error);
      setServices(initialServices);
    } else {
      toast.success("Service deleted");
      router.refresh();
    }
  };

  const openEditModal = (service: Service) => {
    setServiceToEdit(service);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setServiceToEdit(null);
    setIsModalOpen(true);
  };

  return (
    <>
      <PageHeader 
        title="Services Setup" 
        description="Manage the services you offer, their durations, and pricing."
        breadcrumbs={[{ label: "Services" }]}
      >
        <Button 
          size="lg" 
          className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30"
          onClick={openAddModal}
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Service
        </Button>
      </PageHeader>

      <div className="flex-1">
        {services.length === 0 ? (
          <EmptyState 
            icon={Settings2}
            title="No services configured"
            description="You haven't added any services yet. Create your first service to allow patients to book appointments."
            actionLabel="Create First Service"
            onAction={openAddModal}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {services.sort((a,b) => a.sort_order - b.sort_order).map((service) => (
              <div 
                key={service.id} 
                className={`relative group flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md ${
                  !service.is_active ? "border-border opacity-75 grayscale-[0.2]" : "border-border"
                }`}
              >
                {/* Drag handle (visual only for now) */}
                <div className="absolute top-4 right-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                   <GripVertical className="h-5 w-5" />
                </div>

                <div className="flex items-start justify-between gap-4 pr-6">
                  <h3 className="text-lg font-bold text-foreground leading-tight">
                    {service.name}
                  </h3>
                </div>

                <p className="text-sm text-muted-foreground mt-2 line-clamp-2 min-h-[40px]">
                  {service.description || "No description provided."}
                </p>

                <div className="flex items-center gap-4 mt-6">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground bg-muted/50 px-2.5 py-1 rounded-md">
                    <Clock className="h-4 w-4 text-primary" />
                    {service.duration_minutes} min
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground bg-muted/50 px-2.5 py-1 rounded-md">
                    <IndianRupee className="h-4 w-4 text-emerald-500" />
                    {service.price ? service.price : "Free"}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={service.is_active} 
                      onCheckedChange={() => handleToggle(service.id, service.is_active)}
                    />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {service.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(service)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddServiceModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        serviceToEdit={serviceToEdit}
        onSuccess={handleSuccess}
      />
    </>
  );
}
