/// <reference types="node" />
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'


const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.users.upsert({
    where: { email: 'admin@dm-building.com' },
    update: {},
    create: {
      id: 'admin',
      updated_at: new Date(),
      name: 'Admin User',
      email: 'admin@dm-building.com',
      password_hash: adminPassword,
      role: 'admin',
      email_verified: true
    }
  })
  console.log('✅ Created admin user:', admin.email)

  // Create CM team member
  const cmPassword = await bcrypt.hash('cm123456', 10)
  const cmUser = await prisma.users.upsert({
    where: { email: 'cm@dm-building.com' },
    update: {},
    create: {
      id: 'cm',
      updated_at: new Date(),
      name: 'CM Team Member',
      email: 'cm@dm-building.com',
      password_hash: cmPassword,
      role: 'cm_team',
      email_verified: true
    }
  })
  console.log('✅ Created CM team user:', cmUser.email)

  // Create expert user
  const expertPassword = await bcrypt.hash('expert123', 10)
  const expertUser = await prisma.users.upsert({
    where: { email: 'expert@dm-building.com' },
    update: {},
    create: {
      id: 'expert',
      updated_at: new Date(),
      name: 'Expert Consultant',
      email: 'expert@dm-building.com',
      password_hash: expertPassword,
      role: 'expert',
      email_verified: true
    }
  })
  console.log('✅ Created expert user:', expertUser.email)

  // Create expert profile
  const expert = await prisma.experts.upsert({
    where: { user_id: expertUser.id },
    update: {},
    create: {
      id: 'expert',
      updated_at: new Date(),
      user_id: expertUser.id,
      specialization: 'Interior Design',
      rate_per_hour: 75.0,
      bio: 'Experienced interior designer with 10+ years in home renovation and design.',
      rating_avg: 4.8,
      rating_count: 25,
      is_active: true,
      is_verified: true
    }
  })
  console.log('✅ Created expert profile:', expert.id)

  // Create expert schedule (Monday to Friday, 9 AM to 5 PM)
  const expertSchedule = await prisma.expert_schedules.createMany({
    data: [
      { id: `${expert.id}-mon`, expert_id: expert.id, day_of_week: 1, start_time: '09:00', end_time: '17:00', timezone: 'UTC' },
      { id: `${expert.id}-tue`, expert_id: expert.id, day_of_week: 2, start_time: '09:00', end_time: '17:00', timezone: 'UTC' },
      { id: `${expert.id}-wed`, expert_id: expert.id, day_of_week: 3, start_time: '09:00', end_time: '17:00', timezone: 'UTC' },
      { id: `${expert.id}-thu`, expert_id: expert.id, day_of_week: 4, start_time: '09:00', end_time: '17:00', timezone: 'UTC' },
      { id: `${expert.id}-fri`, expert_id: expert.id, day_of_week: 5, start_time: '09:00', end_time: '17:00', timezone: 'UTC' }
    ],
    skipDuplicates: true
  })
  console.log('✅ Created expert schedules')

  // Create sample customer user
  const customerPassword = await bcrypt.hash('customer123', 10)
  const customer = await prisma.users.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      id: 'customer',
      updated_at: new Date(),
      name: 'John Customer',
      email: 'customer@example.com',
      password_hash: customerPassword,
      role: 'customer',
      email_verified: true
    }
  })
  console.log('✅ Created customer user:', customer.email)

  // Create material categories (hierarchical structure)
  console.log('📁 Creating material categories...')
  
  // Root categories
  const flooringCategory = await prisma.materialCategory.upsert({
    where: { slug: 'flooring' },
    update: {},
    create: {
      name: 'Flooring',
      slug: 'flooring',
      sortOrder: 1,
      isActive: true
    }
  })

  const paintCategory = await prisma.materialCategory.upsert({
    where: { slug: 'paint' },
    update: {},
    create: {
      name: 'Paint',
      slug: 'paint',
      sortOrder: 2,
      isActive: true
    }
  })

  const lightingCategory = await prisma.materialCategory.upsert({
    where: { slug: 'lighting' },
    update: {},
    create: {
      name: 'Lighting',
      slug: 'lighting',
      sortOrder: 3,
      isActive: true
    }
  })

  const furnitureCategory = await prisma.materialCategory.upsert({
    where: { slug: 'furniture' },
    update: {},
    create: {
      name: 'Furniture',
      slug: 'furniture',
      sortOrder: 4,
      isActive: true
    }
  })

  const windowsDoorsCategory = await prisma.materialCategory.upsert({
    where: { slug: 'windows-doors' },
    update: {},
    create: {
      name: 'Windows & Doors',
      slug: 'windows-doors',
      sortOrder: 5,
      isActive: true
    }
  })

  console.log('✅ Created root categories')

  // Sub-categories
  const hardwoodCategory = await prisma.materialCategory.upsert({
    where: { slug: 'hardwood' },
    update: {},
    create: {
      name: 'Hardwood',
      slug: 'hardwood',
      parentId: flooringCategory.id,
      sortOrder: 1,
      isActive: true
    }
  })

  const tileCategory = await prisma.materialCategory.upsert({
    where: { slug: 'tile' },
    update: {},
    create: {
      name: 'Tile',
      slug: 'tile',
      parentId: flooringCategory.id,
      sortOrder: 2,
      isActive: true
    }
  })

  const laminateCategory = await prisma.materialCategory.upsert({
    where: { slug: 'laminate' },
    update: {},
    create: {
      name: 'Laminate',
      slug: 'laminate',
      parentId: flooringCategory.id,
      sortOrder: 3,
      isActive: true
    }
  })

  const interiorPaintCategory = await prisma.materialCategory.upsert({
    where: { slug: 'interior-paint' },
    update: {},
    create: {
      name: 'Interior',
      slug: 'interior-paint',
      parentId: paintCategory.id,
      sortOrder: 1,
      isActive: true
    }
  })

  const exteriorPaintCategory = await prisma.materialCategory.upsert({
    where: { slug: 'exterior-paint' },
    update: {},
    create: {
      name: 'Exterior',
      slug: 'exterior-paint',
      parentId: paintCategory.id,
      sortOrder: 2,
      isActive: true
    }
  })

  const indoorLightingCategory = await prisma.materialCategory.upsert({
    where: { slug: 'indoor-lighting' },
    update: {},
    create: {
      name: 'Indoor',
      slug: 'indoor-lighting',
      parentId: lightingCategory.id,
      sortOrder: 1,
      isActive: true
    }
  })

  const outdoorLightingCategory = await prisma.materialCategory.upsert({
    where: { slug: 'outdoor-lighting' },
    update: {},
    create: {
      name: 'Outdoor',
      slug: 'outdoor-lighting',
      parentId: lightingCategory.id,
      sortOrder: 2,
      isActive: true
    }
  })

  const kitchenFurnitureCategory = await prisma.materialCategory.upsert({
    where: { slug: 'kitchen-furniture' },
    update: {},
    create: {
      name: 'Kitchen',
      slug: 'kitchen-furniture',
      parentId: furnitureCategory.id,
      sortOrder: 1,
      isActive: true
    }
  })

  const livingRoomFurnitureCategory = await prisma.materialCategory.upsert({
    where: { slug: 'living-room-furniture' },
    update: {},
    create: {
      name: 'Living Room',
      slug: 'living-room-furniture',
      parentId: furnitureCategory.id,
      sortOrder: 2,
      isActive: true
    }
  })

  console.log('✅ Created sub-categories')

  // Create sample materials
  const materials = await prisma.material.createMany({
    data: ([
      // Hardwood flooring materials
      {
        name: 'Oak Hardwood Flooring',
        categoryId: hardwoodCategory.id,
        unit: 'sqft',
        unitCost: 8.50,
        description: 'Premium oak hardwood flooring, 3/4 inch thick',
        isActive: true
      },
      {
        name: 'Maple Hardwood Flooring',
        categoryId: hardwoodCategory.id,
        unit: 'sqft',
        unitCost: 9.25,
        description: 'High-quality maple hardwood flooring, 3/4 inch thick',
        isActive: true
      },
      {
        name: 'Cherry Hardwood Flooring',
        categoryId: hardwoodCategory.id,
        unit: 'sqft',
        unitCost: 10.50,
        description: 'Premium cherry hardwood flooring, 3/4 inch thick',
        isActive: true
      },
      // Tile materials
      {
        name: 'Ceramic Tile',
        categoryId: tileCategory.id,
        unit: 'sqft',
        unitCost: 3.25,
        description: 'High-quality ceramic tile, 12x12 inches',
        isActive: true
      },
      {
        name: 'Porcelain Tile',
        categoryId: tileCategory.id,
        unit: 'sqft',
        unitCost: 4.50,
        description: 'Durable porcelain tile, 12x24 inches',
        isActive: true
      },
      {
        name: 'Natural Stone Tile',
        categoryId: tileCategory.id,
        unit: 'sqft',
        unitCost: 12.00,
        description: 'Premium natural stone tile, various sizes',
        isActive: true
      },
      // Laminate materials
      {
        name: 'Luxury Vinyl Plank',
        categoryId: laminateCategory.id,
        unit: 'sqft',
        unitCost: 2.75,
        description: 'Waterproof luxury vinyl plank flooring',
        isActive: true
      },
      // Interior paint
      {
        name: 'White Interior Paint',
        categoryId: interiorPaintCategory.id,
        unit: 'gallon',
        unitCost: 35.00,
        description: 'Premium interior white paint, 1 gallon',
        isActive: true
      },
      {
        name: 'Eggshell Interior Paint',
        categoryId: interiorPaintCategory.id,
        unit: 'gallon',
        unitCost: 38.00,
        description: 'Premium interior eggshell finish paint, 1 gallon',
        isActive: true
      },
      // Exterior paint
      {
        name: 'Exterior Paint - White',
        categoryId: exteriorPaintCategory.id,
        unit: 'gallon',
        unitCost: 42.00,
        description: 'Weather-resistant exterior white paint, 1 gallon',
        isActive: true
      },
      {
        name: 'Exterior Paint - Gray',
        categoryId: exteriorPaintCategory.id,
        unit: 'gallon',
        unitCost: 42.00,
        description: 'Weather-resistant exterior gray paint, 1 gallon',
        isActive: true
      },
      // Indoor lighting
      {
        name: 'LED Recessed Light',
        categoryId: indoorLightingCategory.id,
        unit: 'piece',
        unitCost: 45.00,
        description: 'Energy-efficient 6-inch LED recessed light',
        isActive: true
      },
      {
        name: 'Pendant Light',
        categoryId: indoorLightingCategory.id,
        unit: 'piece',
        unitCost: 85.00,
        description: 'Modern pendant light fixture',
        isActive: true
      },
      {
        name: 'Chandelier',
        categoryId: indoorLightingCategory.id,
        unit: 'piece',
        unitCost: 350.00,
        description: 'Elegant crystal chandelier',
        isActive: true
      },
      // Outdoor lighting
      {
        name: 'LED Outdoor Wall Light',
        categoryId: outdoorLightingCategory.id,
        unit: 'piece',
        unitCost: 65.00,
        description: 'Weather-resistant LED outdoor wall light',
        isActive: true
      },
      {
        name: 'Garden Path Light',
        categoryId: outdoorLightingCategory.id,
        unit: 'piece',
        unitCost: 25.00,
        description: 'Solar-powered garden path light',
        isActive: true
      },
      // Kitchen furniture
      {
        name: 'Modern Kitchen Cabinet',
        categoryId: kitchenFurnitureCategory.id,
        unit: 'unit',
        unitCost: 250.00,
        description: 'Modern style kitchen cabinet, per unit',
        isActive: true
      },
      {
        name: 'Kitchen Island',
        categoryId: kitchenFurnitureCategory.id,
        unit: 'unit',
        unitCost: 850.00,
        description: 'Premium kitchen island with storage',
        isActive: true
      },
      // Living room furniture
      {
        name: 'Modern Sofa',
        categoryId: livingRoomFurnitureCategory.id,
        unit: 'unit',
        unitCost: 1200.00,
        description: 'Comfortable modern 3-seater sofa',
        isActive: true
      },
      {
        name: 'Coffee Table',
        categoryId: livingRoomFurnitureCategory.id,
        unit: 'unit',
        unitCost: 350.00,
        description: 'Contemporary wooden coffee table',
        isActive: true
      },
      // Windows & Doors
      {
        name: 'Double Pane Window',
        categoryId: windowsDoorsCategory.id,
        unit: 'unit',
        unitCost: 450.00,
        description: 'Energy-efficient double pane window',
        isActive: true
      },
      {
        name: 'Entry Door',
        categoryId: windowsDoorsCategory.id,
        unit: 'unit',
        unitCost: 650.00,
        description: 'Solid wood entry door with hardware',
        isActive: true
      }
    ]) as any,
    skipDuplicates: true
  } as any)
  console.log('✅ Created materials:', materials.count)

  // Create system settings
  const settings = await prisma.system_settings.createMany({
    data: [
      { id: 'site_name', key: 'site_name', value: 'DM Building', type: 'string', updated_at: new Date() },
      { id: 'chat_timeout_ai_minutes', key: 'chat_timeout_ai_minutes', value: '30', type: 'number', updated_at: new Date() },
      { id: 'chat_timeout_human_minutes', key: 'chat_timeout_human_minutes', value: '60', type: 'number', updated_at: new Date() },
      { id: 'chat_timeout_consulting_hours', key: 'chat_timeout_consulting_hours', value: '24', type: 'number', updated_at: new Date() }
    ],
    skipDuplicates: true
  })
  console.log('✅ Created system settings:', settings.count)

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

