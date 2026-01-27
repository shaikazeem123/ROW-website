import {
    ChevronLeft,
    ChevronRight,
    LogOut
} from 'lucide-react';
import { SidebarMenu } from '../navigation/SidebarMenu';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
    collapsed: boolean;
    onToggleCollapse: () => void;
    mobileOpen: boolean;
    onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }: SidebarProps) {
    const { logout } = useAuth();

    // Mobile overlay styles
    const mobileClasses = mobileOpen
        ? "absolute inset-y-0 left-0 z-30 translate-x-0 w-64 shadow-xl"
        : "absolute inset-y-0 left-0 z-30 -translate-x-full w-64";

    // Desktop styles
    const desktopClasses = `hidden md:flex flex-col bg-surface border-r border-gray-200 h-full transition-all duration-300 ease-in-out ${collapsed ? "w-20" : "w-64"
        }`;

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-surface">
            <div className={`h-16 flex items-center border-b border-gray-100 ${collapsed ? 'justify-center' : 'px-6 justify-between'}`}>
                {!collapsed && <span className="font-bold text-2xl text-primary tracking-tight">ROW</span>}
                {/* Mobile close button */}
                <button className="md:hidden p-2 text-text-muted" onClick={onMobileClose}>
                    <ChevronLeft size={20} />
                </button>
            </div>

            <SidebarMenu collapsed={collapsed} mobileOpen={mobileOpen} onMobileClose={onMobileClose} />

            <div className="p-4 border-t border-gray-100">
                {/* Collapse Toggle (Desktop Only) */}
                {!mobileOpen && (
                    <button
                        onClick={onToggleCollapse}
                        className="hidden md:flex w-full items-center justify-center p-2 text-text-muted hover:bg-gray-50 rounded-lg mb-2"
                    >
                        {collapsed ? <ChevronRight size={20} /> : <div className="flex items-center w-full"><ChevronLeft size={20} /><span className="ml-2 text-sm">Collapse</span></div>}
                    </button>
                )}

                <button
                    onClick={() => logout()}
                    className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer w-full text-left ${collapsed ? 'justify-center' : ''}`}
                >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                        AD
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-main truncate">Admin</p>
                            <p className="text-xs text-text-muted truncate">admin@row.org</p>
                        </div>
                    )}
                    {!collapsed && <LogOut size={16} className="text-text-muted hover:text-red-500 ml-auto" />}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Overlay Backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={onMobileClose}
                />
            )}

            {/* Mobile Sidebar */}
            <aside className={`md:hidden ${mobileClasses} transition-transform duration-300 ease-in-out`}>
                <SidebarContent />
            </aside>

            {/* Desktop Sidebar */}
            <aside className={desktopClasses}>
                <SidebarContent />
            </aside>
        </>
    );
}
