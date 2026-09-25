interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

const VARIANT_CLASS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'border border-border bg-surface text-text',
  danger: 'bg-danger text-white hover:bg-danger-hover',
  ghost: 'bg-transparent text-text',
};

const SIZE_CLASS: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-base px-4 py-2',
  lg: 'text-lg px-5 py-2.5',
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  onClick,
  children,
}: ButtonProps) => {
  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={onClick}
      className={`rounded-card font-medium disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]}`}
    >
      {isLoading ? '처리중 ...' : children}
    </button>
  );
};
