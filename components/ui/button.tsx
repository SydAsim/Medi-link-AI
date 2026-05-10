import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-red-600 to-red-500 text-slate-900 dark:text-white hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-500/25 hover:shadow-red-500/40",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-100 dark:bg-slate-800 hover:text-slate-900 dark:text-slate-100 text-slate-700 dark:text-slate-300",
        secondary:
          "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-700",
        ghost: "hover:bg-slate-100 dark:bg-slate-800 hover:text-slate-900 dark:text-slate-100 text-slate-600 dark:text-slate-400",
        link: "text-red-400 underline-offset-4 hover:underline",
        success:
          "bg-gradient-to-r from-emerald-600 to-emerald-500 text-slate-900 dark:text-white hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/25",
        warning:
          "bg-gradient-to-r from-amber-600 to-amber-500 text-slate-900 dark:text-white hover:from-amber-500 hover:to-amber-400 shadow-lg shadow-amber-500/25",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
