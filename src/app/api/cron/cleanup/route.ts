import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const expired = await prisma.reservation.findMany({
    where: { status: 'PENDING', expiresAt: { lt: new Date() } },
  })

  for (const r of expired) {
    await prisma.$transaction([
      prisma.reservation.update({ where: { id: r.id }, data: { status: 'RELEASED' } }),
      prisma.inventory.update({
        where: { id: r.inventoryId },
        data: { reservedUnits: { decrement: r.quantity } },
      }),
    ])
  }

  return NextResponse.json({ cleaned: expired.length })
}
