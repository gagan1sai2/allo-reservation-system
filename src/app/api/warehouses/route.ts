import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        inventory: {
          select: {
            totalUnits: true,
            reservedUnits: true,
          }
        }
      }
    })

    const result = warehouses.map((w) => {
      const totalUnits = w.inventory.reduce((sum, inv) => sum + inv.totalUnits, 0)
      const reservedUnits = w.inventory.reduce((sum, inv) => sum + inv.reservedUnits, 0)
      return {
        id: w.id,
        name: w.name,
        totalUnits,
        reservedUnits,
        availableUnits: totalUnits - reservedUnits,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch warehouses' }, { status: 500 })
  }
}
