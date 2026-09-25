interface ColumnHeaderProps {
  title: string;
  count: number;
}

export const ColumnHeader = ({ title, count }: ColumnHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      <span className="rounded-card bg-surface px-2 py-0.5 text-xs text-text-muted">{count}</span>
    </div>
  );
};
