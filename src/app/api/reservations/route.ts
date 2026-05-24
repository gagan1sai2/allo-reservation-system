import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  inventoryId: z.string(),
  quantity: z.number().int().positive(),
})

export async function POST(req: NextRequest) {
  const idempotencyKey = req.headers.get('idempotency-key')

  // Check for existing idempotency record
  if (idempotencyKey) {
    try {
      const existing = await prisma.idempotencyRecord.findUnique({
        where: { key: idempotencyKey },
      })
      if (existing) {
        return NextResponse.json(JSON.parse(existing.response), { status: existing.statusCode })
      }
    } catch (e) {
      // Fallback if DB query fails
    }
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const errorResponse = { error: 'Invalid input' }
    if (idempotencyKey) {
      await prisma.idempotencyRecord.create({
        data: { key: idempotencyKey, response: JSON.stringify(errorResponse), statusCode: 400 }
      }).catch(() => {})
    }
    return NextResponse.json(errorResponse, { status: 400 })
  }

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

    if (idempotencyKey) {
      await prisma.idempotencyRecord.create({
        data: { key: idempotencyKey, response: JSON.stringify(reservation), statusCode: 201 }
      }).catch(() => {})
    }

    return NextResponse.json(reservation, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : ''
    let errorResponse = { error: 'Internal error' }
    let statusCode = 500

    if (message === 'INSUFFICIENT_STOCK') {
      errorResponse = { error: 'Insufficient stock' }
      statusCode = 409
    } else if (message === 'NOT_FOUND') {
      errorResponse = { error: 'Inventory not found' }
      statusCode = 404
    }

    if (idempotencyKey && statusCode !== 500) {
      await prisma.idempotencyRecord.create({
        data: { key: idempotencyKey, response: JSON.stringify(errorResponse), statusCode }
      }).catch(() => {})
    }

    return NextResponse.json(errorResponse, { status: statusCode })
  }
}
