"use client";

import React, { useState, useEffect } from "react";
import { Check, Copy, Code2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EmbedCodeProps {
  clinicSlug: string;
  clinicId: string;
}

const IFRAME_STYLE = "position:fixed;bottom:0;right:0;width:420px;height:680px;border:none;z-index:9999;background:transparent;";

function CodeBlock({ label, badge, description, code }: { label: string; badge?: string; description: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground">{label}</span>
            {badge && (
              <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-500/20">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all px-4 py-2 rounded-xl border border-border hover:bg-muted"
        >
          {copied ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
        </button>
      </div>
      <div className="relative group">
        <pre className="bg-[#0D1117] text-[#7EE787] text-[13px] font-mono leading-relaxed rounded-2xl p-6 overflow-x-auto border border-white/5 shadow-2xl">
          {code}
        </pre>
      </div>
    </div>
  );
}

export function EmbedCode({ clinicSlug, clinicId }: EmbedCodeProps) {
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  // Using the slug is more "stable and professional" as per reference code
  const widgetUrl = `${baseUrl}/widget/${clinicSlug || clinicId}`;

  const iframeCode = `<!-- MedBook AI Widget -->
<iframe
  src="${widgetUrl}"
  style="${IFRAME_STYLE}"
  allow="clipboard-write"
></iframe>`;

  const jsCode = `<!-- MedBook AI Widget -->
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${widgetUrl}';
    iframe.style.cssText = '${IFRAME_STYLE}';
    iframe.allow = 'clipboard-write';
    document.body.appendChild(iframe);
  })();
</script>`;

  return (
    <Card className="border-2 border-primary/5 shadow-xl overflow-hidden">
      <div className="bg-primary/5 px-6 py-4 border-b border-primary/10 flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Code2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-base text-foreground">Embed on Your Website</h3>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
            Paste one snippet just before the closing <code className="text-primary font-bold">&lt;/body&gt;</code> tag
          </p>
        </div>
      </div>
      <CardContent className="p-8 space-y-10">
        <CodeBlock
          label="Option 1 — iframe"
          badge="Recommended"
          description="Simple drop-in. Works on any website or CMS."
          code={iframeCode}
        />

        <div className="h-px bg-border/50" />

        <CodeBlock
          label="Option 2 — JavaScript snippet"
          description="Great for Google Tag Manager or dynamic sites."
          code={jsCode}
        />
      </CardContent>
    </Card>
  );
}
