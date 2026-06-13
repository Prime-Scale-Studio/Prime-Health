"use client";

import React, { useState, useEffect } from "react";
import { X, Globe2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createKnowledgeEntry, updateKnowledgeEntry } from "@/actions/settings";
import { toast } from "sonner";

interface KnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry?: any; // If null, it's a new entry
  onSave: (entry: any, isNew: boolean) => void;
}

export function KnowledgeModal({ isOpen, onClose, entry, onSave }: KnowledgeModalProps) {
  const [loading, setLoading] = useState(false);
  const [showHindi, setShowHindi] = useState(!!(entry?.question_hi || entry?.answer_hi));
  
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    question_hi: "",
    answer_hi: ""
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        question: entry.question || "",
        answer: entry.answer || "",
        question_hi: entry.question_hi || "",
        answer_hi: entry.answer_hi || ""
      });
      if (entry.question_hi || entry.answer_hi) {
        setShowHindi(true);
      }
    }
  }, [entry]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question || !formData.answer) {
      toast.error("English question and answer are required");
      return;
    }

    setLoading(true);
    const payload = {
      ...formData,
      question_hi: formData.question_hi || null,
      answer_hi: formData.answer_hi || null
    };

    try {
      if (entry?.id) {
        const { data, error } = await updateKnowledgeEntry(entry.id, payload);
        if (error) throw new Error(error);
        toast.success("Knowledge entry updated");
        onSave(data, false);
      } else {
        const { data, error } = await createKnowledgeEntry(payload);
        if (error) throw new Error(error);
        toast.success("Knowledge entry created");
        onSave(data, true);
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border shadow-lg rounded-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{entry?.id ? "Edit Knowledge" : "Add Knowledge"}</h2>
              <p className="text-sm text-muted-foreground">Train the AI on how to respond to this query.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={loading} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-base">English</span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">Required</span>
              </Label>
              <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/50">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground">Question pattern</Label>
                  <Input 
                    placeholder="e.g. What are your clinic timings?"
                    value={formData.question}
                    onChange={e => setFormData({...formData, question: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground">AI Answer</Label>
                  <textarea 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    placeholder="e.g. We are open Monday to Saturday from 9:00 AM to 6:00 PM."
                    value={formData.answer}
                    onChange={e => setFormData({...formData, answer: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            {!showHindi ? (
              <Button 
                type="button" 
                variant="outline" 
                className="w-full border-dashed"
                onClick={() => setShowHindi(true)}
              >
                <Globe2 className="h-4 w-4 mr-2 text-muted-foreground" />
                Add Hindi Translation (Optional)
              </Button>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-base">Hindi (हिंदी)</span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">Optional</span>
                </Label>
                <div className="space-y-3 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20">
                  <div className="space-y-1.5">
                    <Label className="text-emerald-700 dark:text-emerald-400">Question pattern (Hindi)</Label>
                    <Input 
                      placeholder="e.g. क्लिनिक का समय क्या है?"
                      value={formData.question_hi}
                      onChange={e => setFormData({...formData, question_hi: e.target.value})}
                      className="border-emerald-500/30 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-emerald-700 dark:text-emerald-400">AI Answer (Hindi)</Label>
                    <textarea 
                      className="flex min-h-[80px] w-full rounded-md border border-emerald-500/30 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 resize-none"
                      placeholder="e.g. हम सोमवार से शनिवार सुबह 9:00 बजे से शाम 6:00 बजे तक खुले रहते हैं।"
                      value={formData.answer_hi}
                      onChange={e => setFormData({...formData, answer_hi: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {entry?.id ? "Save Changes" : "Add to Knowledge Base"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
