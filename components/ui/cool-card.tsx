import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const coolCardVariants = cva("w-full relative transition-all duration-300", {
  variants: {
    variant: {
      default: [
        "border rounded-lg",
        "border-zinc-200 dark:border-zinc-800",
        "bg-white dark:bg-zinc-950",
        "shadow-sm hover:shadow-md",
      ],
      glass: [
        "rounded-xl backdrop-blur-md",
        "bg-white/30 dark:bg-zinc-900/30",
        "border border-white/40 dark:border-zinc-700/40",
        "shadow-xl hover:shadow-2xl",
      ],
      floating: [
        "rounded-xl",
        "bg-white dark:bg-zinc-900",
        "border border-zinc-200 dark:border-zinc-800",
        "shadow-lg hover:-translate-y-1 hover:shadow-xl",
      ],
      pattern: [
        "rounded-xl overflow-hidden",
        "bg-white dark:bg-zinc-900",
        "border border-zinc-200 dark:border-zinc-800",
        "shadow-md hover:shadow-lg",
      ],
      gradient: [
        "rounded-xl overflow-hidden",
        "bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900",
        "border border-blue-200/50 dark:border-zinc-700",
        "shadow-lg hover:shadow-xl",
      ],
      neon: [
        "rounded-xl",
        "bg-white dark:bg-zinc-900",
        "border-2 border-blue-200 dark:border-blue-800",
        "shadow-lg hover:shadow-blue-500/25 dark:hover:shadow-blue-400/25",
        "hover:border-blue-300 dark:hover:border-blue-600",
      ],
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface CoolCardProps
  extends Omit<
      React.HTMLAttributes<HTMLDivElement>,
      | "onDrag"
      | "onDragEnd"
      | "onDragStart"
      | "onAnimationStart"
      | "onAnimationEnd"
    >,
    VariantProps<typeof coolCardVariants> {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  highlight?: boolean;
}

const CoolCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6", className)} {...props}>
    {props.children}
  </div>
));
CoolCardContent.displayName = "CoolCardContent";

const CoolCard = React.forwardRef<HTMLDivElement, CoolCardProps>(
  (
    {
      className,
      variant,
      title,
      description,
      icon,
      footer,
      highlight = false,
      children,
      ...props
    },
    ref
  ) => {
    const PatternBackground = () => (
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "30px 30px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-white/90 via-white/40 to-white/10 dark:from-zinc-900/90 dark:via-zinc-900/40 dark:to-zinc-900/10" />
      </div>
    );

    const content = (
      <CoolCardContent>
        <div className="flex items-start gap-4">
          {icon && (
            <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              {icon}
            </div>
          )}
          <div className="flex-1">
            {title && (
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {title}
                {highlight && (
                  <Sparkles className="inline-block ml-2 h-4 w-4 text-amber-400" />
                )}
              </h3>
            )}
            {description && (
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {description}
              </p>
            )}
            {children}
          </div>
        </div>
        {footer && (
          <>
            <div className="h-px w-full bg-gray-200 dark:bg-gray-700 my-4" />
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {footer}
            </div>
          </>
        )}
      </CoolCardContent>
    );

    if (variant === "pattern") {
      return (
        <motion.div
          ref={ref}
          className={cn(
            coolCardVariants({ variant, className }),
            "group relative"
          )}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          {...(props as any)}
        >
          <PatternBackground />
          {content}
        </motion.div>
      );
    }

    if (variant === "glass" || variant === "floating" || variant === "neon") {
      return (
        <motion.div
          ref={ref}
          className={cn(coolCardVariants({ variant, className }), "group")}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          whileHover={{ scale: 1.02 }}
          {...(props as any)}
        >
          {content}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(coolCardVariants({ variant, className }), "group")}
        {...props}
      >
        {content}
      </div>
    );
  }
);
CoolCard.displayName = "CoolCard";

export function CoolCardDemo() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Cool Card Collection
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Beautiful, modern card designs with various effects and animations
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <CoolCard
            variant="glass"
            title="Glass Morphism"
            description="A sleek card with modern glass morphism effect that adds depth while maintaining perfect readability and visual appeal."
            icon={<Sparkles className="h-5 w-5 text-blue-600" />}
            highlight
            footer="Premium Design"
          />

          <CoolCard
            variant="floating"
            title="Floating Animation"
            description="This card gently floats on hover, creating an interactive and engaging user experience with smooth transitions."
            icon={
              <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
            }
            footer="Last updated: Today"
          />

          <CoolCard
            variant="pattern"
            title="Subtle Pattern"
            description="Features a subtle dot pattern background that adds visual interest without overwhelming the content."
            icon={
              <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-blue-500 rounded" />
            }
          />

          <CoolCard
            variant="gradient"
            title="Gradient Background"
            description="Beautiful gradient background that creates a modern and vibrant look for your content."
            icon={
              <div className="w-5 h-5 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg" />
            }
            footer="Trending Design"
          />

          <CoolCard
            variant="neon"
            title="Neon Glow Effect"
            description="A futuristic card with neon border effects that glow on hover, perfect for modern applications."
            icon={
              <div className="w-5 h-5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-pulse" />
            }
            highlight
          />

          <CoolCard
            variant="default"
            title="Classic Clean"
            description="A clean, minimal card design that focuses on content while maintaining elegance and readability."
            icon={<div className="w-5 h-5 bg-gray-500 rounded" />}
            footer="Timeless Design"
          />
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Custom Content Examples
          </h2>

          <div className="grid gap-8 md:grid-cols-2">
            <CoolCard variant="glass">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">AI</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      AI Trading Strategy
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Advanced machine learning
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      +24.5%
                    </div>
                    <div className="text-xs text-gray-500">Performance</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">152</div>
                    <div className="text-xs text-gray-500">Trades</div>
                  </div>
                </div>
              </div>
            </CoolCard>

            <CoolCard variant="neon">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Portfolio Overview
                  </h3>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    ₹12,45,678
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    +8.4% this month
                  </div>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" />
                </div>
              </div>
            </CoolCard>
          </div>
        </div>
      </div>
    </div>
  );
}

export { CoolCard, CoolCardContent };
export default CoolCard;
