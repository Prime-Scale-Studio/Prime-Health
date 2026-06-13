import { createAdminClient } from "./lib/supabase/admin"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

async function diagnostic() {
  const supabase = createAdminClient()
  
  console.info("🔍 Fetching table info...")
  
  // Fetch one row from clinics
  const { data, error } = await supabase.from("clinics").select("*").limit(1)
  
  if (error) {
    console.error("❌ Fetch failed:", error)
  } else if (data && data.length > 0) {
    console.info("✅ Clinics columns:", Object.keys(data[0]))
  } else {
    console.info("ℹ️ Clinics table is empty.")
    // Try to get columns by inserting a dummy (without committing or just a simple check)
    // Actually, we can check the public schema info if we have permissions, but let's try another table
    const { data: sData } = await supabase.from("services").select("*").limit(1)
    if (sData && sData.length > 0) console.info("✅ Services columns:", Object.keys(sData[0]))
  }
}

diagnostic()
