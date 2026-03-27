import { PrismaClient } from '../src/generated/client'
import { hash } from 'bcryptjs'
import { config } from 'dotenv'

config({ path: '.env.local' })

const prisma = new PrismaClient()

async function main() {
    const password = await hash('127Diya', 12)
    const user = await prisma.user.upsert({
        where: { email: 'himeltahsib2@gmail.com' },
        update: {
            name: 'Faishal Uddin Himel',
            password,
            role: 'ADMIN',
        },
        create: {
            email: 'himeltahsib2@gmail.com',
            name: 'Faishal Uddin Himel',
            password,
            role: 'ADMIN',
        },
    })

    const profile = await prisma.profile.upsert({
        where: { id: 'main-profile' },
        update: {
            name: 'Faishal Uddin Himel',
            title: 'AI & Backend Developer',
            bio: 'I build intelligent, scalable backend systems that turn AI ideas into real production products through secure APIs, efficient data pipelines, and reliable architectures.',
            aboutTitle: 'Building intelligent systems with practical innovation',
            address: 'Basundhara R/A, Block-2C, Bangladesh',
            email: 'himeltahsib2@gmail.com',
            educationTitle: 'Academic Background',
            educationSubtitle: 'Education',
            experienceTitle: 'Professional Experience',
            experienceSubtitle: 'Career Path',
            skillsTitle: 'Core Expertise',
            skillsSubtitle: 'Technical Stack',
            projectsTitle: 'Featured Projects',
            projectsSubtitle: 'Portfolio',
            certificatesTitle: 'Certifications & Training',
            certificatesSubtitle: 'Recognition',
            publicationsTitle: 'Research & Publications',
            publicationsSubtitle: 'Academic Work',
            activitiesTitle: 'Leadership & Activities',
            activitiesSubtitle: 'Involvement',
            referencesTitle: 'References',
            referencesSubtitle: 'Endorsements',
            blogTitle: 'Latest Writing',
            blogSubtitle: 'Journal',
        },
        create: {
            id: 'main-profile',
            name: 'Faishal Uddin Himel',
            title: 'AI & Backend Developer',
            bio: 'I build intelligent, scalable backend systems that turn AI ideas into real production products through secure APIs, efficient data pipelines, and reliable architectures.',
            aboutTitle: 'Building intelligent systems with practical innovation',
            address: 'Basundhara R/A, Block-2C, Bangladesh',
            email: 'himeltahsib2@gmail.com',
            educationTitle: 'Academic Background',
            educationSubtitle: 'Education',
            experienceTitle: 'Professional Experience',
            experienceSubtitle: 'Career Path',
            skillsTitle: 'Core Expertise',
            skillsSubtitle: 'Technical Stack',
            projectsTitle: 'Featured Projects',
            projectsSubtitle: 'Portfolio',
            certificatesTitle: 'Certifications & Training',
            certificatesSubtitle: 'Recognition',
            publicationsTitle: 'Research & Publications',
            publicationsSubtitle: 'Academic Work',
            activitiesTitle: 'Leadership & Activities',
            activitiesSubtitle: 'Involvement',
            referencesTitle: 'References',
            referencesSubtitle: 'Endorsements',
            blogTitle: 'Latest Writing',
            blogSubtitle: 'Journal',
        },
    })

    await prisma.socialLink.deleteMany({ where: { profileId: profile.id } })
    await prisma.socialLink.createMany({
        data: [
            { profileId: profile.id, platform: 'LinkedIn', url: 'https://linkedin.com/in/faishal-uddin-himel-b7b29a236/', order: 0 },
            { profileId: profile.id, platform: 'Portfolio', url: 'https://my-portfolio-cyan-nu-69.vercel.app/', order: 1 },
        ],
    })

    await prisma.education.deleteMany()
    await prisma.education.createMany({
        data: [
            {
                school: 'American International University-Bangladesh (AIUB)',
                degree: 'Bachelor of Science in Computer Science and Engineering',
                field: 'Computer Science and Engineering',
                passingYear: 2025,
                gradeType: 'Completed',
                grade: '2022 – 2025',
                gradeScale: '',
                startDate: new Date('2022-01-01T00:00:00.000Z'),
                endDate: new Date('2025-12-31T00:00:00.000Z'),
                current: false,
                order: 0,
            },
            {
                school: 'Pakundia Govt. College',
                degree: 'Higher Secondary Certificate (HSC)',
                field: 'Science',
                passingYear: 2020,
                gradeType: 'Major',
                grade: 'Science',
                gradeScale: '',
                startDate: new Date('2018-01-01T00:00:00.000Z'),
                endDate: new Date('2020-12-31T00:00:00.000Z'),
                current: false,
                order: 1,
            },
        ],
    })

    await prisma.experience.deleteMany()
    await prisma.experience.createMany({
        data: [
            {
                company: 'Betopia Group, Bangladesh',
                position: 'AI Developer & Automation Engineer',
                description: 'Developing and deploying AI-powered features, designing automation workflows, and building backend services and integrations for production-ready AI pipelines.',
                startDate: new Date('2026-01-01T00:00:00.000Z'),
                endDate: null,
                current: true,
                order: 0,
            },
            {
                company: 'Applied Intelligence and Informatics Lab (AIIL), Nottingham, UK',
                position: 'Research Intern',
                description: 'Conducted AI research, literature reviews, model implementation, and evaluation while contributing to research documentation for journal publication preparation.',
                startDate: new Date('2025-10-01T00:00:00.000Z'),
                endDate: new Date('2025-12-31T00:00:00.000Z'),
                current: false,
                order: 1,
            },
            {
                company: 'RIC-Series',
                position: 'Intern App Developer',
                description: 'Assisted in gaming application development, codebase enhancements, and app performance improvements in collaboration with development teams.',
                startDate: new Date('2025-08-25T00:00:00.000Z'),
                endDate: new Date('2025-11-10T00:00:00.000Z'),
                current: false,
                order: 2,
            },
        ],
    })

    await prisma.activity.deleteMany()
    await prisma.activity.createMany({
        data: [
            {
                title: 'Team Tech Wing, AIUB',
                role: 'Leader',
                description: 'Supervised laboratory operations, mentored junior members, and led knowledge-sharing sessions and technical workshops.',
                startDate: new Date('2023-10-01T00:00:00.000Z'),
                endDate: null,
                current: true,
                order: 0,
            },
            {
                title: 'EDGE Project (Enhancing Digital Government and Economy)',
                role: 'Project Contributor',
                description: 'Contributed to Python-based digital solutions under the national EDGE initiative with academic supervision.',
                startDate: new Date('2024-06-01T00:00:00.000Z'),
                endDate: new Date('2025-01-31T00:00:00.000Z'),
                current: false,
                order: 1,
            },
        ],
    })

    await prisma.skill.deleteMany()
    await prisma.skill.createMany({
        data: [
            { name: 'Python', category: 'Languages', level: 95, order: 0 },
            { name: 'TypeScript', category: 'Languages', level: 90, order: 1 },
            { name: 'JavaScript', category: 'Languages', level: 90, order: 2 },
            { name: 'SQL', category: 'Languages', level: 88, order: 3 },
            { name: 'FastAPI', category: 'Backend', level: 92, order: 4 },
            { name: 'Node.js / Express', category: 'Backend', level: 90, order: 5 },
            { name: 'Next.js API Routes', category: 'Backend', level: 88, order: 6 },
            { name: 'Prisma ORM', category: 'Backend', level: 86, order: 7 },
            { name: 'PostgreSQL', category: 'Databases', level: 87, order: 8 },
            { name: 'TensorFlow', category: 'AI/ML', level: 84, order: 9 },
            { name: 'PyTorch', category: 'AI/ML', level: 84, order: 10 },
            { name: 'Scikit-learn', category: 'AI/ML', level: 88, order: 11 },
            { name: 'Docker', category: 'DevOps', level: 78, order: 12 },
            { name: 'Linux', category: 'DevOps', level: 80, order: 13 },
            { name: 'Git', category: 'Tools', level: 90, order: 14 },
        ],
    })

    await prisma.project.deleteMany()
    await prisma.project.createMany({
        data: [
            {
                title: 'Student Workspace: AI + Automation Platform',
                description: 'Built a SaaS-style platform for university management and student productivity with course optimization, syllabus ingestion, AI planning, and role-based dashboards.',
                githubUrl: null,
                liveUrl: null,
                tags: 'Next.js,TypeScript,FastAPI,PostgreSQL,Prisma,Redis,AI',
                featured: true,
                order: 0,
            },
            {
                title: 'CyberShield: Reflective Multi-Agent Zero-Day Defense',
                description: 'Designed an autonomous cyber defense system using GAN-based anomaly detection, coordinator/response agents, and reflective incident memory.',
                githubUrl: null,
                liveUrl: null,
                tags: 'Python,TensorFlow,GAN,Multi-Agent,Cybersecurity',
                featured: true,
                order: 1,
            },
            {
                title: 'SENTRI: Smart Edge-Enabled Threat Response',
                description: 'Implemented an edge-focused threat detection and response system with real-time anomaly scoring, alert prioritization, and automated policy actions.',
                githubUrl: null,
                liveUrl: null,
                tags: 'Edge AI,IoT Security,Python,Scikit-learn,TensorFlow',
                featured: true,
                order: 2,
            },
            {
                title: 'AI-Powered EDR with API Integration',
                description: 'Developed an endpoint detection and response platform with secure APIs, automated threat response, and improved detection using optimized ML pipelines.',
                githubUrl: null,
                liveUrl: null,
                tags: 'AI,Backend,REST API,Security,ML',
                featured: true,
                order: 3,
            },
            {
                title: 'Multimodal Rice Disease Detection System',
                description: 'Built a multimodal disease intelligence framework combining leaf image analysis with environmental data and explainability techniques.',
                githubUrl: null,
                liveUrl: null,
                tags: 'Deep Learning,EfficientNet,Multimodal AI,Grad-CAM',
                featured: true,
                order: 4,
            },
            {
                title: 'LLM-Driven Reflective Multi-Agent Economic Simulation',
                description: 'Created a multi-agent economic simulator using deterministic constraints plus LLM reflection to model adaptive labor and savings behavior.',
                githubUrl: null,
                liveUrl: null,
                tags: 'Python,LLM,Multi-Agent,Simulation,Analytics',
                featured: true,
                order: 5,
            },
        ],
    })

    await prisma.publication.deleteMany()
    await prisma.publication.createMany({
        data: [
            {
                title: 'PhishShield-GAN: Co-Evolving NLP-Based Adversarial Agents for Robust Email Phishing Detection',
                publisher: 'ICM Conference',
                date: new Date('2026-03-01T00:00:00.000Z'),
                url: null,
                description: 'Under peer review at ICM Conference. Proposed a red-team/blue-team adversarial learning framework for robust email phishing detection. The framework features attacker agents crafting deceptive phishing-like content and a defense model learning from evolving attacks. Implemented using Python, PyTorch, scikit-learn, pandas, NumPy, NLTK/spaCy, Gymnasium, and Matplotlib to improve resistance against adaptive phishing attempts.',
                submitted: true,
                order: 0,
            },
            {
                title: 'Self-Healing Federated AI CyberShield: A Privacy-Preserving Adaptive Threat Detection and Recovery Framework for Smart IoT Systems',
                publisher: 'IEEE Access Journal',
                date: new Date('2026-03-01T00:00:00.000Z'),
                url: null,
                description: 'Work in progress for IEEE Access Journal. Currently developing a privacy-preserving federated AI framework for smart IoT security, where distributed clients collaboratively learn threat patterns while keeping raw data local. Integrating adaptive threat detection with a self-healing recovery strategy that identifies unreliable updates, supports rollback, and strengthens system robustness. Using Python, PyTorch, scikit-learn, pandas, NumPy, SHAP, and Matplotlib for modeling, explainability, and experimental analysis.',
                submitted: true,
                order: 1,
            },
            {
                title: 'AI-Enhanced Endpoint Malware Protection with Adversarial Robustness',
                publisher: 'Applied Intelligence and Informatics Lab (AIIL)',
                date: new Date('2025-12-01T00:00:00.000Z'),
                url: null,
                description: 'Research on transformer-based malware detection with adversarial robustness mechanisms, calibration analysis, and ONNX deployment consistency.',
                submitted: true,
                order: 2,
            },
            {
                title: 'Adversarial Learning-Based Phishing Email Detection',
                publisher: 'American International University-Bangladesh',
                date: new Date('2025-11-01T00:00:00.000Z'),
                url: null,
                description: 'Built a phishing email detection framework using DistilBERT and adversarial text attack strategies to improve robustness against evasion.',
                submitted: true,
                order: 3,
            },
            {
                title: 'Evaluating and Hardening DDoS Defenses under Adaptive Adversaries Using Attack Success Rate',
                publisher: 'QPAIN (IEEE International Conference on Quantum Photonics, Artificial Intelligence, and Networking)',
                date: new Date('2026-03-01T00:00:00.000Z'),
                url: null,
                description: 'Accepted at QPAIN. Proposed an adversarial evaluation setting for AI-based DDoS defense, where adaptive attackers attempt to evade detection under changing threat conditions. Emphasized Attack Success Rate (ASR) as a more security-relevant metric than standard accuracy for measuring defense robustness. Implemented hardening-oriented analysis using Python, PyTorch, scikit-learn, pandas, NumPy, and Matplotlib.',
                submitted: false,
                order: 4,
            },
        ],
    })

    await prisma.certificate.deleteMany()
    await prisma.certificate.createMany({
        data: [
            { title: 'LLM Pentesting: Mastering Security Testing for AI Models', issuer: 'Udemy', issuedAt: new Date('2024-06-01T00:00:00.000Z'), order: 0 },
            { title: 'Artificial Intelligence & Machine Learning Fundamentals', issuer: 'Certificate of Completion', issuedAt: new Date('2024-05-01T00:00:00.000Z'), order: 1 },
            { title: 'Generative AI: Prompt Engineering Basics', issuer: 'IBM', issuedAt: new Date('2024-04-01T00:00:00.000Z'), order: 2 },
            { title: 'Professional Web, Android & iOS Penetration Testing', issuer: 'Cyber-Bangla', issuedAt: new Date('2024-10-01T00:00:00.000Z'), order: 3 },
            { title: 'Python for Data Science and Machine Learning', issuer: 'IBM', issuedAt: new Date('2024-09-01T00:00:00.000Z'), order: 4 },
            { title: 'Python Django Development Course', issuer: 'IIT, Jahangirnagar University', issuedAt: new Date('2024-12-01T00:00:00.000Z'), order: 5 },
            { title: 'Advanced Cybersecurity Course', issuer: 'Team Matrix – Elite Hackers', issuedAt: new Date('2025-03-01T00:00:00.000Z'), order: 6 },
            { title: 'Cisco Certified Network Associate (CCNA)', issuer: 'AIUB Institute of Continuing Education / Cisco', issuedAt: new Date('2025-08-01T00:00:00.000Z'), order: 7 },
        ],
    })

    await prisma.reference.deleteMany()
    await prisma.reference.createMany({
        data: [
            {
                name: 'Prof. Dr. Dip Nandi',
                designation: 'Associate Dean, Faculty of Science and Technology',
                company: 'American International University-Bangladesh',
                email: 'dip.nandi@aiub.edu',
                phone: null,
                order: 0,
            },
            {
                name: 'Dr. Md. Saef Ullah Miah',
                designation: 'Associate Professor, Additional Director (IQAC), Department of Computer Science',
                company: 'American International University-Bangladesh',
                email: 'saef@aiub.edu',
                phone: null,
                order: 1,
            },
        ],
    })

    console.log({
        user: user.email,
        profile: profile.name,
        seeded: {
            socialLinks: 2,
            education: 2,
            experience: 3,
            activities: 2,
            skills: 15,
            projects: 6,
            publications: 4,
            certificates: 8,
            references: 2,
        },
    })
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
