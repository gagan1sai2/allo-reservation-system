'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type InventoryItem = { id: string; warehouse: string; availableUnits: number }
type Product = { id: string; name: string; inventory: InventoryItem[] }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Record<string, string>>({})
  const router = useRouter()

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts).finally(() => setLoading(false))
  }, [])

  async function reserve(inventoryId: string) {
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inventoryId, quantity: 1 }),
    })
    if (res.status === 409) {
      setError(e => ({ ...e, [inventoryId]: 'Out of stock — someone just grabbed the last one.' }))
      return
    }
    const data = await res.json()
    router.push(`/checkout/${data.id}`)
  }

  if (loading) return <p className="p-8 text-gray-500">Loading products…</p>

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Available products</h1>
      {products.map(product => (
        <Card key={product.id}>
          <CardHeader><CardTitle>{product.name}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {product.inventory.map(inv => (
              <div key={inv.id} className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-600">{inv.warehouse}</span>
                  <Badge className="ml-2" variant={inv.availableUnits > 0 ? 'default' : 'secondary'}>
                    {inv.availableUnits} available
                  </Badge>
                </div>
                {error[inv.id] && <p className="text-sm text-red-500 mr-4">{error[inv.id]}</p>}
                <Button
                  disabled={inv.availableUnits === 0}
                  onClick={() => reserve(inv.id)}
                >
                  Reserve
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </main>
  )
}
