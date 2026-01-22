import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { BookOpen, CheckSquare, MessageSquare, Home, Menu } from 'lucide-react';
import { clsx } from 'clsx';

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    return (
        <div className="flex h-screen bg-gray-50 text-slate-900">
            {/* Sidebar */}
            <aside
                className={clsx(
                    "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
                    isSidebarOpen ? "w-64" : "w-20"
                )}
            >
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
                    {isSidebarOpen && <h1 className="font-bold text-xl text-indigo-600">Alaiso Hub</h1>}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                    >
                        <Menu size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <NavItem to="/" icon={<Home size={20} />} label="Home" isOpen={isSidebarOpen} />
                    <NavItem to="/prerequisites" icon={<CheckSquare size={20} />} label="Prerequisites" isOpen={isSidebarOpen} />
                    <NavItem to="/sops" icon={<BookOpen size={20} />} label="SOP Index" isOpen={isSidebarOpen} />
                    <NavItem to="/prompts" icon={<MessageSquare size={20} />} label="Prompts" isOpen={isSidebarOpen} />
                </nav>

                <div className="p-4 border-t border-gray-100 text-xs text-gray-400">
                    {isSidebarOpen && <p>© 2026 Alaiso Hub</p>}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

function NavItem({ to, icon, label, isOpen }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => clsx(
                "flex items-center p-3 rounded-xl transition-all",
                isActive
                    ? "bg-indigo-50 text-indigo-600 font-medium"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
        >
            <span className="shrink-0">{icon}</span>
            {isOpen && <span className="ml-3 truncate">{label}</span>}
        </NavLink>
    );
}
