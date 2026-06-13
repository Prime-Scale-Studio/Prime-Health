import { WidgetChatClient } from "@/app/widget/widget-chat-client";
import { notFound } from "next/navigation";

export default async function SlugWidgetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  let clinic = null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    // We need to fetch by slug, but our public API only supports clinicId right now.
    // Let's use the admin client directly here as a server component to fetch by slug.
    // Or, we can use the anonymous client. Let's use the anonymous client (server).
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data } = await supabase
      .from("clinics")
      .select("id, name, doctor_name, logo_url, widget_theme_color, language, timezone")
      .eq("slug", slug)
      .single();
      
    clinic = data;
  } catch (e) {
    console.error("Failed to fetch clinic info by slug", e);
  }

  if (!clinic) {
    notFound();
  }

  return (
    <div style={{ background: "transparent" }}>
      <WidgetChatClient clinic={clinic} />
    </div>
  );
}
