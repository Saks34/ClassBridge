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
        <div className="flex h-screen bg-surface text-on-surface transition-all duration-500 overflow-hidden relative">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-primary opacity-[0.05] rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-secondary opacity-[0.05] rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-tertiary opacity-[0.05] rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <TeacherSidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />

            <div className={`flex-1 flex flex-col overflow-hidden relative z-10 transition-all duration-500 ${isCollapsed ? 'pl-20' : 'pl-64'}`}>
                <TeacherTopBar isSidebarCollapsed={isCollapsed} />
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
