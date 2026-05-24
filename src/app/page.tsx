'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Package, Warehouse, ShoppingCart, Plus, Minus } from 'lucide-react'

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

  const adjustQty = (id: string, current: number, delta: number, max: number) => {
    const next = current + delta
    setQuantities(prev => ({
      ...prev,
      [id]: Math.min(max, Math.max(1, next))
    }))
  }

  async function reserve(inventoryId: string) {
    const qty = quantities[inventoryId] ?? 1
    setReservingId(inventoryId)
    setError(e => ({ ...e, [inventoryId]: '' }))

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Idempotency-Key': `reserve-${inventoryId}-${Date.now()}` // Client-side safe idempotency prefix
        },
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
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-8 flex-1 w-full">
        <div className="space-y-3">
          <div className="h-10 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-96 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-96 bg-white border border-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 space-y-8 flex-1 w-full">
      {/* Page Header */}
      <div className="space-y-2 pb-2">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 font-serif">
          Products
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          Select a warehouse slot to reserve stock for checkout.
        </p>
      </div>

      {/* 3-Column Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map(product => (
          <Card key={product.id} className="bg-white border-slate-200/80 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col">
            {/* Custom Product Header exactly like mockup */}
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-5 bg-slate-50/50 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                <Package className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <CardTitle className="text-base font-bold text-slate-800 tracking-tight leading-tight">
                  {product.name}
                </CardTitle>
                <p className="text-[11px] font-medium text-slate-400">
                  {product.inventory.length} warehouses
                </p>
              </div>
            </CardHeader>

            {/* Product Body containing Warehouse Slots */}
            <CardContent className="p-5 flex-1 space-y-5">
              {product.inventory.map(inv => {
                const isOutOfStock = inv.availableUnits <= 0
                const isThisReserving = reservingId === inv.id
                const currentQty = quantities[inv.id] ?? 1

                return (
                  <div 
                    key={inv.id} 
                    className="p-4 rounded-2xl bg-[#f8fafc]/80 border border-slate-200/40 space-y-4 hover:border-blue-500/20 hover:bg-[#f8fafc] transition-all duration-200"
                  >
                    {/* Warehouse Header & Availability badge */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                        {inv.warehouse}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 border shadow-none ${
                          isOutOfStock 
                            ? 'bg-red-50 text-red-600 border-red-100' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100/60'
                        }`}
                      >
                        {isOutOfStock ? 'Sold Out' : `${inv.availableUnits} available`}
                      </Badge>
                    </div>

                    {/* Stock Stats Grid precisely styled like mockup */}
                    <div className="grid grid-cols-2 gap-3 text-xs font-medium">
                      <div className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200/60 rounded-xl">
                        <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider">Total</span>
                        <span className="font-bold font-mono text-slate-700">{inv.totalUnits}</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200/60 rounded-xl">
                        <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider">Reserved</span>
                        <span className="font-bold font-mono text-slate-700">{inv.reservedUnits}</span>
                      </div>
                    </div>

                    {/* Quantity Stepper exactly like mockup */}
                    {!isOutOfStock && (
                      <div className="flex items-center justify-between border border-slate-200/60 rounded-xl p-2 bg-white">
                        <span className="text-xs font-semibold text-slate-500 pl-2">Quantity</span>
                        <div className="flex items-center gap-2 border border-slate-200/80 rounded-lg bg-white p-1">
                          <button 
                            type="button"
                            onClick={() => adjustQty(inv.id, currentQty, -1, inv.availableUnits)}
                            disabled={isOutOfStock || currentQty <= 1 || reservingId !== null}
                            className="w-6 h-6 rounded-md flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 disabled:opacity-40 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold font-mono text-slate-700">{currentQty}</span>
                          <button 
                            type="button"
                            onClick={() => adjustQty(inv.id, currentQty, 1, inv.availableUnits)}
                            disabled={isOutOfStock || currentQty >= inv.availableUnits || reservingId !== null}
                            className="w-6 h-6 rounded-md flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 disabled:opacity-40 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Reserve Button with Cart Icon exactly like mockup */}
                    <div className="space-y-2">
                      {error[inv.id] && (
                        <p className="text-[11px] font-medium text-red-500 text-center">
                          {error[inv.id]}
                        </p>
                      )}
                      <Button
                        disabled={isOutOfStock || reservingId !== null}
                        onClick={() => reserve(inv.id)}
                        className={`w-full py-5 font-bold text-xs transition-all duration-200 flex items-center justify-center gap-2 rounded-xl shadow-none ${
                          isOutOfStock 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/10 hover:shadow-blue-600/20 active:scale-95'
                        }`}
                      >
                        {isThisReserving ? (
                          <span className="flex items-center gap-1.5 justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Reserve
                          </>
                        )}
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
