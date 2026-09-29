import { Button } from '@/client/components/Button';

interface BoardHeaderProps {
  onCreateClick: () => void;
}

export const BoardHeader = ({ onCreateClick }: BoardHeaderProps) => {
  return (
    <header className="flex items-center justify-between gap-4">
      <h1 className="text-xl font-semibold text-text">Tika</h1>
      <input
        type="text"
        disabled
        placeholder="검색 (준비 중)"
        className="form-input flex-1 max-w-sm"
      />
      <Button variant="primary" onClick={onCreateClick}>
        새 업무
      </Button>
    </header>
  );
};
