import { Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, DoorOpen, CalendarCheck, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';

export const HotelAdminLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();

  const sidebarItems = [
    { label: 'Dashboard', href: '/hotel-admin/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Rooms', href: '/hotel-admin/rooms', icon: <DoorOpen className="h-4 w-4" /> },
    { label: 'Bookings', href: '/hotel-admin/bookings', icon: <CalendarCheck className="h-4 w-4" /> },
    { label: 'Profile', href: '/hotel-admin/hotel-profile', icon: <User className="h-4 w-4" /> },
  ];

  const getPageTitle = () => {
    if (location.pathname.includes('/rooms')) return 'Rooms Management';
    if (location.pathname.includes('/bookings')) return 'Bookings';
    if (location.pathname.includes('/hotel-profile')) return 'Hotel Profile';
    return 'Dashboard';
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar items={sidebarItems} />
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <span className="text-sm">{user?.firstName} {user?.lastName}</span>
          </div>
        </header>
        <main className="flex-1 bg-muted/40 p-6">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
};