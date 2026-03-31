import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { securityHeaders } from "@/lib/security/headers"

export function proxy(request: NextRequest) {
  const response = NextResponse.next()

  Object.entries(securityHeaders).forEach(([header, value]) => {
    response.headers.set(header, value)
  })

  response.headers.set("X-GhostLedger-Path", request.nextUrl.pathname)
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
