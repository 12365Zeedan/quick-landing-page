import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, useRouter, Link, Outlet, HeadContent, Scripts, createFileRoute, lazyRouteComponent, createRouter } from "@tanstack/react-router";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { useState, useEffect, createContext, useContext, useCallback, useMemo, useRef, useLayoutEffect } from "react";
import { s as supabase } from "./client-bowce4Dj.js";
import { Toaster, toast } from "sonner";
import { format, parse, isValid } from "date-fns";
import { ar } from "date-fns/locale/ar";
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, CalendarIcon, X, Plus, Trash2, Timer, Users, Banknote, Building2, TicketPercent, Receipt, TrendingUp, FileSpreadsheet, Boxes, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { getDefaultClassNames, DayPicker } from "react-day-picker";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { createPortal } from "react-dom";
const appCss = "/assets/styles-DwzmVneb.css";
const dict = {
  appName: { ar: "فارما ليدجر", en: "PharmLedger" },
  tagline: { ar: "الإدارة المالية للصيدليات", en: "Pharmacy Financial Management" },
  // Nav
  dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
  revenue: { ar: "الإيرادات", en: "Revenue" },
  expenses: { ar: "المصروفات", en: "Expenses" },
  purchases: { ar: "المشتريات", en: "Purchases" },
  suppliers: { ar: "الموردون", en: "Suppliers" },
  staff: { ar: "الموظفون", en: "Staff" },
  debts: { ar: "الديون", en: "Debts" },
  supplierPayments: { ar: "سندات سداد الموردين", en: "Supplier Payments" },
  statements: { ar: "القوائم المالية", en: "Statements" },
  vat: { ar: "ضريبة القيمة المضافة", en: "VAT" },
  reports: { ar: "التقارير", en: "Reports" },
  settings: { ar: "الإعدادات", en: "Settings" },
  backup: { ar: "النسخ الاحتياطي", en: "Backup" },
  accounts: { ar: "الحسابات", en: "Accounts" },
  inventory: { ar: "المخزون", en: "Inventory" },
  inventoryProducts: { ar: "المنتجات", en: "Products" },
  inventoryOperations: { ar: "العمليات", en: "Operations" },
  inventoryReports: { ar: "التقارير", en: "Reports" },
  productsTab: { ar: "المنتجات", en: "Products" },
  productVariantsTab: { ar: "متغيرات المنتج", en: "Product Variants" },
  lotSerialTab: { ar: "أرقام التشغيل/التسلسل", en: "Lot / Serial Numbers" },
  packagesTab: { ar: "العبوات", en: "Packages" },
  createProduct: { ar: "إنشاء منتج", en: "Create Product" },
  editProduct: { ar: "تعديل المنتج", en: "Edit Product" },
  productName: { ar: "اسم المنتج", en: "Product Name" },
  productNameAr: { ar: "اسم المنتج بالعربية", en: "Product Name (Arabic)" },
  productNameEn: { ar: "اسم المنتج بالإنجليزية", en: "Product Name (English)" },
  productSku: { ar: "SKU", en: "SKU" },
  productCategory: { ar: "تصنيف المنتج", en: "Product Category" },
  productUnit: { ar: "الوحدة", en: "Unit" },
  productPrice: { ar: "السعر", en: "Price" },
  productCost: { ar: "التكلفة", en: "Cost" },
  productBarcode: { ar: "الباركود", en: "Barcode" },
  intlBarcode: { ar: "الباركود الدولي", en: "International Barcode" },
  sfdaCode: { ar: "كود الـ SFDA", en: "SFDA Code" },
  costExTax: { ar: "سعر التكلفة (بدون ضريبة)", en: "Cost Price (Excl. Tax)" },
  priceIncTax: { ar: "سعر البيع (شامل الضريبة)", en: "Sale Price (Incl. Tax)" },
  purchaseTax: { ar: "ضريبة المشتريات", en: "Purchase Tax" },
  salesTax: { ar: "ضريبة المبيعات", en: "Sales Tax" },
  taxZero: { ar: "صفر %", en: "0%" },
  taxFifteen: { ar: "15%", en: "15%" },
  onHandQty: { ar: "الكمية المتوفرة", en: "On Hand QTY" },
  forecastedQty: { ar: "الكمية المتوقعة", en: "Forecasted QTY" },
  sfdaTracking: { ar: "تتبع SFDA", en: "SFDA Tracking" },
  sfdaTrackingHint: { ar: "فعّل إذا كان المنتج يتطلب تتبع SFDA", en: "Enable if this product requires SFDA tracking" },
  lotsSerials: { ar: "أرقام التشغيل / التسلسل", en: "Lot / Serial Numbers" },
  lotNumber: { ar: "رقم التشغيلة / التسلسل", en: "Lot / Serial #" },
  expiryDate: { ar: "تاريخ الانتهاء", en: "Expiry Date" },
  lotQty: { ar: "الكمية", en: "Quantity" },
  addLot: { ar: "إضافة رقم تشغيلة", en: "Add Lot / Serial" },
  noLots: { ar: "لا توجد أرقام تشغيلة بعد", en: "No lots / serials yet" },
  lotRequired: { ar: "هذا المنتج يتطلب تتبع SFDA — أضف رقم تشغيلة واحد على الأقل", en: "This product requires SFDA tracking — add at least one lot/serial" },
  lotNumberRequired: { ar: "رقم التشغيلة مطلوب", en: "Lot/serial number is required" },
  product: { ar: "المنتج", en: "Product" },
  noSfdaProducts: { ar: "لا توجد منتجات مفعّل لها تتبع SFDA", en: "No SFDA-tracked products yet" },
  basicInfo: { ar: "البيانات الأساسية", en: "Basic Information" },
  pricing: { ar: "التسعير والضرائب", en: "Pricing & Taxes" },
  stockInfo: { ar: "المخزون", en: "Stock" },
  noProducts: { ar: "لا توجد منتجات بعد", en: "No products yet" },
  productMedia: { ar: "صور المنتج", en: "Product Images" },
  addImage: { ar: "إضافة صورة", en: "Add Image" },
  imageTooLarge: { ar: "حجم الصورة كبير جدًا (الحد الأقصى 2 ميجابايت)", en: "Image too large (max 2MB)" },
  productDetails: { ar: "تفاصيل ووصف المنتج", en: "Product Details" },
  productDescription: { ar: "وصف المنتج", en: "Product Description" },
  productUsage: { ar: "طريقة الاستخدام", en: "Usage Instructions" },
  totalCostValue: { ar: "إجمالي التكلفة", en: "Total Cost" },
  totalSaleValue: { ar: "إجمالي البيع", en: "Total Sale" },
  totalSalesTax: { ar: "إجمالي ضريبة البيع", en: "Total Sales Tax" },
  totals: { ar: "الإجماليات", en: "Totals" },
  totalAmount: { ar: "إجمالي المبلغ", en: "Total Amount" },
  totalPaid: { ar: "إجمالي المدفوع", en: "Total Paid" },
  totalBalance: { ar: "إجمالي الرصيد", en: "Total Balance" },
  profitMargin: { ar: "نسبة الربح", en: "Profit Margin" },
  groupByNone: { ar: "بدون تجميع", en: "No Grouping" },
  allCategories: { ar: "كل التصنيفات", en: "All Categories" },
  allTaxes: { ar: "كل الضرائب", en: "All Taxes" },
  sfdaStatus: { ar: "حالة تتبع SFDA", en: "SFDA Status" },
  allProducts: { ar: "كل المنتجات", en: "All Products" },
  sfdaOnly: { ar: "بتتبع SFDA فقط", en: "SFDA Tracked Only" },
  nonSfdaOnly: { ar: "بدون تتبع SFDA", en: "Non-SFDA Only" },
  exportProductsExcel: { ar: "تصدير إلى Excel", en: "Export to Excel" },
  importProductsExcel: { ar: "استيراد من Excel", en: "Import from Excel" },
  downloadTemplateBtn: { ar: "تنزيل القالب", en: "Download Template" },
  importedProducts: { ar: "تم استيراد {n} منتج", en: "Imported {n} products" },
  importNoRowsFound: { ar: "لم يتم العثور على صفوف صالحة", en: "No valid rows found" },
  importFailedMsg: { ar: "فشل الاستيراد", en: "Import failed" },
  uncategorized: { ar: "بدون تصنيف", en: "Uncategorized" },
  chartOfAccounts: { ar: "شجرة الحسابات", en: "Chart of Accounts" },
  chartOfAccountsSubtitle: { ar: "الدليل المحاسبي والتصنيفات الرئيسية للحسابات", en: "Accounting directory and main account classifications" },
  accountCode: { ar: "الكود", en: "Code" },
  accountName: { ar: "اسم الحساب", en: "Account Name" },
  accountType: { ar: "النوع", en: "Type" },
  accountNature: { ar: "الطبيعة", en: "Nature" },
  natureDebit: { ar: "مدين", en: "Debit" },
  natureCredit: { ar: "دائن", en: "Credit" },
  addRootAccount: { ar: "إضافة تصنيف رئيسي", en: "Add Main Category" },
  addSubAccount: { ar: "إضافة تصنيف فرعي", en: "Add Sub-category" },
  editName: { ar: "تعديل الاسم", en: "Edit Name" },
  deleteAccount: { ar: "حذف", en: "Delete" },
  confirmDeleteAccount: { ar: "حذف هذا التصنيف وكل ما تحته؟", en: "Delete this account and all its children?" },
  newAccountName: { ar: "اسم التصنيف الجديد", en: "New category name" },
  resetToDefault: { ar: "استعادة الافتراضي", en: "Reset to default" },
  journalAndLedger: { ar: "قيود اليومية ودفتر الأستاذ", en: "Journal & Ledger" },
  journalSubtitle: { ar: "قيود محاسبية مزدوجة مولدة تلقائياً من كل الموديولات", en: "Double-entry journal auto-generated from all modules" },
  journal: { ar: "اليومية", en: "Journal" },
  ledger: { ar: "دفتر الأستاذ", en: "Ledger" },
  ledgerPickAccount: { ar: "اختر حساباً لعرض حركاته", en: "Select an account to view its movements" },
  selectAccount: { ar: "اختر حساباً", en: "Select an account" },
  allAccounts: { ar: "كل الحسابات", en: "All accounts" },
  source: { ar: "المصدر", en: "Source" },
  debit: { ar: "مدين", en: "Debit" },
  credit: { ar: "دائن", en: "Credit" },
  totalDebit: { ar: "إجمالي المدين", en: "Total Debit" },
  totalCredit: { ar: "إجمالي الدائن", en: "Total Credit" },
  difference: { ar: "الفرق", en: "Difference" },
  description: { ar: "البيان", en: "Description" },
  noJournalLines: { ar: "لا توجد قيود مطابقة", en: "No matching entries" },
  refresh: { ar: "تحديث", en: "Refresh" },
  all: { ar: "الكل", en: "All" },
  linkedAccount: { ar: "حساب مرتبط (اختياري)", en: "Linked account (optional)" },
  // Dashboard
  welcome: { ar: "مرحباً بعودتك", en: "Welcome back" },
  overview: { ar: "نظرة عامة على أداء صيدليتك اليوم", en: "Here's how your pharmacy is performing today" },
  todayRevenue: { ar: "إيرادات اليوم", en: "Today's Revenue" },
  todayExpenses: { ar: "مصروفات اليوم", en: "Today's Expenses" },
  netProfit: { ar: "صافي الربح (الشهر)", en: "Net Profit (MTD)" },
  outstandingDebts: { ar: "الديون المستحقة", en: "Outstanding Debts" },
  cashBalance: { ar: "الرصيد النقدي", en: "Cash Balance" },
  vatDue: { ar: "ض. القيمة المضافة المستحقة", en: "VAT Due This Month" },
  vsYesterday: { ar: "مقارنة بالأمس", en: "vs yesterday" },
  revenueVsExpenses: { ar: "الإيرادات مقابل المصروفات", en: "Revenue vs Expenses" },
  last30: { ar: "آخر 30 يوماً", en: "Last 30 days" },
  paymentMix: { ar: "طرق الدفع", en: "Revenue by Payment Method" },
  monthlyProfit: { ar: "الربح الشهري", en: "Monthly Profit" },
  cashFlow: { ar: "التدفق النقدي", en: "Cash Flow" },
  last90: { ar: "آخر 90 يوماً", en: "Last 90 days" },
  recentTransactions: { ar: "أحدث المعاملات", en: "Recent Transactions" },
  topSuppliers: { ar: "أهم الموردين", en: "Top Suppliers" },
  overdueDebts: { ar: "الديون المتأخرة", en: "Overdue Debts" },
  // Quick actions
  addRevenue: { ar: "إضافة إيراد", en: "Add Revenue" },
  addExpense: { ar: "إضافة مصروف", en: "Add Expense" },
  newPurchase: { ar: "فاتورة شراء", en: "New Purchase" },
  logShift: { ar: "تسجيل مناوبة", en: "Log Shift" },
  // Table headers / labels
  date: { ar: "التاريخ", en: "Date" },
  category: { ar: "التصنيف", en: "Category" },
  amount: { ar: "المبلغ", en: "Amount" },
  type: { ar: "النوع", en: "Type" },
  status: { ar: "الحالة", en: "Status" },
  party: { ar: "الجهة", en: "Party" },
  daysOverdue: { ar: "أيام التأخير", en: "Days Overdue" },
  totalPurchases: { ar: "إجمالي المشتريات", en: "Total Purchases" },
  income: { ar: "إيراد", en: "Income" },
  expense: { ar: "مصروف", en: "Expense" },
  cash: { ar: "نقدي", en: "Cash" },
  card: { ar: "بطاقة", en: "Card" },
  transfer: { ar: "تحويل", en: "Transfer" },
  insurance: { ar: "تأمين", en: "Insurance" },
  search: { ar: "بحث...", en: "Search..." },
  admin: { ar: "مدير", en: "Admin" },
  currency: { ar: "ر.س", en: "SAR" },
  // Revenue module
  revenueTitle: { ar: "إدارة الإيرادات", en: "Revenue Management" },
  revenueSubtitle: { ar: "تتبع وإدارة جميع إيرادات الصيدلية", en: "Track and manage all pharmacy income" },
  totalRevenue: { ar: "إجمالي الإيرادات", en: "Total Revenue" },
  avgTicket: { ar: "متوسط الفاتورة", en: "Average Ticket" },
  transactionsCount: { ar: "عدد المعاملات", en: "Transactions" },
  topCategory: { ar: "أعلى تصنيف", en: "Top Category" },
  newRevenue: { ar: "إيراد جديد", en: "New Revenue Entry" },
  filterAll: { ar: "الكل", en: "All" },
  searchRevenue: { ar: "بحث في الإيرادات...", en: "Search revenue..." },
  exportCsv: { ar: "تصدير Excel", en: "Export Excel" },
  exportExcel: { ar: "تصدير Excel", en: "Export Excel" },
  exportPdf: { ar: "تصدير PDF", en: "Export PDF" },
  importExcel: { ar: "استيراد Excel", en: "Import Excel" },
  downloadTemplate: { ar: "تحميل القالب", en: "Download Template" },
  importedRevenue: { ar: "تم استيراد {n} إيراد", en: "Imported {n} revenue entries" },
  importFailed: { ar: "فشل استيراد الملف", en: "Failed to import file" },
  importNoRows: { ar: "لم يتم العثور على صفوف صالحة", en: "No valid rows found" },
  noResults: { ar: "لا توجد نتائج", en: "No results" },
  paymentMethod: { ar: "طريقة الدفع", en: "Payment Method" },
  reference: { ar: "المرجع", en: "Reference" },
  notes: { ar: "ملاحظات", en: "Notes" },
  save: { ar: "حفظ", en: "Save" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  prescription: { ar: "وصفات طبية", en: "Prescriptions" },
  otc: { ar: "أدوية بدون وصفة", en: "OTC" },
  cosmetics: { ar: "مستحضرات تجميل", en: "Cosmetics" },
  supplements: { ar: "مكملات غذائية", en: "Supplements" },
  medical: { ar: "مستلزمات طبية", en: "Medical Supplies" },
  other: { ar: "أخرى", en: "Other" },
  addedRevenue: { ar: "تم إضافة الإيراد بنجاح", en: "Revenue added successfully" },
  updatedRevenue: { ar: "تم تعديل الإيراد بنجاح", en: "Revenue updated successfully" },
  deletedRevenue: { ar: "تم حذف الإيراد", en: "Revenue deleted" },
  editRevenue: { ar: "تعديل الإيراد", en: "Edit Revenue" },
  confirmDeleteRevenue: { ar: "هل أنت متأكد من حذف هذا الإيراد؟", en: "Delete this revenue entry?" },
  actions: { ar: "إجراءات", en: "Actions" },
  edit: { ar: "تعديل", en: "Edit" },
  delete: { ar: "حذف", en: "Delete" },
  updatedPurchase: { ar: "تم تعديل الفاتورة", en: "Purchase updated" },
  updatedExpense: { ar: "تم تعديل المصروف", en: "Expense updated" },
  updatedSupplier: { ar: "تم تعديل المورد", en: "Supplier updated" },
  updatedDebt: { ar: "تم تعديل الدين", en: "Debt updated" },
  updatedStaff: { ar: "تم تعديل الموظف", en: "Staff member updated" },
  deletedRow: { ar: "تم الحذف", en: "Deleted" },
  undo: { ar: "تراجع", en: "Undo" },
  restoredSelected: { ar: "تم استرجاع العناصر", en: "Items restored" },
  confirmDeleteRow: { ar: "هل أنت متأكد من الحذف؟", en: "Delete this entry?" },
  selectedRows: { ar: "محدد", en: "selected" },
  selectAll: { ar: "تحديد الكل", en: "Select all" },
  deselectAll: { ar: "إلغاء تحديد الكل", en: "Deselect all" },
  clearSelection: { ar: "إلغاء التحديد", en: "Clear" },
  deleteSelected: { ar: "حذف المحدد", en: "Delete selected" },
  confirmDeleteSelected: { ar: "هل تريد حذف العناصر المحددة؟", en: "Delete the selected entries?" },
  deletedSelected: { ar: "تم حذف العناصر المحددة", en: "Selected entries deleted" },
  totalSelected: { ar: "إجمالي المعروض", en: "Total shown" },
  customers: { ar: "عدد العملاء", en: "Customers" },
  customersCount: { ar: "إجمالي العملاء", en: "Total Customers" },
  avgPerCustomer: { ar: "متوسط العميل", en: "Avg / Customer" },
  bank: { ar: "بنك", en: "Bank" },
  discount: { ar: "خصومات", en: "Discounts" },
  totalDiscounts: { ar: "إجمالي الخصومات", en: "Total Discounts" },
  netTotal: { ar: "صافي الإيراد", en: "Net Total" },
  netRevenue: { ar: "صافي الإيراد", en: "Net Revenue" },
  wasfatySales: { ar: "مبيعات وصفتي", en: "Wasfaty Sales" },
  dateLabel: { ar: "التاريخ", en: "Date" },
  autoGenerated: { ar: "يُولّد تلقائياً", en: "Auto-generated" },
  thisMonth: { ar: "هذا الشهر", en: "This Month" },
  thisWeek: { ar: "هذا الأسبوع", en: "This Week" },
  today: { ar: "اليوم", en: "Today" },
  filters: { ar: "الفلاتر", en: "Filters" },
  resetFilters: { ar: "إعادة تعيين", en: "Reset" },
  dateFrom: { ar: "من تاريخ", en: "From date" },
  dateTo: { ar: "إلى تاريخ", en: "To date" },
  amountMin: { ar: "أقل مبلغ", en: "Min amount" },
  amountMax: { ar: "أعلى مبلغ", en: "Max amount" },
  paymentAny: { ar: "كل طرق الدفع", en: "All payment methods" },
  cashOnly: { ar: "نقدي فقط", en: "Cash only" },
  bankOnly: { ar: "بنك فقط", en: "Bank only" },
  wasfatyOnly: { ar: "وصفتي فقط", en: "Wasfaty only" },
  groupBy: { ar: "تجميع حسب", en: "Group by" },
  groupNone: { ar: "بدون تجميع", en: "No grouping" },
  groupDay: { ar: "حسب اليوم", en: "By day" },
  groupWeek: { ar: "حسب الأسبوع", en: "By week" },
  groupMonth: { ar: "حسب الشهر", en: "By month" },
  groupYear: { ar: "حسب السنة", en: "By year" },
  entriesCount: { ar: "عدد القيود", en: "Entries" },
  presetThisWeek: { ar: "هذا الأسبوع", en: "This week" },
  presetThisMonth: { ar: "هذا الشهر", en: "This month" },
  presetThisYear: { ar: "هذه السنة", en: "This year" },
  presetAll: { ar: "كل الفترة", en: "All time" },
  // Expenses module
  expensesTitle: { ar: "إدارة المصروفات", en: "Expense Management" },
  expensesSubtitle: { ar: "تتبع جميع مصروفات الصيدلية والتشغيل", en: "Track all pharmacy operating expenses" },
  totalExpenses: { ar: "إجمالي المصروفات", en: "Total Expenses" },
  avgExpense: { ar: "متوسط المصروف", en: "Average Expense" },
  newExpense: { ar: "مصروف جديد", en: "New Expense" },
  searchExpenses: { ar: "بحث في المصروفات...", en: "Search expenses..." },
  addedExpense: { ar: "تم إضافة المصروف بنجاح", en: "Expense added successfully" },
  vendor: { ar: "المورد / الجهة", en: "Vendor" },
  annual: { ar: "مصروفات سنوية", en: "Annual Expenses" },
  founding: { ar: "مصروفات تأسيس", en: "Founding Expenses" },
  office: { ar: "أدوات مكتبية", en: "Office Supplies" },
  marketing: { ar: "تسويق", en: "Marketing" },
  phones: { ar: "تليفونات", en: "Phones" },
  electricity: { ar: "كهرباء", en: "Electricity" },
  bankFees: { ar: "رسوم بنكية", en: "Bank Fees" },
  rent: { ar: "إيجار", en: "Rent" },
  salaries: { ar: "رواتب شهرية", en: "Monthly Salaries" },
  medsPurchase: { ar: "مشتريات أدوية", en: "Medicines Purchase" },
  cosmeticsPurchase: { ar: "مشتريات كماليات", en: "Cosmetics Purchase" },
  milkPurchase: { ar: "مشتريات حليب", en: "Milk Purchase" },
  ownerDrawings: { ar: "مسحوبات الملاك (جاري الشركاء)", en: "Owner Drawings (Partners' Current Account)" },
  depreciation: { ar: "إهلاك الأصول الثابتة", en: "Depreciation Expense" },
  zakat: { ar: "زكاة سنوية", en: "Annual Zakat" },
  misc: { ar: "نثريات", en: "Miscellaneous" },
  receiptNo: { ar: "رقم الإيصال", en: "Receipt No." },
  // Purchases module
  purchasesTitle: { ar: "إدارة المشتريات", en: "Purchase Management" },
  purchasesSubtitle: { ar: "تتبع فواتير الشراء من الموردين والمخزون", en: "Track supplier invoices and inventory purchases" },
  totalPurchasesValue: { ar: "إجمالي المشتريات", en: "Total Purchases" },
  invoicesCount: { ar: "عدد الفواتير", en: "Invoices" },
  avgInvoice: { ar: "متوسط الفاتورة", en: "Avg. Invoice" },
  itemsPurchased: { ar: "الأصناف", en: "Items" },
  newPurchaseInvoice: { ar: "فاتورة شراء جديدة", en: "New Purchase Invoice" },
  searchPurchases: { ar: "بحث في المشتريات...", en: "Search purchases..." },
  addedPurchase: { ar: "تم تسجيل الفاتورة بنجاح", en: "Purchase recorded successfully" },
  supplier: { ar: "المورد", en: "Supplier" },
  invoiceNumber: { ar: "رقم الفاتورة", en: "Invoice #" },
  itemsCount: { ar: "عدد الأصناف", en: "# Items" },
  subtotal: { ar: "المجموع قبل الضريبة", en: "Subtotal" },
  vatAmount: { ar: "قيمة الضريبة", en: "VAT" },
  grandTotal: { ar: "الإجمالي", en: "Total" },
  paymentStatus: { ar: "حالة الدفع", en: "Payment Status" },
  paid: { ar: "مدفوعة", en: "Paid" },
  partial: { ar: "جزئية", en: "Partial" },
  unpaid: { ar: "غير مدفوعة", en: "Unpaid" },
  dueDate: { ar: "تاريخ الاستحقاق", en: "Due Date" },
  outstanding: { ar: "المتبقي", en: "Outstanding" },
  paidAmount: { ar: "المبلغ المدفوع", en: "Paid Amount" },
  // Suppliers module
  suppliersTitle: { ar: "إدارة الموردين", en: "Supplier Management" },
  suppliersSubtitle: { ar: "قاعدة بيانات الموردين والأرصدة المستحقة", en: "Supplier directory with balances and activity" },
  suppliersCount: { ar: "عدد الموردين", en: "Suppliers" },
  activeSuppliers: { ar: "موردون نشطون", en: "Active" },
  totalPayables: { ar: "إجمالي المستحق", en: "Total Payables" },
  topSupplier: { ar: "أعلى مورد", en: "Top Supplier" },
  newSupplier: { ar: "مورد جديد", en: "New Supplier" },
  searchSuppliers: { ar: "بحث في الموردين...", en: "Search suppliers..." },
  addedSupplier: { ar: "تم إضافة المورد بنجاح", en: "Supplier added successfully" },
  supplierName: { ar: "اسم المورد", en: "Supplier Name" },
  contactPerson: { ar: "الشخص المسؤول", en: "Contact Person" },
  phone: { ar: "الهاتف", en: "Phone" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  city: { ar: "المدينة", en: "City" },
  taxNumber: { ar: "الرقم الضريبي", en: "Tax #" },
  glnNumber: { ar: "رقم GLN", en: "GLN #" },
  nationalAddress: { ar: "العنوان الوطني", en: "National Address" },
  lastPurchase: { ar: "آخر فاتورة", en: "Last Purchase" },
  balance: { ar: "الرصيد", en: "Balance" },
  active: { ar: "نشط", en: "Active" },
  inactive: { ar: "غير نشط", en: "Inactive" },
  view: { ar: "عرض", en: "View" },
  // Staff module
  staffTitle: { ar: "إدارة الموظفين", en: "Staff Management" },
  staffSubtitle: { ar: "الموظفون والرواتب والمناوبات", en: "Employees, payroll and shifts" },
  staffCount: { ar: "عدد الموظفين", en: "Employees" },
  monthlyPayroll: { ar: "إجمالي الرواتب الشهرية", en: "Monthly Payroll" },
  onShift: { ar: "في المناوبة الآن", en: "On Shift Now" },
  avgSalary: { ar: "متوسط الراتب", en: "Avg. Salary" },
  newEmployee: { ar: "موظف جديد", en: "New Employee" },
  searchStaff: { ar: "بحث في الموظفين...", en: "Search staff..." },
  addedEmployee: { ar: "تم إضافة الموظف بنجاح", en: "Employee added successfully" },
  employeeName: { ar: "الاسم", en: "Name" },
  role: { ar: "الوظيفة", en: "Role" },
  salary: { ar: "الراتب", en: "Salary" },
  baseSalary: { ar: "الراتب الأساسي", en: "Base Salary" },
  overtimeSalary: { ar: "الراتب الإضافي", en: "Overtime" },
  housingAllowance: { ar: "بدل السكن", en: "Housing Allowance" },
  transportAllowance: { ar: "بدل الانتقال", en: "Transport Allowance" },
  totalSalary: { ar: "إجمالي الراتب", en: "Total Salary" },
  hireDate: { ar: "تاريخ التعيين", en: "Hire Date" },
  shift: { ar: "المناوبة", en: "Shift" },
  morning: { ar: "صباحية", en: "Morning" },
  evening: { ar: "مسائية", en: "Evening" },
  night: { ar: "ليلية", en: "Night" },
  off: { ar: "إجازة", en: "Off" },
  pharmacist: { ar: "صيدلي", en: "Pharmacist" },
  cashier: { ar: "أمين صندوق", en: "Cashier" },
  manager: { ar: "مدير فرع", en: "Manager" },
  assistant: { ar: "مساعد صيدلي", en: "Assistant" },
  cleaner: { ar: "عامل نظافة", en: "Cleaner" },
  hoursThisMonth: { ar: "ساعات هذا الشهر", en: "Hours MTD" },
  // Debts module
  debtsTitle: { ar: "إدارة الديون", en: "Debts Management" },
  debtsSubtitle: { ar: "الذمم المدينة والدائنة وحالة التحصيل", en: "Receivables, payables and collection status" },
  receivables: { ar: "ذمم مدينة (لنا)", en: "Receivables (owed to us)" },
  payables: { ar: "ذمم دائنة (علينا)", en: "Payables (we owe)" },
  netPosition: { ar: "صافي المركز", en: "Net Position" },
  overdueCount: { ar: "متأخرة", en: "Overdue" },
  newDebt: { ar: "دين جديد", en: "New Debt" },
  searchDebts: { ar: "بحث في الديون...", en: "Search debts..." },
  addedDebt: { ar: "تم تسجيل الدين بنجاح", en: "Debt recorded successfully" },
  debtType: { ar: "نوع الدين", en: "Type" },
  receivable: { ar: "مدين (لنا)", en: "Receivable" },
  payable: { ar: "دائن (علينا)", en: "Payable" },
  current: { ar: "ساري", en: "Current" },
  overdue: { ar: "متأخر", en: "Overdue" },
  settled: { ar: "مسدد", en: "Settled" },
  markSettled: { ar: "تم السداد", en: "Mark Settled" },
  agingBuckets: { ar: "أعمار الديون", en: "Aging" },
  bucket1: { ar: "شهر", en: "1 month" },
  bucket2: { ar: "شهرين", en: "2 months" },
  bucket3: { ar: "3 شهور", en: "3 months" },
  bucket4: { ar: "4 شهور", en: "4 months" },
  bucket5: { ar: "5 شهور", en: "5 months" },
  bucket5plus: { ar: "+5 شهور", en: "5+ months" },
  // Statements module
  statementsTitle: { ar: "القوائم المالية", en: "Financial Statements" },
  statementsSubtitle: { ar: "قائمة الدخل والميزانية العمومية والتدفقات النقدية", en: "P&L, Balance Sheet and Cash Flow" },
  profitLoss: { ar: "قائمة الدخل", en: "Profit & Loss" },
  balanceSheet: { ar: "الميزانية العمومية", en: "Balance Sheet" },
  cashFlowStatement: { ar: "التدفقات النقدية", en: "Cash Flow" },
  period: { ar: "الفترة", en: "Period" },
  monthly: { ar: "شهري", en: "Monthly" },
  quarterly: { ar: "ربع سنوي", en: "Quarterly" },
  yearly: { ar: "سنوي", en: "Yearly" },
  ytd: { ar: "منذ بداية العام", en: "Year-to-date" },
  grossRevenue: { ar: "إجمالي الإيرادات", en: "Gross Revenue" },
  costOfGoods: { ar: "تكلفة المبيعات", en: "Cost of Goods Sold" },
  grossProfit: { ar: "مجمل الربح", en: "Gross Profit" },
  operatingExpenses: { ar: "المصروفات التشغيلية", en: "Operating Expenses" },
  operatingIncome: { ar: "الدخل التشغيلي", en: "Operating Income" },
  vatExpense: { ar: "ضريبة القيمة المضافة", en: "VAT" },
  netIncome: { ar: "صافي الدخل", en: "Net Income" },
  margin: { ar: "الهامش", en: "Margin" },
  assets: { ar: "الأصول", en: "Assets" },
  liabilities: { ar: "الخصوم", en: "Liabilities" },
  equity: { ar: "حقوق الملكية", en: "Equity" },
  currentAssets: { ar: "أصول متداولة", en: "Current Assets" },
  fixedAssets: { ar: "أصول ثابتة", en: "Fixed Assets" },
  cashAndEquivalents: { ar: "النقد وما يعادله", en: "Cash & Equivalents" },
  accountsReceivable: { ar: "الذمم المدينة", en: "Accounts Receivable" },
  inventoryAsset: { ar: "المخزون", en: "Inventory" },
  equipment: { ar: "المعدات والأثاث", en: "Equipment & Fixtures" },
  currentLiabilities: { ar: "خصوم متداولة", en: "Current Liabilities" },
  longTermLiabilities: { ar: "خصوم طويلة الأجل", en: "Long-term Liabilities" },
  accountsPayable: { ar: "الذمم الدائنة", en: "Accounts Payable" },
  vatPayable: { ar: "ضريبة مستحقة", en: "VAT Payable" },
  loans: { ar: "قروض", en: "Loans" },
  ownerEquity: { ar: "رأس المال", en: "Owner's Capital" },
  retainedEarnings: { ar: "أرباح محتجزة", en: "Retained Earnings" },
  totalAssets: { ar: "إجمالي الأصول", en: "Total Assets" },
  totalLiabilities: { ar: "إجمالي الخصوم", en: "Total Liabilities" },
  totalEquity: { ar: "إجمالي حقوق الملكية", en: "Total Equity" },
  liabilitiesAndEquity: { ar: "إجمالي الخصوم وحقوق الملكية", en: "Total Liab. & Equity" },
  operatingActivities: { ar: "الأنشطة التشغيلية", en: "Operating Activities" },
  investingActivities: { ar: "الأنشطة الاستثمارية", en: "Investing Activities" },
  financingActivities: { ar: "الأنشطة التمويلية", en: "Financing Activities" },
  otherActivity: { ar: "أنشطة أخرى", en: "Other Activity" },
  otherIncome: { ar: "إيرادات أخرى (ذمم مدينة)", en: "Other Income (Receivables)" },
  otherExpense: { ar: "مصروفات أخرى (ذمم دائنة)", en: "Other Expense (Payables)" },
  cashFromSales: { ar: "متحصلات من المبيعات", en: "Cash from Sales" },
  cashFromReceivables: { ar: "تحصيل ذمم مدينة", en: "Collections from Receivables" },
  cashToExpenses: { ar: "مدفوعات للمصروفات", en: "Cash to Expenses" },
  cashToSuppliers: { ar: "مدفوعات للموردين", en: "Cash to Suppliers" },
  cashToPayables: { ar: "سداد ذمم دائنة", en: "Payments on Payables" },
  netCashChange: { ar: "صافي التغير في النقد", en: "Net Change in Cash" },
  openingBalance: { ar: "الرصيد الافتتاحي", en: "Opening Balance" },
  closingBalance: { ar: "الرصيد الختامي", en: "Closing Balance" },
  openingBalances: { ar: "الأرصدة الافتتاحية", en: "Opening Balances" },
  openingBalancesHint: { ar: "تُضاف هذه القيم إلى القوائم المالية كأرصدة بداية المدة", en: "These values are added to the financial statements as opening period balances" },
  openingCash: { ar: "نقدية بداية المدة", en: "Opening Cash" },
  openingBank: { ar: "بنك بداية المدة", en: "Opening Bank" },
  openingInventory: { ar: "مخزون بداية المدة", en: "Opening Inventory" },
  openingInventorySubtotal: { ar: "قيمة المخزون (بدون ضريبة)", en: "Inventory Value (excl. VAT)" },
  openingInventoryVat: { ar: "قيمة ضريبة القيمة المضافة", en: "VAT Amount" },
  openingInventoryTotal: { ar: "الإجمالي شامل الضريبة", en: "Total (incl. VAT)" },
  closingInventory: { ar: "مخزون نهاية المدة", en: "Closing Inventory" },
  closingInventorySubtotal: { ar: "قيمة المخزون (بدون ضريبة)", en: "Inventory Value (excl. VAT)" },
  closingInventoryVat: { ar: "قيمة ضريبة القيمة المضافة", en: "VAT Amount" },
  closingInventoryTotal: { ar: "الإجمالي شامل الضريبة", en: "Total (incl. VAT)" },
  openingInventoryVatCarry: { ar: "ضريبة مخزون بداية المدة (مرحّلة)", en: "Opening Inventory VAT (carry-forward)" },
  closingInventoryVatMemo: { ar: "ضريبة مخزون نهاية المدة (للعلم)", en: "Closing Inventory VAT (memo)" },
  openingDrawerCustody: { ar: "عهدة الدرج بداية المدة", en: "Opening Drawer Custody" },
  drawerCustody: { ar: "عهدة الدرج", en: "Cash Drawer Custody" },
  openingEquipment: { ar: "التجهيزات في أول المدة", en: "Opening Equipment & Setup" },
  equipmentOpening: { ar: "تجهيزات أول المدة", en: "Equipment & Setup (Opening)" },
  accumulatedDepreciation: { ar: "مجمع الإهلاك", en: "Accumulated Depreciation" },
  openingSupplierDebts: { ar: "ديون الموردين بداية المدة", en: "Opening Supplier Debts" },
  openingFixedAssets: { ar: "الأصول الثابتة الافتتاحية الأخرى", en: "Other Opening Fixed Assets" },
  addFixedAsset: { ar: "إضافة أصل ثابت", en: "Add Fixed Asset" },
  assetName: { ar: "اسم الأصل", en: "Asset Name" },
  noFixedAssetsYet: { ar: "لا توجد أصول ثابتة افتتاحية", en: "No opening fixed assets yet" },
  supplierLedger: { ar: "كشف حساب مورد", en: "Supplier Ledger" },
  selectSupplier: { ar: "اختر المورد", en: "Select supplier" },
  runningBalance: { ar: "الرصيد المتحرك", en: "Running Balance" },
  noTransactions: { ar: "لا توجد حركات في الفترة المحددة", en: "No transactions in the selected period" },
  invoiceAmount: { ar: "قيمة الفاتورة", en: "Invoice Amount" },
  paymentAmount: { ar: "المدفوع", en: "Payment" },
  noSuppliersYet: { ar: "لا يوجد موردون مضافون بعد", en: "No suppliers added yet" },
  editOpenings: { ar: "تعديل الأرصدة", en: "Edit Balances" },
  printStatement: { ar: "طباعة", en: "Print" },
  inflow: { ar: "وارد", en: "Inflow" },
  outflow: { ar: "صادر", en: "Outflow" },
  filterMonth: { ar: "هذا الشهر", en: "This Month" },
  filterQuarter: { ar: "هذا الربع", en: "This Quarter" },
  filterYear: { ar: "هذه السنة", en: "This Year" },
  filterAllTime: { ar: "كامل الفترة", en: "All Time" },
  filterCustom: { ar: "مخصص", en: "Custom" },
  filterPeriod: { ar: "فترة التقرير", en: "Report Period" },
  applyFilter: { ar: "تطبيق", en: "Apply" },
  // VAT module
  vatTitle: { ar: "ضريبة القيمة المضافة", en: "VAT Management" },
  vatSubtitle: { ar: "تقارير ضريبة المبيعات والمشتريات والإقرار الضريبي", en: "Sales & purchases VAT reporting and returns" },
  outputVat: { ar: "ضريبة المخرجات (المبيعات)", en: "Output VAT (Sales)" },
  inputVat: { ar: "ضريبة المدخلات (المشتريات)", en: "Input VAT (Purchases)" },
  outputVatPayable: { ar: "ضريبة المخرجات المستحقة", en: "Output VAT Payable" },
  cashOnHand: { ar: "النقد في الصندوق", en: "Cash on Hand" },
  netVat: { ar: "صافي الضريبة المستحقة", en: "Net VAT Payable" },
  netVatPayable: { ar: "صافي الضريبة المستحقة للمصلحة", en: "Net VAT Payable" },
  vatSummary: { ar: "ملخص ضريبة القيمة المضافة", en: "VAT Summary" },
  vatRate: { ar: "النسبة", en: "Rate" },
  vatRefundable: { ar: "ضريبة قابلة للاسترداد", en: "VAT Refundable" },
  taxableAmount: { ar: "المبلغ الخاضع للضريبة", en: "Taxable Amount" },
  totalWithVat: { ar: "الإجمالي شامل الضريبة", en: "Total Incl. VAT" },
  filingPeriod: { ar: "فترة الإقرار", en: "Filing Period" },
  q1: { ar: "الربع الأول", en: "Q1" },
  q2: { ar: "الربع الثاني", en: "Q2" },
  q3: { ar: "الربع الثالث", en: "Q3" },
  q4: { ar: "الربع الرابع", en: "Q4" },
  salesVat: { ar: "ضريبة المبيعات", en: "Sales VAT" },
  purchasesVat: { ar: "ضريبة المشتريات", en: "Purchases VAT" },
  vatReturn: { ar: "الإقرار الضريبي", en: "VAT Return" },
  invoiceCount: { ar: "عدد الفواتير", en: "Invoices" },
  effectiveRate: { ar: "النسبة الفعلية", en: "Effective Rate" },
  vatBreakdown: { ar: "تفصيل ضريبة القيمة المضافة", en: "VAT Breakdown" },
  breakdownByRate: { ar: "حسب النسبة الضريبية", en: "By VAT Rate" },
  breakdownByCategory: { ar: "حسب الفئة", en: "By Category" },
  standardRate: { ar: "النسبة القياسية 15%", en: "Standard 15%" },
  zeroRated: { ar: "نسبة صفرية 0%", en: "Zero-Rated 0%" },
  shareOfTotal: { ar: "النسبة من الإجمالي", en: "Share of Total" },
  month: { ar: "الشهر", en: "Month" },
  quarter: { ar: "الربع", en: "Quarter" },
  reportsTitle: { ar: "التقارير", en: "Reports Center" },
  reportsSubtitle: { ar: "تقارير جاهزة للتشغيل والتصدير", en: "Ready-to-run reports for your business" },
  reportCatalog: { ar: "كتالوج التقارير", en: "Report Catalog" },
  recentReports: { ar: "التقارير الأخيرة", en: "Recent Reports" },
  runReport: { ar: "تشغيل", en: "Run" },
  catFinancial: { ar: "مالي", en: "Financial" },
  catSales: { ar: "المبيعات", en: "Sales" },
  catInventory: { ar: "المشتريات والمخزون", en: "Purchases & Inventory" },
  catHr: { ar: "الموارد البشرية", en: "HR" },
  catTax: { ar: "الضرائب", en: "Tax" },
  catCompliance: { ar: "الامتثال", en: "Compliance" },
  rptPL: { ar: "قائمة الدخل", en: "Profit & Loss Statement" },
  rptPLDesc: { ar: "ملخص الإيرادات والمصروفات وصافي الربح", en: "Revenue, expenses and net profit summary" },
  rptBS: { ar: "الميزانية العمومية", en: "Balance Sheet" },
  rptBSDesc: { ar: "الأصول والخصوم وحقوق الملكية", en: "Assets, liabilities and equity snapshot" },
  rptCF: { ar: "التدفقات النقدية", en: "Cash Flow Statement" },
  rptCFDesc: { ar: "صافي التغير في النقد عبر الأنشطة", en: "Net change in cash across activities" },
  rptSales: { ar: "تقرير المبيعات اليومية", en: "Daily Sales Report" },
  rptSalesDesc: { ar: "المبيعات حسب الفئة وطريقة الدفع", en: "Sales by category and payment method" },
  rptTopProducts: { ar: "أكثر المنتجات مبيعاً", en: "Top Products" },
  rptTopProductsDesc: { ar: "المنتجات الأعلى مساهمة في الإيراد", en: "Highest revenue contributing items" },
  rptPurchases: { ar: "تقرير المشتريات", en: "Purchases Report" },
  rptPurchasesDesc: { ar: "أوامر الشراء حسب المورد والحالة", en: "Purchase orders by supplier and status" },
  rptSuppliers: { ar: "أداء الموردين", en: "Supplier Performance" },
  rptSuppliersDesc: { ar: "تصنيف الموردين حسب الموثوقية والإنفاق", en: "Suppliers ranked by reliability and spend" },
  rptStaff: { ar: "كشف الرواتب", en: "Payroll Summary" },
  rptStaffDesc: { ar: "ملخص رواتب الموظفين والساعات", en: "Staff salaries and hours overview" },
  rptVat: { ar: "إقرار ضريبة القيمة المضافة", en: "VAT Return" },
  rptVatDesc: { ar: "ضريبة المخرجات والمدخلات والصافي", en: "Output, input and net VAT position" },
  rptDebts: { ar: "أعمار الديون", en: "Debts Aging" },
  rptDebtsDesc: { ar: "الذمم المدينة والدائنة حسب العمر", en: "Receivables and payables by age" },
  rptAudit: { ar: "سجل التدقيق", en: "Audit Log" },
  rptAuditDesc: { ar: "أحدث التغييرات في النظام", en: "Recent system activity trail" },
  lastRun: { ar: "آخر تشغيل", en: "Last run" },
  reportName: { ar: "اسم التقرير", en: "Report" },
  generatedAt: { ar: "وقت الإنشاء", en: "Generated" },
  format: { ar: "الصيغة", en: "Format" },
  download: { ar: "تنزيل", en: "Download" },
  noRecentReports: { ar: "لا توجد تقارير حديثة", en: "No recent reports yet" },
  preview: { ar: "معاينة", en: "Preview" },
  reportPreview: { ar: "معاينة التقرير", en: "Report Preview" },
  rowsCount: { ar: "عدد الصفوف", en: "Rows" },
  closePreview: { ar: "إغلاق", en: "Close" },
  // Settings module
  settingsTitle: { ar: "الإعدادات", en: "Settings" },
  settingsSubtitle: { ar: "تخصيص النظام والتفضيلات والصلاحيات", en: "Customize your workspace, preferences and permissions" },
  settingsSaved: { ar: "تم حفظ الإعدادات", en: "Settings saved successfully" },
  settingsReset: { ar: "تمت استعادة الإعدادات الافتراضية", en: "Settings restored to defaults" },
  resetDefaults: { ar: "استعادة الافتراضي", en: "Reset to defaults" },
  saveChanges: { ar: "حفظ التغييرات", en: "Save changes" },
  unsavedChanges: { ar: "لديك تغييرات غير محفوظة", en: "You have unsaved changes" },
  // Settings - sections
  secBusiness: { ar: "بيانات المنشأة", en: "Business Profile" },
  secBusinessDesc: { ar: "اسم الصيدلية والشعار وبيانات الاتصال", en: "Pharmacy identity, logo and contact details" },
  secLocalization: { ar: "اللغة والمنطقة", en: "Localization" },
  secLocalizationDesc: { ar: "اللغة والعملة والمنطقة الزمنية", en: "Language, currency and timezone" },
  secAppearance: { ar: "المظهر", en: "Appearance" },
  secAppearanceDesc: { ar: "السمة والكثافة وتفضيلات العرض", en: "Theme, density and display options" },
  secTax: { ar: "إعدادات الضرائب", en: "Tax Settings" },
  secTaxDesc: { ar: "نسبة الضريبة وفترة الإقرار", en: "VAT rates and filing period" },
  secInvoicing: { ar: "الفواتير", en: "Invoicing" },
  secInvoicingDesc: { ar: "ترقيم الفواتير والشروط الافتراضية", en: "Invoice numbering and default terms" },
  secNotifications: { ar: "الإشعارات", en: "Notifications" },
  secNotificationsDesc: { ar: "تنبيهات المخزون والديون والضرائب", en: "Inventory, debt and tax alerts" },
  secUsers: { ar: "المستخدمون والصلاحيات", en: "Users & Permissions" },
  secUsersDesc: { ar: "إدارة فريق العمل والأدوار", en: "Manage team members and roles" },
  secIntegrations: { ar: "التكاملات", en: "Integrations" },
  secIntegrationsDesc: { ar: "البوابات والخدمات المتصلة", en: "Connected services and gateways" },
  secSecurity: { ar: "الأمان", en: "Security" },
  secSecurityDesc: { ar: "كلمة المرور والتحقق بخطوتين", en: "Password and two-factor authentication" },
  secBackup: { ar: "النسخ الاحتياطي", en: "Backup & Data" },
  secBackupDesc: { ar: "تصدير واستيراد ومسح البيانات", en: "Export, import and reset data" },
  // Business profile fields
  businessName: { ar: "اسم المنشأة", en: "Business Name" },
  legalName: { ar: "الاسم القانوني", en: "Legal Name" },
  crNumber: { ar: "السجل التجاري", en: "Commercial Reg. #" },
  vatNumber: { ar: "الرقم الضريبي", en: "VAT Number" },
  address: { ar: "العنوان", en: "Address" },
  website: { ar: "الموقع الإلكتروني", en: "Website" },
  logoUrl: { ar: "رابط الشعار", en: "Logo URL" },
  // Localization
  language: { ar: "اللغة", en: "Language" },
  arabic: { ar: "العربية", en: "Arabic" },
  english: { ar: "الإنجليزية", en: "English" },
  timezone: { ar: "المنطقة الزمنية", en: "Timezone" },
  dateFormat: { ar: "تنسيق التاريخ", en: "Date Format" },
  numberFormat: { ar: "تنسيق الأرقام", en: "Number Format" },
  // Appearance
  theme: { ar: "السمة", en: "Theme" },
  themeDark: { ar: "داكن", en: "Dark" },
  themeLight: { ar: "فاتح", en: "Light" },
  density: { ar: "الكثافة", en: "Density" },
  comfortable: { ar: "مريحة", en: "Comfortable" },
  compact: { ar: "مدمجة", en: "Compact" },
  sidebarCollapsed: { ar: "تصغير الشريط الجانبي افتراضياً", en: "Collapse sidebar by default" },
  // Tax
  defaultVatRate: { ar: "النسبة الافتراضية", en: "Default VAT Rate (%)" },
  filingFrequency: { ar: "دورية الإقرار", en: "Filing Frequency" },
  taxInclusive: { ar: "الأسعار شاملة الضريبة", en: "Prices include VAT" },
  // Invoicing
  invoicePrefix: { ar: "بادئة الفاتورة", en: "Invoice Prefix" },
  nextInvoiceNumber: { ar: "رقم الفاتورة التالي", en: "Next Invoice #" },
  paymentTermsDays: { ar: "مهلة السداد (أيام)", en: "Payment Terms (days)" },
  defaultNotes: { ar: "ملاحظات افتراضية على الفاتورة", en: "Default invoice notes" },
  // Notifications
  notifyLowStock: { ar: "تنبيه نفاد المخزون", en: "Low stock alerts" },
  notifyOverdue: { ar: "تنبيه الديون المتأخرة", en: "Overdue debt reminders" },
  notifyVat: { ar: "تذكير موعد الإقرار الضريبي", en: "VAT filing reminders" },
  notifyDailySummary: { ar: "ملخص يومي بالبريد", en: "Daily email summary" },
  emailChannel: { ar: "البريد الإلكتروني", en: "Email" },
  smsChannel: { ar: "رسالة نصية", en: "SMS" },
  pushChannel: { ar: "إشعار داخل التطبيق", en: "In-app push" },
  // Users & roles
  inviteUser: { ar: "دعوة مستخدم", en: "Invite User" },
  userName: { ar: "الاسم", en: "Name" },
  userRole: { ar: "الصلاحية", en: "Role" },
  userStatus: { ar: "الحالة", en: "Status" },
  roleAdmin: { ar: "مدير عام", en: "Admin" },
  roleAccountant: { ar: "محاسب", en: "Accountant" },
  rolePharmacist: { ar: "صيدلي", en: "Pharmacist" },
  roleViewer: { ar: "اطلاع فقط", en: "Viewer" },
  invitePending: { ar: "دعوة معلقة", en: "Pending invite" },
  // Integrations
  intZatca: { ar: "هيئة الزكاة والضريبة (ZATCA)", en: "ZATCA e-invoicing" },
  intZatcaDesc: { ar: "ربط الفوترة الإلكترونية المرحلة الثانية", en: "Phase 2 e-invoicing integration" },
  intMada: { ar: "بوابة مدى للدفع", en: "Mada payment gateway" },
  intMadaDesc: { ar: "قبول مدفوعات البطاقات المحلية", en: "Accept local card payments" },
  intWhatsapp: { ar: "إشعارات واتساب للأعمال", en: "WhatsApp Business" },
  intWhatsappDesc: { ar: "إرسال الفواتير والتذكيرات", en: "Send invoices and reminders" },
  intDrive: { ar: "نسخ احتياطي على Google Drive", en: "Google Drive backup" },
  intDriveDesc: { ar: "نسخ تلقائي للبيانات يومياً", en: "Automatic daily data backup" },
  connect: { ar: "ربط", en: "Connect" },
  connected: { ar: "متصل", en: "Connected" },
  disconnect: { ar: "فصل", en: "Disconnect" },
  notConnected: { ar: "غير متصل", en: "Not connected" },
  connecting: { ar: "جاري الربط...", en: "Connecting..." },
  disconnecting: { ar: "جاري الفصل...", en: "Disconnecting..." },
  connectTitle: { ar: "ربط الخدمة", en: "Connect service" },
  disconnectTitle: { ar: "تأكيد فصل الخدمة", en: "Confirm disconnect" },
  connectIntro: { ar: "أدخل بيانات الاعتماد لإكمال ربط الخدمة بحسابك.", en: "Enter your credentials to complete the connection." },
  disconnectWarn: { ar: "سيتم إيقاف المزامنة وقد تحتاج لإعادة الربط لاحقاً.", en: "Sync will stop and you may need to reconnect later." },
  confirmConnect: { ar: "تأكيد الربط", en: "Confirm connect" },
  confirmDisconnect: { ar: "تأكيد الفصل", en: "Confirm disconnect" },
  connectedSince: { ar: "متصل منذ", en: "Connected since" },
  account: { ar: "الحساب", en: "Account" },
  apiKey: { ar: "مفتاح API", en: "API key" },
  workspaceId: { ar: "معرّف المساحة", en: "Workspace ID" },
  phoneNumber: { ar: "رقم الهاتف", en: "Phone number" },
  merchantId: { ar: "معرّف التاجر", en: "Merchant ID" },
  intConnectedToast: { ar: "تم ربط الخدمة بنجاح", en: "Service connected successfully" },
  intDisconnectedToast: { ar: "تم فصل الخدمة", en: "Service disconnected" },
  required: { ar: "مطلوب", en: "Required" },
  // Security
  changePassword: { ar: "تغيير كلمة المرور", en: "Change password" },
  twoFactor: { ar: "التحقق بخطوتين", en: "Two-factor authentication" },
  sessionTimeout: { ar: "انتهاء الجلسة بعد (دقيقة)", en: "Session timeout (minutes)" },
  loginAlerts: { ar: "تنبيه عند تسجيل دخول جديد", en: "Alert on new sign-in" },
  lastSignIn: { ar: "آخر تسجيل دخول", en: "Last sign-in" },
  // Backup
  exportAll: { ar: "تصدير كل البيانات", en: "Export all data" },
  importData: { ar: "استيراد بيانات", en: "Import data" },
  clearData: { ar: "مسح بيانات النظام", en: "Clear system data" },
  clearDataWarn: { ar: "لا يمكن التراجع عن هذا الإجراء", en: "This action cannot be undone" },
  autoBackup: { ar: "النسخ الاحتياطي التلقائي", en: "Automatic backup" },
  daily: { ar: "يومي", en: "Daily" },
  weekly: { ar: "أسبوعي", en: "Weekly" },
  never: { ar: "غير مفعّل", en: "Never" },
  // Login
  signIn: { ar: "تسجيل الدخول", en: "Sign in" },
  signOut: { ar: "تسجيل الخروج", en: "Sign out" },
  signInTitle: { ar: "أهلاً بعودتك", en: "Welcome back" },
  signInSubtitle: { ar: "سجّل دخولك للمتابعة إلى لوحة التحكم", en: "Sign in to continue to your dashboard" },
  password: { ar: "كلمة المرور", en: "Password" },
  rememberMe: { ar: "تذكرني", en: "Remember me" },
  forgotPassword: { ar: "نسيت كلمة المرور؟", en: "Forgot password?" },
  continueWithGoogle: { ar: "المتابعة عبر Google", en: "Continue with Google" },
  continueWithApple: { ar: "المتابعة عبر Apple", en: "Continue with Apple" },
  orContinueWith: { ar: "أو تابع باستخدام", en: "or continue with" },
  noAccount: { ar: "ليس لديك حساب؟", en: "Don't have an account?" },
  contactSales: { ar: "تواصل مع المبيعات", en: "Contact sales" },
  signedIn: { ar: "تم تسجيل الدخول بنجاح", en: "Signed in successfully" },
  signedOut: { ar: "تم تسجيل الخروج", en: "Signed out" },
  demoCreds: { ar: "بيانات تجريبية: admin@pharm.sa / demo1234", en: "Demo: admin@pharm.sa / demo1234" },
  invalidCreds: { ar: "بريد أو كلمة مرور غير صحيحة", en: "Invalid email or password" },
  trustedBy: { ar: "موثوق به من قِبل صيدليات في الخليج", en: "Trusted by pharmacies across the Gulf" },
  // Branches
  secBranches: { ar: "الفروع", en: "Branches" },
  secBranchesDesc: { ar: "إدارة فروع الصيدلية والمدراء", en: "Manage pharmacy locations and managers" },
  newBranch: { ar: "فرع جديد", en: "New Branch" },
  branchName: { ar: "اسم الفرع", en: "Branch Name" },
  branchCode: { ar: "الرمز", en: "Code" },
  branchManager: { ar: "المدير", en: "Manager" },
  branchAddress: { ar: "العنوان", en: "Address" },
  addedBranch: { ar: "تم إضافة الفرع", en: "Branch added" },
  removedBranch: { ar: "تم حذف الفرع", en: "Branch removed" },
  setMain: { ar: "تعيين كرئيسي", en: "Set as main" },
  mainBranch: { ar: "الفرع الرئيسي", en: "Main branch" },
  remove: { ar: "حذف", en: "Remove" },
  // AI / Coming Soon
  aiCenter: { ar: "ميزات الذكاء الاصطناعي", en: "AI Features" },
  aiSubtitle: { ar: "ميزات قادمة لتحليل وتنبؤ أداء صيدليتك", en: "Upcoming intelligence to analyze and forecast your pharmacy" },
  comingSoon: { ar: "قريباً", en: "Coming Soon" },
  notifyMe: { ar: "أعلمني عند الإطلاق", en: "Notify me at launch" },
  notifyAdded: { ar: "سنخبرك عند توفر هذه الميزة", en: "We'll notify you when this is available" },
  aiForecast: { ar: "التنبؤ المالي بالذكاء الاصطناعي", en: "AI Financial Forecast" },
  aiForecastDesc: { ar: "توقّع إيرادات ومصروفات الشهر القادم باستخدام تحليل الاتجاهات", en: "Predict next month revenue and expenses using trend analysis" },
  smartInsights: { ar: "رؤى ذكية أسبوعية", en: "Smart Weekly Insights" },
  smartInsightsDesc: { ar: "ملخص أسبوعي تلقائي يبرز التغيرات المهمة في أدائك", en: "Auto-generated weekly summary highlighting key shifts in your performance" },
  barcodeScanner: { ar: "ماسح الباركود", en: "Barcode Scanner" },
  barcodeScannerDesc: { ar: "تكامل باركود المنتجات لإدارة المخزون", en: "Product barcode integration for inventory management" },
  multiBranchRollup: { ar: "تجميع متعدد الفروع", en: "Multi-Branch Consolidation" },
  multiBranchRollupDesc: { ar: "تقارير موحّدة عبر جميع فروع صيدليتك", en: "Roll-up reports across all your pharmacy branches" },
  mobileApp: { ar: "تطبيق الجوال", en: "Mobile App" },
  mobileAppDesc: { ar: "تطبيق React Native مرافق للوصول السريع", en: "React Native companion app for on-the-go access" },
  ai: { ar: "الذكاء الاصطناعي", en: "AI" },
  // Organizations / Multi-tenant
  organizations: { ar: "المنشآت", en: "Organizations" },
  organization: { ar: "المنشأة", en: "Organization" },
  currentOrganization: { ar: "المنشأة الحالية", en: "Current Organization" },
  switchOrganization: { ar: "تبديل المنشأة", en: "Switch Organization" },
  manageOrganizations: { ar: "إدارة المنشآت", en: "Manage Organizations" },
  createOrganization: { ar: "إنشاء منشأة جديدة", en: "Create New Organization" },
  editOrganization: { ar: "تعديل المنشأة", en: "Edit Organization" },
  deleteOrganization: { ar: "حذف المنشأة", en: "Delete Organization" },
  organizationName: { ar: "اسم المنشأة", en: "Organization Name" },
  businessType: { ar: "نوع النشاط", en: "Business Type" },
  pharmacyType: { ar: "صيدلية", en: "Pharmacy" },
  clinicType: { ar: "عيادة", en: "Clinic" },
  companyType: { ar: "شركة", en: "Company" },
  retailType: { ar: "تجزئة", en: "Retail" },
  commercialRegister: { ar: "السجل التجاري", en: "Commercial Register" },
  noOrganizations: { ar: "لا توجد منشآت بعد — أنشئ أول منشأة لك", en: "No organizations yet — create your first one" },
  organizationCreated: { ar: "تم إنشاء المنشأة", en: "Organization created" },
  organizationUpdated: { ar: "تم تحديث المنشأة", en: "Organization updated" },
  organizationDeleted: { ar: "تم حذف المنشأة", en: "Organization deleted" },
  confirmDeleteOrg: { ar: "هل أنت متأكد من حذف هذه المنشأة؟ سيتم حذف جميع بياناتها.", en: "Delete this organization? All its data will be removed." },
  roleOwner: { ar: "مالك", en: "Owner" },
  roleCashier: { ar: "كاشير", en: "Cashier" },
  create: { ar: "إنشاء", en: "Create" },
  organizationLogo: { ar: "شعار المنشأة", en: "Organization logo" },
  uploadLogo: { ar: "رفع شعار", en: "Upload logo" },
  changeLogo: { ar: "تغيير الشعار", en: "Change logo" },
  removeLogo: { ar: "إزالة الشعار", en: "Remove logo" },
  uploadingLogo: { ar: "جارٍ الرفع...", en: "Uploading..." },
  logoTooLarge: { ar: "حجم الصورة كبير جداً (الحد الأقصى 2 ميجا)", en: "Logo too large (max 2MB)" }
};
const Ctx$1 = createContext(null);
function AppProvider({ children }) {
  const [lang, setLangState] = useState("ar");
  const [theme, setThemeState] = useState("dark");
  useEffect(() => {
    const savedLang = typeof localStorage !== "undefined" && localStorage.getItem("pl_lang");
    const savedTheme = typeof localStorage !== "undefined" && localStorage.getItem("pl_theme");
    if (savedLang) setLangState(savedLang);
    if (savedTheme) setThemeState(savedTheme);
  }, []);
  const dir = lang === "ar" ? "rtl" : "ltr";
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(theme);
  }, [lang, theme, dir]);
  const setLang = (l) => {
    setLangState(l);
    if (typeof localStorage !== "undefined") localStorage.setItem("pl_lang", l);
  };
  const setTheme = (t2) => {
    setThemeState(t2);
    if (typeof localStorage !== "undefined") localStorage.setItem("pl_theme", t2);
  };
  const t = (k) => dict[k]?.[lang] ?? String(k);
  const fmt = (n) => new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false
  }).format(n);
  return /* @__PURE__ */ jsx(
    Ctx$1.Provider,
    {
      value: {
        lang,
        setLang,
        toggleLang: () => setLang(lang === "ar" ? "en" : "ar"),
        theme,
        setTheme,
        toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
        t,
        fmt,
        dir
      },
      children
    }
  );
}
function useApp() {
  const v = useContext(Ctx$1);
  if (!v) throw new Error("useApp must be used within AppProvider");
  return v;
}
function useAuth() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return { session, user, loading };
}
const Ctx = createContext(null);
const STORAGE_KEY = "pl_current_org";
function OrgProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [currentOrgId, setCurrentOrgId] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchOrgs = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: memberships, error } = await supabase.from("organization_members").select("role, organization:organizations(*)").order("created_at", { ascending: true });
    if (error) {
      console.error("[orgs] fetch error", error);
      setOrganizations([]);
      setLoading(false);
      return;
    }
    const orgs = (memberships ?? []).map((m) => m.organization && { ...m.organization, role: m.role }).filter(Boolean);
    setOrganizations(orgs);
    setLoading(false);
  }, [user]);
  useEffect(() => {
    if (authLoading) return;
    fetchOrgs();
  }, [authLoading, fetchOrgs]);
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setCurrentOrgId(saved);
  }, []);
  useEffect(() => {
    if (!organizations.length) {
      setCurrentOrgId(null);
      return;
    }
    const exists = currentOrgId && organizations.some((o) => o.id === currentOrgId);
    if (!exists) {
      const next = organizations[0].id;
      setCurrentOrgId(next);
      if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, next);
    }
  }, [organizations, currentOrgId]);
  const switchOrg = useCallback((id) => {
    setCurrentOrgId(id);
    if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, id);
  }, []);
  const createOrg = useCallback(
    async (input) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.rpc("create_organization", {
        _name: input.name,
        _business_type: input.business_type ?? "pharmacy",
        _currency: input.currency ?? "SAR",
        _tax_number: input.tax_number ?? void 0,
        _commercial_register: input.commercial_register ?? void 0,
        _national_address: input.national_address ?? void 0,
        _logo_url: input.logo_url ?? void 0
      });
      if (error) throw error;
      await fetchOrgs();
      switchOrg(data.id);
      return { ...data, role: "owner" };
    },
    [user, fetchOrgs, switchOrg]
  );
  const updateOrg = useCallback(
    async (id, patch) => {
      const { role, ...rest } = patch;
      const { error } = await supabase.from("organizations").update(rest).eq("id", id);
      if (error) throw error;
      await fetchOrgs();
    },
    [fetchOrgs]
  );
  const uploadLogo = useCallback(
    async (file) => {
      if (!user) throw new Error("Not authenticated");
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("org-logos").upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("org-logos").getPublicUrl(path);
      return data.publicUrl;
    },
    [user]
  );
  const deleteOrg = useCallback(
    async (id) => {
      const { error } = await supabase.from("organizations").delete().eq("id", id);
      if (error) throw error;
      await fetchOrgs();
    },
    [fetchOrgs]
  );
  const currentOrg = useMemo(
    () => organizations.find((o) => o.id === currentOrgId) ?? null,
    [organizations, currentOrgId]
  );
  return /* @__PURE__ */ jsx(
    Ctx.Provider,
    {
      value: {
        organizations,
        currentOrg,
        loading,
        switchOrg,
        refresh: fetchOrgs,
        createOrg,
        updateOrg,
        deleteOrg,
        uploadLogo
      },
      children
    }
  );
}
function useOrg() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOrg must be used within OrgProvider");
  return v;
}
const isDesktop = () => typeof window !== "undefined" && !!window.pharmledger?.isDesktop;
async function mirrorToDisk(relPath, contents) {
  if (!isDesktop()) return;
  try {
    await window.pharmledger.writeFile(relPath, contents);
  } catch (e) {
    console.warn("[desktop-bridge] mirrorToDisk failed", e);
  }
}
async function readFromDisk(relPath) {
  if (!isDesktop()) return null;
  try {
    return await window.pharmledger.readFile(relPath);
  } catch {
    return null;
  }
}
async function openDataFolder() {
  if (!isDesktop()) return null;
  return window.pharmledger.openDataFolder();
}
async function getDataRoot() {
  if (!isDesktop()) return null;
  return window.pharmledger.dataRoot();
}
async function saveBackup(json) {
  if (isDesktop()) {
    return window.pharmledger.exportBackup(json);
  }
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pharmledger-backup-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return a.download;
}
async function loadBackup() {
  if (isDesktop()) {
    return window.pharmledger.importBackup();
  }
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return resolve(null);
      resolve(await f.text());
    };
    input.click();
  });
}
const STORAGE_FILE = "local-storage.json";
const AUTO_SAVE_PREFIXES = ["pharmledger.", "pl_", "org."];
function isPersistentKey(key) {
  return !!key && AUTO_SAVE_PREFIXES.some((prefix) => key.startsWith(prefix));
}
let skipMirror = false;
let pending = {};
let flushTimer = null;
let isFlushing = false;
async function readPersistedStorage() {
  try {
    const raw = await readFromDisk(STORAGE_FILE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn("[desktop-storage] failed to read persisted storage", error);
    return null;
  }
}
async function writePersistedStorage(data) {
  await mirrorToDisk(STORAGE_FILE, JSON.stringify(data));
}
async function flushPendingStorage() {
  if (!isDesktop()) return;
  if (isFlushing) return;
  if (!Object.keys(pending).length) return;
  const items = { ...pending };
  pending = {};
  if (flushTimer) {
    window.clearTimeout(flushTimer);
    flushTimer = null;
  }
  isFlushing = true;
  try {
    const existing = await readPersistedStorage() ?? {};
    const next = { ...existing };
    for (const [key, value] of Object.entries(items)) {
      if (value === null) {
        delete next[key];
      } else {
        next[key] = value;
      }
    }
    await writePersistedStorage(next);
  } catch (error) {
    console.warn("[desktop-storage] failed to flush storage", error);
  } finally {
    isFlushing = false;
  }
}
function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flushPendingStorage();
  }, 120);
}
function queueStorageChange(key, value) {
  pending[key] = value;
  scheduleFlush();
}
function patchLocalStorageMirror() {
  if (!isDesktop() || typeof window === "undefined") return;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;
  const originalClear = Storage.prototype.clear;
  Storage.prototype.setItem = function(key, value) {
    originalSetItem.call(this, key, value);
    if (skipMirror || this !== window.localStorage) return;
    if (isPersistentKey(key)) {
      queueStorageChange(key, value);
    }
  };
  Storage.prototype.removeItem = function(key) {
    originalRemoveItem.call(this, key);
    if (skipMirror || this !== window.localStorage) return;
    if (isPersistentKey(key)) {
      queueStorageChange(key, null);
    }
  };
  Storage.prototype.clear = function() {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && isPersistentKey(key)) {
        keys.push(key);
      }
    }
    originalClear.call(this);
    if (skipMirror || this !== window.localStorage) return;
    if (keys.length) {
      for (const key of keys) {
        queueStorageChange(key, null);
      }
    }
  };
}
async function initDesktopLocalStorage() {
  if (!isDesktop() || typeof window === "undefined") return;
  patchLocalStorageMirror();
  skipMirror = true;
  try {
    const persisted = await readPersistedStorage();
    if (!persisted) return;
    for (const [key, value] of Object.entries(persisted)) {
      if (!isPersistentKey(key)) continue;
      try {
        if (typeof value === "string") {
          window.localStorage.setItem(key, value);
        } else {
          window.localStorage.setItem(key, JSON.stringify(value));
        }
      } catch (error) {
        console.warn(`[desktop-storage] failed to restore key ${key}`, error);
      }
    }
  } finally {
    skipMirror = false;
  }
  window.addEventListener("beforeunload", () => {
    void flushPendingStorage();
  });
}
function useDesktopLocalStorageHydration() {
  const [hydrated, setHydrated] = useState(!isDesktop());
  useEffect(() => {
    if (!isDesktop()) return;
    let mounted = true;
    initDesktopLocalStorage().catch((error) => console.error("[desktop-storage] init failed", error)).finally(() => {
      if (mounted) setHydrated(true);
    });
    return () => {
      mounted = false;
    };
  }, []);
  return hydrated;
}
function NotFoundComponent() {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground", children: "This page didn't load" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Something went wrong on our end. You can try refreshing or head back home." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const Route$l = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PharmLedger — Pharmacy Financial Management" },
      { name: "description", content: "Modern financial management SaaS for pharmacies. Revenue, expenses, VAT, payroll and statements in Arabic and English." },
      { name: "author", content: "PharmLedger" },
      { property: "og:title", content: "PharmLedger — Pharmacy Financial Management" },
      { property: "og:description", content: "Modern financial management SaaS for pharmacies. Revenue, expenses, VAT, payroll and statements in Arabic and English." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "PharmLedger — Pharmacy Financial Management" },
      { name: "twitter:description", content: "Modern financial management SaaS for pharmacies. Revenue, expenses, VAT, payroll and statements in Arabic and English." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9a824082-3af1-4a37-930f-7121a7b1b8ef/id-preview-7706532b--b86e98e1-f29f-4c7f-b9ef-00000e8b1101.lovable.app-1779971350541.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9a824082-3af1-4a37-930f-7121a7b1b8ef/id-preview-7706532b--b86e98e1-f29f-4c7f-b9ef-00000e8b1101.lovable.app-1779971350541.png" }
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
      }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "ar", dir: "rtl", className: "dark", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$l.useRouteContext();
  const hydrated = useDesktopLocalStorageHydration();
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsx(AppProvider, { children: /* @__PURE__ */ jsx(OrgProvider, { children: !hydrated ? /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsx("div", { className: "text-center text-muted-foreground", children: "Loading saved data..." }) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Outlet, {}),
    /* @__PURE__ */ jsx(Toaster, { richColors: true, position: "top-center" })
  ] }) }) }) });
}
const $$splitComponentImporter$k = () => import("./vat-DTISkpc0.js");
const Route$k = createFileRoute("/vat")({
  head: () => ({
    meta: [{
      title: "VAT — PharmLedger"
    }, {
      name: "description",
      content: "Sales and purchases VAT reports with quarterly filing summary."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$k, "component")
});
const $$splitComponentImporter$j = () => import("./suppliers-DPJcLSbT.js");
const Route$j = createFileRoute("/suppliers")({
  head: () => ({
    meta: [{
      title: "Suppliers — PharmLedger"
    }, {
      name: "description",
      content: "Manage pharmacy suppliers, payables and contact information."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$j, "component")
});
const $$splitComponentImporter$i = () => import("./supplier-payments-BMhnL5Fa.js");
const Route$i = createFileRoute("/supplier-payments")({
  head: () => ({
    meta: [{
      title: "Supplier Payments — PharmLedger"
    }, {
      name: "description",
      content: "Manage supplier payment vouchers."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$i, "component")
});
const $$splitComponentImporter$h = () => import("./statements-DQzYLoiz.js");
const Route$h = createFileRoute("/statements")({
  head: () => ({
    meta: [{
      title: "Financial Statements — PharmLedger"
    }, {
      name: "description",
      content: "Profit & loss, balance sheet and cash flow statements for the pharmacy."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$h, "component")
});
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx(Comp, { className: cn(buttonVariants({ variant, size, className })), ref, ...props });
  }
);
Button.displayName = "Button";
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames();
  return /* @__PURE__ */ jsx(
    DayPicker,
    {
      showOutsideDays,
      className: cn(
        "bg-background group/calendar p-3 [--cell-size:2rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      ),
      captionLayout,
      formatters: {
        formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
        ...formatters
      },
      classNames: {
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-(--cell-size) w-(--cell-size) select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-(--cell-size) w-(--cell-size) select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn("bg-popover absolute inset-0 opacity-0", defaultClassNames.dropdown),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label" ? "text-sm" : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground flex-1 select-none rounded-md text-[0.8rem] font-normal",
          defaultClassNames.weekday
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn("w-(--cell-size) select-none", defaultClassNames.week_number_header),
        week_number: cn(
          "text-muted-foreground select-none text-[0.8rem]",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md",
          defaultClassNames.day
        ),
        range_start: cn("bg-accent rounded-l-md", defaultClassNames.range_start),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("bg-accent rounded-r-md", defaultClassNames.range_end),
        today: cn(
          "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames
      },
      components: {
        Root: ({ className: className2, rootRef, ...props2 }) => {
          return /* @__PURE__ */ jsx("div", { "data-slot": "calendar", ref: rootRef, className: cn(className2), ...props2 });
        },
        Chevron: ({ className: className2, orientation, ...props2 }) => {
          if (orientation === "left") {
            return /* @__PURE__ */ jsx(ChevronLeftIcon, { className: cn("size-4", className2), ...props2 });
          }
          if (orientation === "right") {
            return /* @__PURE__ */ jsx(ChevronRightIcon, { className: cn("size-4", className2), ...props2 });
          }
          return /* @__PURE__ */ jsx(ChevronDownIcon, { className: cn("size-4", className2), ...props2 });
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props2 }) => {
          return /* @__PURE__ */ jsx("td", { ...props2, children: /* @__PURE__ */ jsx("div", { className: "flex size-(--cell-size) items-center justify-center text-center", children }) });
        },
        ...components
      },
      ...props
    }
  );
}
function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames();
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  return /* @__PURE__ */ jsx(
    Button,
    {
      ref,
      variant: "ghost",
      size: "icon",
      "data-day": day.date.toLocaleDateString(),
      "data-selected-single": modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle,
      "data-range-start": modifiers.range_start,
      "data-range-end": modifiers.range_end,
      "data-range-middle": modifiers.range_middle,
      className: cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 flex aspect-square h-auto w-full min-w-(--cell-size) flex-col gap-1 font-normal leading-none data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className
      ),
      ...props
    }
  );
}
const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverContent = React.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(PopoverPrimitive.Portal, { children: /* @__PURE__ */ jsx(
  PopoverPrimitive.Content,
  {
    ref,
    align,
    sideOffset,
    className: cn(
      "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-popover-content-transform-origin)",
      className
    ),
    ...props
  }
) }));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;
function parseISO(value) {
  if (!value) return void 0;
  const d = parse(value, "yyyy-MM-dd", /* @__PURE__ */ new Date());
  return isValid(d) ? d : void 0;
}
function toISO(d) {
  return format(d, "yyyy-MM-dd");
}
function DatePickerInput({
  value,
  onChange,
  className,
  placeholder,
  disabled,
  required,
  min,
  max,
  id
}) {
  const [open, setOpen] = React.useState(false);
  const [isRtl, setIsRtl] = React.useState(false);
  React.useEffect(() => {
    setIsRtl(document.documentElement.dir === "rtl");
  }, []);
  const date = parseISO(value);
  const minDate = parseISO(min ?? "");
  const maxDate = parseISO(max ?? "");
  const label = date ? format(date, "dd/MM/yyyy", isRtl ? { locale: ar } : void 0) : placeholder ?? (isRtl ? "يوم/شهر/سنة" : "dd/mm/yyyy");
  return /* @__PURE__ */ jsxs(Popover, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        id,
        disabled,
        "aria-required": required || void 0,
        dir: isRtl ? "rtl" : "ltr",
        className: cn(
          "inline-flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm tabular shadow-sm transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-ring/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !date && "text-muted-foreground",
          className
        ),
        children: [
          /* @__PURE__ */ jsx("span", { className: "truncate", children: label }),
          /* @__PURE__ */ jsx(CalendarIcon, { className: "size-4 opacity-60 shrink-0" })
        ]
      }
    ) }),
    /* @__PURE__ */ jsx(
      PopoverContent,
      {
        className: "w-auto p-0 pointer-events-auto",
        align: isRtl ? "end" : "start",
        dir: isRtl ? "rtl" : "ltr",
        children: /* @__PURE__ */ jsx(
          Calendar,
          {
            mode: "single",
            selected: date,
            onSelect: (d) => {
              if (d) {
                onChange(toISO(d));
                setOpen(false);
              } else {
                onChange("");
              }
            },
            defaultMonth: date,
            disabled: (d) => {
              if (minDate && d < minDate) return true;
              if (maxDate && d > maxDate) return true;
              return false;
            },
            locale: isRtl ? ar : void 0,
            dir: isRtl ? "rtl" : "ltr",
            initialFocus: true,
            className: cn("p-3 pointer-events-auto")
          }
        )
      }
    )
  ] });
}
const $$splitComponentImporter$g = () => import("./staff-DyvMXayz.js");
function computeHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const [h1, m1] = checkIn.split(":").map(Number);
  const [h2, m2] = checkOut.split(":").map(Number);
  let mins = h2 * 60 + m2 - (h1 * 60 + m1);
  if (mins < 0) mins += 24 * 60;
  return Math.round(mins / 60 * 100) / 100;
}
const Route$g = createFileRoute("/staff")({
  head: () => ({
    meta: [{
      title: "Staff — PharmLedger"
    }, {
      name: "description",
      content: "Manage pharmacy staff, payroll, shifts and working hours."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$g, "component")
});
function Field$3({
  label,
  children,
  full
}) {
  return /* @__PURE__ */ jsxs("label", { className: cn("space-y-1.5 block", full && "col-span-2"), children: [
    /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground", children: label }),
    children
  ] });
}
function LogShiftDialog({
  members,
  lang,
  dir,
  onClose,
  onSubmit
}) {
  const L = (ar2, en) => lang === "ar" ? ar2 : en;
  const [employeeId, setEmployeeId] = useState(members[0]?.id ?? "");
  const [date, setDate] = useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const [sessions, setSessions] = useState([{
    checkIn: "09:00",
    checkOut: "13:00"
  }]);
  const [note, setNote] = useState("");
  const updateSession = (i, patch) => {
    setSessions((prev) => prev.map((s, idx) => idx === i ? {
      ...s,
      ...patch
    } : s));
  };
  const addSession = () => setSessions((prev) => [...prev, {
    checkIn: "14:00",
    checkOut: "18:00"
  }]);
  const removeSession = (i) => setSessions((prev) => prev.filter((_, idx) => idx !== i));
  const perSessionHours = sessions.map((s) => computeHours(s.checkIn, s.checkOut));
  const totalHours = Math.round(perSessionHours.reduce((a, b) => a + b, 0) * 100) / 100;
  const submit = (ev) => {
    ev.preventDefault();
    if (!employeeId) return toast.error(L("اختر موظفاً", "Pick an employee"));
    if (!date) return toast.error(L("اختر التاريخ", "Pick a date"));
    if (totalHours <= 0) return toast.error(L("الساعات يجب أن تكون أكبر من صفر", "Hours must be > 0"));
    const entries = sessions.map((s) => ({
      employeeId,
      date,
      checkIn: s.checkIn,
      checkOut: s.checkOut,
      hours: computeHours(s.checkIn, s.checkOut),
      note: note || void 0
    })).filter((e) => e.hours > 0);
    if (entries.length === 0) return toast.error(L("لا توجد جلسات صالحة", "No valid sessions"));
    onSubmit(entries);
  };
  return /* @__PURE__ */ jsx("div", { dir, className: "fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in", onClick: onClose, children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, onClick: (e) => e.stopPropagation(), className: "glass-card rounded-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: L("تسجيل مناوبة", "Log Shift") }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: L("يمكنك تسجيل أكثر من حضور وانصراف في نفس اليوم", "Record multiple check-ins/outs on the same day") })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "size-8 rounded-lg hover:bg-muted grid place-items-center", children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(Field$3, { label: L("الموظف", "Employee"), full: true, children: /* @__PURE__ */ jsxs("select", { value: employeeId, onChange: (e) => setEmployeeId(e.target.value), required: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", children: [
        members.length === 0 && /* @__PURE__ */ jsx("option", { value: "", children: L("لا يوجد موظفون — أضف موظف أولاً", "No employees — add one first") }),
        members.map((m) => /* @__PURE__ */ jsxs("option", { value: m.id, children: [
          m.name[lang],
          " (",
          m.id,
          ")"
        ] }, m.id))
      ] }) }),
      /* @__PURE__ */ jsx(Field$3, { label: L("التاريخ", "Date"), full: true, children: /* @__PURE__ */ jsx(DatePickerInput, { value: date, onChange: setDate, required: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground", children: L("الجلسات", "Sessions") }),
        /* @__PURE__ */ jsxs("button", { type: "button", onClick: addSession, className: "h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 bg-card border border-border hover:bg-muted transition", children: [
          /* @__PURE__ */ jsx(Plus, { className: "size-3.5" }),
          L("إضافة جلسة", "Add session")
        ] })
      ] }),
      sessions.map((s, i) => /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center", children: [
        /* @__PURE__ */ jsx("input", { type: "time", value: s.checkIn, onChange: (e) => updateSession(i, {
          checkIn: e.target.value
        }), required: true, className: "h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }),
        /* @__PURE__ */ jsx("input", { type: "time", value: s.checkOut, onChange: (e) => updateSession(i, {
          checkOut: e.target.value
        }), required: true, className: "h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }),
        /* @__PURE__ */ jsxs("span", { className: "text-xs tabular font-semibold text-primary min-w-[3.5rem] text-center", children: [
          perSessionHours[i] || 0,
          "h"
        ] }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => removeSession(i), disabled: sessions.length === 1, className: "size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed transition", "aria-label": "remove", children: /* @__PURE__ */ jsx(Trash2, { className: "size-4" }) })
      ] }, i))
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(Field$3, { label: L("إجمالي اليوم", "Day total"), children: /* @__PURE__ */ jsx("input", { value: totalHours ? `${totalHours} h` : "", readOnly: true, className: "w-full h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm tabular font-bold text-primary" }) }),
      /* @__PURE__ */ jsx(Field$3, { label: L("ملاحظة (اختياري)", "Note (optional)"), children: /* @__PURE__ */ jsx("input", { value: note, onChange: (e) => setNote(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-end pt-2", children: [
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "h-10 px-4 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/70 transition", children: L("إلغاء", "Cancel") }),
      /* @__PURE__ */ jsxs("button", { type: "submit", disabled: members.length === 0, className: "h-10 px-5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition inline-flex items-center gap-2 disabled:opacity-50", children: [
        /* @__PURE__ */ jsx(Timer, { className: "size-4" }),
        L("حفظ", "Save")
      ] })
    ] })
  ] }) });
}
const $$splitComponentImporter$f = () => import("./settings-C0zPkHtU.js");
const Route$f = createFileRoute("/settings")({
  component: lazyRouteComponent($$splitComponentImporter$f, "component")
});
const $$splitComponentImporter$e = () => import("./revenue-BVa_ESar.js");
const Route$e = createFileRoute("/revenue")({
  head: () => ({
    meta: [{
      title: "Revenue — PharmLedger"
    }, {
      name: "description",
      content: "Track daily pharmacy revenue: customers, cash, bank and discounts with CSV export."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$e, "component")
});
const vatOf = (e) => {
  return Number(e.vat) || 0;
};
const nextReference = (entries) => {
  const max = entries.reduce((m, e) => {
    const n = Number(e.id.replace(/\D/g, "")) || 0;
    return n > m ? n : m;
  }, 0);
  return `RV-${String(max + 1).padStart(5, "0")}`;
};
function RevenueDialog({
  mode = "create",
  initial,
  onClose,
  onSubmit,
  nextId
}) {
  const {
    t,
    fmt
  } = useApp();
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const [date, setDate] = useState(initial ? initial.date.slice(0, 10) : today);
  const [customers, setCustomers] = useState(initial ? String(initial.customers) : "");
  const [cash, setCash] = useState(initial ? String(initial.cash) : "");
  const [bank, setBank] = useState(initial ? String(initial.bank) : "");
  const [discount, setDiscount] = useState(initial ? String(initial.discount) : "");
  const [wasfaty, setWasfaty] = useState(initial ? String(initial.wasfaty || 0) : "");
  const [vat, setVat] = useState(initial ? String(initial.vat || 0) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const cashN = round2(Number(cash) || 0);
  const bankN = round2(Number(bank) || 0);
  const discountN = round2(Number(discount) || 0);
  const wasfatyN = round2(Number(wasfaty) || 0);
  const vatN = round2(Number(vat) || 0);
  const totalIncVat = cashN + bankN + wasfatyN;
  const subtotalExVat = totalIncVat - vatN;
  const netTotal = cashN + bankN;
  const grossTotal = cashN + bankN + discountN;
  const submit = (ev) => {
    ev.preventDefault();
    const c = Number(customers);
    if (!c || c <= 0) {
      toast.error(t("customers"));
      return;
    }
    if (cashN + bankN <= 0) {
      toast.error(t("netTotal"));
      return;
    }
    onSubmit({
      date: new Date(date).toISOString(),
      customers: c,
      cash: cashN,
      bank: bankN,
      discount: discountN,
      wasfaty: wasfatyN,
      vat: vatN,
      notes: notes || void 0
    });
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in", onClick: onClose, children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, onClick: (e) => e.stopPropagation(), className: "glass-card rounded-2xl w-full max-w-lg p-6 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: mode === "edit" ? t("editRevenue") : t("newRevenue") }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          t("reference"),
          ": ",
          /* @__PURE__ */ jsx("span", { className: "tabular font-semibold text-foreground", children: nextId }),
          mode === "create" && /* @__PURE__ */ jsxs("span", { className: "ms-2 text-muted-foreground", children: [
            "(",
            t("autoGenerated"),
            ")"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "size-8 rounded-lg hover:bg-muted grid place-items-center", children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(Field$2, { label: t("dateLabel"), children: /* @__PURE__ */ jsx(DatePickerInput, { value: date, onChange: setDate, required: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field$2, { label: t("customers"), children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Users, { className: "absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground end-3 pointer-events-none" }),
        /* @__PURE__ */ jsx("input", { type: "number", value: customers, onChange: (e) => setCustomers(e.target.value), min: 1, required: true, autoFocus: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" })
      ] }) }),
      /* @__PURE__ */ jsx(Field$2, { label: `${t("cash")} (${t("currency")})`, children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Banknote, { className: "absolute top-1/2 -translate-y-1/2 size-4 text-success end-3 pointer-events-none" }),
        /* @__PURE__ */ jsx("input", { type: "number", value: cash, onChange: (e) => setCash(e.target.value), step: "0.01", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" })
      ] }) }),
      /* @__PURE__ */ jsx(Field$2, { label: `${t("bank")} (${t("currency")})`, children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Building2, { className: "absolute top-1/2 -translate-y-1/2 size-4 text-info end-3 pointer-events-none" }),
        /* @__PURE__ */ jsx("input", { type: "number", value: bank, onChange: (e) => setBank(e.target.value), step: "0.01", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" })
      ] }) }),
      /* @__PURE__ */ jsx(Field$2, { label: `${t("discount")} (${t("currency")})`, children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(TicketPercent, { className: "absolute top-1/2 -translate-y-1/2 size-4 text-destructive end-3 pointer-events-none" }),
        /* @__PURE__ */ jsx("input", { type: "number", value: discount, onChange: (e) => setDiscount(e.target.value), step: "0.01", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" })
      ] }) }),
      /* @__PURE__ */ jsx(Field$2, { label: t("grossRevenue"), children: /* @__PURE__ */ jsxs("div", { className: "h-10 rounded-xl bg-muted/40 border border-border px-3 text-sm tabular font-semibold flex items-center justify-between", children: [
        /* @__PURE__ */ jsx(Receipt, { className: "size-4 text-muted-foreground" }),
        /* @__PURE__ */ jsxs("span", { children: [
          fmt(grossTotal),
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal", children: t("currency") })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Field$2, { label: t("netRevenue"), children: /* @__PURE__ */ jsxs("div", { className: "h-10 rounded-xl bg-primary/10 border border-primary/30 px-3 text-sm tabular font-bold flex items-center justify-between", children: [
        /* @__PURE__ */ jsx(TrendingUp, { className: "size-4 text-primary" }),
        /* @__PURE__ */ jsxs("span", { className: "text-gradient", children: [
          fmt(netTotal),
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal", children: t("currency") })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Field$2, { label: `${t("wasfatySales")} (${t("currency")})`, children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(FileSpreadsheet, { className: "absolute top-1/2 -translate-y-1/2 size-4 text-warning end-3 pointer-events-none" }),
        /* @__PURE__ */ jsx("input", { type: "number", value: wasfaty, onChange: (e) => setWasfaty(e.target.value), step: "0.01", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" })
      ] }) }),
      /* @__PURE__ */ jsx(Field$2, { label: `${t("subtotal")} (${t("currency")})`, children: /* @__PURE__ */ jsxs("div", { className: "h-10 rounded-xl bg-muted/40 border border-border px-3 text-sm tabular font-semibold flex items-center justify-between", children: [
        /* @__PURE__ */ jsx(Receipt, { className: "size-4 text-muted-foreground" }),
        /* @__PURE__ */ jsxs("span", { children: [
          fmt(subtotalExVat),
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal", children: t("currency") })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Field$2, { label: `${t("vatAmount")} (${t("currency")})`, children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Receipt, { className: "absolute top-1/2 -translate-y-1/2 size-4 text-warning end-3 pointer-events-none" }),
        /* @__PURE__ */ jsx("input", { type: "number", value: vat, onChange: (e) => setVat(e.target.value), step: "0.01", placeholder: "0.00", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" })
      ] }) }),
      /* @__PURE__ */ jsx(Field$2, { label: `${t("totalAmount") || "Total"} (${t("currency")})`, children: /* @__PURE__ */ jsxs("div", { className: "h-10 rounded-xl bg-primary/10 border border-primary/30 px-3 text-sm tabular font-bold flex items-center justify-between", children: [
        /* @__PURE__ */ jsx(TrendingUp, { className: "size-4 text-primary" }),
        /* @__PURE__ */ jsxs("span", { className: "text-gradient", children: [
          fmt(totalIncVat),
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal", children: t("currency") })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(Field$2, { label: t("notes"), children: /* @__PURE__ */ jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), rows: 2, className: "w-full rounded-xl bg-input/40 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 resize-none" }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "h-10 px-4 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/70 transition", children: t("cancel") }),
      /* @__PURE__ */ jsxs("button", { type: "submit", className: "h-10 px-5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition inline-flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
        t("save")
      ] })
    ] })
  ] }) });
}
function Field$2({
  label,
  children
}) {
  return /* @__PURE__ */ jsxs("label", { className: "block space-y-1.5", children: [
    /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: label }),
    children
  ] });
}
const $$splitComponentImporter$d = () => import("./reports-D48xTXwJ.js");
const Route$d = createFileRoute("/reports")({
  head: () => ({
    meta: [{
      title: "Reports — PharmLedger"
    }, {
      name: "description",
      content: "Run, preview, and export financial, sales, tax and HR reports."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
function useOrgStorage(prefix, fallback = []) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id ?? null;
  const key = `${prefix}.${orgId ?? "__none__"}`;
  const [items, setItems] = useState(fallback);
  const [hydratedFor, setHydratedFor] = useState(null);
  useEffect(() => {
    if (typeof window === "undefined") {
      setHydratedFor(orgId);
      return;
    }
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        setItems(Array.isArray(parsed) ? parsed : fallback);
      } else {
        setItems(fallback);
      }
    } catch (e) {
      console.warn(`[useOrgStorage:${prefix}] load failed`, e);
      setItems(fallback);
    }
    setHydratedFor(orgId);
  }, [orgId, key]);
  useEffect(() => {
    if (hydratedFor !== orgId) return;
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (e) {
      console.warn(`[useOrgStorage:${prefix}] save failed`, e);
    }
  }, [items, hydratedFor, orgId, key, prefix]);
  return [items, setItems, hydratedFor === orgId];
}
const $$splitComponentImporter$c = () => import("./purchases-CS0i3FkM.js");
const Route$c = createFileRoute("/purchases")({
  head: () => ({
    meta: [{
      title: "Purchases — PharmLedger"
    }, {
      name: "description",
      content: "Track supplier invoices, VAT and outstanding balances for pharmacy purchases."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const DUE_OPTIONS = [{
  value: "0",
  label: "0 days",
  days: 0
}, {
  value: "30",
  label: "30 days",
  days: 30
}, {
  value: "60",
  label: "60 days",
  days: 60
}, {
  value: "90",
  label: "90 days",
  days: 90
}, {
  value: "120",
  label: "120 days",
  days: 120
}, {
  value: "150",
  label: "150 days",
  days: 150
}, {
  value: "overdue",
  label: "Over Due",
  days: "overdue"
}];
function computeDueDate(baseIso, opt) {
  const base = new Date(baseIso);
  const cfg = DUE_OPTIONS.find((d2) => d2.value === opt) ?? DUE_OPTIONS[1];
  if (cfg.days === "overdue") {
    const d2 = /* @__PURE__ */ new Date();
    d2.setDate(d2.getDate() - 1);
    return d2.toISOString();
  }
  const d = new Date(base);
  d.setDate(d.getDate() + cfg.days);
  return d.toISOString();
}
function AddPurchaseDialog({
  onClose,
  onSubmit,
  initial
}) {
  const {
    t,
    lang
  } = useApp();
  const [suppliersList] = useOrgStorage("suppliers.records.v1", []);
  const supplierOptions = useMemo(() => {
    const seen = /* @__PURE__ */ new Set();
    const opts = [];
    for (const s of suppliersList) {
      const name = (s.name?.[lang] || s.name?.en || s.name?.ar || "").trim();
      if (name && !seen.has(name)) {
        seen.add(name);
        opts.push(name);
      }
    }
    return opts.sort((a, b) => a.localeCompare(b, lang === "ar" ? "ar" : "en"));
  }, [suppliersList, lang]);
  const toDateInput = (iso) => {
    const d = iso ? new Date(iso) : /* @__PURE__ */ new Date();
    return d.toISOString().slice(0, 10);
  };
  const [date, setDate] = useState(toDateInput(initial?.date));
  const [invoiceNumber, setInvoiceNumber] = useState(initial?.invoiceNumber ?? "");
  const [vendorReference, setVendorReference] = useState(initial?.vendorReference ?? "");
  const [supplier, setSupplier] = useState(initial?.supplier[lang] ?? initial?.supplier.en ?? "");
  const [subtotal, setSubtotal] = useState(initial ? String(initial.subtotal) : "");
  const [vatInput, setVatInput] = useState(initial ? String(initial.vat) : "");
  const [totalInput, setTotalInput] = useState(initial ? String(initial.total) : "");
  const [paidAmount, setPaidAmount] = useState(initial ? String(initial.paid) : "");
  const [status, setStatus] = useState(initial?.status ?? "unpaid");
  const [payMethod, setPayMethod] = useState(initial?.method === "transfer" ? "bank" : "cash");
  const [dueOption, setDueOption] = useState(initial?.dueOption ?? "30");
  const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const sub = Number(subtotal) || 0;
  const vat = Number(vatInput) || 0;
  const total = totalInput !== "" ? Number(totalInput) || 0 : sub + vat;
  const submit = (ev) => {
    ev.preventDefault();
    const rawPaid = Number(paidAmount) || 0;
    const paid = status === "paid" ? total : status === "partial" ? total < 0 ? Math.max(rawPaid, total) : Math.min(rawPaid, total) : 0;
    if (status === "partial" && paid === 0) return toast.error(t("paidAmount"));
    const method = payMethod === "bank" ? "transfer" : "cash";
    const dateIso = new Date(date).toISOString();
    onSubmit({
      date: dateIso,
      dueDate: computeDueDate(dateIso, dueOption),
      dueOption,
      supplier: (() => {
        const rec = suppliersList.find((s) => s.name?.ar === supplier || s.name?.en === supplier);
        if (rec) return {
          ar: rec.name.ar || supplier,
          en: rec.name.en || supplier
        };
        return {
          ar: supplier || "—",
          en: supplier || "—"
        };
      })(),
      invoiceNumber: invoiceNumber || `SINV-${Math.floor(Math.random() * 9e4) + 1e4}`,
      vendorReference: vendorReference || void 0,
      itemsCount: initial?.itemsCount ?? 1,
      subtotal: round2(sub),
      vat: round2(vat),
      total: round2(total),
      paid: round2(paid),
      status,
      method
    });
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto", onClick: onClose, children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, onClick: (e) => e.stopPropagation(), className: "glass-card rounded-2xl w-full max-w-2xl p-6 space-y-5 my-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: t("newPurchaseInvoice") }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("purchasesSubtitle") })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "size-8 rounded-lg hover:bg-muted grid place-items-center", children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(Field$1, { label: t("date"), children: /* @__PURE__ */ jsx(DatePickerInput, { value: date, onChange: setDate, required: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field$1, { label: t("invoiceNumber"), children: /* @__PURE__ */ jsx("input", { value: invoiceNumber, onChange: (e) => setInvoiceNumber(e.target.value), placeholder: "SINV-xxxxx", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field$1, { label: "Vendor reference", children: /* @__PURE__ */ jsx("input", { value: vendorReference, onChange: (e) => setVendorReference(e.target.value), placeholder: "REF-...", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field$1, { label: t("supplier"), children: /* @__PURE__ */ jsxs("select", { value: supplier, onChange: (e) => setSupplier(e.target.value), required: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", children: [
        /* @__PURE__ */ jsx("option", { value: "", disabled: true, children: supplierOptions.length === 0 ? lang === "ar" ? "لا يوجد موردين — أضف من شاشة الموردين" : "No suppliers — add from Suppliers page" : lang === "ar" ? "اختر مورد" : "Select supplier" }),
        supplier && !supplierOptions.includes(supplier) && /* @__PURE__ */ jsx("option", { value: supplier, children: supplier }),
        supplierOptions.map((name) => /* @__PURE__ */ jsx("option", { value: name, children: name }, name))
      ] }) }),
      /* @__PURE__ */ jsx(Field$1, { label: `${t("subtotal")} (${t("currency")})`, children: /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: subtotal, onChange: (e) => setSubtotal(e.target.value), required: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field$1, { label: `${t("vatAmount")} (${t("currency")})`, children: /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: vatInput, onChange: (e) => setVatInput(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field$1, { label: `${t("grandTotal")} (${t("currency")})`, children: /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: totalInput, onChange: (e) => setTotalInput(e.target.value), placeholder: (sub + vat).toFixed(2), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular font-bold text-primary focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field$1, { label: `${t("paidAmount")} (${t("currency")})`, children: /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: status === "paid" ? total || "" : status === "unpaid" ? 0 : paidAmount, onChange: (e) => setPaidAmount(e.target.value), readOnly: status === "paid" || status === "unpaid", className: cn("w-full h-10 rounded-xl border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40", status === "paid" || status === "unpaid" ? "bg-muted/60 font-semibold" : "bg-input/40") }) }),
      /* @__PURE__ */ jsx(Field$1, { label: t("paymentStatus"), children: /* @__PURE__ */ jsxs("select", { value: status, onChange: (e) => setStatus(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", children: [
        /* @__PURE__ */ jsx("option", { value: "paid", children: t("paid") }),
        /* @__PURE__ */ jsx("option", { value: "partial", children: t("partial") }),
        /* @__PURE__ */ jsx("option", { value: "unpaid", children: t("unpaid") })
      ] }) }),
      /* @__PURE__ */ jsx(Field$1, { label: t("paymentMethod"), children: /* @__PURE__ */ jsxs("select", { value: payMethod, onChange: (e) => setPayMethod(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", children: [
        /* @__PURE__ */ jsx("option", { value: "cash", children: t("cash") }),
        /* @__PURE__ */ jsx("option", { value: "bank", children: t("bank") })
      ] }) }),
      /* @__PURE__ */ jsx(Field$1, { label: t("dueDate"), children: /* @__PURE__ */ jsx("select", { value: dueOption, onChange: (e) => setDueOption(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", children: DUE_OPTIONS.map((o) => /* @__PURE__ */ jsx("option", { value: o.value, children: o.label }, o.value)) }) })
    ] }),
    (sub !== 0 || vat !== 0 || total !== 0) && /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-muted/30 p-3 text-xs space-y-1.5 tabular", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: t("subtotal") }),
        /* @__PURE__ */ jsxs("span", { children: [
          sub.toLocaleString(),
          " ",
          t("currency")
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: t("vatAmount") }),
        /* @__PURE__ */ jsxs("span", { children: [
          vat.toLocaleString(),
          " ",
          t("currency")
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-bold text-sm pt-1.5 border-t border-border/60", children: [
        /* @__PURE__ */ jsx("span", { children: t("grandTotal") }),
        /* @__PURE__ */ jsxs("span", { className: "text-primary", children: [
          total.toLocaleString(),
          " ",
          t("currency")
        ] })
      ] }),
      status !== "unpaid" && /* @__PURE__ */ jsxs("div", { className: "flex justify-between pt-1.5 border-t border-border/60", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: t("outstanding") }),
        /* @__PURE__ */ jsxs("span", { children: [
          (total - (status === "paid" ? total : Number(paidAmount) || 0)).toLocaleString(),
          " ",
          t("currency")
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-end pt-2", children: [
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "h-10 px-4 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/70 transition", children: t("cancel") }),
      /* @__PURE__ */ jsxs("button", { type: "submit", className: "h-10 px-5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition inline-flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Boxes, { className: "size-4" }),
        t("save")
      ] })
    ] })
  ] }) });
}
function Field$1({
  label,
  children
}) {
  return /* @__PURE__ */ jsxs("label", { className: "space-y-1.5 block", children: [
    /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground", children: label }),
    children
  ] });
}
const $$splitComponentImporter$b = () => import("./organizations-DChSxUHw.js");
const Route$b = createFileRoute("/organizations")({
  head: () => ({
    meta: [{
      title: "Organizations — PharmLedger"
    }, {
      name: "description",
      content: "Manage your organizations and switch between them."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./login-DkS3LC_o.js");
const Route$a = createFileRoute("/login")({
  head: () => ({
    meta: [{
      title: "Sign in — PharmLedger"
    }, {
      name: "description",
      content: "Sign in to your PharmLedger account to manage pharmacy finances."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./journal-entries-qHHequp4.js");
const Route$9 = createFileRoute("/journal-entries")({
  head: () => ({
    meta: [{
      title: "Journal & Ledger — PharmLedger"
    }, {
      name: "description",
      content: "Double-entry journal and per-account ledger."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
function normalizeSupplierName(s) {
  return (s || "").toLowerCase().replace(/[\u064B-\u065F\u0670]/g, "").replace(/[إأآا]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^a-z0-9\u0600-\u06FF]+/g, " ").replace(/\b(co|company|ltd|llc|inc|corp|corporation|sa|sarl|gmbh|plc|trading|intl|international|limited|شركه|شركة|محدوده|محدودة|ذمم|ذ\s?م\s?م|للتجارة)\b/g, " ").replace(/\s+/g, " ").trim();
}
function supplierKeys(supplier) {
  if (!supplier) return [];
  return [normalizeSupplierName(supplier.en || ""), normalizeSupplierName(supplier.ar || "")].filter(Boolean);
}
function supplierIdentity(supplier) {
  return supplierKeys(supplier)[0] || "";
}
function supplierMatches(target, candidate) {
  const targets = supplierKeys(target);
  const sources = supplierKeys(candidate);
  return targets.some((t) => sources.some((s) => s === t));
}
function allocatePaymentToPurchases(purchases, supplierKey, amount) {
  let remaining = Math.max(0, Number(amount) || 0);
  const allocations = [];
  const next = purchases.slice();
  const candidates = purchases.map((p, i) => ({ p, i })).filter(({ p }) => {
    const total = Number(p.total) || 0;
    const paid = Number(p.paid) || 0;
    return total > 0 && total - paid > 1e-3 && supplierKeys(p.supplier).includes(supplierKey);
  }).sort((a, b) => new Date(a.p.date).getTime() - new Date(b.p.date).getTime());
  for (const { p, i } of candidates) {
    if (remaining <= 1e-3) break;
    const total = Number(p.total) || 0;
    const paid = Number(p.paid) || 0;
    const outstanding = Math.max(0, total - paid);
    const applied = Math.min(outstanding, remaining);
    if (applied <= 0) continue;
    remaining -= applied;
    allocations.push({ purchaseId: p.id, amount: applied });
    const newPaid = paid + applied;
    const patched = {
      ...p,
      paid: newPaid,
      ...Object.prototype.hasOwnProperty.call(p, "status") ? { status: newPaid >= total - 0.01 ? "paid" : newPaid > 0 ? "partial" : "unpaid" } : {}
    };
    next[i] = patched;
  }
  return { purchases: next, allocations, leftover: remaining };
}
function getSupplierPaymentAllocations(purchases, payments) {
  const allocated = /* @__PURE__ */ new Map();
  const byId = new Map(purchases.map((p) => [p.id, p]));
  const add = (purchaseId, amount) => {
    const n = Math.max(0, Number(amount) || 0);
    if (!n || !byId.has(purchaseId)) return;
    allocated.set(purchaseId, (allocated.get(purchaseId) || 0) + n);
  };
  for (const payment of payments) {
    if (payment.allocations?.length) {
      payment.allocations.forEach((a) => add(a.purchaseId, a.amount));
    }
  }
  const legacyPayments = payments.filter((p) => !p.allocations?.length).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  for (const payment of legacyPayments) {
    let remaining = Math.max(0, Number(payment.amount) || 0);
    const candidates = purchases.filter((p) => supplierMatches(payment.supplier, p.supplier)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    for (const p of candidates) {
      if (remaining <= 1e-3) break;
      const paidCapacity = Math.max(0, Math.min(Number(p.total) || 0, Math.max(0, Number(p.paid) || 0)) - (allocated.get(p.id) || 0));
      const applied = Math.min(paidCapacity, remaining);
      if (applied <= 0) continue;
      add(p.id, applied);
      remaining -= applied;
    }
  }
  return allocated;
}
function reconcileSupplierAccounting(purchases, payments) {
  const previousAllocated = getSupplierPaymentAllocations(purchases, payments);
  const directPaidByPurchase = /* @__PURE__ */ new Map();
  for (const p of purchases) {
    const total = Number(p.total) || 0;
    const paid = Number(p.paid) || 0;
    const voucherPaid = previousAllocated.get(p.id) || 0;
    directPaidByPurchase.set(p.id, total > 0 ? Math.max(0, Math.min(total, paid) - voucherPaid) : paid);
  }
  let working = purchases.map((p) => ({
    ...p,
    paid: directPaidByPurchase.get(p.id) ?? 0
  }));
  const reconciledPayments = [];
  for (const payment of [...payments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())) {
    const allocation = allocatePaymentToPurchases(working, supplierIdentity(payment.supplier), Number(payment.amount) || 0);
    working = allocation.purchases;
    reconciledPayments.push({ ...payment, allocations: allocation.allocations });
  }
  const byId = new Map(working.map((p) => [p.id, p]));
  return {
    purchases: purchases.map((p) => byId.get(p.id) || p),
    payments: reconciledPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    duplicates: []
  };
}
function monthsBetween(start, end) {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}
function getPurchaseMonthDate(purchase) {
  if (purchase.month) {
    const [y, m] = purchase.month.split("-").map(Number);
    if (y && m) return new Date(y, m - 1, 1);
  }
  return new Date(purchase.date);
}
function computePurchaseAging(purchases, options = {}) {
  const fromTs = options.from ? options.from.getTime() : -Infinity;
  const toTs = options.to ? options.to.getTime() : Infinity;
  const supplierKey = options.supplierKey || "";
  const events = purchases.filter((p) => {
    const ts = new Date(p.date).getTime();
    if (ts < fromTs || ts > toTs) return false;
    if (supplierKey && !supplierKeys(p.supplier).includes(supplierKey)) return false;
    return true;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const lots = [];
  for (const purchase of events) {
    const total = Number(purchase.total) || 0;
    const paid = Number(purchase.paid) || 0;
    if (total > 0) {
      const remaining = Math.max(0, total - Math.max(0, paid));
      if (remaining > 1e-3) lots.push({ purchase, remaining, originalTotal: total });
      continue;
    }
    if (total < 0) {
      let credit = Math.max(0, Math.abs(total) - Math.max(0, -paid));
      for (const lot of lots) {
        if (credit <= 1e-3) break;
        const applied = Math.min(lot.remaining, credit);
        lot.remaining -= applied;
        credit -= applied;
      }
    }
  }
  const openLots = lots.filter((l) => l.remaining > 1e-3);
  const now = options.now ?? Date.now();
  const buckets = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "+5": 0 };
  for (const lot of openLots) {
    const months = Math.max(0, monthsBetween(getPurchaseMonthDate(lot.purchase), new Date(now)));
    if (months <= 1) buckets["1"] += lot.remaining;
    else if (months <= 2) buckets["2"] += lot.remaining;
    else if (months <= 3) buckets["3"] += lot.remaining;
    else if (months <= 4) buckets["4"] += lot.remaining;
    else if (months <= 5) buckets["5"] += lot.remaining;
    else buckets["+5"] += lot.remaining;
  }
  return { buckets, lots: openLots, total: openLots.reduce((s, l) => s + l.remaining, 0) };
}
const DEFAULT_CHART = [
  {
    code: "1",
    nameAr: "الأصول",
    nameEn: "Assets",
    type: "assets",
    nature: "debit",
    children: [
      {
        code: "11",
        nameAr: "الأصول المتداولة",
        nameEn: "Current Assets",
        type: "assets",
        nature: "debit",
        children: [
          { code: "1101", nameAr: "النقد في الصندوق", nameEn: "Cash on Hand", type: "assets", nature: "debit" },
          { code: "1106", nameAr: "عهدة الدرج", nameEn: "Cash Drawer Custody", type: "assets", nature: "debit" },
          { code: "1102", nameAr: "البنك", nameEn: "Bank", type: "assets", nature: "debit" },
          { code: "1103", nameAr: "الذمم المدينة (العملاء)", nameEn: "Accounts Receivable", type: "assets", nature: "debit" },
          { code: "1104", nameAr: "المخزون", nameEn: "Inventory", type: "assets", nature: "debit" },
          { code: "1105", nameAr: "ضريبة المدخلات", nameEn: "Input VAT", type: "assets", nature: "debit" }
        ]
      },
      {
        code: "12",
        nameAr: "الأصول الثابتة",
        nameEn: "Fixed Assets",
        type: "assets",
        nature: "debit",
        children: [
          { code: "1201", nameAr: "الأثاث والمعدات", nameEn: "Furniture & Equipment", type: "assets", nature: "debit" },
          { code: "1202", nameAr: "السيارات", nameEn: "Vehicles", type: "assets", nature: "debit" },
          { code: "1203", nameAr: "مجمع الإهلاك", nameEn: "Accumulated Depreciation", type: "assets", nature: "credit" }
        ]
      }
    ]
  },
  {
    code: "2",
    nameAr: "الخصوم",
    nameEn: "Liabilities",
    type: "liabilities",
    nature: "credit",
    children: [
      {
        code: "21",
        nameAr: "الخصوم المتداولة",
        nameEn: "Current Liabilities",
        type: "liabilities",
        nature: "credit",
        children: [
          { code: "2101", nameAr: "الذمم الدائنة (الموردون)", nameEn: "Accounts Payable", type: "liabilities", nature: "credit" },
          { code: "2102", nameAr: "ضريبة المخرجات المستحقة", nameEn: "Output VAT Payable", type: "liabilities", nature: "credit" },
          { code: "2103", nameAr: "رواتب مستحقة", nameEn: "Accrued Salaries", type: "liabilities", nature: "credit" }
        ]
      },
      {
        code: "22",
        nameAr: "الخصوم طويلة الأجل",
        nameEn: "Long-term Liabilities",
        type: "liabilities",
        nature: "credit",
        children: [
          { code: "2201", nameAr: "قروض طويلة الأجل", nameEn: "Long-term Loans", type: "liabilities", nature: "credit" }
        ]
      }
    ]
  },
  {
    code: "3",
    nameAr: "حقوق الملكية",
    nameEn: "Equity",
    type: "equity",
    nature: "credit",
    children: [
      { code: "3101", nameAr: "رأس المال", nameEn: "Owner's Capital", type: "equity", nature: "credit" },
      { code: "3102", nameAr: "الأرباح المحتجزة", nameEn: "Retained Earnings", type: "equity", nature: "credit" },
      { code: "3103", nameAr: "حساب جاري الملاك (المسحوبات الشخصية)", nameEn: "Owners' Current Account (Drawings)", type: "equity", nature: "debit" }
    ]
  },
  {
    code: "4",
    nameAr: "الإيرادات",
    nameEn: "Revenue",
    type: "revenue",
    nature: "credit",
    children: [
      { code: "4101", nameAr: "مبيعات الوصفات الطبية", nameEn: "Prescription Sales", type: "revenue", nature: "credit" },
      { code: "4102", nameAr: "مبيعات بدون وصفة", nameEn: "OTC Sales", type: "revenue", nature: "credit" },
      { code: "4103", nameAr: "مبيعات مستحضرات التجميل", nameEn: "Cosmetics Sales", type: "revenue", nature: "credit" },
      { code: "4104", nameAr: "مبيعات المكملات", nameEn: "Supplements Sales", type: "revenue", nature: "credit" },
      { code: "4105", nameAr: "مبيعات وصفتي", nameEn: "Wasfaty Sales", type: "revenue", nature: "credit" },
      { code: "4199", nameAr: "إيرادات أخرى", nameEn: "Other Revenue", type: "revenue", nature: "credit" }
    ]
  },
  {
    code: "5",
    nameAr: "المصروفات",
    nameEn: "Expenses",
    type: "expenses",
    nature: "debit",
    children: [
      { code: "5101", nameAr: "تكلفة المبيعات (مشتريات الأدوية)", nameEn: "Cost of Goods Sold", type: "expenses", nature: "debit" },
      { code: "5201", nameAr: "الرواتب", nameEn: "Salaries", type: "expenses", nature: "debit" },
      { code: "5202", nameAr: "الإيجار", nameEn: "Rent", type: "expenses", nature: "debit" },
      { code: "5203", nameAr: "الكهرباء", nameEn: "Electricity", type: "expenses", nature: "debit" },
      { code: "5204", nameAr: "تليفونات", nameEn: "Phones", type: "expenses", nature: "debit" },
      { code: "5205", nameAr: "أدوات مكتبية", nameEn: "Office Supplies", type: "expenses", nature: "debit" },
      { code: "5206", nameAr: "تسويق", nameEn: "Marketing", type: "expenses", nature: "debit" },
      { code: "5207", nameAr: "رسوم بنكية", nameEn: "Bank Fees", type: "expenses", nature: "debit" },
      { code: "5208", nameAr: "مصروفات تأسيس", nameEn: "Founding Expenses", type: "expenses", nature: "debit" },
      { code: "5210", nameAr: "مصروف الإهلاك", nameEn: "Depreciation Expense", type: "expenses", nature: "debit" },
      { code: "5299", nameAr: "نثريات", nameEn: "Miscellaneous", type: "expenses", nature: "debit" }
    ]
  }
];
function loadChartFor(orgId) {
  if (typeof window === "undefined" || !orgId) return DEFAULT_CHART;
  try {
    const raw = localStorage.getItem(`pl_chart_of_accounts.${orgId}`);
    if (!raw) return DEFAULT_CHART;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_CHART;
  } catch {
    return DEFAULT_CHART;
  }
}
function flattenChart(tree) {
  const out = [];
  const walk = (n) => {
    out.push(n);
    n.children?.forEach(walk);
  };
  tree.forEach(walk);
  return out;
}
function findAccount(tree, code) {
  for (const n of tree) {
    if (n.code === code) return n;
    if (n.children) {
      const found = findAccount(n.children, code);
      if (found) return found;
    }
  }
  return null;
}
const EXPENSE_CATEGORY_TO_ACCOUNT = {
  annual: "5299",
  founding: "5208",
  office: "5205",
  marketing: "5206",
  phones: "5204",
  electricity: "5203",
  bankFees: "5207",
  rent: "5202",
  salaries: "5201",
  medsPurchase: "5101",
  cosmeticsPurchase: "5101",
  milkPurchase: "5101",
  ownerDrawings: "3103",
  depreciation: "5210",
  misc: "5299",
  other: "5299"
};
const cashAccount = (method) => method === "bank" || method === "card" || method === "transfer" ? "1102" : "1101";
function readArray(key) {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function buildJournal(orgId) {
  if (!orgId) return [];
  const lines = [];
  const push = (l) => {
    if (l.debit === 0 && l.credit === 0) return;
    lines.push({ ...l, id: `${l.entryId}-${l.accountCode}-${lines.length}` });
  };
  const revenue = readArray(`pharmledger.revenue.entries.v2.${orgId}`);
  for (const r of revenue) {
    const cash = Number(r.cash) || 0;
    const bank = Number(r.bank) || 0;
    const vat = Number(r.vat) || 0;
    const totalInc = cash + bank;
    const ref = r.reference || r.id;
    const date = r.date;
    const share = (amt) => totalInc > 0 ? vat * amt / totalInc : 0;
    const cashVat = share(cash);
    const bankVat = share(bank);
    if (cash > 0) {
      const net = cash - cashVat;
      push({ entryId: r.id, date, source: "revenue", reference: ref, description: "مبيعات نقدي", accountCode: "1101", debit: cash, credit: 0 });
      push({ entryId: r.id, date, source: "revenue", reference: ref, description: "مبيعات نقدي", accountCode: "4101", debit: 0, credit: net });
      if (cashVat > 0) push({ entryId: r.id, date, source: "revenue", reference: ref, description: "ضريبة مخرجات", accountCode: "2102", debit: 0, credit: cashVat });
    }
    if (bank > 0) {
      const net = bank - bankVat;
      push({ entryId: r.id, date, source: "revenue", reference: ref, description: "مبيعات بنك", accountCode: "1102", debit: bank, credit: 0 });
      push({ entryId: r.id, date, source: "revenue", reference: ref, description: "مبيعات بنك", accountCode: "4101", debit: 0, credit: net });
      if (bankVat > 0) push({ entryId: r.id, date, source: "revenue", reference: ref, description: "ضريبة مخرجات", accountCode: "2102", debit: 0, credit: bankVat });
    }
  }
  const expenses = readArray(`pharmledger.expenses.v1.${orgId}`);
  for (const e of expenses) {
    const subtotal = Number(e.subtotal) || 0;
    const vat = Number(e.vat) || 0;
    const total = Number(e.amount) || subtotal + vat;
    const cash = cashAccount(e.method);
    const expAccount = e.accountCode || EXPENSE_CATEGORY_TO_ACCOUNT[e.category] || "5299";
    const ref = e.reference || e.id;
    if (e.category === "depreciation") {
      const amt = total || subtotal;
      push({ entryId: e.id, date: e.date, source: "expense", reference: ref, description: `مصروف إهلاك`, accountCode: "5210", debit: amt, credit: 0 });
      push({ entryId: e.id, date: e.date, source: "expense", reference: ref, description: `مجمع الإهلاك`, accountCode: "1203", debit: 0, credit: amt });
      continue;
    }
    push({ entryId: e.id, date: e.date, source: "expense", reference: ref, description: `مصروف: ${e.vendor?.ar ?? ""}`, accountCode: expAccount, debit: subtotal, credit: 0 });
    if (vat > 0) push({ entryId: e.id, date: e.date, source: "expense", reference: ref, description: "ضريبة مدخلات", accountCode: "1105", debit: vat, credit: 0 });
    push({ entryId: e.id, date: e.date, source: "expense", reference: ref, description: `سداد مصروف`, accountCode: cash, debit: 0, credit: total });
  }
  const rawPurchases = readArray(`pharmledger.purchases.v1.${orgId}`);
  const rawSupplierPayments = readArray(`pharmledger.supplier-payments.v1.${orgId}`);
  const reconciledSupplierAccounting = reconcileSupplierAccounting(rawPurchases, rawSupplierPayments);
  const purchases = reconciledSupplierAccounting.purchases;
  const supplierPayments = reconciledSupplierAccounting.payments;
  const allocatedPaidByPurchase = getSupplierPaymentAllocations(purchases, supplierPayments);
  for (const p of purchases) {
    const subtotal = Number(p.subtotal) || 0;
    const vat = Number(p.vat) || 0;
    const total = Number(p.total) || subtotal + vat;
    const paid = Number(p.paid) || 0;
    const allocatedPaid = allocatedPaidByPurchase.get(p.id) || 0;
    const directPaid = paid > 0 ? Math.max(0, paid - allocatedPaid) : paid;
    const owed = total - directPaid;
    const cash = cashAccount(p.method);
    const ref = p.invoiceNumber || p.id;
    if (total >= 0) {
      push({ entryId: p.id, date: p.date, source: "purchase", reference: ref, description: `شراء: ${p.supplier?.ar ?? ""}`, accountCode: "1104", debit: subtotal, credit: 0 });
      if (vat > 0) push({ entryId: p.id, date: p.date, source: "purchase", reference: ref, description: "ضريبة مدخلات", accountCode: "1105", debit: vat, credit: 0 });
      if (directPaid > 0) push({ entryId: p.id, date: p.date, source: "purchase", reference: ref, description: "سداد مباشر من الفاتورة", accountCode: cash, debit: 0, credit: directPaid });
      if (owed !== 0) push({ entryId: p.id, date: p.date, source: "purchase", reference: ref, description: "ذمم دائنة - موردون", accountCode: "2101", debit: 0, credit: owed });
    } else {
      push({ entryId: p.id, date: p.date, source: "purchase", reference: ref, description: `مرتجع مشتريات: ${p.supplier?.ar ?? ""}`, accountCode: "2101", debit: Math.abs(total), credit: 0 });
      if (subtotal !== 0) push({ entryId: p.id, date: p.date, source: "purchase", reference: ref, description: "عكس مخزون مرتجع", accountCode: "1104", debit: 0, credit: Math.abs(subtotal) });
      if (vat !== 0) push({ entryId: p.id, date: p.date, source: "purchase", reference: ref, description: "عكس ضريبة مدخلات", accountCode: "1105", debit: 0, credit: Math.abs(vat) });
      if (paid < 0) {
        push({ entryId: `${p.id}-refund`, date: p.date, source: "purchase", reference: ref, description: "استرداد من المورد", accountCode: cash, debit: Math.abs(paid), credit: 0 });
        push({ entryId: `${p.id}-refund`, date: p.date, source: "purchase", reference: ref, description: "إقفال استرداد المورد", accountCode: "2101", debit: 0, credit: Math.abs(paid) });
      }
    }
  }
  for (const p of supplierPayments) {
    const amount = Number(p.amount) || 0;
    if (amount <= 0) continue;
    const ref = p.voucherNo || p.id;
    const cash = cashAccount(p.method);
    push({ entryId: p.id, date: p.date, source: "debt", reference: ref, description: `سند سداد مورد: ${p.supplier?.ar ?? ""}`, accountCode: "2101", debit: amount, credit: 0 });
    push({ entryId: p.id, date: p.date, source: "debt", reference: ref, description: "نقد/بنك مقابل سند سداد مورد", accountCode: cash, debit: 0, credit: amount });
  }
  const debts = readArray(`pharmledger.debts.v1.${orgId}`);
  for (const d of debts) {
    if (typeof d.id === "string" && d.id.startsWith("AUTO-PUR-")) continue;
    const amount = Number(d.amount) || 0;
    const paid = Number(d.paid) || 0;
    const ref = d.reference || d.id;
    const payDate = d.paidAt || d.issuedAt;
    if (d.kind === "receivable") {
      push({ entryId: d.id, date: d.issuedAt, source: "debt", reference: ref, description: `ذمم مدينة: ${d.party?.ar ?? ""}`, accountCode: "1103", debit: amount, credit: 0 });
      push({ entryId: d.id, date: d.issuedAt, source: "debt", reference: ref, description: `مبيعات آجلة`, accountCode: "4199", debit: 0, credit: amount });
      if (paid > 0) {
        push({ entryId: `${d.id}-p`, date: payDate, source: "debt", reference: ref, description: `تحصيل`, accountCode: "1101", debit: paid, credit: 0 });
        push({ entryId: `${d.id}-p`, date: payDate, source: "debt", reference: ref, description: `تحصيل`, accountCode: "1103", debit: 0, credit: paid });
      }
    } else {
      push({ entryId: d.id, date: d.issuedAt, source: "debt", reference: ref, description: `التزام: ${d.party?.ar ?? ""}`, accountCode: "5299", debit: amount, credit: 0 });
      push({ entryId: d.id, date: d.issuedAt, source: "debt", reference: ref, description: `ذمم دائنة`, accountCode: "2101", debit: 0, credit: amount });
      if (paid > 0) {
        push({ entryId: `${d.id}-p`, date: payDate, source: "debt", reference: ref, description: `سداد التزام`, accountCode: "2101", debit: paid, credit: 0 });
        push({ entryId: `${d.id}-p`, date: payDate, source: "debt", reference: ref, description: `سداد التزام`, accountCode: "1101", debit: 0, credit: paid });
      }
    }
  }
  lines.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return lines;
}
function AccountPicker({ value, onChange, filterTypes, placeholder, className }) {
  const { lang, t } = useApp();
  const { currentOrg } = useOrg();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const buttonRef = useRef(null);
  const [menuRect, setMenuRect] = useState({ top: 0, left: 0, width: 0 });
  useLayoutEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);
  const allAccounts = useMemo(() => {
    const flat = flattenChart(loadChartFor(currentOrg?.id));
    const leaves = flat.filter((a) => !a.children || a.children.length === 0);
    return filterTypes ? leaves.filter((a) => filterTypes.includes(a.type)) : leaves;
  }, [currentOrg?.id, filterTypes]);
  const selected = useMemo(
    () => allAccounts.find((a) => a.code === value),
    [allAccounts, value]
  );
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return allAccounts;
    return allAccounts.filter(
      (a) => a.code.toLowerCase().includes(term) || a.nameAr.toLowerCase().includes(term) || a.nameEn.toLowerCase().includes(term)
    );
  }, [allAccounts, q]);
  const display = (a) => `${a.code} — ${lang === "ar" ? a.nameAr : a.nameEn}`;
  return /* @__PURE__ */ jsxs("div", { className: cn("relative", open && "z-[100]", className), children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        ref: buttonRef,
        type: "button",
        onClick: () => setOpen((v) => !v),
        className: "w-full h-10 px-3 rounded-xl bg-input/40 border border-border text-sm flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring/40",
        children: [
          /* @__PURE__ */ jsx("span", { className: cn("flex-1 text-start truncate", !selected && "text-muted-foreground"), children: selected ? display(selected) : placeholder ?? t("selectAccount") }),
          selected && /* @__PURE__ */ jsx(
            X,
            {
              className: "size-4 opacity-60 hover:opacity-100",
              onClick: (e) => {
                e.stopPropagation();
                onChange(void 0);
              }
            }
          ),
          /* @__PURE__ */ jsx(ChevronDown, { className: "size-4 opacity-60" })
        ]
      }
    ),
    open && typeof document !== "undefined" && createPortal(
      /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[9998]", onClick: () => setOpen(false) }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: "fixed z-[9999] rounded-xl bg-popover border border-border shadow-xl overflow-hidden",
            style: { top: menuRect.top, left: menuRect.left, width: menuRect.width },
            children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  autoFocus: true,
                  value: q,
                  onChange: (e) => setQ(e.target.value),
                  placeholder: t("search"),
                  className: "w-full h-10 px-3 border-b border-border bg-transparent text-sm focus:outline-none"
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "max-h-64 overflow-y-auto", children: filtered.length === 0 ? /* @__PURE__ */ jsx("div", { className: "px-3 py-6 text-center text-sm text-muted-foreground", children: t("noResults") }) : filtered.map((a) => /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    onChange(a.code);
                    setOpen(false);
                    setQ("");
                  },
                  className: cn(
                    "w-full text-start px-3 py-2 text-sm hover:bg-muted/50 flex items-center gap-2",
                    a.code === value && "bg-primary/10 text-primary"
                  ),
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-muted-foreground w-14 shrink-0", children: a.code }),
                    /* @__PURE__ */ jsx("span", { className: "flex-1 truncate", children: lang === "ar" ? a.nameAr : a.nameEn })
                  ]
                },
                a.code
              )) })
            ]
          }
        )
      ] }),
      document.body
    )
  ] });
}
const $$splitComponentImporter$8 = () => import("./expenses-DMEbWqGa.js");
const Route$8 = createFileRoute("/expenses")({
  head: () => ({
    meta: [{
      title: "Expenses — PharmLedger"
    }, {
      name: "description",
      content: "Track all pharmacy operating expenses with categories, filters and CSV export."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const CATEGORIES = ["annual", "founding", "office", "marketing", "phones", "electricity", "bankFees", "rent", "salaries", "medsPurchase", "cosmeticsPurchase", "milkPurchase", "ownerDrawings", "depreciation", "zakat", "misc", "other"];
const METHODS = ["cash", "bank"];
const VAT_RATE = 0.15;
function AddExpenseDialog({
  onClose,
  onSubmit,
  initial
}) {
  const {
    t,
    fmt
  } = useApp();
  const [date, setDate] = useState(() => initial ? initial.date.slice(0, 10) : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const [category, setCategory] = useState(initial?.category ?? "annual");
  const [method, setMethod] = useState(initial?.method ?? "cash");
  const [subtotalStr, setSubtotalStr] = useState(initial ? String(initial.subtotal) : "");
  const [vatStr, setVatStr] = useState(initial ? String(initial.vat) : "");
  const [vendor, setVendor] = useState(initial?.vendor.en ?? "");
  const [receiptNo, setReceiptNo] = useState(initial?.receiptNo ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [accountCode, setAccountCode] = useState(initial?.accountCode);
  const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const subtotal = Number(subtotalStr) || 0;
  const vat = vatStr === "" ? round2(subtotal * VAT_RATE) : Number(vatStr) || 0;
  const total = subtotal + vat;
  const submit = (ev) => {
    ev.preventDefault();
    if (subtotal <= 0) return toast.error("Subtotal must be > 0");
    onSubmit({
      date: new Date(date).toISOString(),
      category,
      method,
      subtotal: round2(subtotal),
      vat: round2(vat),
      amount: round2(total),
      vendor: {
        ar: vendor || "—",
        en: vendor || "—"
      },
      receiptNo: receiptNo || void 0,
      notes: notes || void 0,
      accountCode: accountCode || void 0
    });
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in", onClick: onClose, children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, onClick: (e) => e.stopPropagation(), className: "glass-card rounded-2xl w-full max-w-xl p-6 space-y-5 max-h-[92vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: t("newExpense") }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("expensesSubtitle") })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "size-8 rounded-lg hover:bg-muted grid place-items-center", children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(Field, { label: t("dateLabel"), children: /* @__PURE__ */ jsx(DatePickerInput, { value: date, onChange: setDate, required: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("category"), children: /* @__PURE__ */ jsx("select", { value: category, onChange: (e) => setCategory(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", children: CATEGORIES.map((c) => /* @__PURE__ */ jsx("option", { value: c, children: t(c) }, c)) }) }),
      /* @__PURE__ */ jsx(Field, { label: t("paymentMethod"), children: /* @__PURE__ */ jsx("select", { value: method, onChange: (e) => setMethod(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", children: METHODS.map((m) => /* @__PURE__ */ jsx("option", { value: m, children: t(m) }, m)) }) }),
      /* @__PURE__ */ jsx(Field, { label: t("vendor"), children: /* @__PURE__ */ jsx("input", { value: vendor, onChange: (e) => setVendor(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: `${t("subtotal")} (${t("currency")})`, children: /* @__PURE__ */ jsx("input", { type: "number", value: subtotalStr, onChange: (e) => setSubtotalStr(e.target.value), step: "0.01", required: true, autoFocus: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: `${t("vatAmount")} (${t("currency")})`, children: /* @__PURE__ */ jsx("input", { type: "number", value: vatStr, onChange: (e) => setVatStr(e.target.value), step: "0.01", placeholder: (subtotal * VAT_RATE).toFixed(2), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("receiptNo"), children: /* @__PURE__ */ jsx("input", { value: receiptNo, onChange: (e) => setReceiptNo(e.target.value), placeholder: "R-00000", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("reference"), children: /* @__PURE__ */ jsx("input", { value: t("autoGenerated"), disabled: true, className: "w-full h-10 rounded-xl bg-muted/40 border border-border px-3 text-sm text-muted-foreground" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-muted/30 px-4 py-3 flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: t("totalAmount") }),
      /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold tabular text-warning", children: [
        fmt(total),
        " ",
        /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal", children: t("currency") })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Field, { label: t("linkedAccount"), children: /* @__PURE__ */ jsx(AccountPicker, { value: accountCode, onChange: setAccountCode, filterTypes: ["expenses", "assets"], placeholder: t("selectAccount") }) }),
    /* @__PURE__ */ jsx(Field, { label: t("notes"), children: /* @__PURE__ */ jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), rows: 2, className: "w-full rounded-xl bg-input/40 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 resize-none" }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "h-10 px-4 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/70 transition", children: t("cancel") }),
      /* @__PURE__ */ jsxs("button", { type: "submit", className: "h-10 px-5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition inline-flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
        t("save")
      ] })
    ] })
  ] }) });
}
function Field({
  label,
  children
}) {
  return /* @__PURE__ */ jsxs("label", { className: "block space-y-1.5", children: [
    /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: label }),
    children
  ] });
}
const $$splitComponentImporter$7 = () => import("./debts-BqMUf6xm.js");
const Route$7 = createFileRoute("/debts")({
  head: () => ({
    meta: [{
      title: "Debts — PharmLedger"
    }, {
      name: "description",
      content: "Manage receivables, payables and debt aging for the pharmacy."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./chart-of-accounts-h0AS0EsG.js");
const Route$6 = createFileRoute("/chart-of-accounts")({
  head: () => ({
    meta: [{
      title: "Chart of Accounts — PharmLedger"
    }, {
      name: "description",
      content: "Accounting directory for the pharmacy."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./backup-BPQoIFKx.js");
const Route$5 = createFileRoute("/backup")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./ai-CwABFmut.js");
const Route$4 = createFileRoute("/ai")({
  head: () => ({
    meta: [{
      title: "AI Features — PharmLedger"
    }, {
      name: "description",
      content: "Upcoming AI-powered forecasting, insights and automation for your pharmacy."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./index-B_vW418Z.js");
const Route$3 = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "PharmLedger — Pharmacy Financial Management"
    }, {
      name: "description",
      content: "Modern financial management SaaS for pharmacies. Track revenue, expenses, VAT, payroll and statements in Arabic and English."
    }, {
      property: "og:title",
      content: "PharmLedger — Pharmacy Financial Management"
    }, {
      property: "og:description",
      content: "Modern financial management for pharmacies. Built for Arabic-speaking owners."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./inventory.reports-r2PYQTJ1.js");
const Route$2 = createFileRoute("/inventory/reports")({
  head: () => ({
    meta: [{
      title: "Reports — Inventory"
    }, {
      name: "description",
      content: "Inventory reports and analytics."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./inventory.products-B8CTQoiS.js");
const Route$1 = createFileRoute("/inventory/products")({
  head: () => ({
    meta: [{
      title: "Products — Inventory"
    }, {
      name: "description",
      content: "Inventory products catalog."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./inventory.operations-ClXaJnSy.js");
const Route = createFileRoute("/inventory/operations")({
  head: () => ({
    meta: [{
      title: "Operations — Inventory"
    }, {
      name: "description",
      content: "Inventory operations (in/out/transfers)."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const VatRoute = Route$k.update({
  id: "/vat",
  path: "/vat",
  getParentRoute: () => Route$l
});
const SuppliersRoute = Route$j.update({
  id: "/suppliers",
  path: "/suppliers",
  getParentRoute: () => Route$l
});
const SupplierPaymentsRoute = Route$i.update({
  id: "/supplier-payments",
  path: "/supplier-payments",
  getParentRoute: () => Route$l
});
const StatementsRoute = Route$h.update({
  id: "/statements",
  path: "/statements",
  getParentRoute: () => Route$l
});
const StaffRoute = Route$g.update({
  id: "/staff",
  path: "/staff",
  getParentRoute: () => Route$l
});
const SettingsRoute = Route$f.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => Route$l
});
const RevenueRoute = Route$e.update({
  id: "/revenue",
  path: "/revenue",
  getParentRoute: () => Route$l
});
const ReportsRoute = Route$d.update({
  id: "/reports",
  path: "/reports",
  getParentRoute: () => Route$l
});
const PurchasesRoute = Route$c.update({
  id: "/purchases",
  path: "/purchases",
  getParentRoute: () => Route$l
});
const OrganizationsRoute = Route$b.update({
  id: "/organizations",
  path: "/organizations",
  getParentRoute: () => Route$l
});
const LoginRoute = Route$a.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => Route$l
});
const JournalEntriesRoute = Route$9.update({
  id: "/journal-entries",
  path: "/journal-entries",
  getParentRoute: () => Route$l
});
const ExpensesRoute = Route$8.update({
  id: "/expenses",
  path: "/expenses",
  getParentRoute: () => Route$l
});
const DebtsRoute = Route$7.update({
  id: "/debts",
  path: "/debts",
  getParentRoute: () => Route$l
});
const ChartOfAccountsRoute = Route$6.update({
  id: "/chart-of-accounts",
  path: "/chart-of-accounts",
  getParentRoute: () => Route$l
});
const BackupRoute = Route$5.update({
  id: "/backup",
  path: "/backup",
  getParentRoute: () => Route$l
});
const AiRoute = Route$4.update({
  id: "/ai",
  path: "/ai",
  getParentRoute: () => Route$l
});
const IndexRoute = Route$3.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$l
});
const InventoryReportsRoute = Route$2.update({
  id: "/inventory/reports",
  path: "/inventory/reports",
  getParentRoute: () => Route$l
});
const InventoryProductsRoute = Route$1.update({
  id: "/inventory/products",
  path: "/inventory/products",
  getParentRoute: () => Route$l
});
const InventoryOperationsRoute = Route.update({
  id: "/inventory/operations",
  path: "/inventory/operations",
  getParentRoute: () => Route$l
});
const rootRouteChildren = {
  IndexRoute,
  AiRoute,
  BackupRoute,
  ChartOfAccountsRoute,
  DebtsRoute,
  ExpensesRoute,
  JournalEntriesRoute,
  LoginRoute,
  OrganizationsRoute,
  PurchasesRoute,
  ReportsRoute,
  RevenueRoute,
  SettingsRoute,
  StaffRoute,
  StatementsRoute,
  SupplierPaymentsRoute,
  SuppliersRoute,
  VatRoute,
  InventoryOperationsRoute,
  InventoryProductsRoute,
  InventoryReportsRoute
};
const routeTree = Route$l._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  AccountPicker as A,
  Button as B,
  vatOf as C,
  DEFAULT_CHART as D,
  LogShiftDialog as L,
  RevenueDialog as R,
  AddExpenseDialog as a,
  AddPurchaseDialog as b,
  DatePickerInput as c,
  allocatePaymentToPurchases as d,
  buildJournal as e,
  buttonVariants as f,
  cn as g,
  computePurchaseAging as h,
  findAccount as i,
  getDataRoot as j,
  getSupplierPaymentAllocations as k,
  isDesktop as l,
  loadBackup as m,
  loadChartFor as n,
  nextReference as o,
  normalizeSupplierName as p,
  openDataFolder as q,
  reconcileSupplierAccounting as r,
  router as s,
  saveBackup as t,
  supplierIdentity as u,
  supplierMatches as v,
  useApp as w,
  useAuth as x,
  useOrg as y,
  useOrgStorage as z
};
