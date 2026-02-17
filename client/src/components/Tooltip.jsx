import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

export default function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  const [above, setAbove] = useState(true);
  const btnRef = useRef(null);

  useEffect(() => {
    if (show && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // If not enough space above (less than 80px), show below
      setAbove(rect.top > 80);
    }
  }, [show]);

  return (
    <span className="relative inline-block ml-1">
      <button
        ref={btnRef}
        type="button"
        className="text-slate-500 hover:text-cyan-400 focus:outline-none transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
      >
        <HelpCircle size={16} />
      </button>
      {show && (
        <div
          className={`absolute z-50 w-64 p-3 text-sm rounded-lg shadow-xl -left-28 ${
            above ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          {text}
          {/* Arrow */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 ${
              above ? '-bottom-1.5' : '-top-1.5'
            }`}
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRight: above ? '1px solid rgba(255,255,255,0.15)' : 'none', borderBottom: above ? '1px solid rgba(255,255,255,0.15)' : 'none', borderLeft: above ? 'none' : '1px solid rgba(255,255,255,0.15)', borderTop: above ? 'none' : '1px solid rgba(255,255,255,0.15)' }}
          />
        </div>
      )}
    </span>
  );
}
