'use client'

/**
 * components/ai/RAGDocumentManager.tsx
 * Client component — RAG document management UI.
 * Calls Server Actions for all data operations.
 */

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Plus,
  Trash2,
  RefreshCw,
  Upload,
  BookOpen,
  X,
  Loader2,
  FileUp,
  PenLine,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

import {
  listDocuments,
  uploadDocument,
  deleteDocument,
  toggleDocument,
  reindexDocument,
} from '@/actions/rag'

import type { Tables } from '@/types/supabase'

type RagDocument = Tables<'rag_documents'>

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface RAGDocumentManagerProps {
  /** Pre-fetched documents from the server component (SSR) */
  initialDocuments: RagDocument[]
}

// ─────────────────────────────────────────────
// Source-type badge helper
// ─────────────────────────────────────────────

function SourceTypeBadge({ type }: { type: RagDocument['source_type'] }) {
  const config = {
    manual: { label: 'Manual', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    upload: { label: 'File Upload', className: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
    auto_generated: { label: 'Auto', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  } as const

  const { label, className } = config[type ?? 'manual']
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${className}`}
    >
      {label}
    </span>
  )
}

// ─────────────────────────────────────────────
// Add-Document Dialog
// ─────────────────────────────────────────────

interface AddDocumentDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: (doc: RagDocument) => void
}

function AddDocumentDialog({ open, onClose, onSuccess }: AddDocumentDialogProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [sourceType, setSourceType] = useState<'manual' | 'upload'>('manual')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setTitle('')
    setContent('')
    setFileName(null)
    setSourceType('manual')
  }

  const handleClose = () => {
    if (isSubmitting) return
    resetForm()
    onClose()
  }

  // Read .txt or .pdf as plain text client-side via FileReader
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['text/plain', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only .txt and .pdf files are supported')
      return
    }

    setFileName(file.name)
    setSourceType('upload')

    // Pre-fill title from filename (strip extension)
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''))
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result
      if (typeof text === 'string') {
        setContent(text)
      }
    }
    reader.onerror = () => {
      toast.error('Failed to read file')
    }
    // For PDFs we read as text — for proper PDF parsing the user should
    // copy-paste content, but FileReader will extract raw text from simple PDFs
    reader.readAsText(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required')
      return
    }
    setIsSubmitting(true)
    try {
      const result = await uploadDocument(title.trim(), content.trim(), sourceType)
      if (result.error || !result.data) {
        toast.error(result.error ?? 'Failed to upload document')
      } else {
        toast.success(`"${result.data.title}" added and indexed!`)
        onSuccess(result.data)
        resetForm()
        onClose()
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-2xl bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <div className="bg-primary/10 p-2 rounded-lg">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            Add Knowledge Document
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Source-type tabs */}
          <div className="flex rounded-xl border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => { setSourceType('manual'); setFileName(null) }}
              className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors
                ${sourceType === 'manual'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted/40'}`}
            >
              <PenLine className="h-4 w-4" />
              Write Manually
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors
                ${sourceType === 'upload'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted/40'}`}
            >
              <FileUp className="h-4 w-4" />
              Upload File
            </button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* File indicator */}
          {fileName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
              <FileText className="h-4 w-4 text-violet-400 shrink-0" />
              <span className="truncate">{fileName}</span>
              <button
                type="button"
                onClick={() => { setFileName(null); setSourceType('manual'); setContent('') }}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="rag-doc-title">Document Title</Label>
            <Input
              id="rag-doc-title"
              placeholder="e.g. Clinic Timings, Post-Op Instructions, FAQ"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <Label htmlFor="rag-doc-content">Content</Label>
            <Textarea
              id="rag-doc-content"
              placeholder="Paste or type the document content here. The AI will use this to answer patient questions."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
              rows={10}
              className="resize-y min-h-[180px] font-mono text-sm"
              required
            />
            <p className="text-xs text-muted-foreground">
              ~{Math.ceil(content.length / 4)} tokens · will be split into{' '}
              {Math.max(1, Math.ceil(content.length / 2000))} chunk
              {content.length > 2000 ? 's' : ''}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title || !content}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Indexing…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Add &amp; Index
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export function RAGDocumentManager({ initialDocuments }: RAGDocumentManagerProps) {
  const [documents, setDocuments] = useState<RagDocument[]>(initialDocuments)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  // Track per-document loading states
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({})

  const setLoading = (id: string, val: boolean) =>
    setLoadingIds((prev) => ({ ...prev, [id]: val }))

  // ── Toggle active/inactive ──
  const handleToggle = async (doc: RagDocument) => {
    const next = !doc.is_active
    // Optimistic update
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, is_active: next } : d))
    )
    setLoading(doc.id, true)
    const result = await toggleDocument(doc.id, next)
    setLoading(doc.id, false)

    if (result.error) {
      toast.error(result.error)
      // Revert
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, is_active: doc.is_active } : d))
      )
    } else {
      toast.success(next ? 'Document activated' : 'Document deactivated')
    }
  }

  // ── Delete ──
  const handleDelete = async (doc: RagDocument) => {
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return
    setLoading(doc.id, true)
    const result = await deleteDocument(doc.id)
    setLoading(doc.id, false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`"${doc.title}" deleted`)
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
    }
  }

  // ── Re-index ──
  const handleReindex = async (doc: RagDocument) => {
    setLoading(doc.id, true)
    const result = await reindexDocument(doc.id)
    setLoading(doc.id, false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`"${doc.title}" re-indexed successfully`)
      if (result.data) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? result.data! : d))
        )
      }
    }
  }

  // ── On new document added ──
  const handleDocumentAdded = (doc: RagDocument) => {
    setDocuments((prev) => [doc, ...prev])
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/10">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Knowledge Base Documents
            </h3>
            <p className="text-sm text-muted-foreground">
              Upload documents to train your AI assistant with clinic-specific knowledge
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </div>

      {/* Body */}
      {documents.length === 0 ? (
        // ── Empty state ──
        <div className="p-16 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/30 mb-6">
            <FileText className="h-10 w-10 text-muted-foreground opacity-40" />
          </div>
          <h4 className="text-xl font-semibold mb-2">No documents yet</h4>
          <p className="text-muted-foreground max-w-sm mx-auto mb-8">
            Add clinic documents — FAQs, post-op instructions, pricing guides — and
            your AI will use them to answer patient questions accurately.
          </p>
          <Button onClick={() => setIsDialogOpen(true)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Document
          </Button>
        </div>
      ) : (
        // ── Document list ──
        <div className="divide-y divide-border">
          <AnimatePresence initial={false}>
            {documents.map((doc) => {
              const isLoading = loadingIds[doc.id] === true
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-6 py-4 hover:bg-muted/10 transition-colors"
                >
                  {/* Icon */}
                  <div className="bg-primary/5 p-2.5 rounded-lg shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>

                  {/* Meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground truncate">
                        {doc.title}
                      </span>
                      <SourceTypeBadge type={doc.source_type} />
                      {!doc.is_active && (
                        <Badge variant="outline" className="text-muted-foreground border-muted-foreground/20 text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(doc.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      · ~{Math.ceil(doc.content.length / 4)} tokens ·{' '}
                      ~{Math.max(1, Math.ceil(doc.content.length / 2000))} chunk
                      {doc.content.length > 2000 ? 's' : ''}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Active toggle */}
                    <Switch
                      id={`toggle-${doc.id}`}
                      checked={doc.is_active}
                      onCheckedChange={() => handleToggle(doc)}
                      disabled={isLoading}
                      aria-label={doc.is_active ? 'Deactivate document' : 'Activate document'}
                    />

                    {/* Re-index */}
                    <button
                      type="button"
                      onClick={() => handleReindex(doc)}
                      disabled={isLoading}
                      title="Re-index document"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors disabled:opacity-40"
                      aria-label="Re-index document"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(doc)}
                      disabled={isLoading}
                      title="Delete document"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                      aria-label="Delete document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add document dialog */}
      <AddDocumentDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={handleDocumentAdded}
      />
    </div>
  )
}
