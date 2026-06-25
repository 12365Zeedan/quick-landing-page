import React, { useRef, useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DatePickerInput } from "@/components/date-picker-input";
import * as XLSX from "xlsx";
import {
  Package,
  Layers,
  Barcode,
  Box,
  Construction,
  Plus,
  Trash2,
  Pencil,
  ShieldCheck,
  Tag,
  Boxes,
  Activity,
  ImagePlus,
  FileText,
  Search,
  Download,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { PaginationBar } from "@/components/pagination-bar";
import { useApp } from "@/lib/app-context";
import { useOrgStorage } from "@/lib/use-org-storage";
import { usePagination } from "@/lib/use-pagination";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/inventory/products")({
  head: () => ({
    meta: [
      { title: "Products — Inventory" },
      { name: "description", content: "Inventory products catalog." },
    ],
  }),
  component: ProductsPage,
});

type TabKey = "products" | "variants" | "lots" | "packages";
type TaxRate = 0 | 15;

type Lot = {
  id: string;
  productId: string;
  lotNumber: string;
  expiryDate: string;
  qty: number;
};

type Product = {
  id: string;
  nameAr: string;
  nameEn: string;
  intlBarcode: string;
  sfdaCode: string;
  category: string;
  costExTax: number;
  priceIncTax: number;
  purchaseTax: TaxRate;
  salesTax: TaxRate;
  onHandQty: number;
  forecastedQty: number;
  sfdaTracking: boolean;
  images: string[];
  description: string;
  usage: string;
  createdAt: string;
};

const EMPTY: Omit<Product, "id" | "createdAt"> = {
  nameAr: "",
  nameEn: "",
  intlBarcode: "",
  sfdaCode: "",
  category: "",
  costExTax: 0,
  priceIncTax: 0,
  purchaseTax: 15,
  salesTax: 15,
  onHandQty: 0,
  forecastedQty: 0,
  sfdaTracking: false,
  images: [],
  description: "",
  usage: "",
};

function ProductsPage() {
  const { t, lang } = useApp();
  const [tab, setTab] = useState<TabKey>("products");
  const [products, setProducts] = useOrgStorage<Product>("inventory.products", []);
  const [lots, setLots] = useOrgStorage<Lot>("inventory.lots", []);

  const tabs: { key: TabKey; labelKey: Parameters<typeof t>[0]; icon: typeof Package }[] = [
    { key: "products", labelKey: "productsTab", icon: Package },
    { key: "variants", labelKey: "productVariantsTab", icon: Layers },
    { key: "lots", labelKey: "lotSerialTab", icon: Barcode },
    { key: "packages", labelKey: "packagesTab", icon: Box },
  ];

  const displayName = (p: Product) =>
    lang === "ar" ? p.nameAr || p.nameEn : p.nameEn || p.nameAr;

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="flex-1 px-6 py-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{t("inventoryProducts")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("inventory")}</p>
          </div>

          <div className="glass-card rounded-2xl p-2 inline-flex flex-wrap gap-1">
            {tabs.map((tb) => {
              const active = tab === tb.key;
              return (
                <button
                  key={tb.key}
                  onClick={() => setTab(tb.key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    active
                      ? "gradient-primary text-primary-foreground glow-primary"
                      : "text-muted-foreground hover:bg-sidebar-accent/40 hover:text-foreground",
                  )}
                >
                  <tb.icon className="size-4" />
                  {t(tb.labelKey)}
                </button>
              );
            })}
          </div>

          {tab === "products" && (
            <ProductsSection
              items={products}
              setItems={setProducts}
              lots={lots}
              setLots={setLots}
              displayName={displayName}
            />
          )}
          {tab === "lots" && (
            <LotsSection
              products={products}
              lots={lots}
              setLots={setLots}
              displayName={displayName}
            />
          )}
          {(tab === "variants" || tab === "packages") && (
            <SectionPlaceholder titleKey={tabs.find((x) => x.key === tab)!.labelKey} />
          )}
        </main>
      </div>
    </div>
  );
}

