'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

type InventoryItem = { 
  id: string 
  warehouse: string 
  totalUnits: number 
  reservedUnits: number 
  availableUnits: number 
}
type Product = { id: string; name: string; inventory: InventoryItem[] }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [reservingId, setReservingId] = useState<string | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
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
    const qty = quantities[inventoryId] ?? 1
    setReservingId(inventoryId)
    setError(e => ({ ...e, [inventoryId]: '' }))

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryId, quantity: qty }),
      })

      if (res.status === 409) {
        const errorMsg = 'Insufficient stock — someone else just claimed these units.'
        setError(e => ({ ...e, [inventoryId]: errorMsg }))
        toast.error(errorMsg)
        return
      }

      if (!res.ok) {
        throw new Error('Server error')
      }

      const data = await res.json()
      toast.success(`${qty} unit(s) held! Redirecting to checkout...`)
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
          <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-96 bg-slate-200 rounded animate-pulse" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-40 bg-slate-100/50 border border-slate-200/80 rounded-xl animate-pulse" />
        ))}
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 space-y-8 flex-1 w-full">
      {/* Page Header */}
      <div className="space-y-2 border-b border-slate-200/80 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Available Products
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
          Select an item and customize the quantity below. The database guarantees atomicity by acquiring row-level locks on the selected inventory record, preventing race conditions or double booking.
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid gap-6">
        {products.map(product => (
          <Card key={product.id} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-slate-100">
              <CardTitle className="text-xl font-semibold text-slate-800 tracking-tight">
                {product.name}
              </CardTitle>
              <span className="text-xs text-slate-500 font-mono">ID: {product.id}</span>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {product.inventory.map(inv => {
                const isOutOfStock = inv.availableUnits <= 0
                const isThisReserving = reservingId === inv.id
                const currentQty = quantities[inv.id] ?? 1

                return (
                  <div 
                    key={inv.id} 
                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/50 border border-slate-200/50 hover:border-teal-500/20 hover:bg-slate-50 transition-all duration-200"
                  >
                    {/* Left section: Warehouse Name & Details */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold ${isOutOfStock ? 'bg-slate-100 text-slate-400 border border-slate-200' : 'bg-teal-50 text-teal-600 border border-teal-100'}`}>
                          WH
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">{inv.warehouse}</p>
                          <span className="text-[10px] font-mono text-slate-400">ID: {inv.id}</span>
                        </div>
                      </div>

                      {/* Stock stats grid */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-6 text-xs font-mono sm:border-l border-slate-200 sm:pl-6 py-1">
                        <div className="flex flex-col">
                          <span className="text-slate-400 uppercase tracking-wider text-[9px]">Total</span>
                          <span className="text-slate-600 font-semibold mt-0.5">{inv.totalUnits}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-400 uppercase tracking-wider text-[9px]">Reserved</span>
                          <span className="text-amber-600 font-semibold mt-0.5">{inv.reservedUnits}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-400 uppercase tracking-wider text-[9px]">Available</span>
                          <span className={`font-semibold mt-0.5 ${isOutOfStock ? 'text-red-500' : 'text-emerald-600'}`}>
                            {isOutOfStock ? 'Out of Stock' : inv.availableUnits}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right section: Quantity Selector & Reserve Button */}
                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 w-full lg:w-auto border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0">
                      {error[inv.id] && (
                        <p className="text-xs font-medium text-red-500 max-w-[200px] text-right order-first sm:order-none">
                          {error[inv.id]}
                        </p>
                      )}

                      {!isOutOfStock && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-500">Qty:</span>
                          <input
                            type="number"
                            min="1"
                            max={inv.availableUnits}
                            value={currentQty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1
                              setQuantities(q => ({ 
                                ...q, 
                                [inv.id]: Math.min(inv.availableUnits, Math.max(1, val)) 
                              }))
                            }}
                            disabled={reservingId !== null}
                            className="w-16 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-teal-500 text-center font-semibold font-mono"
                          />
                        </div>
                      )}

                      <Button
                        disabled={isOutOfStock || reservingId !== null}
                        onClick={() => reserve(inv.id)}
                        className={`w-full sm:w-28 font-medium shadow-sm transition-all duration-200 ${
                          isOutOfStock 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                            : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/10 hover:shadow-teal-600/20 active:scale-95'
                        }`}
                      >
                        {isThisReserving ? (
                          <span className="flex items-center gap-1.5 justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                        ) : isOutOfStock ? 'Sold Out' : 'Reserve'}
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
