import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import * as React from "react";
import React__default, { useState, useRef, useMemo } from "react";
import { g as cn, w as useApp, z as useOrgStorage, B as Button, c as DatePickerInput } from "./router-CH3R9Cfm.js";
import * as XLSX from "xlsx";
import { Check, Package, Layers, Barcode, Box, Search, FileSpreadsheet, Upload, Download, Plus, Tag, ShieldCheck, Trash2, Activity, Boxes, ImagePlus, FileText, Pencil, Construction } from "lucide-react";
import { toast } from "sonner";
import { l as Sidebar, T as Topbar, I as Input, S as Select, j as SelectTrigger, k as SelectValue, h as SelectContent, i as SelectItem, D as Dialog, f as DialogTrigger, a as DialogContent, d as DialogHeader, e as DialogTitle, L as Label, c as DialogFooter } from "./topbar-CywcAnz-.js";
import { u as usePagination, P as PaginationBar } from "./use-pagination-DIgFAfhb.js";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "./client-bowce4Dj.js";
import "@supabase/supabase-js";
import "date-fns";
import "date-fns/locale/ar";
import "clsx";
import "tailwind-merge";
import "react-day-picker";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "@radix-ui/react-popover";
import "react-dom";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-dialog";
import "@radix-ui/react-label";
import "@radix-ui/react-select";
const Switch = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SwitchPrimitives.Root,
  {
    className: cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    ),
    ...props,
    ref,
    children: /* @__PURE__ */ jsx(
      SwitchPrimitives.Thumb,
      {
        className: cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
        )
      }
    )
  }
));
Switch.displayName = SwitchPrimitives.Root.displayName;
const Textarea = React.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "textarea",
      {
        className: cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Textarea.displayName = "Textarea";
const Checkbox = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  CheckboxPrimitive.Root,
  {
    ref,
    className: cn(
      "grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx(CheckboxPrimitive.Indicator, { className: cn("grid place-content-center text-current"), children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) })
  }
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
const EMPTY = {
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
  usage: ""
};
function ProductsPage() {
  const {
    t,
    lang
  } = useApp();
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useOrgStorage("inventory.products", []);
  const [lots, setLots] = useOrgStorage("inventory.lots", []);
  const tabs = [{
    key: "products",
    labelKey: "productsTab",
    icon: Package
  }, {
    key: "variants",
    labelKey: "productVariantsTab",
    icon: Layers
  }, {
    key: "lots",
    labelKey: "lotSerialTab",
    icon: Barcode
  }, {
    key: "packages",
    labelKey: "packagesTab",
    icon: Box
  }];
  const displayName = (p) => lang === "ar" ? p.nameAr || p.nameEn : p.nameEn || p.nameAr;
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex", children: [
    /* @__PURE__ */ jsx(Sidebar, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 flex flex-col", children: [
      /* @__PURE__ */ jsx(Topbar, {}),
      /* @__PURE__ */ jsxs("main", { className: "flex-1 px-6 py-8 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: t("inventoryProducts") }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: t("inventory") })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "glass-card rounded-2xl p-2 inline-flex flex-wrap gap-1", children: tabs.map((tb) => {
          const active = tab === tb.key;
          return /* @__PURE__ */ jsxs("button", { onClick: () => setTab(tb.key), className: cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all", active ? "gradient-primary text-primary-foreground glow-primary" : "text-muted-foreground hover:bg-sidebar-accent/40 hover:text-foreground"), children: [
            /* @__PURE__ */ jsx(tb.icon, { className: "size-4" }),
            t(tb.labelKey)
          ] }, tb.key);
        }) }),
        tab === "products" && /* @__PURE__ */ jsx(ProductsSection, { items: products, setItems: setProducts, lots, setLots, displayName }),
        tab === "lots" && /* @__PURE__ */ jsx(LotsSection, { products, lots, setLots, displayName }),
        (tab === "variants" || tab === "packages") && /* @__PURE__ */ jsx(SectionPlaceholder, { titleKey: tabs.find((x) => x.key === tab).labelKey })
      ] })
    ] })
  ] });
}
function ProductsSection({
  items,
  setItems,
  lots,
  setLots,
  displayName
}) {
  const {
    t
  } = useApp();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(/* @__PURE__ */ new Set());
  const [categoryFilter, setCategoryFilter] = useState("__all__");
  const [salesTaxFilter, setSalesTaxFilter] = useState("__all__");
  const [sfdaFilter, setSfdaFilter] = useState("__all__");
  const [groupBy, setGroupBy] = useState("__none__");
  const fileRef = useRef(null);
  const [draftLots, setDraftLots] = useState([]);
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setDraftLots([]);
    setOpen(true);
  };
  const openEdit = (p) => {
    setEditingId(p.id);
    const {
      id: _id,
      createdAt: _c,
      ...rest
    } = p;
    setForm(rest);
    setDraftLots(lots.filter((l) => l.productId === p.id));
    setOpen(true);
  };
  const addDraftLot = () => {
    setDraftLots((prev) => [...prev, {
      id: crypto.randomUUID(),
      productId: editingId ?? "__new__",
      lotNumber: "",
      expiryDate: "",
      qty: 0
    }]);
  };
  const updateDraftLot = (id, patch) => setDraftLots((prev) => prev.map((l) => l.id === id ? {
    ...l,
    ...patch
  } : l));
  const removeDraftLot = (id) => setDraftLots((prev) => prev.filter((l) => l.id !== id));
  const submit = () => {
    if (!form.nameAr.trim() && !form.nameEn.trim()) {
      toast.error(t("productName"));
      return;
    }
    if (form.sfdaTracking) {
      const valid = draftLots.filter((l) => l.lotNumber.trim());
      if (valid.length === 0) {
        toast.error(t("lotRequired"));
        return;
      }
    }
    const productId = editingId ?? crypto.randomUUID();
    if (editingId) {
      setItems((prev) => prev.map((p) => p.id === editingId ? {
        ...p,
        ...form
      } : p));
    } else {
      const p = {
        ...form,
        id: productId,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      setItems((prev) => [p, ...prev]);
    }
    setLots((prev) => {
      const others = prev.filter((l) => l.productId !== productId);
      if (!form.sfdaTracking) return others;
      const mine = draftLots.filter((l) => l.lotNumber.trim()).map((l) => ({
        ...l,
        productId
      }));
      return [...others, ...mine];
    });
    toast.success(t("save"));
    setOpen(false);
  };
  const remove = (id) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
    setLots((prev) => prev.filter((l) => l.productId !== id));
  };
  const categories = useMemo(() => {
    const set = /* @__PURE__ */ new Set();
    items.forEach((p) => {
      if (p.category.trim()) set.add(p.category.trim());
    });
    return Array.from(set).sort();
  }, [items]);
  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (q && !displayName(p).toLowerCase().includes(q) && !p.nameAr.toLowerCase().includes(q) && !p.nameEn.toLowerCase().includes(q) && !p.intlBarcode.toLowerCase().includes(q)) return false;
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
    if (groupBy === "__none__") return [{
      key: "",
      label: "",
      items: filtered
    }];
    const map = /* @__PURE__ */ new Map();
    for (const p of filtered) {
      let key = "";
      if (groupBy === "category") {
        key = p.category.trim() || "__none__";
        p.category.trim() || t("uncategorized");
      } else if (groupBy === "salesTax") {
        key = String(p.salesTax);
        `${p.salesTax}%`;
      } else if (groupBy === "sfda") {
        key = p.sfdaTracking ? "sfda" : "non";
        p.sfdaTracking ? t("sfdaOnly") : t("nonSfdaOnly");
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([key, list]) => {
      let label = key;
      if (groupBy === "category") label = key === "__none__" ? t("uncategorized") : key;
      else if (groupBy === "salesTax") label = `${key}%`;
      else if (groupBy === "sfda") label = key === "sfda" ? t("sfdaOnly") : t("nonSfdaOnly");
      return {
        key,
        label,
        items: list
      };
    });
  }, [filtered, groupBy, t]);
  const pg = usePagination(filtered);
  const pagedGroups = useMemo(() => {
    const ids = new Set(pg.pageItems.map((p) => p.id));
    return groups.map((g) => ({
      ...g,
      items: g.items.filter((p) => ids.has(p.id))
    })).filter((g) => g.items.length > 0);
  }, [groups, pg.pageItems]);
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
      [t("totalSaleValue")]: p.priceIncTax * p.onHandQty
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, `products-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.xlsx`);
  };
  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([["intlBarcode", "nameAr", "nameEn", "sfdaCode", "category", "costExTax", "priceIncTax", "purchaseTax", "salesTax", "onHandQty", "forecastedQty", "sfdaTracking"], ["1234567890123", "باراسيتامول 500 مجم", "Paracetamol 500mg", "SFDA-001", "Pain Relief", 5, 12, 15, 15, 100, 50, "NO"]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "products-template.xlsx");
  };
  const handleImportFile = async (file) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, {
        type: "array"
      });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, {
        defval: ""
      });
      const norm = (k) => k.toString().trim().toLowerCase();
      const pick = (row, keys) => {
        for (const k of Object.keys(row)) {
          if (keys.includes(norm(k))) return row[k];
        }
        return void 0;
      };
      const toNum = (v) => {
        if (v === null || v === void 0 || v === "") return 0;
        const n = Number(String(v).replace(/[,\s]/g, ""));
        return Number.isFinite(n) ? n : 0;
      };
      const toTax = (v) => toNum(v) >= 15 ? 15 : 0;
      const toBool = (v) => {
        const s = String(v).trim().toLowerCase();
        return s === "yes" || s === "true" || s === "1" || s === "y" || s === "نعم";
      };
      const parsed = [];
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
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
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
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("input", { ref: fileRef, type: "file", accept: ".xlsx,.xls,.csv", className: "hidden", onChange: (e) => {
      const f = e.target.files?.[0];
      if (f) handleImportFile(f);
    } }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-w-[200px] max-w-sm", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx(Input, { placeholder: t("search"), value: query, onChange: (e) => setQuery(e.target.value), className: "ps-9" })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: categoryFilter, onValueChange: setCategoryFilter, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[180px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: t("productCategory") }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "__all__", children: t("allCategories") }),
          categories.map((c) => /* @__PURE__ */ jsx(SelectItem, { value: c, children: c }, c))
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: salesTaxFilter, onValueChange: setSalesTaxFilter, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[150px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: t("salesTax") }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "__all__", children: t("allTaxes") }),
          /* @__PURE__ */ jsx(SelectItem, { value: "0", children: "0%" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "15", children: "15%" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: sfdaFilter, onValueChange: setSfdaFilter, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[170px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: t("sfdaStatus") }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "__all__", children: t("allProducts") }),
          /* @__PURE__ */ jsx(SelectItem, { value: "sfda", children: t("sfdaOnly") }),
          /* @__PURE__ */ jsx(SelectItem, { value: "non", children: t("nonSfdaOnly") })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: groupBy, onValueChange: setGroupBy, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[170px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: t("groupBy") }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "__none__", children: t("groupByNone") }),
          /* @__PURE__ */ jsx(SelectItem, { value: "category", children: t("productCategory") }),
          /* @__PURE__ */ jsx(SelectItem, { value: "salesTax", children: t("salesTax") }),
          /* @__PURE__ */ jsx(SelectItem, { value: "sfda", children: t("sfdaStatus") })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1" }),
      /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "gap-2", onClick: downloadTemplate, children: [
        /* @__PURE__ */ jsx(FileSpreadsheet, { className: "size-4" }),
        /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: t("downloadTemplateBtn") })
      ] }),
      /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "gap-2", onClick: () => fileRef.current?.click(), children: [
        /* @__PURE__ */ jsx(Upload, { className: "size-4" }),
        /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: t("importProductsExcel") })
      ] }),
      /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "gap-2", onClick: exportToExcel, children: [
        /* @__PURE__ */ jsx(Download, { className: "size-4" }),
        /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: t("exportProductsExcel") })
      ] }),
      /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
        /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { className: "gap-2", onClick: openCreate, children: [
          /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
          t("createProduct")
        ] }) }),
        /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-3xl max-h-[90vh] overflow-y-auto", children: [
          /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: editingId ? t("editProduct") : t("createProduct") }) }),
          /* @__PURE__ */ jsx(SectionTitle, { icon: Tag, children: t("basicInfo") }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsx(Field, { label: t("productNameAr"), children: /* @__PURE__ */ jsx(Input, { dir: "rtl", value: form.nameAr, onChange: (e) => setForm({
              ...form,
              nameAr: e.target.value
            }) }) }),
            /* @__PURE__ */ jsx(Field, { label: t("productNameEn"), children: /* @__PURE__ */ jsx(Input, { dir: "ltr", value: form.nameEn, onChange: (e) => setForm({
              ...form,
              nameEn: e.target.value
            }) }) }),
            /* @__PURE__ */ jsx(Field, { label: t("intlBarcode"), children: /* @__PURE__ */ jsx(Input, { value: form.intlBarcode, onChange: (e) => setForm({
              ...form,
              intlBarcode: e.target.value
            }) }) }),
            /* @__PURE__ */ jsx(Field, { label: t("sfdaCode"), children: /* @__PURE__ */ jsx(Input, { value: form.sfdaCode, onChange: (e) => setForm({
              ...form,
              sfdaCode: e.target.value
            }) }) }),
            /* @__PURE__ */ jsx(Field, { label: t("productCategory"), className: "col-span-2", children: /* @__PURE__ */ jsx(Input, { value: form.category, onChange: (e) => setForm({
              ...form,
              category: e.target.value
            }) }) }),
            /* @__PURE__ */ jsxs("div", { className: "col-span-2 flex items-center justify-between rounded-xl border border-border/60 px-4 py-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs(Label, { className: "text-sm font-medium flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(ShieldCheck, { className: "size-4 text-primary" }),
                  t("sfdaTracking")
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("sfdaTrackingHint") })
              ] }),
              /* @__PURE__ */ jsx(Switch, { checked: form.sfdaTracking, onCheckedChange: (v) => {
                setForm({
                  ...form,
                  sfdaTracking: v
                });
                if (v && draftLots.length === 0) addDraftLot();
              } })
            ] })
          ] }),
          form.sfdaTracking && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(SectionTitle, { icon: Barcode, children: t("lotsSerials") }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              draftLots.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: t("lotRequired") }) : draftLots.map((l) => /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[1fr_1fr_120px_auto] gap-2 items-center", children: [
                /* @__PURE__ */ jsx(Input, { placeholder: t("lotNumber"), value: l.lotNumber, onChange: (e) => updateDraftLot(l.id, {
                  lotNumber: e.target.value
                }) }),
                /* @__PURE__ */ jsx(DatePickerInput, { placeholder: t("expiryDate"), value: l.expiryDate, onChange: (v) => updateDraftLot(l.id, {
                  expiryDate: v
                }) }),
                /* @__PURE__ */ jsx(Input, { type: "number", placeholder: t("lotQty"), value: l.qty, onChange: (e) => updateDraftLot(l.id, {
                  qty: Number(e.target.value)
                }) }),
                /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: () => removeDraftLot(l.id), "aria-label": t("delete"), children: /* @__PURE__ */ jsx(Trash2, { className: "size-4 text-destructive" }) })
              ] }, l.id)),
              /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: addDraftLot, className: "gap-2", children: [
                /* @__PURE__ */ jsx(Plus, { className: "size-3.5" }),
                t("addLot")
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(SectionTitle, { icon: Activity, children: t("pricing") }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsx(Field, { label: t("costExTax"), children: /* @__PURE__ */ jsx(Input, { type: "number", value: form.costExTax, onChange: (e) => setForm({
              ...form,
              costExTax: Number(e.target.value)
            }) }) }),
            /* @__PURE__ */ jsx(Field, { label: t("priceIncTax"), children: /* @__PURE__ */ jsx(Input, { type: "number", value: form.priceIncTax, onChange: (e) => setForm({
              ...form,
              priceIncTax: Number(e.target.value)
            }) }) }),
            /* @__PURE__ */ jsx(Field, { label: t("purchaseTax"), children: /* @__PURE__ */ jsx(TaxToggle, { value: form.purchaseTax, onChange: (v) => setForm({
              ...form,
              purchaseTax: v
            }) }) }),
            /* @__PURE__ */ jsx(Field, { label: t("salesTax"), children: /* @__PURE__ */ jsx(TaxToggle, { value: form.salesTax, onChange: (v) => setForm({
              ...form,
              salesTax: v
            }) }) })
          ] }),
          /* @__PURE__ */ jsx(SectionTitle, { icon: Boxes, children: t("stockInfo") }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsx(Field, { label: t("onHandQty"), children: /* @__PURE__ */ jsx(Input, { type: "number", value: form.onHandQty, onChange: (e) => setForm({
              ...form,
              onHandQty: Number(e.target.value)
            }) }) }),
            /* @__PURE__ */ jsx(Field, { label: t("forecastedQty"), children: /* @__PURE__ */ jsx(Input, { type: "number", value: form.forecastedQty, onChange: (e) => setForm({
              ...form,
              forecastedQty: Number(e.target.value)
            }) }) })
          ] }),
          /* @__PURE__ */ jsx(SectionTitle, { icon: ImagePlus, children: t("productMedia") }),
          /* @__PURE__ */ jsx(ImagesPicker, { images: form.images, onChange: (imgs) => setForm({
            ...form,
            images: imgs
          }) }),
          /* @__PURE__ */ jsx(SectionTitle, { icon: FileText, children: t("productDetails") }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4", children: [
            /* @__PURE__ */ jsx(Field, { label: t("productDescription"), children: /* @__PURE__ */ jsx(Textarea, { rows: 3, value: form.description, onChange: (e) => setForm({
              ...form,
              description: e.target.value
            }) }) }),
            /* @__PURE__ */ jsx(Field, { label: t("productUsage"), children: /* @__PURE__ */ jsx(Textarea, { rows: 3, value: form.usage, onChange: (e) => setForm({
              ...form,
              usage: e.target.value
            }) }) })
          ] }),
          /* @__PURE__ */ jsxs(DialogFooter, { className: "mt-2", children: [
            /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => setOpen(false), children: t("cancel") }),
            /* @__PURE__ */ jsx(Button, { onClick: submit, children: t("save") })
          ] })
        ] })
      ] })
    ] }),
    filtered.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-3xl p-10 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "size-14 rounded-2xl gradient-primary grid place-items-center mx-auto mb-4 glow-primary", children: /* @__PURE__ */ jsx(Package, { className: "size-6 text-primary-foreground" }) }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: items.length === 0 ? t("noProducts") : t("noResults") })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-sidebar-accent/30 text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 w-10", children: /* @__PURE__ */ jsx(Checkbox, { checked: filtered.length > 0 && filtered.every((p) => selected.has(p.id)), onCheckedChange: (v) => {
            if (v) setSelected(new Set(filtered.map((p) => p.id)));
            else setSelected(/* @__PURE__ */ new Set());
          }, "aria-label": "select all" }) }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-start font-medium", children: t("intlBarcode") }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-start font-medium", children: t("productName") }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-start font-medium", children: t("productCategory") }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-start font-medium", children: t("lotNumber") }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-start font-medium", children: t("expiryDate") }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-end font-medium", children: t("costExTax") }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-end font-medium", children: t("priceIncTax") }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-end font-medium", children: t("onHandQty") }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-end font-medium", children: t("forecastedQty") }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-end font-medium", children: t("totalCostValue") }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-end font-medium", children: t("totalSaleValue") }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-end font-medium", children: t("salesTax") }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-end font-medium", children: t("totalSalesTax") }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-end font-medium", children: t("grossProfit") }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-end font-medium", children: t("profitMargin") }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: pagedGroups.map((g) => /* @__PURE__ */ jsxs(React__default.Fragment, { children: [
          groupBy !== "__none__" && /* @__PURE__ */ jsx("tr", { className: "bg-sidebar-accent/40", children: /* @__PURE__ */ jsxs("td", { colSpan: 16, className: "px-4 py-2 font-semibold text-sm", children: [
            g.label,
            " ",
            /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground font-normal", children: [
              "(",
              g.items.length,
              ")"
            ] })
          ] }) }),
          g.items.map((p) => {
            const productLots = lots.filter((l) => l.productId === p.id);
            const totalCost = p.costExTax * p.onHandQty;
            const totalSale = p.priceIncTax * p.onHandQty;
            const saleTaxPerUnit = p.salesTax > 0 ? p.priceIncTax * p.salesTax / (100 + p.salesTax) : 0;
            const totalSaleTax = saleTaxPerUnit * p.onHandQty;
            const grossProfit = totalSale - totalCost - totalSaleTax;
            const netSales = totalSale - totalSaleTax;
            const profitMargin = netSales > 0 ? grossProfit / netSales * 100 : 0;
            const isSelected = selected.has(p.id);
            return /* @__PURE__ */ jsxs("tr", { className: cn("border-t border-border/60 hover:bg-sidebar-accent/20", isSelected && "bg-primary/5"), children: [
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(Checkbox, { checked: isSelected, onCheckedChange: (v) => {
                setSelected((prev) => {
                  const next = new Set(prev);
                  if (v) next.add(p.id);
                  else next.delete(p.id);
                  return next;
                });
              }, "aria-label": `select ${displayName(p)}` }) }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground tabular-nums", children: p.intlBarcode || "—" }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium", children: displayName(p) }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: p.category || "—" }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: productLots.length > 0 ? /* @__PURE__ */ jsx("div", { className: "space-y-0.5", children: productLots.map((l) => /* @__PURE__ */ jsx("div", { className: "tabular-nums text-sm", children: l.lotNumber }, l.id)) }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: "—" }) }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: productLots.length > 0 ? /* @__PURE__ */ jsx("div", { className: "space-y-0.5", children: productLots.map((l) => /* @__PURE__ */ jsx("div", { className: "tabular-nums text-sm text-muted-foreground", children: l.expiryDate || "—" }, l.id)) }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: "—" }) }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-end tabular-nums", children: p.costExTax.toLocaleString() }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-end tabular-nums", children: p.priceIncTax.toLocaleString() }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-end tabular-nums", children: p.onHandQty }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-end tabular-nums", children: p.forecastedQty }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-end tabular-nums font-medium", children: totalCost.toLocaleString() }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-end tabular-nums font-medium", children: totalSale.toLocaleString() }),
              /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 text-end tabular-nums", children: [
                p.salesTax,
                "%"
              ] }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-end tabular-nums font-medium", children: totalSaleTax.toLocaleString(void 0, {
                maximumFractionDigits: 2
              }) }),
              /* @__PURE__ */ jsx("td", { className: cn("px-4 py-3 text-end tabular-nums font-semibold", grossProfit > 0 ? "text-emerald-500" : grossProfit < 0 ? "text-destructive" : ""), children: grossProfit.toLocaleString(void 0, {
                maximumFractionDigits: 2
              }) }),
              /* @__PURE__ */ jsx("td", { className: cn("px-4 py-3 text-end tabular-nums font-semibold", profitMargin > 0 ? "text-emerald-500" : profitMargin < 0 ? "text-destructive" : "text-muted-foreground"), children: netSales > 0 ? `${profitMargin.toFixed(1)}%` : "—" }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-end", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-1", children: [
                /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: () => openEdit(p), "aria-label": t("edit"), children: /* @__PURE__ */ jsx(Pencil, { className: "size-4" }) }),
                /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: () => remove(p.id), "aria-label": t("delete"), children: /* @__PURE__ */ jsx(Trash2, { className: "size-4 text-destructive" }) })
              ] }) })
            ] }, p.id);
          })
        ] }, g.key || "__all__")) })
      ] }) }),
      /* @__PURE__ */ jsx(PaginationBar, { page: pg.page, totalPages: pg.totalPages, total: pg.total, from: pg.from, to: pg.to, onPageChange: pg.setPage, showAll: pg.showAll, onToggleShowAll: pg.toggleShowAll })
    ] })
  ] });
}
function LotsSection({
  products,
  lots,
  setLots,
  displayName
}) {
  const {
    t
  } = useApp();
  const sfdaProducts = products.filter((p) => p.sfdaTracking);
  const productMap = new Map(products.map((p) => [p.id, p]));
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const startEdit = (l) => {
    setEditingId(l.id);
    setDraft({
      ...l
    });
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
    setLots((prev) => prev.map((l) => l.id === draft.id ? draft : l));
    setEditingId(null);
    setDraft(null);
    toast.success(t("save"));
  };
  const updateDraft = (patch) => setDraft((prev) => prev ? {
    ...prev,
    ...patch
  } : prev);
  const remove = (id) => setLots((prev) => prev.filter((l) => l.id !== id));
  if (sfdaProducts.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-3xl p-10 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "size-14 rounded-2xl gradient-primary grid place-items-center mx-auto mb-4 glow-primary", children: /* @__PURE__ */ jsx(Barcode, { className: "size-6 text-primary-foreground" }) }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t("noSfdaProducts") })
    ] });
  }
  if (lots.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-3xl p-10 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "size-14 rounded-2xl gradient-primary grid place-items-center mx-auto mb-4 glow-primary", children: /* @__PURE__ */ jsx(Barcode, { className: "size-6 text-primary-foreground" }) }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t("noLots") })
    ] });
  }
  return /* @__PURE__ */ jsx("div", { className: "glass-card rounded-2xl overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
    /* @__PURE__ */ jsx("thead", { className: "bg-sidebar-accent/30 text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
      /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-start font-medium", children: t("product") }),
      /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-start font-medium", children: t("lotNumber") }),
      /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-start font-medium", children: t("expiryDate") }),
      /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-end font-medium", children: t("lotQty") }),
      /* @__PURE__ */ jsx("th", { className: "px-4 py-3" })
    ] }) }),
    /* @__PURE__ */ jsx("tbody", { children: lots.map((l) => {
      const p = productMap.get(l.productId);
      const isEditing = editingId === l.id;
      return /* @__PURE__ */ jsxs("tr", { className: "border-t border-border/60 hover:bg-sidebar-accent/20", children: [
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium", children: p ? displayName(p) : "—" }),
        isEditing && draft ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(Input, { value: draft.lotNumber, onChange: (e) => updateDraft({
            lotNumber: e.target.value
          }), className: "h-8" }) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(DatePickerInput, { value: draft.expiryDate, onChange: (v) => updateDraft({
            expiryDate: v
          }), className: "h-8" }) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(Input, { type: "number", value: draft.qty, onChange: (e) => updateDraft({
            qty: Number(e.target.value)
          }), className: "h-8 text-end" }) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-end", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-1", children: [
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: saveEdit, "aria-label": t("save"), children: /* @__PURE__ */ jsx(ShieldCheck, { className: "size-4 text-emerald-500" }) }),
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: cancelEdit, "aria-label": t("cancel"), children: /* @__PURE__ */ jsx(Trash2, { className: "size-4 text-muted-foreground" }) })
          ] }) })
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 tabular-nums", children: l.lotNumber }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground tabular-nums", children: l.expiryDate || "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-end tabular-nums", children: l.qty }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-end", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-1", children: [
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: () => startEdit(l), "aria-label": t("edit"), children: /* @__PURE__ */ jsx(Pencil, { className: "size-4" }) }),
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: () => remove(l.id), "aria-label": t("delete"), children: /* @__PURE__ */ jsx(Trash2, { className: "size-4 text-destructive" }) })
          ] }) })
        ] })
      ] }, l.id);
    }) })
  ] }) }) });
}
function TaxToggle({
  value,
  onChange
}) {
  const {
    t
  } = useApp();
  const opts = [{
    v: 0,
    label: t("taxZero")
  }, {
    v: 15,
    label: t("taxFifteen")
  }];
  return /* @__PURE__ */ jsx("div", { className: "inline-flex rounded-lg border border-border/60 p-1 bg-background w-full", children: opts.map((o) => {
    const active = value === o.v;
    return /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onChange(o.v), className: cn("flex-1 px-3 py-1.5 text-sm rounded-md transition-all font-medium", active ? "gradient-primary text-primary-foreground glow-primary" : "text-muted-foreground hover:text-foreground"), children: o.label }, o.v);
  }) });
}
function SectionTitle({
  icon: Icon,
  children
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-2 pb-1 border-b border-border/40 mb-2", children: [
    /* @__PURE__ */ jsx(Icon, { className: "size-4 text-primary" }),
    /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold", children })
  ] });
}
function Field({
  label,
  children,
  className
}) {
  return /* @__PURE__ */ jsxs("div", { className: cn("space-y-1.5", className), children: [
    /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: label }),
    children
  ] });
}
function SectionPlaceholder({
  titleKey
}) {
  const {
    t
  } = useApp();
  return /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-3xl p-10 text-center animate-fade-in", children: [
    /* @__PURE__ */ jsx("div", { className: "size-14 rounded-2xl gradient-primary grid place-items-center mx-auto mb-4 glow-primary", children: /* @__PURE__ */ jsx(Construction, { className: "size-6 text-primary-foreground" }) }),
    /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold mb-1", children: t(titleKey) }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t("comingSoon") })
  ] });
}
function ImagesPicker({
  images,
  onChange
}) {
  const {
    t
  } = useApp();
  const inputRef = useRef(null);
  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const next = [];
    for (const file of Array.from(files)) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(t("imageTooLarge"));
        continue;
      }
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      next.push(dataUrl);
    }
    if (next.length) onChange([...images, ...next]);
    if (inputRef.current) inputRef.current.value = "";
  };
  const removeAt = (i) => onChange(images.filter((_, idx) => idx !== i));
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
      images.map((src, i) => /* @__PURE__ */ jsxs("div", { className: "relative size-20 rounded-xl overflow-hidden border border-border bg-muted/40", children: [
        /* @__PURE__ */ jsx("img", { src, alt: "", className: "size-full object-cover" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => removeAt(i), className: "absolute top-0.5 end-0.5 size-5 grid place-items-center rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground", "aria-label": t("delete"), children: /* @__PURE__ */ jsx(Trash2, { className: "size-3" }) })
      ] }, i)),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => inputRef.current?.click(), className: "size-20 rounded-xl border-2 border-dashed border-border bg-muted/20 grid place-items-center text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors", "aria-label": t("addImage"), children: /* @__PURE__ */ jsx(ImagePlus, { className: "size-5" }) })
    ] }),
    /* @__PURE__ */ jsx("input", { ref: inputRef, type: "file", accept: "image/*", multiple: true, className: "hidden", onChange: (e) => handleFiles(e.target.files) })
  ] });
}
export {
  ProductsPage as component
};
