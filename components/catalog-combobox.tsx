"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronDown, Plus } from "lucide-react";

interface CatalogItem {
  id: number;
  nombre: string;
  descripcion?: string;
}

interface CatalogComboboxProps {
  tipo: "especie" | "tratamiento";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

export function CatalogCombobox({
  tipo,
  value,
  onChange,
  placeholder,
  label,
  required,
  className,
  id,
}: CatalogComboboxProps) {
  const [query, setQuery] = useState(value || "");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightNew, setHighlightNew] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value changes (e.g. when IA identifies species)
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const fetchItems = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/catalogo?tipo=${tipo}&q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.data || []);
      }
    } catch (e) {
      console.error("Error fetching catalog:", e);
    } finally {
      setLoading(false);
    }
  }, [tipo]);

  // Debounced search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val); // propagate immediately so form stays in sync

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchItems(val);
      setOpen(true);
    }, 250);
  };

  const handleFocus = () => {
    fetchItems(query);
    setOpen(true);
  };

  const handleSelect = (nombre: string) => {
    setQuery(nombre);
    onChange(nombre);
    setOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Show "create new" hint if typed value is not in list
  const exactMatch = items.some((i) => i.nombre.toLowerCase() === query.toLowerCase());
  const showNewHint = query.trim().length >= 2 && !exactMatch && open;

  return (
    <div className={`space-y-2 ${className || ""}`} ref={containerRef}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
          {value && (
            <span className="text-green-600 text-xs ml-2">✓ Seleccionada</span>
          )}
        </Label>
      )}
      <div className="relative">
        <Input
          id={id}
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder || `Buscar o escribir ${tipo}...`}
          autoComplete="off"
          className="pr-8 border-blue-200 focus:border-blue-500"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Dropdown */}
        {open && (items.length > 0 || showNewHint) && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg max-h-52 overflow-y-auto">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors text-sm"
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur before select
                  handleSelect(item.nombre);
                }}
              >
                <p className="font-medium text-gray-900 dark:text-gray-100">{item.nombre}</p>
                {item.descripcion && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{item.descripcion}</p>
                )}
              </button>
            ))}

            {showNewHint && (
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors border-t border-gray-100 dark:border-slate-700 flex items-center gap-2 text-sm text-green-700 dark:text-green-400"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(query.trim());
                }}
              >
                <Plus className="h-3 w-3 flex-shrink-0" />
                <span>
                  Usar &quot;<strong>{query.trim()}</strong>&quot;{" "}
                  <span className="text-xs opacity-75">(se creará automáticamente)</span>
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {tipo === "especie" && (
        <p className="text-xs text-muted-foreground">
          La IA sugiere la especie. Puedes confirmar o escribir una diferente.
        </p>
      )}
      {tipo === "tratamiento" && (
        <p className="text-xs text-muted-foreground">
          Selecciona del catálogo o escribe uno nuevo — se creará automáticamente.
        </p>
      )}
    </div>
  );
}
