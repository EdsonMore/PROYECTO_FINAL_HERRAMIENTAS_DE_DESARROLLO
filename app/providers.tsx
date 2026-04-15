// app/providers.tsx
"use client"

import { SessionProvider } from "next-auth/react"
import type React from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={60}
      refetchOnWindowFocus={true}
      refetchOnMount={true}
    >
      {children}
    </SessionProvider>
  )
}
