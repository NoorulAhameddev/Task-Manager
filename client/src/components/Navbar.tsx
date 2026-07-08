import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-gray-900 text-white">
      <Link to="/tasks" className="font-semibold text-lg">
        Task Manager
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-300">{user?.name}</span>
        <button
          onClick={handleLogout}
          className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
