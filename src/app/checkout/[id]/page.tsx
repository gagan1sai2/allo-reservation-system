'use client'
import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [reservation, setReservation] = useState<{ expiresAt: string; status: string } | null>(null)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    fetch(`/api/reservations/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Reservation not found')
        return r.json()
      })
      .then(data => {
        setReservation(data)
        const diff = Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000)
        setSecondsLeft(Math.max(0, diff))
      })
      .catch(() => {
        toast.error('Failed to load reservation details.')
        router.push('/')
      })
  }, [id, router])

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return
    const t = setInterval(() => setSecondsLeft(s => (s !== null ? Math.max(0, s - 1) : 0)), 1000)
    return () => clearInterval(t)
  }, [secondsLeft])

  const confirm = useCallback(async () => {
    setConfirming(true)
    try {
      const res = await fetch(`/api/reservations/${id}/confirm`, { method: 'POST' })
      if (res.status === 410) { 
        toast.error('Reservation expired before it could be confirmed.')
        router.push('/')
        return 
      }
      if (!res.ok) throw new Error('Confirmation failed')
      toast.success('Purchase confirmed successfully!')
      router.push('/')
    } catch {
      toast.error('An unexpected error occurred during confirmation.')
    } finally {
      setConfirming(false)
    }
  }, [id, router])

  const cancel = useCallback(async () => {
    setCancelling(true)
    try {
      await fetch(`/api/reservations/${id}/release`, { method: 'POST' })
      toast.info('Reservation cancelled and inventory released.')
      router.push('/')
    } catch {
      toast.error('Failed to manually release reservation.')
    } finally {
      setCancelling(false)
    }
  }, [id, router])

  const expired = secondsLeft !== null && secondsLeft <= 0

  return (
    <main className="max-w-xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center items-center w-full">
      <Card className="w-full bg-slate-900/30 backdrop-blur border-slate-900/80 shadow-2xl overflow-hidden relative">
        {/* Glow accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-[3px] transition-all duration-300 ${expired ? 'bg-red-500 shadow-md shadow-red-500/50' : 'bg-gradient-to-r from-amber-500 to-indigo-500 shadow-md shadow-indigo-500/50'}`} />

        <CardHeader className="pt-8 pb-4 border-b border-slate-950/50 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Complete Your Purchase
          </CardTitle>
          <p className="text-xs text-slate-500 mt-2 font-mono tracking-wider">
            RESERVATION: {id}
          </p>
        </CardHeader>

        <CardContent className="py-8 px-8 space-y-8">
          {/* Main Visual Timer Display */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950/50 border border-slate-900/80 shadow-inner">
            <div className="text-center space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Hold Status
              </span>
              
              {secondsLeft !== null ? (
                <div className="space-y-2 pt-2">
                  <div className={`text-4xl font-extrabold tracking-tight tabular-nums transition-all ${expired ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.2)]' : 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.2)]'}`}>
                    {expired ? 'Expired' : `${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s`}
                  </div>
                  <p className="text-xs text-slate-400">
                    {expired 
                      ? 'The 10-minute database lock has been released.' 
                      : 'Inventory is locked exclusively for you until timer expires.'}
                  </p>
                </div>
              ) : (
                <div className="h-10 w-32 bg-slate-900 rounded animate-pulse mt-2" />
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button 
              onClick={confirm} 
              disabled={expired || confirming || cancelling}
              className={`flex-1 py-6 text-sm font-semibold tracking-wide transition-all shadow-md ${
                expired 
                  ? 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95'
              }`}
            >
              {confirming ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              ) : 'Confirm Purchase'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={cancel}
              disabled={cancelling || confirming}
              className="flex-1 py-6 text-sm font-semibold border-slate-900 text-slate-300 hover:bg-slate-900 hover:text-white transition-all active:scale-95"
            >
              {cancelling ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              ) : 'Release Inventory'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
