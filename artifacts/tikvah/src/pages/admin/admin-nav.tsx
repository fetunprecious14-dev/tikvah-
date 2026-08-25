import { Link } from 'wouter';

const items = [
  { href: '/admin', key: 'inbox', label: 'Inbox' },
  { href: '/admin/resources', key: 'resources', label: 'Resources' },
  {
    href: '/admin/professionals',
    key: 'professionals',
    label: 'Professionals',
  },
  { href: '/admin/analytics', key: 'analytics', label: 'Analytics' },
] as const;

export function AdminNav({ active }: { active: 'inbox' | 'analytics' | 'resources' | 'professionals' }) {
  return (
    <nav className="flex gap-2" aria-label="Admin navigation">
      {items.map(item => (
        <Link
          key={item.key}
          href={item.href}
          data-testid={`link-admin-nav-${item.key}`}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${active === item.key ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:border-primary hover:text-primary'}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
