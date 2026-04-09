import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const CV_PLATFORM = {
    academic: "CV_ACADEMIC",
    industry: "CV_INDUSTRY",
} as const;

export async function GET() {
    try {
        const profile = await prisma.profile.findFirst({
            include: {
                socialLinks: {
                    orderBy: { order: 'asc' }
                }
            }
        });
        return NextResponse.json(profile);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        console.log("Profile Update Request Body:", JSON.stringify(body, null, 2));

        const {
            name, title, bio = "", aboutTitle, address, avatarUrl, resumeUrl, email,
            academicCvUrl, industryCvUrl,
            socialLinks = [],
            educationTitle, educationSubtitle,
            experienceTitle, experienceSubtitle,
            skillsTitle, skillsSubtitle,
            projectsTitle, projectsSubtitle,
            certificatesTitle, certificatesSubtitle,
            publicationsTitle, publicationsSubtitle,
            activitiesTitle, activitiesSubtitle,
            referencesTitle, referencesSubtitle,
            blogTitle, blogSubtitle
        } = body;

        const profile = await prisma.profile.findFirst();
        let updated;

        // Helper to use provided value or fall back to system defaults if blank
        const clean = (val: string, fallback: string) => (val && val.trim() !== "") ? val : fallback;

        const trimmedAcademicCvUrl = typeof academicCvUrl === "string" ? academicCvUrl.trim() : "";
        const trimmedIndustryCvUrl = typeof industryCvUrl === "string" ? industryCvUrl.trim() : "";
        const primaryResumeUrl =
            (typeof resumeUrl === "string" && resumeUrl.trim()) ||
            trimmedIndustryCvUrl ||
            trimmedAcademicCvUrl ||
            null;

        const regularSocialLinks = Array.isArray(socialLinks)
            ? socialLinks.filter((link: any) => {
                if (!link || typeof link !== "object") return false;
                if (!link.platform || !link.url) return false;
                return link.platform !== CV_PLATFORM.academic && link.platform !== CV_PLATFORM.industry;
            })
            : [];

        const cvLinks = [
            trimmedAcademicCvUrl ? { platform: CV_PLATFORM.academic, url: trimmedAcademicCvUrl } : null,
            trimmedIndustryCvUrl ? { platform: CV_PLATFORM.industry, url: trimmedIndustryCvUrl } : null,
        ].filter(Boolean) as Array<{ platform: string; url: string }>;

        const mergedSocialLinks = [...regularSocialLinks, ...cvLinks];

        const data: any = {
            name, title, bio, aboutTitle, address, avatarUrl, resumeUrl: primaryResumeUrl, email,
            educationTitle: clean(educationTitle, "Academic Background"),
            educationSubtitle: clean(educationSubtitle, "Education"),
            experienceTitle: clean(experienceTitle, "Professional Experience"),
            experienceSubtitle: clean(experienceSubtitle, "Career Path"),
            skillsTitle: clean(skillsTitle, "Core Expertise"),
            skillsSubtitle: clean(skillsSubtitle, "Technical Stack"),
            projectsTitle: clean(projectsTitle, "Featured Projects"),
            projectsSubtitle: clean(projectsSubtitle, "Portfolio"),
            certificatesTitle: clean(certificatesTitle, "Certifications"),
            certificatesSubtitle: clean(certificatesSubtitle, "Recognition"),
            publicationsTitle: clean(publicationsTitle, "Research & Publications"),
            publicationsSubtitle: clean(publicationsSubtitle, "Academic Work"),
            activitiesTitle: clean(activitiesTitle, "Extra-Curricular Activities"),
            activitiesSubtitle: clean(activitiesSubtitle, "Involvement"),
            referencesTitle: clean(referencesTitle, "References"),
            referencesSubtitle: clean(referencesSubtitle, "Endorsements"),
            blogTitle: clean(blogTitle, "Latest Writing"),
            blogSubtitle: clean(blogSubtitle, "Journal")
        };

        if (profile) {
            console.log("Updating existing profile:", profile.id);
            updated = (prisma.profile as any).update({
                where: { id: profile.id },
                data: {
                    ...data,
                    socialLinks: {
                        deleteMany: {},
                        create: mergedSocialLinks.map((link: any, index: number) => ({
                            platform: link.platform,
                            url: link.url,
                            order: index
                        }))
                    }
                },
                include: { socialLinks: true }
            });
        } else {
            console.log("Creating new profile");
            updated = (prisma.profile as any).create({
                data: {
                    ...data,
                    socialLinks: {
                        create: mergedSocialLinks.map((link: any, index: number) => ({
                            platform: link.platform,
                            url: link.url,
                            order: index,
                        }))
                    }
                },
                include: { socialLinks: true }
            });
        }

        // Finalize the update/create
        updated = await updated;
        console.log("Profile updated successfully");
        return NextResponse.json(updated);


    } catch (error: any) {
        console.error("Profile Update Error Details:", error.message, error.stack);
        return NextResponse.json({
            error: "Failed to update profile",
            details: error.message
        }, { status: 500 });
    }
}
