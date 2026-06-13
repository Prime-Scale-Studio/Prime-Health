"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Plus, Edit2, Trash2, BookOpen, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  createKnowledgeEntry, 
  updateKnowledgeEntry, 
  deleteKnowledgeEntry 
} from "@/actions/settings";
import { KnowledgeModal } from "./knowledge-modal";

export function KnowledgeBase({ initialKnowledge }: { initialKnowledge: any[] }) {
  const [entries, setEntries] = useState(initialKnowledge || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    // Optimistic
    setEntries(entries.map(e => e.id === id ? { ...e, is_active: !currentStatus } : e));
    
    const { error } = await updateKnowledgeEntry(id, { is_active: !currentStatus });
    if (error) {
      toast.error(error);
      // Revert
      setEntries(entries.map(e => e.id === id ? { ...e, is_active: currentStatus } : e));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this knowledge entry?")) return;
    
    const { error } = await deleteKnowledgeEntry(id);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Entry deleted");
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const openEdit = (entry: any) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleSave = (savedEntry: any, isNew: boolean) => {
    if (isNew) {
      setEntries([savedEntry, ...entries]);
    } else {
      setEntries(entries.map(e => e.id === savedEntry.id ? savedEntry : e));
    }
  };

  const handleQuickAdd = (question: string, answer: string) => {
    setEditingEntry({ question, answer });
    setIsModalOpen(true);
  };

  const suggestedQuestions = [
    { q: "What are your clinic timings?", a: "We are open Monday to Saturday from 9:00 AM to 6:00 PM." },
    { q: "What should I bring for my first visit?", a: "Please bring your ID, previous medical records, and any current prescriptions." },
    { q: "Do you accept insurance?", a: "Yes, we accept most major insurance plans. Please contact our reception for specifics." },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/10">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Knowledge Base</h3>
            <p className="text-sm text-muted-foreground">Train your AI by adding common questions patients ask.</p>
          </div>
        </div>
        <Button onClick={() => { setEditingEntry(null); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="p-12 text-center border-t border-border bg-card">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
          <h4 className="text-lg font-medium">Your knowledge base is empty</h4>
          <p className="text-muted-foreground mt-1 mb-8 max-w-md mx-auto">
            Train your AI assistant so it can answer patient questions automatically. Try adding one of these common questions:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {suggestedQuestions.map((sq, idx) => (
              <div 
                key={idx} 
                onClick={() => handleQuickAdd(sq.q, sq.a)}
                className="bg-muted/30 border border-border/60 hover:border-primary/40 hover:bg-primary/5 p-4 rounded-xl cursor-pointer transition-all text-left group"
              >
                <p className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">{sq.q}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{sq.a}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 border-y border-border text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Question</th>
                <th className="px-6 py-3 font-medium hidden md:table-cell">Answer</th>
                <th className="px-6 py-3 font-medium">Languages</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 font-medium max-w-[200px] truncate" title={entry.question}>
                    {entry.question}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground max-w-[300px] truncate hidden md:table-cell" title={entry.answer}>
                    {entry.answer}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5">
                      <Badge variant="outline" className="text-[10px] uppercase font-semibold text-primary border-primary/20 bg-primary/5">EN</Badge>
                      {entry.question_hi && entry.answer_hi && (
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold text-emerald-600 border-emerald-600/20 bg-emerald-600/5">HI</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Switch 
                      checked={entry.is_active} 
                      onCheckedChange={() => handleToggleActive(entry.id, entry.is_active)}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(entry)}>
                        <Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(entry.id)}>
                        <Trash2 className="h-4 w-4 text-destructive hover:bg-destructive/10" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <KnowledgeModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          entry={editingEntry}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
