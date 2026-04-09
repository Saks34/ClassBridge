import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './App.css'
import Login from './pages/Login.jsx'
import LandingPage from './pages/LandingPage.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import RoleRoute from './routes/RoleRoute.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import ErrorBoundary from './components/shared/ErrorBoundary.jsx'
import InstitutionSignup from './pages/InstitutionSignup.jsx'
import ChangePassword from './pages/ChangePassword.jsx'
import VODLibrary from './pages/shared/VODLibrary.jsx'
import Settings from './pages/shared/Settings.jsx'
import Notifications from './pages/shared/Notifications.jsx'
import NotFound from './pages/shared/NotFound.jsx'
import Support from './pages/shared/Support.jsx'
import Documentation from './pages/shared/Documentation.jsx'

// Admin components
import AdminLayout from './components/admin/AdminLayout.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminTeachers from './pages/admin/Teachers.jsx'
import AdminModerators from './pages/admin/Moderators.jsx'
import AdminStudents from './pages/admin/Students.jsx'
import AdminBatches from './pages/admin/Batches.jsx'
import AdminTimetable from './pages/admin/Timetable.jsx'
import AdminAnalytics from './pages/admin/Analytics.jsx'

// Teacher components
import TeacherLayout from './components/teacher/TeacherLayout.jsx'
import TeacherDashboard from './pages/teacher/Dashboard.jsx'
import TeacherClassDetail from './pages/teacher/ClassDetail.jsx'
import TeacherNotes from './pages/teacher/Notes.jsx'
import TeacherTimetable from './pages/teacher/Timetable.jsx'
import TeacherAssignments from './pages/teacher/Assignments.jsx'

// Student components
import StudentLayout from './components/student/StudentLayout.jsx'
import StudentDashboard from './pages/student/Dashboard.jsx'
import StudentClassDetail from './pages/student/ClassDetail.jsx'
import StudentNotes from './pages/student/Notes.jsx'
import StudentTimetable from './pages/student/Timetable.jsx'
import StudentAssignments from './pages/student/Assignments.jsx'

function HomeRedirect() {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role === 'Teacher') return <Navigate to="/teacher/dashboard" replace />
  if (role === 'Student') return <Navigate to="/student/dashboard" replace />
  return <Navigate to="/admin/dashboard" replace />
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route index element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/institution/signup" element={<InstitutionSignup />} />
          <Route path="/change-password" element={<ChangePassword />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomeRedirect />} />
            <Route path="/docs" element={<Documentation />} />

            <Route element={<RoleRoute allow={["InstitutionAdmin", "AcademicAdmin", "SuperAdmin"]} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="teachers" element={<AdminTeachers />} />
                <Route path="moderators" element={<AdminModerators />} />
                <Route path="students" element={<AdminStudents />} />
                <Route path="batches" element={<AdminBatches />} />
                <Route path="timetable" element={<AdminTimetable />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="live-class/:id" element={<TeacherClassDetail />} />
                <Route path="settings" element={<Settings />} />
                <Route path="support" element={<Support />} />
              </Route>
            </Route>

            <Route element={<RoleRoute allow={["Moderator"]} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="support" element={<Support />} />
              </Route>
            </Route>

            <Route element={<RoleRoute allow={["Teacher"]} />}>
              <Route path="/teacher" element={<TeacherLayout />}>
                <Route index element={<Navigate to="/teacher/dashboard" replace />} />
                <Route path="dashboard" element={<TeacherDashboard />} />
                <Route path="notes" element={<TeacherNotes />} />
                <Route path="timetable" element={<TeacherTimetable />} />
                <Route path="assignments" element={<TeacherAssignments />} />
                <Route path="library" element={<VODLibrary />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="settings" element={<Settings />} />
                <Route path="support" element={<Support />} />
              </Route>
              {/* Full Screen Live Class Control */}
              <Route path="/teacher/class/:id" element={<TeacherClassDetail />} />
            </Route>

            <Route element={<RoleRoute allow={["Student"]} />}>
              <Route path="/student" element={<StudentLayout />}>
                <Route index element={<Navigate to="/student/dashboard" replace />} />
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="notes" element={<StudentNotes />} />
                <Route path="timetable" element={<StudentTimetable />} />
                <Route path="assignments" element={<StudentAssignments />} />
                <Route path="library" element={<VODLibrary />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="settings" element={<Settings />} />
                <Route path="support" element={<Support />} />
              </Route>
              <Route path="/student/class/:id" element={<StudentClassDetail />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
