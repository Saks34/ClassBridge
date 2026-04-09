import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useTheme } from '../../context/ThemeContext';

export default function AdminLayout() {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('admin-sidebar-collapsed') === 'true';
    });

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('admin-sidebar-collapsed', String(newState));
    };

    const { isDark } = useTheme();

    return (
        <div className="flex h-screen bg-background transition-all duration-500 overflow-hidden">
            {/* Animated Background - Premium Aurora Effect */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-tertiary/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />

            <div className={`flex-1 flex flex-col overflow-hidden relative z-10 transition-all duration-500 ${isCollapsed ? 'pl-20' : 'pl-72'}`}>
                <TopBar />
                <main className="flex-1 overflow-y-auto p-6 pt-2">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
