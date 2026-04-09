import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import StudentSidebar from './StudentSidebar';
import StudentTopBar from './StudentTopBar';

export default function StudentLayout() {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('sidebar-collapsed') === 'true';
    });

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', String(newState));
    };

    return (
        <div className="flex h-screen bg-background text-on-background transition-all duration-500 overflow-hidden">
            <StudentSidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />

            <div className={`flex-1 flex flex-col overflow-hidden relative z-10 transition-all duration-500 ${isCollapsed ? 'pl-20' : 'pl-64'}`}>
                <StudentTopBar isSidebarCollapsed={isCollapsed} />
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
