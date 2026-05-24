'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

type InventoryItem = { id: string; warehouse: string; availableUnits: number }
type Product = { id: string; name: string; inventory: InventoryItem[] }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [reservingId, setReservingId] = useState<string | null>(null)
  const [error, setError] = useState<Record<string, string>>({})
  const router = useRouter()

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(setProducts)
      .catch(() => toast.error('Failed to load available products.'))
      .finally(() => setLoading(false))
  }, [])

  async function reserve(inventoryId: string) {
    setReservingId(inventoryId)
    setError(e => ({ ...e, [inventoryId]: '' }))

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryId, quantity: 1 }),
      })

      if (res.status === 409) {
        const errorMsg = 'Out of stock — another user just reserved the last unit.'
        setError(e => ({ ...e, [inventoryId]: errorMsg }))
        toast.error(errorMsg)
        return
      }

      if (!res.ok) {
        throw new Error('Server error')
      }

      const data = await res.json()
      toast.success('Inventory held! Redirecting to checkout...')
      router.push(`/checkout/${data.id}`)
    } catch {
      toast.error('An unexpected connection error occurred.')
    } finally {
      setReservingId(null)
    }
  }

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8 flex-1 w-full">
        <div className="space-y-3">
          <div className="h-8 w-64 bg-slate-900 rounded animate-pulse" />
          <div className="h-4 w-96 bg-slate-900 rounded animate-pulse" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-40 bg-slate-900/50 border border-slate-900/80 rounded-xl animate-pulse" />
        ))}
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 space-y-8 flex-1 w-full">
      {/* Page Header */}
      <div className="space-y-2 border-b border-slate-900 pb-6">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Available Products
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Select an item below to lock it. The database guarantees atomicity by acquiring row-level locks on the selected inventory record, preventing race conditions or double booking.
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid gap-6">
        {products.map(product => (
          <Card key={product.id} className="bg-slate-900/30 backdrop-blur border-slate-900/80 hover:border-slate-800/80 hover:bg-slate-900/40 transition-all duration-300 shadow-xl hover:shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-slate-950/50">
              <CardTitle className="text-xl font-semibold text-slate-100 tracking-tight">
                {product.name}
              </CardTitle>
              <span className="text-xs text-slate-500 font-mono">ID: {product.id}</span>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {product.inventory.map(inv => {
                const isOutOfStock = inv.availableUnits <= 0
                const isThisReserving = reservingId === inv.id

                return (
                  <div 
                    key={inv.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/40 border border-slate-900/50 hover:border-indigo-500/10 hover:bg-slate-950/60 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      {/* Warehouse Icon indicator */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold ${isOutOfStock ? 'bg-slate-900 text-slate-500' : 'bg-indigo-950/50 text-indigo-400 border border-indigo-900/30'}`}>
                        WH
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-200">{inv.warehouse}</p>
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${isOutOfStock ? 'bg-red-950/30 text-red-400 border border-red-900/30' : 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30'}`}
                          >
                            {inv.availableUnits} units available
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                      {error[inv.id] && (
                        <p className="text-xs font-medium text-red-400 max-w-[200px] text-right">
                          {error[inv.id]}
                        </p>
                      )}
                      <Button
                        disabled={isOutOfStock || reservingId !== null}
                        onClick={() => reserve(inv.id)}
                        className={`w-full sm:w-28 font-medium shadow-md transition-all duration-200 ${
                          isOutOfStock 
                            ? 'bg-slate-900 text-slate-500 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95'
                        }`}
                      >
                        {isThisReserving ? (
                          <span className="flex items-center gap-1.5 justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                        ) : 'Reserve'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
