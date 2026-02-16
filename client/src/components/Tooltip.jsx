import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export default function Tooltip({ text }) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-block ml-1">
      <button
        type="button"
        className="text-slate-500 hover:text-cyan-400 focus:outline-none transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
      >
        <HelpCircle size={16} />
      </button>
      {show && (
        <div className="absolute z-50 w-64 p-3 text-sm text-slate-300 glass-strong rounded-lg -left-28 top-6">
          {text}
        </div>
      )}
    </span>
  );
}
