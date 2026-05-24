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
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
        {/* Modern decorative gradient background blobs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-indigo-900/20 blur-[150px]" />
          <div className="absolute -top-[20%] -right-[20%] w-[60%] h-[70%] rounded-full bg-violet-900/15 blur-[130px]" />
          <div className="absolute top-[40%] left-[10%] w-[50%] h-[60%] rounded-full bg-indigo-950/20 blur-[140px]" />
        </div>

        {/* Premium Header */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                A
              </div>
              <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                AlloHealth <span className="text-xs font-medium text-indigo-400 bg-indigo-950/50 border border-indigo-900/60 px-2 py-0.5 rounded-full ml-1.5">System</span>
              </span>
            </div>
            <nav className="flex items-center gap-6 text-sm font-medium text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 px-2.5 py-1 rounded-full text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Database Connected
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
            <p>© {new Date().getFullYear()} AlloHealth. Core Concurrency Engine.</p>
            <p className="font-mono bg-slate-900/50 border border-slate-800 px-2.5 py-1 rounded">SELECT FOR UPDATE locking active</p>
          </div>
        </footer>
        <Toaster theme="dark" closeButton richColors />
      </body>
    </html>
  )
}
