"use client";

import { Check } from "lucide-react";
import type { AIModel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { vendorColor } from "@/lib/constants";

export function ModelMultiSelect({
  models,
  selected,
  onChange,
  max = 4,
  min = 0,
}: {
  models: AIModel[];
  selected: string[];
  onChange: (ids: string[]) => void;
  max?: number;
  min?: number;
}) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      if (selected.length <= min) return;
      onChange(selected.filter((s) => s !== id));
    } else {
      if (selected.length >= max) return;
      onChange([...selected, id]);
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          Select models{" "}
          <span className="tnum">
            ({selected.length}/{max})
          </span>
        </p>
        {selected.length > min ? (
          <button
            type="button"
            onClick={() => onChange(selected.slice(0, min))}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Reset
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {models.map((m) => {
          const isSel = selected.includes(m.id);
          const disabled = !isSel && selected.length >= max;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              disabled={disabled}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition",
                isSel
                  ? "border-brand bg-brand-subtle text-brand"
                  : "border-border bg-background text-muted-foreground hover:border-brand/40 hover:text-foreground",
                disabled && "cursor-not-allowed opacity-40 hover:border-border hover:text-muted-foreground",
              )}
            >
              {isSel ? (
                <Check className="h-3 w-3" strokeWidth={3} />
              ) : (
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: vendorColor(m.vendor) }} />
              )}
              {m.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
