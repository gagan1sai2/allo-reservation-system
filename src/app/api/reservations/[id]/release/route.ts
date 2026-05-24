import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({ where: { id } })
      if (!reservation) throw new Error('NOT_FOUND')
      if (reservation.status !== 'PENDING') throw new Error('ALREADY_RELEASED')

      await tx.reservation.update({ where: { id }, data: { status: 'RELEASED' } })
      await tx.inventory.update({
        where: { id: reservation.inventoryId },
        data: { reservedUnits: { decrement: reservation.quantity } },
      })
    })

    return NextResponse.json({ released: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'NOT_FOUND') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (message === 'ALREADY_RELEASED') return NextResponse.json({ error: 'Already released' }, { status: 409 })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
