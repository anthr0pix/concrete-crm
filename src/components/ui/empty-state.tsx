import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateAction =
  | { label: string; href: string; onClick?: never }
  | { label: string; onClick: () => void; href?: never };

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "text-center py-20 rounded-xl border-2 border-dashed border-border",
        className
      )}
    >
      <Icon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-lg font-semibold text-foreground mb-1">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mb-5">{description}</p>
      )}
      {action &&
        (action.href ? (
          <Link href={action.href}>
            <Button>{action.label}</Button>
          </Link>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        ))}
    </div>
  );
}
