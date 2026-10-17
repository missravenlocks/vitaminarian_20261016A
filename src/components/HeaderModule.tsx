import React from 'react';
import { SpinachLogo } from './SpinachLogo';

export const HeaderModule: React.FC = () => {
  return (
    <header className="w-full bg-white border-b border-slate-200/80 px-6 py-5 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SpinachLogo size={46} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
              Vitaminarian
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Customizable nutrition tracking
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 hidden sm:block">
          Nutritional Intelligence Platform
        </div>
      </div>
    </header>
  );
};
