import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AuthRoute, SetupRoute } from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import BottomNav from './components/BottomNav';

import Landing         from './pages/Landing';
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import Setup           from './pages/Setup';
import Chat            from './pages/Chat';
import Dashboard       from './pages/Dashboard';
import FoodLog         from './pages/FoodLog';
import WorkoutLog      from './pages/WorkoutLog';
import Progress        from './pages/Progress';
import Profile         from './pages/Profile';
import ExerciseLibrary from './pages/ExerciseLibrary';
import MyPlan          from './pages/MyPlan';
import MyDiet          from './pages/MyDiet';
import CoachDashboard  from './pages/CoachDashboard';
import CoachClientDetail from './pages/CoachClientDetail';
import CoachChat       from './pages/CoachChat';
import CoachGroups     from './pages/CoachGroups';
import CoachProfile    from './pages/CoachProfile';
import GroupChat       from './pages/GroupChat';
import UserCoachChat   from './pages/UserCoachChat';
import ForgotPassword  from './pages/ForgotPassword';

import { FiMessageCircle, FiHome, FiList, FiActivity, FiTrendingUp, FiUser, FiLogOut, FiBook, FiUsers } from 'react-icons/fi';
import './App.css';

// Route guard for coach-only pages
function CoachRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.setupDone) return <Navigate to="/setup" replace />;
  if (user.role !== 'COACH') return <Navigate to="/dashboard" replace />;
  return children;
}

const USER_NAV_TABS = [
  { to: '/chat',      label: 'Chat',      icon: FiMessageCircle },
  { to: '/dashboard', label: 'Home',      icon: FiHome },
  { to: '/exercises', label: 'Exercises', icon: FiBook },
  { to: '/food',      label: 'Food',      icon: FiList },
  { to: '/progress',  label: 'Progress',  icon: FiTrendingUp },
];

const COACH_NAV_TABS = [
  { to: '/coach',        label: 'Clients',   icon: FiUsers },
  { to: '/coach/groups', label: 'Groups',    icon: FiMessageCircle },
  { to: '/exercises',    label: 'Exercises', icon: FiBook },
];

function TopNav() {
  const { user, logout } = useAuth();
  if (!user || !user.setupDone) return null;

  const isCoach = user.role === 'COACH';
  const tabs = isCoach ? COACH_NAV_TABS : USER_NAV_TABS;

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <NavLink to={isCoach ? '/coach' : '/chat'} className="top-nav-logo">💪 FitBot</NavLink>
        <nav className="top-nav-links">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={15} />{label}
            </NavLink>
          ))}
          {!isCoach && (
            <>
              <NavLink to="/groups" className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}>
                <FiUsers size={15} /> Groups
              </NavLink>
              <NavLink to="/my-plan" className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}>
                📋 My Plan
              </NavLink>
              <NavLink to="/my-diet" className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}>
                🥗 My Diet
              </NavLink>
              <NavLink to="/chat/coach" className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}>
                🏅 Coach
              </NavLink>
            </>
          )}
        </nav>
        <div className="top-nav-right">
          <NavLink to="/profile" className="top-nav-link"><FiUser size={15} /> Profile</NavLink>
          <button className="top-nav-link" onClick={logout} style={{ cursor: 'pointer' }}>
            <FiLogOut size={15} /> Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const { user } = useAuth();
  const isCoach = user?.role === 'COACH';

  return (
    <>
      <ScrollToTop />
      <TopNav />
      <Routes>
        {/* Public */}
        <Route path="/" element={
          user?.setupDone
            ? <Navigate to={isCoach ? '/coach' : '/chat'} replace />
            : <Landing />
        } />
        <Route path="/login" element={
          user
            ? <Navigate to={user.setupDone ? (isCoach ? '/coach' : '/chat') : '/setup'} replace />
            : <LoginPage />
        } />
        <Route path="/register" element={
          user
            ? <Navigate to={user.setupDone ? (isCoach ? '/coach' : '/chat') : '/setup'} replace />
            : <RegisterPage />
        } />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Auth required, setup optional */}
        <Route path="/setup" element={<AuthRoute><Setup /></AuthRoute>} />

        {/* Auth + setup required (User pages) */}
        <Route path="/chat"       element={<SetupRoute><Chat /></SetupRoute>} />
        <Route path="/dashboard"  element={<SetupRoute><Dashboard /></SetupRoute>} />
        <Route path="/exercises"  element={<SetupRoute><ExerciseLibrary /></SetupRoute>} />
        <Route path="/food"       element={<SetupRoute><FoodLog /></SetupRoute>} />
        <Route path="/workout"    element={<SetupRoute><WorkoutLog /></SetupRoute>} />
        <Route path="/progress"   element={<SetupRoute><Progress /></SetupRoute>} />
        <Route path="/my-plan"    element={<SetupRoute><MyPlan /></SetupRoute>} />
        <Route path="/my-diet"    element={<SetupRoute><MyDiet /></SetupRoute>} />
        <Route path="/chat/coach" element={<SetupRoute><UserCoachChat /></SetupRoute>} />
        <Route path="/groups"            element={<SetupRoute><CoachGroups /></SetupRoute>} />
        <Route path="/groups/:groupId"   element={<SetupRoute><GroupChat /></SetupRoute>} />
        <Route path="/profile"           element={<SetupRoute>{isCoach ? <CoachProfile /> : <Profile />}</SetupRoute>} />

        {/* Coach-only pages */}
        <Route path="/coach"                   element={<CoachRoute><CoachDashboard /></CoachRoute>} />
        <Route path="/coach/client/:clientId"  element={<CoachRoute><CoachClientDetail /></CoachRoute>} />
        <Route path="/coach/chat/:clientId"    element={<CoachRoute><CoachChat /></CoachRoute>} />
        <Route path="/coach/groups"            element={<CoachRoute><CoachGroups /></CoachRoute>} />
        <Route path="/coach/groups/:groupId"   element={<CoachRoute><GroupChat /></CoachRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Mobile bottom nav — only shown when logged in and setup done */}
      {user?.setupDone && <BottomNav />}
    </>
  );
}
