type FilterType = 'all' | 'week' | 'overdue';

interface FilterBarProps {
  weekCount: number;
  overdueCount: number;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const BASE_CLASS = 'rounded-card px-3 py-1.5 text-sm font-medium border';
const ACTIVE_CLASS = 'border-primary bg-primary text-white';
const INACTIVE_CLASS = 'border-border bg-surface text-text';

export const FilterBar = ({
  weekCount,
  overdueCount,
  activeFilter,
  onFilterChange,
}: FilterBarProps) => {
  const handleClick = (filter: FilterType) => {
    onFilterChange(activeFilter === filter ? 'all' : filter);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-pressed={activeFilter === 'week'}
        onClick={() => handleClick('week')}
        className={`${BASE_CLASS} ${activeFilter === 'week' ? ACTIVE_CLASS : INACTIVE_CLASS}`}
      >
        이번주 업무 {weekCount}
      </button>
      <button
        type="button"
        aria-pressed={activeFilter === 'overdue'}
        onClick={() => handleClick('overdue')}
        className={`${BASE_CLASS} ${activeFilter === 'overdue' ? ACTIVE_CLASS : INACTIVE_CLASS}`}
      >
        일정 초과 {overdueCount}
      </button>
    </div>
  );
};
