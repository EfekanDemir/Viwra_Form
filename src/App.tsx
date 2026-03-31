import React from 'react';
import { Scene1 } from './components/Scene1';

export default function App() {
  return (
    <div className="w-full h-screen bg-viwra-navy text-viwra-bone selection:bg-viwra-bone/20 relative overflow-hidden">
      <div className="noise-overlay pointer-events-none absolute inset-0 z-0 opacity-40"></div>
      <div className="relative z-10 w-full h-full">
        <Scene1 />
      </div>
    </div>
  );
}

