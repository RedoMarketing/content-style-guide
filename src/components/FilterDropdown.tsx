"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, CloseIcon } from "./icons";

export interface Option {
  id: string;
  label: string;
}

export default function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: Option[];
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = value ? options.find((o) => o.id === value) : null;
  const active = !!selected;

  return (
    <div className="fdrop" ref={ref}>
      <button
        className="fpill"
        data-active={active}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="fpill-label">{selected ? selected.label : label}</span>
        {active ? (
          <span
            className="fpill-x"
            role="button"
            aria-label={`Clear ${label}`}
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
              setOpen(false);
            }}
          >
            <CloseIcon size={13} />
          </span>
        ) : (
          <ChevronDown size={15} />
        )}
      </button>

      {open && (
        <div className="fmenu" role="listbox">
          {options.map((o) => (
            <button
              key={o.id}
              role="option"
              aria-selected={value === o.id}
              data-sel={value === o.id}
              onClick={() => {
                onChange(value === o.id ? null : o.id);
                setOpen(false);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
