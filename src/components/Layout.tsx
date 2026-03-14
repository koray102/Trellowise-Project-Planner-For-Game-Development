import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden text-slate-200">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-900/50">
        {children}
      </main>
    </div>
  );
}
