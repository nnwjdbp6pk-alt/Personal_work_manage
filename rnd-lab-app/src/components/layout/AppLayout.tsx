import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/projects', label: 'Projects' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/tasks', label: 'Tasks' },
];

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <nav className="w-56 bg-gray-800 text-gray-100 flex flex-col shrink-0">
        <div className="px-4 py-4 text-lg font-bold border-b border-gray-700">
          R&D Lab Manager
        </div>
        <ul className="flex-1 py-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `block px-4 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-gray-700 text-white font-medium'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="px-4 py-3 text-xs text-gray-500 border-t border-gray-700">
          v0.1.0
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}
