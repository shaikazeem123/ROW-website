import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TokenService } from '@/services/tokenService';

export function AppLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        // Initialize token sequence on login/mount
        TokenService.getLastToken();
    }, []);

    return (
        <div className="flex h-screen bg-background text-text-main font-sans overflow-hidden">
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                mobileOpen={mobileMenuOpen}
                onMobileClose={() => setMobileMenuOpen(false)}
            />

            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                <Header onMenuClick={() => setMobileMenuOpen(true)} />

                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
                    <div className="max-w-7xl mx-auto w-full min-w-0">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
