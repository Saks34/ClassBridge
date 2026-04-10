import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TeacherSidebar from './TeacherSidebar';
import TeacherTopBar from './TeacherTopBar';

export default function TeacherLayout() {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('teacher-sidebar-collapsed') === 'true';
    });

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('teacher-sidebar-collapsed', String(newState));
    };

    return (
        <div 
            className="flex h-screen bg-surface text-on-surface transition-all duration-500 overflow-hidden relative"
            style={{ '--sidebar-offset': isCollapsed ? '80px' : '256px' }}
        >


            <TeacherSidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />

            <div className={`flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 transition-all duration-500 ${isCollapsed ? 'pl-20' : 'pl-64'}`}>
                <TeacherTopBar isSidebarCollapsed={isCollapsed} />
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
