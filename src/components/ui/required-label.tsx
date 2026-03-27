import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function RequiredLabel({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label className={cn(className)} {...props}>
      {children}
      <span className="text-destructive ml-0.5">*</span>
    </Label>
  );
}
