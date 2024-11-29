import { GeistSans } from "geist/font/sans"
import "@/styles/globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${GeistSans.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
