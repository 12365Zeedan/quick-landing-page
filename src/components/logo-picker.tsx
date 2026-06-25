import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/app-context";
import { useOrg } from "@/lib/org-context";

export function LogoPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const { t } = useApp();
  const { uploadLogo } = useOrg();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const handlePick = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("logoTooLarge"));
      return;
    }
    setBusy(true);
    try {
      const url = await uploadLogo(file);
      onChange(url);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="size-16 rounded-xl border border-border bg-muted/40 grid place-items-center overflow-hidden shrink-0">
        {value ? (
          <img src={value} alt="logo" className="size-full object-cover" />
        ) : (
          <ImagePlus className="size-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-accent disabled:opacity-60 inline-flex items-center gap-1.5"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
          {busy ? t("uploadingLogo") : value ? t("changeLogo") : t("uploadLogo")}
        </button>
        {value && !busy && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="size-8 grid place-items-center rounded-lg border border-border text-destructive hover:bg-destructive hover:text-destructive-foreground"
            aria-label={t("removeLogo")}
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handlePick(f);
        }}
      />
    </div>
  );
}
