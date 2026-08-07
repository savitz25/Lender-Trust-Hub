import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Lender Trust Hub buttons — Deep Emerald Teal primary (#0D9488).
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[#0D9488] text-white hover:bg-[#059669]',
        outline:
          'border border-[#E2E8F0] bg-white text-[#0A2540] hover:border-[#0D9488]/40 hover:bg-[#CCFBF1]/40',
        ghost: 'text-[#0A2540] hover:bg-[#CCFBF1]/50 hover:text-[#059669]',
        trust: 'bg-[#0D9488] text-white hover:bg-[#059669]',
        navy: 'bg-[#0A2540] text-white hover:bg-[#0A2540]/90',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-12 px-8 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}
