import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)
  
  const url = request.nextUrl.pathname
  
  // If this is a widget request, inject frame-ancestors * header manually
  // to ensure it overrides any defaults.
  if (url.startsWith("/widget")) {
    response.headers.set("Content-Security-Policy", "frame-ancestors *;")
    response.headers.delete("X-Frame-Options") // Remove any conflicting headers
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - static assets
     * - api/widget (API is CORS-open)
     * 
     * We REMOVED 'widget' from the exclusion list so the middleware runs 
     * for widget pages and can inject the CSP headers.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/widget).*)",
  ],
}
