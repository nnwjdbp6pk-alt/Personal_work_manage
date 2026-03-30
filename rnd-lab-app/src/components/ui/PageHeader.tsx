import type { ReactNode } from 'react';

interface Props {
  title: string;
  children?: ReactNode;
}

export function PageHeader({ title, children }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}
