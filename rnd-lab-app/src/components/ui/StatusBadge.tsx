const colors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  paused: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-gray-100 text-gray-500',
  todo: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  IN: 'bg-green-100 text-green-700',
  OUT: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-600',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-500',
};

const labels: Record<string, string> = {
  active: '진행중',
  completed: '완료',
  paused: '일시중지',
  archived: '보관',
  todo: '예정',
  in_progress: '진행중',
  done: '완료',
  IN: '입고',
  OUT: '출고',
  high: '높음',
  medium: '보통',
  low: '낮음',
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[value] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[value] ?? value}
    </span>
  );
}
