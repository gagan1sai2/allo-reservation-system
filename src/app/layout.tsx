import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Allo Inventory Reservation System",
  description: "A concurrency-safe high-performance inventory reservation system.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0b0f19] text-slate-100 font-sans selection:bg-teal-500/20 selection:text-teal-200">
        {/* Premium Header */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-900 bg-[#0b0f19]/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center font-bold text-white shadow-lg shadow-teal-500/10">
                A
              </div>
              <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-slate-100 to-slate-200 bg-clip-text text-transparent">
                AlloHealth <span className="text-xs font-medium text-teal-400 bg-teal-950/30 border border-teal-900/50 px-2 py-0.5 rounded-full ml-1.5 font-mono">Core</span>
              </span>
            </div>
            <nav className="flex items-center gap-6 text-sm font-medium text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 px-2.5 py-1 rounded-full text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Database Connected
              </span>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col relative z-10">
          {children}
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-900 py-6 mt-auto">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} AlloHealth. Inventory Reservation System.</p>
            <p className="font-mono bg-slate-900/30 border border-slate-900 px-2.5 py-1 rounded">SELECT FOR UPDATE active</p>
          </div>
        </footer>
        <Toaster theme="dark" closeButton richColors />
      </body>
    </html>
  )
}
