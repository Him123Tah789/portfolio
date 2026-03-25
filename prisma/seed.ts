import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const password = await hash('admin123', 12)
    const user = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            name: 'Admin User',
            password,
            role: 'ADMIN',
        },
    })

    const profile = await prisma.profile.create({
        data: {
            name: 'Your Name',
            title: 'Full Stack Developer',
            bio: 'I build clean, beautiful, and scalable web applications.',
        }
    })

    console.log({ user, profile })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