function ProductsSection({
  items,
  setItems,
  lots,
  setLots,
  displayName,
}: {
  items: Product[];
  setItems: React.Dispatch<React.SetStateAction<Product[]>>;
  lots: Lot[];
  setLots: React.Dispatch<React.SetStateAction<Lot[]>>;
  displayName: (p: Product) => string;
}) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Product, "id" | "createdAt">>(EMPTY);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>("__all__");
  const [salesTaxFilter, setSalesTaxFilter] = useState<string>("__all__");
  const [sfdaFilter, setSfdaFilter] = useState<string>("__all__");
  const [groupBy, setGroupBy] = useState<string>("__none__");
  const fileRef = useRef<HTMLInputElement>(null);
  // Draft lots edited inline in the dialog (committed on save)
  const [draftLots, setDraftLots] = useState<Lot[]>([]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setDraftLots([]);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    const { id: _id, createdAt: _c, ...rest } = p;
    setForm(rest);
    setDraftLots(lots.filter((l) => l.productId === p.id));
    setOpen(true);
  };

  const addDraftLot = () => {
    setDraftLots((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        productId: editingId ?? "__new__",
        lotNumber: "",
        expiryDate: "",
        qty: 0,
      },
    ]);
  };

  const updateDraftLot = (id: string, patch: Partial<Lot>) =>
    setDraftLots((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const removeDraftLot = (id: string) =>
    setDraftLots((prev) => prev.filter((l) => l.id !== id));

  const submit = () => {
    if (!form.nameAr.trim() && !form.nameEn.trim()) {
      toast.error(t("productName"));
      return;
    }

    // SFDA Tracking gate: must have at least one lot with a number
    if (form.sfdaTracking) {
      const valid = draftLots.filter((l) => l.lotNumber.trim());
      if (valid.length === 0) {
        toast.error(t("lotRequired"));
        return;
      }
    }

    const productId = editingId ?? crypto.randomUUID();

    if (editingId) {
      setItems((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...form } : p)),
      );
    } else {
      const p: Product = {
        ...form,
        id: productId,
        createdAt: new Date().toISOString(),
      };
      setItems((prev) => [p, ...prev]);
    }

    // Sync lots for this product: replace all lots belonging to it
    setLots((prev) => {
      const others = prev.filter((l) => l.productId !== productId);
      if (!form.sfdaTracking) return others; // if tracking off, drop any lots
      const mine = draftLots
        .filter((l) => l.lotNumber.trim())
        .map((l) => ({ ...l, productId }));
      return [...others, ...mine];
    });

    toast.success(t("save"));
    setOpen(false);
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
    setLots((prev) => prev.filter((l) => l.productId !== id));
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((p) => {
      if (p.category.trim()) set.add(p.category.trim());
    });
    return Array.from(set).sort();
  }, [items]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (
        q &&
        !displayName(p).toLowerCase().includes(q) &&
        !p.nameAr.toLowerCase().includes(q) &&
        !p.nameEn.toLowerCase().includes(q) &&
        !p.intlBarcode.toLowerCase().includes(q)
      )
        return false;
      if (categoryFilter !== "__all__") {
        const cat = p.category.trim() || "__none__";
        if (cat !== categoryFilter) return false;
      }
      if (salesTaxFilter !== "__all__" && String(p.salesTax) !== salesTaxFilter) return false;
      if (sfdaFilter === "sfda" && !p.sfdaTracking) return false;
      if (sfdaFilter === "non" && p.sfdaTracking) return false;
      return true;
    });
  }, [items, q, categoryFilter, salesTaxFilter, sfdaFilter, displayName]);

  const groups = useMemo(() => {
    if (groupBy === "__none__") return [{ key: "", label: "", items: filtered }];
    const map = new Map<string, Product[]>();
    for (const p of filtered) {
      let key = "";
      let label = "";
      if (groupBy === "category") {
        key = p.category.trim() || "__none__";
        label = p.category.trim() || t("uncategorized");
      } else if (groupBy === "salesTax") {
        key = String(p.salesTax);
        label = `${p.salesTax}%`;
      } else if (groupBy === "sfda") {
        key = p.sfdaTracking ? "sfda" : "non";
        label = p.sfdaTracking ? t("sfdaOnly") : t("nonSfdaOnly");
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, list]) => {
        let label = key;
        if (groupBy === "category") label = key === "__none__" ? t("uncategorized") : key;
        else if (groupBy === "salesTax") label = `${key}%`;
        else if (groupBy === "sfda") label = key === "sfda" ? t("sfdaOnly") : t("nonSfdaOnly");
        return { key, label, items: list };
      });
  }, [filtered, groupBy, t]);

  const pg = usePagination(filtered);
  const pagedGroups = useMemo(() => {
    const ids = new Set(pg.pageItems.map((p) => p.id));
    return groups
      .map((g) => ({ ...g, items: g.items.filter((p) => ids.has(p.id)) }))
      .filter((g) => g.items.length > 0);
  }, [groups, pg.pageItems]);



  // Excel export
  const exportToExcel = () => {
    const rows = filtered.map((p) => ({
      [t("intlBarcode")]: p.intlBarcode,
      [t("productNameAr")]: p.nameAr,
      [t("productNameEn")]: p.nameEn,
      [t("sfdaCode")]: p.sfdaCode,
      [t("productCategory")]: p.category,
      [t("costExTax")]: p.costExTax,
      [t("priceIncTax")]: p.priceIncTax,
      [t("purchaseTax")]: p.purchaseTax,
      [t("salesTax")]: p.salesTax,
      [t("onHandQty")]: p.onHandQty,
      [t("forecastedQty")]: p.forecastedQty,
      [t("sfdaTracking")]: p.sfdaTracking ? "YES" : "NO",
      [t("totalCostValue")]: p.costExTax * p.onHandQty,
      [t("totalSaleValue")]: p.priceIncTax * p.onHandQty,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, `products-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      [
        "intlBarcode",
        "nameAr",
        "nameEn",
        "sfdaCode",
        "category",
        "costExTax",
        "priceIncTax",
        "purchaseTax",
        "salesTax",
        "onHandQty",
        "forecastedQty",
        "sfdaTracking",
      ],
      ["1234567890123", "باراسيتامول 500 مجم", "Paracetamol 500mg", "SFDA-001", "Pain Relief", 5, 12, 15, 15, 100, 50, "NO"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "products-template.xlsx");
  };

  const handleImportFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      const norm = (k: string) => k.toString().trim().toLowerCase();
      const pick = (row: Record<string, unknown>, keys: string[]) => {
        for (const k of Object.keys(row)) {
          if (keys.includes(norm(k))) return row[k];
        }
        return undefined;
      };
      const toNum = (v: unknown) => {
        if (v === null || v === undefined || v === "") return 0;
        const n = Number(String(v).replace(/[,\s]/g, ""));
        return Number.isFinite(n) ? n : 0;
      };
      const toTax = (v: unknown): TaxRate => (toNum(v) >= 15 ? 15 : 0);
      const toBool = (v: unknown) => {
        const s = String(v).trim().toLowerCase();
        return s === "yes" || s === "true" || s === "1" || s === "y" || s === "نعم";
      };
      const parsed: Product[] = [];
      for (const row of rows) {
        const nameAr = String(pick(row, ["namear", "اسم المنتج بالعربية", "الاسم بالعربية"]) ?? "");
        const nameEn = String(pick(row, ["nameen", "name", "اسم المنتج بالإنجليزية"]) ?? "");
        if (!nameAr.trim() && !nameEn.trim()) continue;
        parsed.push({
          id: crypto.randomUUID(),
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim(),
          intlBarcode: String(pick(row, ["intlbarcode", "barcode", "الباركود الدولي", "باركود"]) ?? "").trim(),
          sfdaCode: String(pick(row, ["sfdacode", "sfda code", "كود sfda"]) ?? "").trim(),
          category: String(pick(row, ["category", "تصنيف", "تصنيف المنتج"]) ?? "").trim(),
          costExTax: toNum(pick(row, ["costextax", "cost", "سعر التكلفة"])),
          priceIncTax: toNum(pick(row, ["priceinctax", "price", "سعر البيع"])),
          purchaseTax: toTax(pick(row, ["purchasetax", "ضريبة المشتريات"])),
          salesTax: toTax(pick(row, ["salestax", "ضريبة المبيعات"])),
          onHandQty: toNum(pick(row, ["onhandqty", "qty", "الكمية المتوفرة"])),
          forecastedQty: toNum(pick(row, ["forecastedqty", "الكمية المتوقعة"])),
          sfdaTracking: toBool(pick(row, ["sfdatracking", "تتبع sfda"])),
          images: [],
          description: "",
          usage: "",
          createdAt: new Date().toISOString(),
        });
      }
      if (parsed.length === 0) {
        toast.error(t("importNoRowsFound"));
        return;
      }
      setItems((prev) => [...parsed, ...prev]);
      toast.success(t("importedProducts").replace("{n}", String(parsed.length)));
    } catch (err) {
      console.error(err);
      toast.error(t("importFailedMsg"));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImportFile(f);
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t("search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="ps-9"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("productCategory")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t("allCategories")}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={salesTaxFilter} onValueChange={setSalesTaxFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t("salesTax")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t("allTaxes")}</SelectItem>
            <SelectItem value="0">0%</SelectItem>
            <SelectItem value="15">15%</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sfdaFilter} onValueChange={setSfdaFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder={t("sfdaStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t("allProducts")}</SelectItem>
            <SelectItem value="sfda">{t("sfdaOnly")}</SelectItem>
            <SelectItem value="non">{t("nonSfdaOnly")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={groupBy} onValueChange={setGroupBy}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder={t("groupBy")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">{t("groupByNone")}</SelectItem>
            <SelectItem value="category">{t("productCategory")}</SelectItem>
            <SelectItem value="salesTax">{t("salesTax")}</SelectItem>
            <SelectItem value="sfda">{t("sfdaStatus")}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button variant="outline" className="gap-2" onClick={downloadTemplate}>
          <FileSpreadsheet className="size-4" />
          <span className="hidden sm:inline">{t("downloadTemplateBtn")}</span>
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => fileRef.current?.click()}>
          <Upload className="size-4" />
          <span className="hidden sm:inline">{t("importProductsExcel")}</span>
        </Button>
        <Button variant="outline" className="gap-2" onClick={exportToExcel}>
          <Download className="size-4" />
          <span className="hidden sm:inline">{t("exportProductsExcel")}</span>
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="size-4" />
              {t("createProduct")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? t("editProduct") : t("createProduct")}</DialogTitle>
            </DialogHeader>

            {/* Basic info */}
            <SectionTitle icon={Tag}>{t("basicInfo")}</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("productNameAr")}>
                <Input
                  dir="rtl"
                  value={form.nameAr}
                  onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                />
              </Field>
              <Field label={t("productNameEn")}>
                <Input
                  dir="ltr"
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                />
              </Field>
              <Field label={t("intlBarcode")}>
                <Input
                  value={form.intlBarcode}
                  onChange={(e) => setForm({ ...form, intlBarcode: e.target.value })}
                />
              </Field>
              <Field label={t("sfdaCode")}>
                <Input
                  value={form.sfdaCode}
                  onChange={(e) => setForm({ ...form, sfdaCode: e.target.value })}
                />
              </Field>
              <Field label={t("productCategory")} className="col-span-2">
                <Input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </Field>

              <div className="col-span-2 flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary" />
                    {t("sfdaTracking")}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">{t("sfdaTrackingHint")}</p>
                </div>
                <Switch
                  checked={form.sfdaTracking}
                  onCheckedChange={(v) => {
                    setForm({ ...form, sfdaTracking: v });
                    if (v && draftLots.length === 0) addDraftLot();
                  }}
                />
              </div>
            </div>

            {/* Lot / Serial — visible only when SFDA tracking is on */}
            {form.sfdaTracking && (
              <>
                <SectionTitle icon={Barcode}>{t("lotsSerials")}</SectionTitle>
                <div className="space-y-2">
                  {draftLots.length === 0 ? (
                    <p className="text-xs text-destructive">{t("lotRequired")}</p>
                  ) : (
                    draftLots.map((l) => (
                      <div
                        key={l.id}
                        className="grid grid-cols-[1fr_1fr_120px_auto] gap-2 items-center"
                      >
                        <Input
                          placeholder={t("lotNumber")}
                          value={l.lotNumber}
                          onChange={(e) => updateDraftLot(l.id, { lotNumber: e.target.value })}
                        />
                        <DatePickerInput
                          placeholder={t("expiryDate")}
                          value={l.expiryDate}
                          onChange={(v) => updateDraftLot(l.id, { expiryDate: v })}
                        />
                        <Input
                          type="number"
                          placeholder={t("lotQty")}
                          value={l.qty}
                          onChange={(e) =>
                            updateDraftLot(l.id, { qty: Number(e.target.value) })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDraftLot(l.id)}
                          aria-label={t("delete")}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDraftLot}
                    className="gap-2"
                  >
                    <Plus className="size-3.5" />
                    {t("addLot")}
                  </Button>
                </div>
              </>
            )}

            {/* Pricing */}
            <SectionTitle icon={Activity}>{t("pricing")}</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("costExTax")}>
                <Input
                  type="number"
                  value={form.costExTax}
                  onChange={(e) => setForm({ ...form, costExTax: Number(e.target.value) })}
                />
              </Field>
              <Field label={t("priceIncTax")}>
                <Input
                  type="number"
                  value={form.priceIncTax}
                  onChange={(e) => setForm({ ...form, priceIncTax: Number(e.target.value) })}
                />
              </Field>
              <Field label={t("purchaseTax")}>
                <TaxToggle
                  value={form.purchaseTax}
                  onChange={(v) => setForm({ ...form, purchaseTax: v })}
                />
              </Field>
              <Field label={t("salesTax")}>
                <TaxToggle
                  value={form.salesTax}
                  onChange={(v) => setForm({ ...form, salesTax: v })}
                />
              </Field>
            </div>

            {/* Stock */}
            <SectionTitle icon={Boxes}>{t("stockInfo")}</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("onHandQty")}>
                <Input
                  type="number"
                  value={form.onHandQty}
                  onChange={(e) => setForm({ ...form, onHandQty: Number(e.target.value) })}
                />
              </Field>
              <Field label={t("forecastedQty")}>
                <Input
                  type="number"
                  value={form.forecastedQty}
                  onChange={(e) => setForm({ ...form, forecastedQty: Number(e.target.value) })}
                />
              </Field>
            </div>

            {/* Media */}
            <SectionTitle icon={ImagePlus}>{t("productMedia")}</SectionTitle>
            <ImagesPicker
              images={form.images}
              onChange={(imgs) => setForm({ ...form, images: imgs })}
            />

            {/* Details */}
            <SectionTitle icon={FileText}>{t("productDetails")}</SectionTitle>
            <div className="grid grid-cols-1 gap-4">
              <Field label={t("productDescription")}>
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Field>
              <Field label={t("productUsage")}>
                <Textarea
                  rows={3}
                  value={form.usage}
                  onChange={(e) => setForm({ ...form, usage: e.target.value })}
                />
              </Field>
            </div>


            <DialogFooter className="mt-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={submit}>{t("save")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-3xl p-10 text-center">
          <div className="size-14 rounded-2xl gradient-primary grid place-items-center mx-auto mb-4 glow-primary">
            <Package className="size-6 text-primary-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {items.length === 0 ? t("noProducts") : t("noResults")}
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-sidebar-accent/30 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <Checkbox
                      checked={
                        filtered.length > 0 && filtered.every((p) => selected.has(p.id))
                      }
                      onCheckedChange={(v) => {
                        if (v) setSelected(new Set(filtered.map((p) => p.id)));
                        else setSelected(new Set());
                      }}
                      aria-label="select all"
                    />
                  </th>
                  <th className="px-4 py-3 text-start font-medium">{t("intlBarcode")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("productName")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("productCategory")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("lotNumber")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("expiryDate")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("costExTax")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("priceIncTax")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("onHandQty")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("forecastedQty")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("totalCostValue")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("totalSaleValue")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("salesTax")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("totalSalesTax")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("grossProfit")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("profitMargin")}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {pagedGroups.map((g) => (
                  <React.Fragment key={g.key || "__all__"}>
                    {groupBy !== "__none__" && (
                      <tr className="bg-sidebar-accent/40">
                        <td colSpan={16} className="px-4 py-2 font-semibold text-sm">
                          {g.label}{" "}
                          <span className="text-muted-foreground font-normal">
                            ({g.items.length})
                          </span>
                        </td>
                      </tr>
                    )}
                    {g.items.map((p) => {
                  const productLots = lots.filter((l) => l.productId === p.id);
                  const totalCost = p.costExTax * p.onHandQty;
                  const totalSale = p.priceIncTax * p.onHandQty;
                  const saleTaxPerUnit =
                    p.salesTax > 0 ? (p.priceIncTax * p.salesTax) / (100 + p.salesTax) : 0;
                  const totalSaleTax = saleTaxPerUnit * p.onHandQty;
                  const grossProfit = totalSale - totalCost - totalSaleTax;
                  const netSales = totalSale - totalSaleTax;
                  const profitMargin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;
                  const isSelected = selected.has(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={cn(
                        "border-t border-border/60 hover:bg-sidebar-accent/20",
                        isSelected && "bg-primary/5",
                      )}
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(v) => {
                            setSelected((prev) => {
                              const next = new Set(prev);
                              if (v) next.add(p.id);
                              else next.delete(p.id);
                              return next;
                            });
                          }}
                          aria-label={`select ${displayName(p)}`}
                        />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">
                        {p.intlBarcode || "—"}
                      </td>
                      <td className="px-4 py-3 font-medium">{displayName(p)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.category || "—"}</td>
                      <td className="px-4 py-3">
                        {productLots.length > 0 ? (
                          <div className="space-y-0.5">
                            {productLots.map((l) => (
                              <div key={l.id} className="tabular-nums text-sm">
                                {l.lotNumber}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {productLots.length > 0 ? (
                          <div className="space-y-0.5">
                            {productLots.map((l) => (
                              <div key={l.id} className="tabular-nums text-sm text-muted-foreground">
                                {l.expiryDate || "—"}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-end tabular-nums">
                        {p.costExTax.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-end tabular-nums">
                        {p.priceIncTax.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-end tabular-nums">{p.onHandQty}</td>
                      <td className="px-4 py-3 text-end tabular-nums">{p.forecastedQty}</td>
                      <td className="px-4 py-3 text-end tabular-nums font-medium">
                        {totalCost.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-end tabular-nums font-medium">
                        {totalSale.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-end tabular-nums">{p.salesTax}%</td>
                      <td className="px-4 py-3 text-end tabular-nums font-medium">
                        {totalSaleTax.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-end tabular-nums font-semibold",
                          grossProfit > 0
                            ? "text-emerald-500"
                            : grossProfit < 0
                              ? "text-destructive"
                              : "",
                        )}
                      >
                        {grossProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-end tabular-nums font-semibold",
                          profitMargin > 0
                            ? "text-emerald-500"
                            : profitMargin < 0
                              ? "text-destructive"
                              : "text-muted-foreground",
                        )}
                      >
                        {netSales > 0 ? `${profitMargin.toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(p)}
                            aria-label={t("edit")}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(p.id)}
                            aria-label={t("delete")}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar page={pg.page} totalPages={pg.totalPages} total={pg.total} from={pg.from} to={pg.to} onPageChange={pg.setPage} showAll={pg.showAll} onToggleShowAll={pg.toggleShowAll} />
        </div>
      )}
    </div>
  );
}

