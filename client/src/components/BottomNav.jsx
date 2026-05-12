import { NavLink } from 'react-router-dom';
import { FiMessageCircle, FiHome, FiList, FiTrendingUp, FiBook, FiUsers, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './BottomNav.css';

const USER_TABS = [
  { to: '/chat',      icon: FiMessageCircle, label: 'Chat' },
  { to: '/dashboard', icon: FiHome,           label: 'Home' },
  { to: '/food',      icon: FiList,           label: 'Food' },
  { to: '/groups',    icon: FiUsers,          label: 'Groups' },
  { to: '/progress',  icon: FiTrendingUp,     label: 'Progress' },
];

const COACH_TABS = [
  { to: '/coach',        icon: FiUsers,          label: 'Clients' },
  { to: '/coach/groups', icon: FiMessageCircle,  label: 'Groups' },
  { to: '/exercises',    icon: FiBook,           label: 'Exercises' },
  { to: '/coach/profile', icon: FiUser,           label: 'Profile' },
];

export default function BottomNav() {
  const { user } = useAuth();
  const TABS = user?.role === 'COACH' ? COACH_TABS : USER_TABS;

  return (
    <nav className="bottom-nav">
      {TABS.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <Icon size={22} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
