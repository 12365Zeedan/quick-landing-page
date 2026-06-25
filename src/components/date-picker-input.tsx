import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { ar } from "date-fns/locale/ar";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DatePickerInputProps {
  value: string; // ISO "yyyy-MM-dd" or ""
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  min?: string;
  max?: string;
  id?: string;
}

function parseISO(value: string): Date | undefined {
  if (!value) return undefined;
  const d = parse(value, "yyyy-MM-dd", new Date());
  return isValid(d) ? d : undefined;
}

function toISO(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/**
 * Drop-in replacement for <input type="date"> that renders a custom calendar
 * popover. Avoids Chromium's UA-locked LTR segment order so day/month/year
 * always read correctly in Arabic (RTL) and English (LTR).
 *
 * API mirrors the native input: `value` and `onChange` use ISO yyyy-MM-dd
 * strings, so call sites only need to swap `onChange={(e) => setX(e.target.value)}`
 * for `onChange={setX}`.
 */
export function DatePickerInput({
  value,
  onChange,
  className,
  placeholder,
  disabled,
  required,
  min,
  max,
  id,
}: DatePickerInputProps) {
  const [open, setOpen] = React.useState(false);
  const [isRtl, setIsRtl] = React.useState(false);
  React.useEffect(() => {
    setIsRtl(document.documentElement.dir === "rtl");
  }, []);

  const date = parseISO(value);
  const minDate = parseISO(min ?? "");
  const maxDate = parseISO(max ?? "");

  const label = date
    ? format(date, "dd/MM/yyyy", isRtl ? { locale: ar } : undefined)
    : (placeholder ?? (isRtl ? "يوم/شهر/سنة" : "dd/mm/yyyy"));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-required={required || undefined}
          dir={isRtl ? "rtl" : "ltr"}
          className={cn(
            "inline-flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm tabular shadow-sm transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-ring/40",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !date && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{label}</span>
          <CalendarIcon className="size-4 opacity-60 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 pointer-events-auto"
        align={isRtl ? "end" : "start"}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            if (d) {
              onChange(toISO(d));
              setOpen(false);
            } else {
              onChange("");
            }
          }}
          defaultMonth={date}
          disabled={(d) => {
            if (minDate && d < minDate) return true;
            if (maxDate && d > maxDate) return true;
            return false;
          }}
          locale={isRtl ? ar : undefined}
          dir={isRtl ? "rtl" : "ltr"}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
