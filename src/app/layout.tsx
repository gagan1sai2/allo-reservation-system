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
      className={`${inter.variable} h-full antialiased light`}
    >
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900">
        {/* Premium Header */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Rounded Teal-like icon changed to fresh blue icon */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/10">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-semibold text-lg tracking-tight text-slate-900">
                Allo Health
              </span>
            </div>
            <nav className="flex items-center gap-6 text-sm font-medium text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live inventory
              </span>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col relative z-10">
          {children}
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200/60 py-6 mt-auto bg-white/40">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} AlloHealth. Inventory Reservation System.</p>
            <p className="font-mono bg-slate-100 text-slate-600 border border-slate-200/80 px-2.5 py-1 rounded">SELECT FOR UPDATE active</p>
          </div>
        </footer>
        <Toaster theme="light" closeButton richColors />
      </body>
    </html>
  )
}
