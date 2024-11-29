'use client'

import { type ReactNode } from 'react'
import { GeistSans } from 'geist/font/sans'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={GeistSans.variable}>{children}</body>
    </html>
  )
}