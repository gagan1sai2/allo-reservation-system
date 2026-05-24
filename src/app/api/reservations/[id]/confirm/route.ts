import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'EXPIRED') return NextResponse.json({ error: 'Reservation expired' }, { status: 410 })
    if (message === 'NOT_FOUND') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (message === 'INVALID_STATE') return NextResponse.json({ error: 'Already confirmed or released' }, { status: 409 })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
