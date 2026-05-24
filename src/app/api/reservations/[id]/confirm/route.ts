import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      // Fallback
    }
  }

  try {
    const { id } = await params
    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({ where: { id } })
      if (!reservation) throw new Error('NOT_FOUND')
      if (reservation.status !== 'PENDING') throw new Error('INVALID_STATE')

      if (new Date() > reservation.expiresAt) {
        await tx.reservation.update({ where: { id }, data: { status: 'RELEASED' } })
        await tx.inventory.update({
          where: { id: reservation.inventoryId },
          data: { reservedUnits: { decrement: reservation.quantity } },
        })
        throw new Error('EXPIRED')
      }

      await tx.reservation.update({ where: { id }, data: { status: 'CONFIRMED' } })
      await tx.inventory.update({
        where: { id: reservation.inventoryId },
        data: {
          reservedUnits: { decrement: reservation.quantity },
          totalUnits: { decrement: reservation.quantity },
        },
      })

      return { confirmed: true }
    })

    if (idempotencyKey) {
      await prisma.idempotencyRecord.create({
        data: { key: idempotencyKey, response: JSON.stringify(result), statusCode: 200 }
      }).catch(() => {})
    }

    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : ''
    let errorResponse = { error: 'Internal error' }
    let statusCode = 500

    if (message === 'EXPIRED') {
      errorResponse = { error: 'Reservation expired' }
      statusCode = 410
    } else if (message === 'NOT_FOUND') {
      errorResponse = { error: 'Not found' }
      statusCode = 404
    } else if (message === 'INVALID_STATE') {
      errorResponse = { error: 'Already confirmed or released' }
      statusCode = 409
    }

    if (idempotencyKey && statusCode !== 500) {
      await prisma.idempotencyRecord.create({
        data: { key: idempotencyKey, response: JSON.stringify(errorResponse), statusCode }
      }).catch(() => {})
    }

    return NextResponse.json(errorResponse, { status: statusCode })
  }
}
