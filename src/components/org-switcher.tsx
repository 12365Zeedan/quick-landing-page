import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Building2, Check, ChevronDown, Plus, Settings2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/lib/app-context";
import { useOrg } from "@/lib/org-context";
import { LogoPicker } from "@/components/logo-picker";

export function OrgSwitcher() {
  const { t } = useApp();
  const { organizations, currentOrg, switchOrg, createOrg } = useOrg();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [bizType, setBizType] = useState("pharmacy");
  const [currency, setCurrency] = useState("SAR");
  const [taxNum, setTaxNum] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error(t("organizationName"));
      return;
    }
    setSaving(true);
    try {
      await createOrg({
        name: name.trim(),
        business_type: bizType,
        currency,
        tax_number: taxNum.trim() || null,
        logo_url: logoUrl,
      });
      toast.success(t("organizationCreated"));
      setOpen(false);
      setName("");
      setTaxNum("");
      setLogoUrl(null);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="h-10 px-3 rounded-xl bg-muted/50 hover:bg-muted border border-border flex items-center gap-2 text-sm font-medium transition max-w-[220px]">
            {currentOrg?.logo_url ? (
              <img src={currentOrg.logo_url} alt="" className="size-5 rounded object-cover shrink-0" />
            ) : (
              <Building2 className="size-4 text-primary shrink-0" />
            )}
            <span className="truncate">
              {currentOrg?.name ?? t("noOrganizations")}
            </span>
            <ChevronDown className="size-4 opacity-60 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>{t("switchOrganization")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {organizations.length === 0 && (
            <div className="px-2 py-3 text-xs text-muted-foreground text-center">
              {t("noOrganizations")}
            </div>
          )}
          {organizations.map((o) => (
            <DropdownMenuItem
              key={o.id}
              onClick={() => switchOrg(o.id)}
              className="flex items-center gap-2"
            >
              {o.logo_url ? (
                <img src={o.logo_url} alt="" className="size-5 rounded object-cover shrink-0" />
              ) : (
                <Building2 className="size-4 text-muted-foreground" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{o.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {t(`role${(o.role ?? "cashier").charAt(0).toUpperCase()}${(o.role ?? "cashier").slice(1)}` as any)}
                </div>
              </div>
              {currentOrg?.id === o.id && <Check className="size-4 text-primary" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Plus className="size-4 me-2" />
            {t("createOrganization")}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/organizations" className="cursor-pointer">
              <Settings2 className="size-4 me-2" />
              {t("manageOrganizations")}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createOrganization")}</DialogTitle>
            <DialogDescription>{t("organizationName")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("organizationLogo")}</Label>
              <LogoPicker value={logoUrl} onChange={setLogoUrl} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("organizationName")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("businessType")}</Label>
                <Select value={bizType} onValueChange={setBizType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pharmacy">{t("pharmacyType")}</SelectItem>
                    <SelectItem value="clinic">{t("clinicType")}</SelectItem>
                    <SelectItem value="company">{t("companyType")}</SelectItem>
                    <SelectItem value="retail">{t("retailType")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("currency")}</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAR">SAR</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                    <SelectItem value="EGP">EGP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("taxNumber")}</Label>
              <Input value={taxNum} onChange={(e) => setTaxNum(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
            >
              {t("create")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
