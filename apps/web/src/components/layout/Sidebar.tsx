import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  items: SidebarItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ items }) => {
  const location = useLocation();

  return (
    <aside className="w-64 border-r bg-background hidden lg:block">
      <nav className="flex flex-col gap-1 p-4">
        {items.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
              location.pathname === item.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};