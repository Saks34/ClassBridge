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
        <div 
            className="flex h-screen bg-background transition-all duration-500 overflow-hidden"
            style={{ '--sidebar-offset': isCollapsed ? '80px' : '288px' }}
        >


            <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />

            <div className={`flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 transition-all duration-500 ${isCollapsed ? 'pl-20' : 'pl-72'}`}>
                <TopBar />
                <main className="flex-1 overflow-y-auto p-6 pt-2">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
