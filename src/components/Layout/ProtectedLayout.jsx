
import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/authcontexts';

export default function ProtectedLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/issues', label: 'Dashboard' },
    { to: '/new', label: 'New Issue' },
    { to: '/resolved', label: 'Resolved' },
    { to: '/innovation-records', label: 'Innovation Records' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <header className="bg-white border-b border-gray-200 md:hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">Problem Repo </h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-600 hover:text-gray-900 focus:outline-none cursor-pointer"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <nav className="bg-white border-t border-gray-200 px-4 py-3">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `block py-2 px-4 rounded-md transition-colors ${isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
              <li className="pt-2 border-t border-gray-100 mt-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left py-2 px-4 text-red-600 hover:bg-red-50 rounded-md"
                >
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        )}
      </header>

      <div className="flex">
        
        <aside className="hidden md:block w-64 bg-white border-r border-gray-200 h-screen sticky top-0 overflow-y-auto">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-10">Problem Repo</h1>

            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-lg transition-colors ${isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto pt-10 border-t border-gray-100">
              <div className="px-4 mb-4">
                <p className="text-sm text-gray-600 truncate">
                  {user?.displayName || user?.email}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full text-left cursor-pointer px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </aside>

        
        <div className="flex-1 flex flex-col min-h-screen">
          
          <header className="hidden md:flex bg-white border-b border-gray-200 px-6 py-4 items-center justify-between">
            <div className="text-xl font-semibold text-gray-800">
              Problem Repo
            </div>

            <div className="flex items-center gap-4">
              <span className="text-gray-600 text-sm truncate max-w-[240px]">
                {user?.displayName || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-50 cursor-pointer text-red-700 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </header>

        
          <main className="flex-1 p-4 sm:p-6 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}