function LotsSection({
  products,
  lots,
  setLots,
  displayName,
}: {
  products: Product[];
  lots: Lot[];
  setLots: React.Dispatch<React.SetStateAction<Lot[]>>;
  displayName: (p: Product) => string;
}) {
  const { t } = useApp();
  const sfdaProducts = products.filter((p) => p.sfdaTracking);
  const productMap = new Map(products.map((p) => [p.id, p]));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Lot | null>(null);

  const startEdit = (l: Lot) => {
    setEditingId(l.id);
    setDraft({ ...l });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = () => {
    if (!draft) return;
    if (!draft.lotNumber.trim()) {
      toast.error(t("lotNumberRequired"));
      return;
    }
    setLots((prev) => prev.map((l) => (l.id === draft.id ? draft : l)));
    setEditingId(null);
    setDraft(null);
    toast.success(t("save"));
  };

  const updateDraft = (patch: Partial<Lot>) =>
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));

  const remove = (id: string) => setLots((prev) => prev.filter((l) => l.id !== id));

  if (sfdaProducts.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-10 text-center">
        <div className="size-14 rounded-2xl gradient-primary grid place-items-center mx-auto mb-4 glow-primary">
          <Barcode className="size-6 text-primary-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{t("noSfdaProducts")}</p>
      </div>
    );
  }

  if (lots.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-10 text-center">
        <div className="size-14 rounded-2xl gradient-primary grid place-items-center mx-auto mb-4 glow-primary">
          <Barcode className="size-6 text-primary-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{t("noLots")}</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-sidebar-accent/30 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t("product")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("lotNumber")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("expiryDate")}</th>
              <th className="px-4 py-3 text-end font-medium">{t("lotQty")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {lots.map((l) => {
              const p = productMap.get(l.productId);
              const isEditing = editingId === l.id;

              return (
                <tr key={l.id} className="border-t border-border/60 hover:bg-sidebar-accent/20">
                  <td className="px-4 py-3 font-medium">{p ? displayName(p) : "—"}</td>

                  {isEditing && draft ? (
                    <>
                      <td className="px-4 py-3">
                        <Input
                          value={draft.lotNumber}
                          onChange={(e) => updateDraft({ lotNumber: e.target.value })}
                          className="h-8"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <DatePickerInput
                          value={draft.expiryDate}
                          onChange={(v) => updateDraft({ expiryDate: v })}
                          className="h-8"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          value={draft.qty}
                          onChange={(e) => updateDraft({ qty: Number(e.target.value) })}
                          className="h-8 text-end"
                        />
                      </td>
                      <td className="px-4 py-3 text-end">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={saveEdit}
                            aria-label={t("save")}
                          >
                            <ShieldCheck className="size-4 text-emerald-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={cancelEdit}
                            aria-label={t("cancel")}
                          >
                            <Trash2 className="size-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 tabular-nums">{l.lotNumber}</td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">
                        {l.expiryDate || "—"}
                      </td>
                      <td className="px-4 py-3 text-end tabular-nums">{l.qty}</td>
                      <td className="px-4 py-3 text-end">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEdit(l)}
                            aria-label={t("edit")}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(l.id)}
                            aria-label={t("delete")}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TaxToggle({ value, onChange }: { value: TaxRate; onChange: (v: TaxRate) => void }) {
  const { t } = useApp();
  const opts: { v: TaxRate; label: string }[] = [
    { v: 0, label: t("taxZero") },
    { v: 15, label: t("taxFifteen") },
  ];
  return (
    <div className="inline-flex rounded-lg border border-border/60 p-1 bg-background w-full">
      {opts.map((o) => {
        const active = value === o.v;
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            className={cn(
              "flex-1 px-3 py-1.5 text-sm rounded-md transition-all font-medium",
              active
                ? "gradient-primary text-primary-foreground glow-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: typeof Package;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1 border-b border-border/40 mb-2">
      <Icon className="size-4 text-primary" />
      <h3 className="text-sm font-semibold">{children}</h3>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SectionPlaceholder({ titleKey }: { titleKey: Parameters<ReturnType<typeof useApp>["t"]>[0] }) {
  const { t } = useApp();
  return (
    <div className="glass-card rounded-3xl p-10 text-center animate-fade-in">
      <div className="size-14 rounded-2xl gradient-primary grid place-items-center mx-auto mb-4 glow-primary">
        <Construction className="size-6 text-primary-foreground" />
      </div>
      <h2 className="text-xl font-bold mb-1">{t(titleKey)}</h2>
      <p className="text-sm text-muted-foreground">{t("comingSoon")}</p>
    </div>
  );
}

function ImagesPicker({
  images,
  onChange,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
}) {
  const { t } = useApp();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next: string[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(t("imageTooLarge"));
        continue;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      next.push(dataUrl);
    }
    if (next.length) onChange([...images, ...next]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (i: number) => onChange(images.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {images.map((src, i) => (
          <div
            key={i}
            className="relative size-20 rounded-xl overflow-hidden border border-border bg-muted/40"
          >
            <img src={src} alt="" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute top-0.5 end-0.5 size-5 grid place-items-center rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
              aria-label={t("delete")}
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="size-20 rounded-xl border-2 border-dashed border-border bg-muted/20 grid place-items-center text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
          aria-label={t("addImage")}
        >
          <ImagePlus className="size-5" />
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

