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
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-slate-800 font-sans selection:bg-teal-100 selection:text-teal-900">
        {/* Premium Header */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center font-bold text-white shadow-md shadow-teal-500/10">
                A
              </div>
              <span className="font-semibold text-lg tracking-tight text-slate-900">
                AlloHealth <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full ml-1.5 font-mono uppercase tracking-wider">Core</span>
              </span>
            </div>
            <nav className="flex items-center gap-6 text-sm font-medium text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Database Active
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
            <p className="font-mono bg-slate-100 text-slate-600 border border-slate-200/80 px-2.5 py-1 rounded">SELECT FOR UPDATE locking enabled</p>
          </div>
        </footer>
        <Toaster theme="light" closeButton richColors />
      </body>
    </html>
  )
}
