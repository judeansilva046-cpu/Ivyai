"use client";

import { useDeferredValue, useMemo } from "react";

type Props = {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

/** Campo de busca do DeliveryHub */
export function SearchField({
  placeholder = "Buscar...",
  value,
  onChange,
  className = "",
}: Props) {
  return (
    <div className={`relative ${className}`}>
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dh-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        type="search"
        className="input pl-10"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      />
    </div>
  );
}

export function useSearchFilter<T>(
  items: T[],
  query: string,
  getText: (item: T) => string
) {
  const deferred = useDeferredValue(query.trim().toLowerCase());
  return useMemo(() => {
    if (!deferred) return items;
    return items.filter((item) =>
      getText(item).toLowerCase().includes(deferred)
    );
  }, [items, deferred, getText]);
}
