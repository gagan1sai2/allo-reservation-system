import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('Clearing database tables...')
  await prisma.idempotencyRecord.deleteMany({})
  await prisma.reservation.deleteMany({})
  await prisma.inventory.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.warehouse.deleteMany({})

  console.log('Seeding fresh records...')
  const warehouse1 = await prisma.warehouse.create({ data: { name: 'Delhi Warehouse' } })
  const warehouse2 = await prisma.warehouse.create({ data: { name: 'Mumbai Warehouse' } })

  const products = await Promise.all([
    prisma.product.create({ data: { name: 'Wireless Headphones' } }),
    prisma.product.create({ data: { name: 'Mechanical Keyboard' } }),
    prisma.product.create({ data: { name: 'USB-C Hub' } }),
  ])

  for (const product of products) {
    await prisma.inventory.create({
      data: { productId: product.id, warehouseId: warehouse1.id, totalUnits: 5 },
    })
    await prisma.inventory.create({
      data: { productId: product.id, warehouseId: warehouse2.id, totalUnits: 3 },
    })
  }
  console.log('Seeded successfully')
}

main().catch(console.error).finally(() => prisma.$disconnect())
