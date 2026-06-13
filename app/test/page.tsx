"use client"

import React, { useState, useEffect } from "react"
import { 
  Activity, 
  User, 
  Calendar, 
  Settings, 
  Stethoscope, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw,
  Database,
  Brain,
  MessageSquare,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  ShieldCheck,
  ShieldAlert
} from "lucide-react"
import { toast } from "sonner"

// Import browser client
import { createClient } from "@/lib/supabase/client"

// Import all actions
import * as clinicActions from "@/actions/clinic"
import * as appointmentActions from "@/actions/appointments"
import * as patientActions from "@/actions/patients"
import * as serviceActions from "@/actions/services"
import * as settingsActions from "@/actions/settings"

export default function TestPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState("test@primehealth.com")
  const [password, setPassword] = useState("Test@12345")
  const [authLoading, setAuthLoading] = useState(false)
  
  const [results, setResults] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  // Auth Listener
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) toast.error(error.message)
    else toast.success("Signed in successfully")
    setAuthLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const runAction = async (category: string, name: string, actionFn: Function, ...args: any[]) => {
    const key = `${category}-${name}`
    setLoading(prev => ({ ...prev, [key]: true }))
    try {
      const response = await actionFn(...args)
      setResults(prev => ({ ...prev, [key]: response }))
    } catch (error) {
      setResults(prev => ({ ...prev, [key]: { error: error instanceof Error ? error.message : "Unknown error" } }))
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  const ActionCard = ({ 
    category, 
    name, 
    description, 
    actionFn, 
    args = [] 
  }: { 
    category: string, 
    name: string, 
    description: string, 
    actionFn: Function, 
    args?: any[] 
  }) => {
    const key = `${category}-${name}`
    const result = results[key]
    const isLoading = loading[key]
    const isAuthorized = !!user

    return (
      <div className={`p-4 rounded-xl border transition-all ${isAuthorized ? 'border-slate-200 bg-white shadow-sm hover:shadow-md' : 'border-slate-200 bg-slate-50 opacity-75'}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-800">{name}</h3>
          <button
            onClick={() => runAction(category, name, actionFn, ...args)}
            disabled={isLoading || !isAuthorized}
            className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:bg-slate-400"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            {isAuthorized ? "Run Test" : "Locked"}
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          {isAuthorized ? description : "🔒 Sign in above to run tests"}
        </p>
        {result && (
          <div className="mt-3 relative">
            <div className="absolute top-0 right-0 p-1 text-[10px] font-mono text-slate-400 bg-slate-50 rounded">
              {result.error ? "ERROR" : "SUCCESS"}
            </div>
            <pre className="p-3 bg-slate-900 text-teal-400 rounded-lg text-[10px] overflow-auto max-h-40 scrollbar-hide">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    )
  }

  const Section = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-teal-100 text-teal-700 rounded-lg">
          <Icon className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </section>
  )

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      {/* Banner */}
      <div className="bg-red-600 text-white py-2 px-4 text-center text-xs font-bold sticky top-0 z-[60] shadow-md uppercase tracking-widest">
        ⚠️ DELETE BEFORE PRODUCTION — DEVELOPMENT ONLY TEST PAGE ⚠️
      </div>

      {/* Sticky Auth Bar */}
      <div className="sticky top-8 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${user ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {user ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              {user ? `Signed in as: ${user.email}` : "Not signed in"}
            </div>
          </div>

          {!user ? (
            <form onSubmit={handleSignIn} className="flex items-center gap-2">
              <input 
                type="email" 
                placeholder="Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <button 
                type="submit"
                disabled={authLoading}
                className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                {authLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          ) : (
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Backend Action <span className="text-teal-600">Testing Lab</span>
          </h1>
          <p className="text-slate-600 max-w-2xl">
            Test all server actions with hardcoded data. Ensure Supabase and environment variables are properly configured.
          </p>
        </header>

        {/* CLINIC ACTIONS */}
        <Section title="Clinic Profile" icon={Stethoscope}>
          <ActionCard 
            category="clinic" 
            name="getMyClinic" 
            description="Fetch authenticated clinic profile"
            actionFn={clinicActions.getMyClinic} 
          />
          <ActionCard 
            category="clinic" 
            name="updateClinicProfile" 
            description="Update clinic name and doctor info"
            actionFn={clinicActions.updateClinicProfile} 
            args={[{ clinic_name: "Test Clinic Updated", doctor_name: "Dr. Test" }]}
          />
        </Section>

        {/* APPOINTMENT ACTIONS */}
        <Section title="Appointments" icon={Calendar}>
          <ActionCard 
            category="appointments" 
            name="getAppointments" 
            description="Fetch all clinic appointments"
            actionFn={appointmentActions.getAppointments} 
          />
          <ActionCard 
            category="appointments" 
            name="getTodaysAppointments" 
            description="Fetch appointments for today only"
            actionFn={appointmentActions.getTodaysAppointments} 
          />
          <ActionCard 
            category="appointments" 
            name="getUpcomingAppointments" 
            description="Fetch next 10 upcoming appointments"
            actionFn={appointmentActions.getUpcomingAppointments} 
          />
        </Section>

        {/* PATIENT ACTIONS */}
        <Section title="Patients" icon={User}>
          <ActionCard 
            category="patients" 
            name="getPatients" 
            description="Fetch all clinic patients"
            actionFn={patientActions.getPatients} 
          />
          <ActionCard 
            category="patients" 
            name="getPatientById" 
            description="Fetch patient with history (requires valid ID)"
            actionFn={patientActions.getPatientById} 
            args={["replace-with-valid-uuid"]}
          />
          <ActionCard 
            category="patients" 
            name="createPatient" 
            description="Add a new test patient"
            actionFn={patientActions.createPatient} 
            args={[{ name: "John Doe", phone: "9876543210", email: "john@example.com" }]}
          />
          <ActionCard 
            category="patients" 
            name="updatePatient" 
            description="Update patient info (requires valid ID)"
            actionFn={patientActions.updatePatient} 
            args={["replace-with-valid-uuid", { name: "John Updated" }]}
          />
        </Section>

        {/* SERVICE ACTIONS */}
        <Section title="Services" icon={Database}>
          <ActionCard 
            category="services" 
            name="getServices" 
            description="Fetch all clinic services"
            actionFn={serviceActions.getServices} 
          />
          <ActionCard 
            category="services" 
            name="getActiveServices" 
            description="Fetch only active services"
            actionFn={serviceActions.getActiveServices} 
          />
          <ActionCard 
            category="services" 
            name="createService" 
            description="Create a new test service"
            actionFn={serviceActions.createService} 
            args={[{ name: "Test Consultation", duration: 30, price: 500, description: "Basic test service" }]}
          />
          <ActionCard 
            category="services" 
            name="toggleServiceActive" 
            description="Flip service status (requires valid ID)"
            actionFn={serviceActions.toggleServiceActive} 
            args={["replace-with-valid-uuid"]}
          />
        </Section>

        {/* SETTINGS ACTIONS */}
        <Section title="Clinic Settings" icon={Settings}>
          <ActionCard 
            category="settings" 
            name="getAvailability" 
            description="Fetch weekly availability slots"
            actionFn={settingsActions.getAvailability} 
          />
          <ActionCard 
            category="settings" 
            name="getBlockedDates" 
            description="Fetch all blocked vacation dates"
            actionFn={settingsActions.getBlockedDates} 
          />
          <ActionCard 
            category="settings" 
            name="getKnowledgeBase" 
            description="Fetch AI FAQ entries"
            actionFn={settingsActions.getKnowledgeBase} 
          />
        </Section>

      </div>
    </main>
  )
}
