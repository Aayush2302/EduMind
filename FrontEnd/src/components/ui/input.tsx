import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full bg-transparent text-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "h-10 rounded-sm border border-border bg-surface-1 px-3 py-2 text-sm focus-visible:border-foreground",
        underline:
          "h-10 border-b border-border bg-transparent px-0 py-2 text-sm focus-visible:border-foreground rounded-none",
        ghost:
          "h-10 border-transparent bg-transparent px-3 py-2 text-sm focus-visible:bg-surface-1 rounded-sm",
        search:
          "h-10 rounded-sm border border-border bg-surface-1 pl-10 pr-3 py-2 text-sm focus-visible:border-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
