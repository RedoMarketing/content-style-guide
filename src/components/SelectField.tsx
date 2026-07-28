"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "./icons";

export interface SelOption {
  id: string;
  label: string;
}

export default function SelectField({
  value,
  options,
  onChange,
}: {
  value: string;
  options: SelOption[];
  onChange: (v: string) => void;
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

  const selected = options.find((o) => o.id === value) ?? options[0];

  return (
    <div className="fdrop" ref={ref}>
      <button
        type="button"
        className="fpill"
        data-active={!!value}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="fpill-label">{selected?.label}</span>
        <ChevronDown size={15} />
      </button>

      {open && (
        <div className="fmenu" role="listbox">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              role="option"
              aria-selected={value === o.id}
              data-sel={value === o.id}
              onClick={() => {
                onChange(o.id);
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
