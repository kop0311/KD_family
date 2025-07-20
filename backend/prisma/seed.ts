import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create default group
  const defaultGroup = await prisma.group.upsert({
    where: { inviteCode: 'KD_FAMILY_2024' },
    update: {},
    create: {
      name: 'KD Family',
      description: 'Default family group for KD Family system',
      inviteCode: 'KD_FAMILY_2024',
    },
  })

  console.log('✅ Created default group:', defaultGroup.name)

  // Create demo users
  const hashedPassword = await bcrypt.hash('password123', 12)

  const advisor = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@kdfamily.com',
      password: hashedPassword,
      fullName: 'System Administrator',
      role: 'ADVISOR',
      groupId: defaultGroup.id,
    },
  })

  const parent = await prisma.user.upsert({
    where: { username: 'parent' },
    update: {},
    create: {
      username: 'parent',
      email: 'parent@kdfamily.com',
      password: hashedPassword,
      fullName: 'Parent User',
      role: 'PARENT',
      groupId: defaultGroup.id,
    },
  })

  const member = await prisma.user.upsert({
    where: { username: 'member' },
    update: {},
    create: {
      username: 'member',
      email: 'member@kdfamily.com',
      password: hashedPassword,
      fullName: 'Family Member',
      role: 'MEMBER',
      groupId: defaultGroup.id,
    },
  })

  console.log('✅ Created demo users')

  // Create user stats for all users
  for (const user of [advisor, parent, member]) {
    await prisma.userStats.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        totalPoints: Math.floor(Math.random() * 500),
        weekPoints: Math.floor(Math.random() * 100),
        monthPoints: Math.floor(Math.random() * 200),
        yearPoints: Math.floor(Math.random() * 1000),
        totalTasks: Math.floor(Math.random() * 50),
        completedTasks: Math.floor(Math.random() * 40),
        currentStreak: Math.floor(Math.random() * 10),
        bestStreak: Math.floor(Math.random() * 20),
        rank: 1,
      },
    })
  }

  console.log('✅ Created user statistics')

  // Create sample tasks
  const taskCategories = ['清洁', '整理', '烹饪', '购物', '维护', '其他']
  const taskTitles = [
    '洗碗', '拖地', '整理房间', '倒垃圾', '洗衣服',
    '买菜', '做饭', '清理浴室', '整理书桌', '浇花'
  ]

  for (let i = 0; i < 10; i++) {
    await prisma.task.create({
      data: {
        title: taskTitles[i],
        description: `这是一个${taskTitles[i]}的任务描述`,
        points: Math.floor(Math.random() * 20) + 5,
        category: taskCategories[Math.floor(Math.random() * taskCategories.length)],
        status: ['AVAILABLE', 'CLAIMED', 'COMPLETED', 'APPROVED'][Math.floor(Math.random() * 4)] as any,
        priority: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)] as any,
        createdBy: [advisor.id, parent.id][Math.floor(Math.random() * 2)],
        assignedTo: Math.random() > 0.5 ? member.id : null,
        groupId: defaultGroup.id,
        dueDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within 7 days
      },
    })
  }

  console.log('✅ Created sample tasks')

  // Create achievements
  const achievements = [
    {
      title: '初来乍到',
      description: '完成第一个任务',
      icon: '🎯',
      tasksRequired: 1,
      category: '入门',
      createdBy: advisor.id,
    },
    {
      title: '勤劳小蜜蜂',
      description: '完成10个任务',
      icon: '🐝',
      tasksRequired: 10,
      category: '任务',
      createdBy: advisor.id,
    },
    {
      title: '积分达人',
      description: '获得100积分',
      icon: '💎',
      pointsRequired: 100,
      category: '积分',
      createdBy: advisor.id,
    },
    {
      title: '连续作战',
      description: '连续7天完成任务',
      icon: '🔥',
      streakRequired: 7,
      category: '连击',
      createdBy: advisor.id,
    },
  ]

  for (const achievement of achievements) {
    await prisma.achievement.create({
      data: achievement,
    })
  }

  console.log('✅ Created achievements')

  // Create sample notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: member.id,
        title: '欢迎加入KD之家！',
        message: '欢迎使用KD之家家务积分系统，开始您的家务管理之旅吧！',
        type: 'INFO',
      },
      {
        userId: member.id,
        title: '新任务分配',
        message: '您有一个新的任务等待完成：洗碗',
        type: 'TASK',
      },
      {
        userId: member.id,
        title: '恭喜获得成就！',
        message: '您获得了"初来乍到"成就！',
        type: 'ACHIEVEMENT',
      },
    ],
  })

  console.log('✅ Created sample notifications')

  // Create system settings
  const settings = [
    { key: 'system.name', value: 'KD之家', type: 'string', category: 'general' },
    { key: 'system.version', value: '2.0.0', type: 'string', category: 'general' },
    { key: 'points.daily_bonus', value: '5', type: 'number', category: 'points' },
    { key: 'tasks.auto_approve', value: 'false', type: 'boolean', category: 'tasks' },
    { key: 'notifications.enabled', value: 'true', type: 'boolean', category: 'notifications' },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  console.log('✅ Created system settings')

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
