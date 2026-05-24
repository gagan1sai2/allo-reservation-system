import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  inventoryId: z.string(),
  quantity: z.number().int().positive(),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { inventoryId, quantity } = parsed.data

  try {
    const reservation = await prisma.$transaction(async (tx) => {
      // Lock the row — no other transaction can read/write it until this commits
      const inventory = await tx.$queryRaw<{ id: string; totalUnits: number; reservedUnits: number }[]>`
        SELECT id, "totalUnits", "reservedUnits"
        FROM "Inventory"
        WHERE id = ${inventoryId}
        FOR UPDATE
      `

      if (!inventory.length) throw new Error('NOT_FOUND')

      const inv = inventory[0]
      const available = inv.totalUnits - inv.reservedUnits

      if (available < quantity) throw new Error('INSUFFICIENT_STOCK')

      await tx.inventory.update({
        where: { id: inventoryId },
        data: { reservedUnits: { increment: quantity } },
      })

      return tx.reservation.create({
        data: {
          inventoryId,
          quantity,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        },
      })
    })

    return NextResponse.json(reservation, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'INSUFFICIENT_STOCK')
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 409 })
    if (message === 'NOT_FOUND')
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
