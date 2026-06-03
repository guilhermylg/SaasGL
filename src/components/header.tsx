"use client";

import { Bell, Search } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-pitch-border bg-pitch-bg-alt/80 px-6 backdrop-blur-sm">
      {/* Search */}
      <div className="relative max-w-xs flex-1">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          type="text"
          placeholder="Buscar liga ou jogo..."
          className="input-pitch w-full pl-9 text-sm"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-text-muted transition-colors hover:bg-pitch-surface hover:text-text-primary">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-verde" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-verde/20 flex items-center justify-center">
            <span className="text-xs font-bold text-verde">U</span>
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-text-primary">
              Usuário
            </div>
            <div className="text-xs text-text-muted">Organizador</div>
          </div>
        </div>
      </div>
    </header>
  );
}
