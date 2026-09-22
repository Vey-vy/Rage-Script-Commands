import { forwardRef, InputHTMLAttributes } from 'react';

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <label className="inline-flex items-center gap-2 cursor-pointer" htmlFor={checkboxId}>
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={`
            h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-bg-elevated)]
            text-[var(--color-accent)]
            focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)]
            checked:border-[var(--color-accent)] checked:bg-[var(--color-accent)]
            transition-colors duration-150
            ${className}
          `}
          {...props}
        />
        {label && <span className="text-sm text-[var(--color-fg)]">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';