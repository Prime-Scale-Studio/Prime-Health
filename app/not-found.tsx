import Link from "next/link";
import { Hammer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-slate-200/50 max-w-lg w-full border border-slate-100 flex flex-col items-center space-y-6">
        <div className="h-24 w-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2 animate-bounce-slow">
          <Hammer className="h-12 w-12" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Under Construction
          </h1>
          <p className="text-slate-500 text-lg">
            We are working hard to build this page. It will be available very soon!
          </p>
        </div>

        <div className="pt-6 w-full">
          <Link href="/dashboard" className="w-full inline-block">
            <Button size="lg" className="w-full rounded-xl h-12 text-base font-semibold">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-12 text-slate-400 text-sm font-medium">
        &copy; {new Date().getFullYear()} Prime Health Smart Infrastructure
      </div>
    </div>
  );
}
