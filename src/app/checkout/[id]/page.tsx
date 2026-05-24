'use client'
import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [reservation, setReservation] = useState<{ expiresAt: string; status: string } | null>(null)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch(`/api/reservations/${id}`)
      .then(r => r.json())
      .then(data => {
        setReservation(data)
        const diff = Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000)
        setSecondsLeft(Math.max(0, diff))
      })
  }, [id])

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return
    const t = setInterval(() => setSecondsLeft(s => (s !== null ? Math.max(0, s - 1) : 0)), 1000)
    return () => clearInterval(t)
  }, [secondsLeft])

  const confirm = useCallback(async () => {
    const res = await fetch(`/api/reservations/${id}/confirm`, { method: 'POST' })
    if (res.status === 410) { setMessage('Reservation expired before we could confirm it.'); return }
    setMessage('Purchase confirmed!')
    router.push('/')
  }, [id, router])

  const cancel = useCallback(async () => {
    await fetch(`/api/reservations/${id}/release`, { method: 'POST' })
    router.push('/')
  }, [id, router])

  const expired = secondsLeft !== null && secondsLeft <= 0

  return (
    <main className="max-w-md mx-auto p-8">
      <Card>
        <CardHeader><CardTitle>Complete your purchase</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">Reservation ID: <code>{id}</code></p>
          {secondsLeft !== null && (
            <p className={`text-lg font-semibold ${expired ? 'text-red-500' : 'text-amber-600'}`}>
              {expired ? 'Reservation expired' : `Expires in ${secondsLeft}s`}
            </p>
          )}
          {message && <p className="text-sm text-green-600">{message}</p>}
          <div className="flex gap-3">
            <Button onClick={confirm} disabled={expired}>Confirm purchase</Button>
            <Button variant="outline" onClick={cancel}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
