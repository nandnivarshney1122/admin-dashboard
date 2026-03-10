import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "accent" | "warning" | "success";
  className?: string;
}

const variantStyles = {
  default: "bg-card",
  primary: "gradient-primary text-primary-foreground",
  accent: "gradient-accent text-accent-foreground",
  warning: "gradient-warm text-warning-foreground",
  success: "gradient-success text-success-foreground",
};

const iconVariantStyles = {
  default: "bg-primary/10 text-primary",
  primary: "bg-primary-foreground/20 text-primary-foreground",
  accent: "bg-accent-foreground/20 text-accent-foreground",
  warning: "bg-warning-foreground/20 text-warning-foreground",
  success: "bg-success-foreground/20 text-success-foreground",
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) => {
  const isGradient = variant !== "default";

  return (
    <div
      className={cn(
        "rounded-2xl p-5 lg:p-6 shadow-card hover:shadow-card-hover transition-all duration-300 animate-scale-in",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p
            className={cn(
              "text-sm font-medium",
              isGradient ? "opacity-80" : "text-muted-foreground"
            )}
          >
            {title}
          </p>
          <p className="text-2xl lg:text-3xl font-display font-bold">{value}</p>
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  trend.isPositive
                    ? isGradient
                      ? "bg-primary-foreground/20"
                      : "bg-success/10 text-success"
                    : isGradient
                    ? "bg-primary-foreground/20"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
              </span>
              <span
                className={cn(
                  "text-xs",
                  isGradient ? "opacity-70" : "text-muted-foreground"
                )}
              >
                vs last month
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "p-3 rounded-xl",
            iconVariantStyles[variant]
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
