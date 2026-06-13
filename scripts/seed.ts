import { createAdminClient } from "../lib/supabase/admin"
import { addDays, subDays, format } from "date-fns"
import * as dotenv from "dotenv"

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" })

async function seed() {
  console.info("🚀 Starting database seed...")
  const supabase = createAdminClient()

  const email = "test@primehealth.com"
  const password = "Test@12345"

  try {
    // 1. Create or fetch auth user
    console.info(`👤 C=hecking for auth user: ${email}`)
    let userId: string

    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError

    const existingUser = users.users.find((u) => u.email === email)

    if (existingUser) {
      console.info("✅ User already exists.")
      userId = existingUser.id
    } else {
      console.info("➕ Creating new auth user...")
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (createError) throw createError
      userId = newUser.user.id
      console.info("✅ User created.")
    }

    // 2. Wait for DB trigger (clinic auto-creation)
    console.info("⏳ Waiting 3 seconds for clinic auto-creation trigger...")
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // 3. Find and update clinic profile
    console.info("🏥 Locating clinic profile...")
    
    // Find by user_id
    const { data: clinic, error: clinicFetchError } = await supabase
      .from("clinics")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    if (clinicFetchError || !clinic) {
      console.error("❌ Clinic fetch error:", clinicFetchError)
      throw new Error(`Could not find clinic for user ${userId}. Check triggers.`)
    }

    const clinicId = clinic.id
    console.info(`✅ Found clinic ID: ${clinicId}`)

    // --- IDEMPOTENCY: Clear existing data for this clinic ---
    console.info("🧹 Clearing existing data for this clinic...")
    await supabase.from("appointments").delete().eq("clinic_id", clinicId)
    await supabase.from("patients").delete().eq("clinic_id", clinicId)
    await supabase.from("services").delete().eq("clinic_id", clinicId)
    await supabase.from("ai_knowledge").delete().eq("clinic_id", clinicId)
    console.info("✅ Data cleared.")

    console.info("🏥 Updating clinic profile details...")
    const { error: updateError } = await supabase
      .from("clinics")
      .update({
        name: "Sharma Family Clinic",
        doctor_name: "Dr. Rajesh Sharma",
        specialty: "General Physician",
        phone: "+91-9876543210",
        city: "Delhi",
        slug: "sharma-family-clinic",
        email: email // Also update the email field in the clinic table
      })
      .eq("id", clinicId)

    if (updateError) {
      console.error("❌ Clinic update failed:", updateError)
      throw updateError
    }
    console.info("✅ Clinic profile updated.")

    // 4. Insert 5 services
    console.info("🛠️ Inserting services...")
    const servicesData = [
      { name: "General Consultation", duration_minutes: 30, price: 500, description: "Standard checkup" },
      { name: "Follow-up Visit", duration_minutes: 15, price: 300, description: "Review of progress" },
      { name: "Full Health Checkup", duration_minutes: 60, price: 2000, description: "Comprehensive body scan" },
      { name: "Blood Pressure Check", duration_minutes: 20, price: 100, description: "BP monitoring" },
      { name: "Diabetes Consultation", duration_minutes: 45, price: 800, description: "Sugar management" },
    ]

    const { data: services, error: servicesError } = await supabase
      .from("services")
      .insert(
        servicesData.map((s) => ({ ...s, clinic_id: clinicId, is_active: true }))
      )
      .select()

    if (servicesError) {
      console.error("❌ Error inserting services:", servicesError)
      throw servicesError
    }
    console.info(`✅ ${services.length} services inserted/updated.`)

    // 5. Insert 5 patients
    console.info("👥 Inserting patients...")
    const patientsData = [
      { name: "Aarav Mehta", email: "aarav@example.com", phone: "+91-9988776655", gender: "male" },
      { name: "Ishani Gupta", email: "ishani@example.com", phone: "+91-8877665544", gender: "female" },
      { name: "Vihaan Singh", email: "vihaan@example.com", phone: "+91-7766554433", gender: "male" },
      { name: "Ananya Iyer", email: "ananya@example.com", phone: "+91-6655443322", gender: "female" },
      { name: "Kabir Sharma", email: "kabir@example.com", phone: "+91-5544332211", gender: "male" },
    ]

    const { data: patients, error: patientsError } = await supabase
      .from("patients")
      .insert(
        patientsData.map((p) => ({ ...p, clinic_id: clinicId }))
      )
      .select()

    if (patientsError) {
      console.error("❌ Error inserting patients:", patientsError)
      throw patientsError
    }
    console.info(`✅ ${patients.length} patients inserted/updated.`)

    // 6. Insert 10 appointments
    console.info("📅 Inserting appointments...")
    const statuses = ["completed", "confirmed", "pending", "cancelled"]
    const appointmentsData = []

    // 5 past appointments
    for (let i = 0; i < 5; i++) {
      const patient = patients[i % patients.length]
      const service = services[i % services.length]
      const date = subDays(new Date(), i + 1)
      appointmentsData.push({
        clinic_id: clinicId,
        patient_id: patient.id,
        service_id: service.id,
        patient_name: patient.name,
        patient_phone: patient.phone,
        patient_email: patient.email,
        appointment_date: format(date, "yyyy-MM-dd"),
        start_time: "10:00:00",
        end_time: "10:30:00",
        status: statuses[i % statuses.length],
        booked_via: "dashboard",
        booking_language: "en"
      })
    }

    // 5 future appointments
    for (let i = 0; i < 5; i++) {
      const patient = patients[(i + 2) % patients.length]
      const service = services[(i + 1) % services.length]
      const date = addDays(new Date(), i + 1)
      appointmentsData.push({
        clinic_id: clinicId,
        patient_id: patient.id,
        service_id: service.id,
        patient_name: patient.name,
        patient_phone: patient.phone,
        patient_email: patient.email,
        appointment_date: format(date, "yyyy-MM-dd"),
        start_time: "11:00:00",
        end_time: "11:30:00",
        status: statuses[(i + 1) % statuses.length],
        booked_via: "dashboard",
        booking_language: "en"
      })
    }

    const { error: apptError } = await supabase.from("appointments").insert(appointmentsData)
    if (apptError) {
      console.error("❌ Error inserting appointments:", apptError)
      throw apptError
    }
    console.info("✅ 10 appointments inserted.")

    // 7. AI Knowledge Base
    console.info("🤖 Inserting AI knowledge base entries...")
    const knowledgeData = [
      {
        question: "What are your clinic timings?",
        answer: "We are open Monday to Saturday from 9:00 AM to 7:00 PM. We are closed on Sundays.",
      },
      {
        question: "What should I bring for my first visit?",
        answer: "Please bring your ID proof, any previous medical records, and a list of current medications.",
      },
      {
        question: "Tell me about Dr. Sharma's experience.",
        answer: "Dr. Rajesh Sharma has over 15 years of experience in General Medicine and is specialized in chronic disease management.",
      },
    ]

    const { error: kbError } = await supabase
      .from("ai_knowledge")
      .insert(
        knowledgeData.map((k) => ({ ...k, clinic_id: clinicId, is_active: true }))
      )

    if (kbError) {
      console.error("❌ Error inserting knowledge base:", kbError)
      throw kbError
    }
    console.info("✅ AI knowledge base entries inserted.")

    console.info("\n✨ Database seeding completed successfully!")
  } catch (err) {
    console.error("\n❌ Seed process failed!")
    console.error(err)
    process.exit(1)
  }
}

seed()
