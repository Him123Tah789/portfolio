import Link from "next/link";
import { User, Briefcase, FileText, Settings, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

const navigation = [
    { name: 'Profile', href: '/admin/profile', icon: User },
    { name: 'Projects', href: '/admin/projects', icon: Briefcase },
    { name: 'Posts', href: '/admin/posts', icon: FileText },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function Sidebar() {
    return (
        <div className="flex h-full w-64 flex-col border-r bg-white">
            <div className="flex h-16 shrink-0 items-center px-6 border-b">
                <span className="text-lg font-semibold">Portfolio Admin</span>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto">
                <nav className="flex-1 space-y-1 px-4 py-4">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                            <item.icon
                                className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                                aria-hidden="true"
                            />
                            {item.name}
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t">
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-red-700 hover:bg-red-50 hover:text-red-900"
                    >
                        <LogOut
                            className="mr-3 h-5 w-5 flex-shrink-0 text-red-400 group-hover:text-red-500"
                            aria-hidden="true"
                        />
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    );
}
