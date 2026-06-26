import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({
  items,
  className = '',
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={`text-sm text-zinc-500 ${className}`}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />}
            {item.href ? (
              <Link href={item.href} className="hover:text-[#00A3A1]">
                {item.label}
              </Link>
            ) : (
              <span className="text-[#0A2540]">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}