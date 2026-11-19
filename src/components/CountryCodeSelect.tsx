import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { COUNTRY_CODES, type CountryCode } from '../utils/countryCodes';

interface CountryCodeSelectProps {
  value: CountryCode;
  onChange: (country: CountryCode) => void;
}

export function CountryCodeSelect({ value, onChange }: CountryCodeSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => searchInputRef.current?.focus(), 20);
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRY_CODES;
    const cleanCode = q.replace(/^\+/, '');
    return COUNTRY_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.iso.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.dialCode.replace(/^\+/, '').startsWith(cleanCode)
    );
  }, [search]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label={`Country code ${value.name} ${value.dialCode}`}
        aria-expanded={open}
        className="h-10 px-2.5 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] border border-transparent focus:border-[#5B5CE6] text-sm flex items-center gap-1.5 whitespace-nowrap shrink-0 hover:bg-slate-200/70 dark:hover:bg-[#2C3B4B] transition-colors"
      >
        <span className="text-base leading-none">{value.flag}</span>
        <span className="font-mono text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-100">
          {value.dialCode}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-50 w-72 max-w-[82vw] rounded-2xl bg-white dark:bg-[#1E2B38] shadow-2xl border border-slate-200 dark:border-[#2C3B4B] overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-[#2C3B4B]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or +code..."
                className="w-full h-9 pl-8 pr-2.5 rounded-xl bg-[#F4F4F5] dark:bg-[#242F3D] text-xs focus:outline-none focus:ring-2 focus:ring-[#5B5CE6]"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No country matches</div>
            ) : (
              filtered.map((country) => {
                const selected =
                  country.iso === value.iso && country.dialCode === value.dialCode;
                return (
                  <button
                    key={`${country.iso}-${country.dialCode}`}
                    type="button"
                    onClick={() => {
                      onChange(country);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={`w-full px-3 py-2 min-h-[40px] flex items-center justify-between gap-2 text-left text-xs transition-colors ${
                      selected
                        ? 'bg-[#5B5CE6]/12 text-[#5B5CE6] dark:text-[#A78BFA] font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-[#263545] text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-base leading-none shrink-0">{country.flag}</span>
                      <span className="truncate">{country.name}</span>
                    </span>
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                      {country.dialCode}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
