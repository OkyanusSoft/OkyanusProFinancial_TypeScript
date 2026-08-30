/* ════════════════════════════════════════════════════════════
   النظام المالي المتكامل — إصدار 3.0 | أوكيانوس سوفت
   طبقة البيانات (Data Access Layer) — نماذج وبيانات أولية
   ════════════════════════════════════════════════════════════ */

export const SYSTEM = {
  name: "النظام المالي المتكامل",
  en: "Integrated Financial System",
  company: "أوكيانوس سوفت",
  companyEn: "Okyanus Soft",
  version: "3.0.0",
  short: "IFS",
  phone: "781 183 050",
  cr: "السجل التجاري: 2019004571 — صنعاء",
  site: "https://okyanussoft.online/",
};

export type AnyR = Record<string, any> & { id: string };

export interface Account { code: string; name: string; en: string; level: number; parent: string; type: "أصول" | "خصوم" | "حقوق ملكية" | "إيرادات" | "مصروفات"; posting: boolean; analytical?: boolean }
export interface InvDoc { id: string; type: string; date: string; ref: string; warehouse: string; toWarehouse?: string; user: string; status: "مرحّل" | "ملغي"; lines: { item: string; qty: number; cost: number }[]; note?: string }
export interface Invoice { id: string; no: string; date: string; partner: string; payType: "نقدي" | "آجل"; currency: string; rate: number; costCenter: string; status: "مرحّلة" | "ملغاة"; lines: { item: string; qty: number; price: number; disc: number }[]; vat: number; note?: string; paid?: number }
export interface JournalLine { account: string; debit: number; credit: number; currency: string; rate: number; analytical?: string; costCenter?: string }
export interface Journal { id: string; no: string; date: string; desc: string; kind: "افتتاحي" | "يومية" | "قبض" | "صرف" | "طلب"; lines: JournalLine[]; user: string; status: "مرحّل" | "ملغي" | "بانتظار الموافقة"; source?: string }

/* ── دليل الحسابات: 5 مستويات (نمط يمين سوفت التجاري) ──
   1-أصول  2-خصوم  3-حقوق ملكية  4-إيرادات  5-مصروفات */
export const ACCOUNTS: Account[] = [
  { code: "1", name: "الأصول", en: "Assets", level: 1, parent: "", type: "أصول", posting: false },
  { code: "11", name: "الأصول المتداولة", en: "Current Assets", level: 2, parent: "1", type: "أصول", posting: false },
  { code: "111", name: "النقدية والبنوك", en: "Cash & Banks", level: 3, parent: "11", type: "أصول", posting: false },
  { code: "1111", name: "الصناديق النقدية", en: "Cash Boxes", level: 4, parent: "111", type: "أصول", posting: false },
  { code: "11111", name: "الصندوق الرئيسي", en: "Main Cash Box", level: 5, parent: "1111", type: "أصول", posting: true },
  { code: "11112", name: "صندوق فرع عدن", en: "Aden Branch Box", level: 5, parent: "1111", type: "أصول", posting: true },
  { code: "1112", name: "البنوك", en: "Banks", level: 4, parent: "111", type: "أصول", posting: false },
  { code: "11121", name: "بنك الكريمي — جاري", en: "Kuraimi Bank - Current", level: 5, parent: "1112", type: "أصول", posting: true },
  { code: "11122", name: "بنك التضامن — توفير", en: "Tadhamon Bank", level: 5, parent: "1112", type: "أصول", posting: true },
  { code: "112", name: "الذمم المدينة", en: "Receivables", level: 3, parent: "11", type: "أصول", posting: false },
  { code: "1121", name: "ذمم العملاء", en: "Trade Receivables", level: 4, parent: "112", type: "أصول", posting: false },
  { code: "11211", name: "عملاء محليون — آجل", en: "Local Customers - Credit", level: 5, parent: "1121", type: "أصول", posting: true },
  { code: "11212", name: "نزلاء المستشفى — تحليلي", en: "Hospital Patients (Analytical)", level: 5, parent: "1121", type: "أصول", posting: true, analytical: true },
  { code: "11213", name: "ذمم موظفين", en: "Staff Receivables", level: 5, parent: "1121", type: "أصول", posting: true },
  { code: "113", name: "المخزون", en: "Inventory", level: 3, parent: "11", type: "أصول", posting: false },
  { code: "1131", name: "مخزون البضائع", en: "Goods Stock", level: 4, parent: "113", type: "أصول", posting: false },
  { code: "11311", name: "المخزون الرئيسي", en: "Main Stock", level: 5, parent: "1131", type: "أصول", posting: true },
  { code: "114", name: "الأصول الثابتة", en: "Fixed Assets", level: 3, parent: "11", type: "أصول", posting: false },
  { code: "1141", name: "المعدات والتجهيزات", en: "Equipment", level: 4, parent: "114", type: "أصول", posting: false },
  { code: "11411", name: "معدات طبية", en: "Medical Equipment", level: 5, parent: "1141", type: "أصول", posting: true },
  { code: "1142", name: "مجمعات الاستهلاك", en: "Acc. Depreciation", level: 4, parent: "114", type: "أصول", posting: false },
  { code: "11421", name: "مجمع استهلاك المعدات", en: "Equip. Depreciation", level: 5, parent: "1142", type: "أصول", posting: true },
  { code: "2", name: "الخصوم", en: "Liabilities", level: 1, parent: "", type: "خصوم", posting: false },
  { code: "21", name: "الخصوم المتداولة", en: "Current Liabilities", level: 2, parent: "2", type: "خصوم", posting: false },
  { code: "211", name: "الذمم الدائنة", en: "Payables", level: 3, parent: "21", type: "خصوم", posting: false },
  { code: "2111", name: "ذمم الموردين", en: "Trade Payables", level: 4, parent: "211", type: "خصوم", posting: false },
  { code: "21111", name: "موردون محليون — آجل", en: "Local Suppliers - Credit", level: 5, parent: "2111", type: "خصوم", posting: true },
  { code: "212", name: "الضرائب المستحقة", en: "Taxes Payable", level: 3, parent: "21", type: "خصوم", posting: false },
  { code: "2121", name: "ضريبة المبيعات", en: "Sales Tax", level: 4, parent: "212", type: "خصوم", posting: false },
  { code: "21211", name: "ضريبة مخرجات مستحقة", en: "Output VAT", level: 5, parent: "2121", type: "خصوم", posting: true },
  { code: "21212", name: "ضريبة مدخلات قابلة للخصم", en: "Input VAT", level: 5, parent: "2121", type: "خصوم", posting: true },
  { code: "3", name: "حقوق الملكية", en: "Equity", level: 1, parent: "", type: "حقوق ملكية", posting: false },
  { code: "31", name: "رأس المال", en: "Capital", level: 2, parent: "3", type: "حقوق ملكية", posting: false },
  { code: "311", name: "رأس المال المدفوع", en: "Paid-up Capital", level: 3, parent: "31", type: "حقوق ملكية", posting: false },
  { code: "3111", name: "رأس المال المصرح", en: "Authorized Capital", level: 4, parent: "311", type: "حقوق ملكية", posting: false },
  { code: "31111", name: "رأس المال — الشركاء", en: "Partners Capital", level: 5, parent: "3111", type: "حقوق ملكية", posting: true },
  { code: "312", name: "الاحتياطيات والأرباح", en: "Retained Earnings", level: 2, parent: "3", type: "حقوق ملكية", posting: false },
  { code: "3121", name: "أرباح محتجزة", en: "Retained Profits", level: 3, parent: "312", type: "حقوق ملكية", posting: false },
  { code: "31211", name: "أرباح سنوات سابقة", en: "Prior Years Profits", level: 5, parent: "3121", type: "حقوق ملكية", posting: true },
  { code: "4", name: "الإيرادات", en: "Revenues", level: 1, parent: "", type: "إيرادات", posting: false },
  { code: "41", name: "الإيرادات التشغيلية", en: "Operating Revenue", level: 2, parent: "4", type: "إيرادات", posting: false },
  { code: "411", name: "المبيعات", en: "Sales", level: 3, parent: "41", type: "إيرادات", posting: false },
  { code: "4111", name: "مبيعات البضائع", en: "Goods Sales", level: 4, parent: "411", type: "إيرادات", posting: false },
  { code: "41111", name: "مبيعات محلية — نقدي", en: "Local Sales - Cash", level: 5, parent: "4111", type: "إيرادات", posting: true },
  { code: "41112", name: "مبيعات محلية — آجل", en: "Local Sales - Credit", level: 5, parent: "4111", type: "إيرادات", posting: true },
  { code: "412", name: "إيرادات الخدمات", en: "Services Revenue", level: 3, parent: "41", type: "إيرادات", posting: false },
  { code: "4121", name: "الخدمات الطبية", en: "Medical Services", level: 4, parent: "412", type: "إيرادات", posting: false },
  { code: "41211", name: "إيراد خدمات طبية", en: "Medical Services Income", level: 5, parent: "4121", type: "إيرادات", posting: true },
  { code: "413", name: "مرتجعات المبيعات", en: "Sales Returns", level: 3, parent: "41", type: "إيرادات", posting: false },
  { code: "4131", name: "مرتجعات محلية", en: "Local Returns", level: 4, parent: "413", type: "إيرادات", posting: false },
  { code: "41311", name: "مرتجع مبيعات محلية", en: "Local Sales Returns", level: 5, parent: "4131", type: "إيرادات", posting: true },
  { code: "5", name: "المصروفات", en: "Expenses", level: 1, parent: "", type: "مصروفات", posting: false },
  { code: "51", name: "المصروفات التشغيلية", en: "Operating Expenses", level: 2, parent: "5", type: "مصروفات", posting: false },
  { code: "511", name: "الرواتب والأجور", en: "Salaries", level: 3, parent: "51", type: "مصروفات", posting: false },
  { code: "5111", name: "رواتب الموظفين", en: "Staff Salaries", level: 4, parent: "511", type: "مصروفات", posting: false },
  { code: "51111", name: "رواتب إدارية وطبية", en: "Admin & Medical Salaries", level: 5, parent: "5111", type: "مصروفات", posting: true },
  { code: "512", name: "الإيجارات والمرافق", en: "Rent & Utilities", level: 3, parent: "51", type: "مصروفات", posting: false },
  { code: "5121", name: "الإيجارات", en: "Rent", level: 4, parent: "512", type: "مصروفات", posting: false },
  { code: "51211", name: "إيجار المقر الرئيسي", en: "HQ Rent", level: 5, parent: "5121", type: "مصروفات", posting: true },
  { code: "513", name: "الاستهلاكات", en: "Depreciation", level: 3, parent: "51", type: "مصروفات", posting: false },
  { code: "5131", name: "استهلاك أصول ثابتة", en: "FA Depreciation", level: 4, parent: "513", type: "مصروفات", posting: false },
  { code: "51311", name: "استهلاك المعدات الطبية", en: "Medical Equip. Depr.", level: 5, parent: "5131", type: "مصروفات", posting: true },
  { code: "514", name: "مصاريف تسويقية", en: "Marketing", level: 3, parent: "51", type: "مصروفات", posting: false },
  { code: "5141", name: "إعلان ودعاية", en: "Advertising", level: 4, parent: "514", type: "مصروفات", posting: false },
  { code: "51411", name: "حملات رقمية", en: "Digital Campaigns", level: 5, parent: "5141", type: "مصروفات", posting: true },
  { code: "515", name: "تكلفة المبيعات", en: "COGS", level: 3, parent: "51", type: "مصروفات", posting: false },
  { code: "5151", name: "تكلفة البضاعة المباعة", en: "Cost of Goods Sold", level: 4, parent: "515", type: "مصروفات", posting: false },
  { code: "51511", name: "تكلفة مبيعات محلية", en: "Local COGS", level: 5, parent: "5151", type: "مصروفات", posting: true },
];

export const ANALYTICALS: AnyR[] = [
  { id: "AN-001", code: "AN-001", name: "أحمد محمد الشامي", linkedAccount: "11212", open: 40000, debit: 22000, credit: 0, phone: "777-102-334", note: "قسم الباطنية — غرفة 204" },
  { id: "AN-002", code: "AN-002", name: "سالم عبدالله الحضرمي", linkedAccount: "11212", open: 35000, debit: 13500, credit: 0, phone: "733-881-210", note: "قسم الجراحة — غرفة 118" },
  { id: "AN-003", code: "AN-003", name: "منى عوض السقاف", linkedAccount: "11212", open: 30000, debit: 9000, credit: 0, phone: "711-455-902", note: "قسم النساء — غرفة 305" },
  { id: "AN-004", code: "AN-004", name: "خالد سالم باوزير", linkedAccount: "11212", open: 25000, debit: 500, credit: 0, phone: "770-233-481", note: "قسم الأطفال — غرفة 210" },
  { id: "AN-005", code: "AN-005", name: "فاطمة حسن العمودي", linkedAccount: "11212", open: 50000, debit: 0, credit: 0, phone: "736-604-118", note: "قسم العيون — غرفة 122" },
];

export const UNITS: AnyR[] = [
  { id: "UN-01", code: "UN-01", name: "قطعة", symbol: "قطعة", active: true },
  { id: "UN-02", code: "UN-02", name: "علبة", symbol: "علبة", active: true },
  { id: "UN-03", code: "UN-03", name: "كرتون", symbol: "كرتون", active: true },
  { id: "UN-04", code: "UN-04", name: "كيلوجرام", symbol: "كجم", active: true },
  { id: "UN-05", code: "UN-05", name: "لتر", symbol: "لتر", active: true },
  { id: "UN-06", code: "UN-06", name: "أمبولة", symbol: "أمبولة", active: true },
  { id: "UN-07", code: "UN-07", name: "شريط", symbol: "شريط", active: true },
];

export const GROUPS: AnyR[] = [
  { id: "GR-01", code: "GR-01", name: "مضادات حيوية", note: "تتطلب وصفة طبية" },
  { id: "GR-02", code: "GR-02", name: "مسكنات وخافضات حرارة", note: "الأعلى دوراناً" },
  { id: "GR-03", code: "GR-03", name: "فيتامينات ومكملات", note: "" },
  { id: "GR-04", code: "GR-04", name: "مستلزمات طبية", note: "استهلاكية" },
  { id: "GR-05", code: "GR-05", name: "محاليل وحقن", note: "تخزين بارد" },
  { id: "GR-06", code: "GR-06", name: "أجهزة قياس", note: "أصول دورانية" },
];

export const WAREHOUSES: AnyR[] = [
  { id: "WH-01", code: "WH-01", name: "المخزن الرئيسي — صنعاء", keeper: "عادل الحميري", location: "حزيز، المنطقة الصناعية", capacity: "12,000 موقع", active: true },
  { id: "WH-02", code: "WH-02", name: "مخزن الفرع — عدن", keeper: "سميرة النجار", location: "المعلا، شارع الملكة أروى", capacity: "4,500 موقع", active: true },
  { id: "WH-03", code: "WH-03", name: "مخزن العبور — المكلا", keeper: "فهد باشراحيل", location: "خور المكلا", capacity: "2,200 موقع", active: true },
];

export const ITEMS: AnyR[] = [
  { id: "IT-1001", code: "IT-1001", name: "باراسيتامول 500mg أقراص", group: "GR-02", unit: "UN-02", barcode: "6210001001", cost: 850, price: 1150, min: 200, max: 2000, qty: { "WH-01": 1240, "WH-02": 320 } },
  { id: "IT-1002", code: "IT-1002", name: "أموكسيسيلين 500mg كبسول", group: "GR-01", unit: "UN-02", barcode: "6210001002", cost: 1450, price: 1980, min: 150, max: 1500, qty: { "WH-01": 860, "WH-02": 140, "WH-03": 90 } },
  { id: "IT-1003", code: "IT-1003", name: "فيتامين C + زنك فوار", group: "GR-03", unit: "UN-02", barcode: "6210001003", cost: 1100, price: 1500, min: 100, max: 900, qty: { "WH-01": 640 } },
  { id: "IT-1004", code: "IT-1004", name: "سيفترياكسون 1g حقن", group: "GR-05", unit: "UN-06", barcode: "6210001004", cost: 2200, price: 2950, min: 300, max: 2500, qty: { "WH-01": 260, "WH-02": 120 } },
  { id: "IT-1005", code: "IT-1005", name: "محلول نورمال سالين 500ml", group: "GR-05", unit: "UN-01", barcode: "6210001005", cost: 620, price: 890, min: 400, max: 3000, qty: { "WH-01": 2100, "WH-02": 800, "WH-03": 350 } },
  { id: "IT-1006", code: "IT-1006", name: "جهاز قياس ضغط رقمي", group: "GR-06", unit: "UN-01", barcode: "6210001006", cost: 18500, price: 24900, min: 20, max: 150, qty: { "WH-01": 46 } },
  { id: "IT-1007", code: "IT-1007", name: "قفازات طبية معقمة (100)", group: "GR-04", unit: "UN-02", barcode: "6210001007", cost: 1900, price: 2600, min: 250, max: 2200, qty: { "WH-01": 180, "WH-02": 95 } },
  { id: "IT-1008", code: "IT-1008", name: "أوميغا 3 كبسولات 1000mg", group: "GR-03", unit: "UN-02", barcode: "6210001008", cost: 3400, price: 4500, min: 80, max: 700, qty: { "WH-01": 420, "WH-02": 110 } },
  { id: "IT-1009", code: "IT-1009", name: "أنسولين مخلوط 100IU", group: "GR-05", unit: "UN-06", barcode: "6210001009", cost: 5600, price: 7200, min: 120, max: 800, qty: { "WH-01": 95, "WH-03": 40 } },
  { id: "IT-1010", code: "IT-1010", name: "جهاز قياس سكر + شرائط", group: "GR-06", unit: "UN-01", barcode: "6210001010", cost: 14200, price: 19400, min: 25, max: 180, qty: { "WH-01": 58, "WH-02": 22 } },
];

export const SUPPLIERS: AnyR[] = [
  { id: "SP-01", code: "SP-01", name: "شركة الدواء الحديث المتحدة", phone: "01-448-210", city: "صنعاء", category: "أدوية", balance: 342000, account: "21111", creditDays: 45, active: true },
  { id: "SP-02", code: "SP-02", name: "مؤسسة الخليج للمستلزمات الطبية", phone: "02-331-908", city: "عدن", category: "مستلزمات", balance: 128500, account: "21111", creditDays: 30, active: true },
  { id: "SP-03", code: "SP-03", name: "شركة ميديكال بلس للتجهيزات", phone: "05-662-774", city: "المكلا", category: "أجهزة", balance: 0, account: "21111", creditDays: 60, active: true },
  { id: "SP-04", code: "SP-04", name: "مختبرات فارما كير", phone: "01-220-315", city: "صنعاء", category: "تحاليل", balance: 56800, account: "21111", creditDays: 30, active: true },
];

export const CUSTOMERS: AnyR[] = [
  { id: "CU-01", code: "CU-01", name: "مستشفى النور التخصصي", phone: "01-505-100", city: "صنعاء", category: "مستشفيات", balance: 412000, creditLimit: 500000, account: "11211", active: true },
  { id: "CU-02", code: "CU-02", name: "صيدلية الشفاء المركزية", phone: "02-244-871", city: "عدن", category: "صيدليات", balance: 96400, creditLimit: 150000, account: "11211", active: true },
  { id: "CU-03", code: "CU-03", name: "مؤسسة الصحة للجميع", phone: "05-310-226", city: "المكلا", category: "منظمات", balance: 188200, creditLimit: 200000, account: "11211", active: true },
  { id: "CU-04", code: "CU-04", name: "مجمع الريان الطبي", phone: "01-617-402", city: "تعز", category: "مجمعات", balance: 64300, creditLimit: 120000, account: "11211", active: true },
  { id: "CU-05", code: "CU-05", name: "صيدلية ابن سينا", phone: "02-883-519", city: "عدن", category: "صيدليات", balance: 210500, creditLimit: 200000, account: "11211", active: true },
];

export const CASHBOXES: AnyR[] = [
  { id: "CB-01", code: "CB-01", name: "الصندوق الرئيسي", currency: "YER", open: 250000, keeper: "عادل الحميري", account: "11111", active: true },
  { id: "CB-02", code: "CB-02", name: "صندوق فرع عدن", currency: "YER", open: 84000, keeper: "نبيل السباعي", account: "11112", active: true },
  { id: "CB-03", code: "CB-03", name: "صندوق النقد الأجنبي", currency: "USD", open: 5200, keeper: "سمير الحداد", account: "11121", active: true },
];

export const COST_CENTERS: AnyR[] = [
  { id: "CC-01", code: "CC-01", name: "الإدارة العامة", parent: "", manager: "م. أروى المقطري" },
  { id: "CC-02", code: "CC-02", name: "فرع عدن", parent: "", manager: "أ. نبيل السباعي" },
  { id: "CC-03", code: "CC-03", name: "فرع المكلا", parent: "", manager: "أ. فهد باشراحيل" },
  { id: "CC-011", code: "CC-011", name: "قسم المشتريات", parent: "CC-01", manager: "أ. هدى العامري" },
  { id: "CC-012", code: "CC-012", name: "قسم المبيعات", parent: "CC-01", manager: "أ. طارق الوزير" },
  { id: "CC-021", code: "CC-021", name: "صيدلية الفرع", parent: "CC-02", manager: "د. لمى العطاس" },
];

export const BRANCHES: AnyR[] = [
  { id: "BR-01", code: "BR-01", name: "المركز الرئيسي — صنعاء", manager: "م. أروى المقطري", phone: "01-448-210", main: true },
  { id: "BR-02", code: "BR-02", name: "فرع عدن", manager: "أ. نبيل السباعي", phone: "02-331-908", main: false },
  { id: "BR-03", code: "BR-03", name: "فرع المكلا", manager: "أ. فهد باشراحيل", phone: "05-662-774", main: false },
];

export const DEPARTMENTS: AnyR[] = [
  { id: "DP-01", code: "DP-01", name: "الإدارة المالية", branch: "BR-01", head: "سمير الحداد" },
  { id: "DP-02", code: "DP-02", name: "إدارة المشتريات", branch: "BR-01", head: "هدى العامري" },
  { id: "DP-03", code: "DP-03", name: "إدارة المبيعات", branch: "BR-01", head: "طارق الوزير" },
  { id: "DP-04", code: "DP-04", name: "إدارة المخازن", branch: "BR-01", head: "عادل الحميري" },
  { id: "DP-05", code: "DP-05", name: "قسم الصيدلية — عدن", branch: "BR-02", head: "د. لمى العطاس" },
];

export const USERS: AnyR[] = [
  { id: "U-01", code: "U-01", name: "م. أروى المقطري", username: "admin", role: "مدير النظام", branch: "BR-01", active: true, lastLogin: "2026-03-29 08:12" },
  { id: "U-02", code: "U-02", name: "سمير الحداد", username: "s.haddad", role: "محاسب رئيسي", branch: "BR-01", active: true, lastLogin: "2026-03-29 07:55" },
  { id: "U-03", code: "U-03", name: "عادل الحميري", username: "a.humairi", role: "أمين مخزن", branch: "BR-01", active: true, lastLogin: "2026-03-28 16:40" },
  { id: "U-04", code: "U-04", name: "هدى العامري", username: "h.ameri", role: "مسؤولة مشتريات", branch: "BR-02", active: true, lastLogin: "2026-03-29 09:03" },
  { id: "U-05", code: "U-05", name: "طارق الوزير", username: "t.wazir", role: "مسؤول مبيعات", branch: "BR-02", active: false, lastLogin: "2026-03-14 11:22" },
];

export const ROLES = ["مدير النظام", "محاسب رئيسي", "أمين مخزن", "مسؤولة مشتريات", "مسؤول مبيعات", "مدقق خارجي"];

export const CURRENCIES: AnyR[] = [
  { id: "YER", code: "YER", name: "الريال اليمني", symbol: "ر.ي", rate: 1, base: true },
  { id: "USD", code: "USD", name: "الدولار الأمريكي", symbol: "$", rate: 535, base: false },
  { id: "SAR", code: "SAR", name: "الريال السعودي", symbol: "ر.س", rate: 142.7, base: false },
  { id: "EUR", code: "EUR", name: "اليورو", symbol: "€", rate: 578.4, base: false },
];

export const PERIODS: AnyR[] = [
  { id: "2026-01", code: "2026-01", label: "يناير 2026", locked: true, closedAt: "2026-02-03" },
  { id: "2026-02", code: "2026-02", label: "فبراير 2026", locked: true, closedAt: "2026-03-04" },
  { id: "2026-03", code: "2026-03", label: "مارس 2026", locked: false, closedAt: "" },
  { id: "2026-04", code: "2026-04", label: "أبريل 2026", locked: false, closedAt: "" },
  { id: "2026-05", code: "2026-05", label: "مايو 2026", locked: false, closedAt: "" },
  { id: "2026-06", code: "2026-06", label: "يونيو 2026", locked: false, closedAt: "" },
];

export const INV_DOCS: InvDoc[] = [
  { id: "INV-2601", type: "قيد افتتاحي", date: "2026-01-01", ref: "OB-2026-0001", warehouse: "WH-01", user: "عادل الحميري", status: "مرحّل", lines: [{ item: "IT-1001", qty: 1240, cost: 850 }, { item: "IT-1002", qty: 860, cost: 1450 }, { item: "IT-1005", qty: 2100, cost: 620 }], note: "أرصدة افتتاحية للمخزن الرئيسي" },
  { id: "INV-2602", type: "توريد", date: "2026-01-14", ref: "GRN-2026-0001", warehouse: "WH-01", user: "عادل الحميري", status: "مرحّل", lines: [{ item: "IT-1004", qty: 260, cost: 2200 }, { item: "IT-1007", qty: 180, cost: 1900 }], note: "توريد من شركة الدواء الحديث" },
  { id: "INV-2603", type: "تحويل", date: "2026-01-28", ref: "TR-2026-0001", warehouse: "WH-01", toWarehouse: "WH-02", user: "فهد باشراحيل", status: "مرحّل", lines: [{ item: "IT-1001", qty: 320, cost: 850 }, { item: "IT-1005", qty: 800, cost: 620 }] },
  { id: "INV-2604", type: "صرف", date: "2026-02-06", ref: "ISS-2026-0001", warehouse: "WH-01", user: "عادل الحميري", status: "مرحّل", lines: [{ item: "IT-1003", qty: 120, cost: 1100 }], note: "صرف لفرع عدن — حملة ترويجية" },
  { id: "INV-2605", type: "جرد", date: "2026-02-20", ref: "JC-2026-0001", warehouse: "WH-02", user: "سميرة النجار", status: "مرحّل", lines: [{ item: "IT-1002", qty: -6, cost: 1450 }, { item: "IT-1007", qty: 4, cost: 1900 }], note: "فروقات الجرد الدوري — فبراير" },
  { id: "INV-2606", type: "تسوية", date: "2026-03-05", ref: "ADJ-2026-0001", warehouse: "WH-01", user: "عادل الحميري", status: "ملغي", lines: [{ item: "IT-1008", qty: -12, cost: 3400 }], note: "أُلغي بخطأ إدخال — أعيد إنشاؤه" },
];

export const PURCHASES: Invoice[] = [
  { id: "PU-1", no: "PIN-2026-0087", date: "2026-01-12", partner: "SP-01", payType: "آجل", currency: "YER", rate: 1, costCenter: "CC-01", status: "مرحّلة", vat: 5, paid: 100000, lines: [{ item: "IT-1004", qty: 260, price: 2200, disc: 0 }, { item: "IT-1001", qty: 400, price: 850, disc: 2 }] },
  { id: "PU-2", no: "PIN-2026-0091", date: "2026-01-25", partner: "SP-02", payType: "نقدي", currency: "YER", rate: 1, costCenter: "CC-01", status: "مرحّلة", vat: 5, lines: [{ item: "IT-1007", qty: 180, price: 1900, disc: 0 }] },
  { id: "PU-3", no: "PIN-2026-0096", date: "2026-02-09", partner: "SP-03", payType: "آجل", currency: "USD", rate: 535, costCenter: "CC-02", status: "مرحّلة", vat: 5, paid: 400000, lines: [{ item: "IT-1006", qty: 20, price: 34.5, disc: 0 }, { item: "IT-1010", qty: 15, price: 26.5, disc: 0 }] },
  { id: "PU-4", no: "PIN-2026-0102", date: "2026-02-22", partner: "SP-01", payType: "نقدي", currency: "YER", rate: 1, costCenter: "CC-01", status: "مرحّلة", vat: 5, lines: [{ item: "IT-1002", qty: 300, price: 1450, disc: 1.5 }] },
  { id: "PU-5", no: "PIN-2026-0109", date: "2026-03-08", partner: "SP-04", payType: "آجل", currency: "YER", rate: 1, costCenter: "CC-03", status: "مرحّلة", vat: 5, lines: [{ item: "IT-1009", qty: 60, price: 5600, disc: 0 }] },
  { id: "PU-6", no: "PIN-2026-0114", date: "2026-03-19", partner: "SP-02", payType: "نقدي", currency: "YER", rate: 1, costCenter: "CC-02", status: "ملغاة", vat: 5, lines: [{ item: "IT-1005", qty: 500, price: 620, disc: 0 }] },
];

export const SALES: Invoice[] = [
  { id: "SA-1", no: "SIN-2026-0201", date: "2026-01-08", partner: "CU-01", payType: "آجل", currency: "YER", rate: 1, costCenter: "CC-01", status: "مرحّلة", vat: 5, paid: 130000, lines: [{ item: "IT-1001", qty: 150, price: 1150, disc: 0 }, { item: "IT-1005", qty: 400, price: 890, disc: 2 }] },
  { id: "SA-2", no: "SIN-2026-0206", date: "2026-01-17", partner: "CU-02", payType: "نقدي", currency: "YER", rate: 1, costCenter: "CC-02", status: "مرحّلة", vat: 5, lines: [{ item: "IT-1003", qty: 80, price: 1500, disc: 0 }] },
  { id: "SA-3", no: "SIN-2026-0211", date: "2026-01-26", partner: "CU-05", payType: "آجل", currency: "YER", rate: 1, costCenter: "CC-02", status: "مرحّلة", vat: 5, lines: [{ item: "IT-1008", qty: 60, price: 4500, disc: 1 }] },
  { id: "SA-4", no: "SIN-2026-0217", date: "2026-02-05", partner: "CU-03", payType: "آجل", currency: "YER", rate: 1, costCenter: "CC-03", status: "مرحّلة", vat: 5, lines: [{ item: "IT-1004", qty: 120, price: 2950, disc: 0 }, { item: "IT-1007", qty: 100, price: 2600, disc: 3 }] },
  { id: "SA-5", no: "SIN-2026-0223", date: "2026-02-14", partner: "CU-01", payType: "نقدي", currency: "USD", rate: 535, costCenter: "CC-01", status: "مرحّلة", vat: 5, lines: [{ item: "IT-1006", qty: 6, price: 46.5, disc: 0 }] },
  { id: "SA-6", no: "SIN-2026-0228", date: "2026-02-24", partner: "CU-04", payType: "آجل", currency: "YER", rate: 1, costCenter: "CC-01", status: "مرحّلة", vat: 5, lines: [{ item: "IT-1002", qty: 90, price: 1980, disc: 0 }] },
  { id: "SA-7", no: "SIN-2026-0234", date: "2026-03-03", partner: "CU-02", payType: "نقدي", currency: "YER", rate: 1, costCenter: "CC-02", status: "مرحّلة", vat: 5, lines: [{ item: "IT-1001", qty: 200, price: 1150, disc: 1 }] },
  { id: "SA-8", no: "SIN-2026-0239", date: "2026-03-12", partner: "CU-03", payType: "آجل", currency: "YER", rate: 1, costCenter: "CC-03", status: "مرحّلة", vat: 5, lines: [{ item: "IT-1009", qty: 40, price: 7200, disc: 0 }] },
  { id: "SA-9", no: "SIN-2026-0245", date: "2026-03-21", partner: "CU-05", payType: "آجل", currency: "YER", rate: 1, costCenter: "CC-02", status: "مرحّلة", vat: 5, lines: [{ item: "IT-1010", qty: 12, price: 19400, disc: 2 }] },
  { id: "SA-10", no: "SIN-2026-0251", date: "2026-03-28", partner: "CU-01", payType: "نقدي", currency: "YER", rate: 1, costCenter: "CC-01", status: "مرحّلة", vat: 5, lines: [{ item: "IT-1005", qty: 350, price: 890, disc: 0 }] },
];

export const RETURNS: Invoice[] = [
  { id: "RT-1", no: "SRT-2026-0012", date: "2026-02-18", partner: "CU-04", payType: "آجل", currency: "YER", rate: 1, costCenter: "CC-01", status: "مرحّلة", vat: 5, lines: [{ item: "IT-1002", qty: 10, price: 1980, disc: 0 }], note: "عبوات تالفة أثناء النقل" },
  { id: "RT-2", no: "SRT-2026-0017", date: "2026-03-15", partner: "CU-02", payType: "نقدي", currency: "YER", rate: 1, costCenter: "CC-02", status: "مرحّلة", vat: 5, lines: [{ item: "IT-1003", qty: 6, price: 1500, disc: 0 }], note: "استرجاع فائض طلب" },
];

export const QUOTES: AnyR[] = [
  { id: "Q-1", code: "QT-2026-0041", no: "QT-2026-0041", kind: "بيع", date: "2026-03-02", partner: "CU-03", valid: "2026-03-31", total: 1180000, status: "مقبول" },
  { id: "Q-2", code: "QT-2026-0044", no: "QT-2026-0044", kind: "بيع", date: "2026-03-10", partner: "CU-01", valid: "2026-04-10", total: 642500, status: "ساري" },
  { id: "Q-3", code: "QT-2026-0047", no: "QT-2026-0047", kind: "بيع", date: "2026-03-18", partner: "CU-05", valid: "2026-04-18", total: 288300, status: "ساري" },
  { id: "Q-4", code: "PQ-2026-0019", no: "PQ-2026-0019", kind: "شراء", date: "2026-03-06", partner: "SP-01", valid: "2026-03-25", total: 954000, status: "منتهي" },
  { id: "Q-5", code: "PQ-2026-0022", no: "PQ-2026-0022", kind: "شراء", date: "2026-03-16", partner: "SP-03", valid: "2026-04-15", total: 213000, status: "ساري" },
];

export const REQUESTS: AnyR[] = [
  { id: "PR-1", code: "PR-2026-0031", no: "PR-2026-0031", date: "2026-03-20", requester: "طارق الوزير", desc: "طلب شراء عاجل — أنسولين مخلوط", qty: 120, est: 672000, status: "معتمد" },
  { id: "PR-2", code: "PR-2026-0032", no: "PR-2026-0032", date: "2026-03-22", requester: "عادل الحميري", desc: "طلب شراء — قفازات طبية معقمة", qty: 500, est: 950000, status: "مسودة" },
  { id: "PR-3", code: "PR-2026-0033", no: "PR-2026-0033", date: "2026-03-25", requester: "هدى العامري", desc: "طلب شراء — محاليل وريدية", qty: 1000, est: 620000, status: "تم التحويل" },
  { id: "PR-4", code: "PR-2026-0034", no: "PR-2026-0034", date: "2026-03-27", requester: "سميرة النجار", desc: "طلب شراء — أجهزة قياس سكر", qty: 30, est: 426000, status: "مسودة" },
  { id: "PR-5", code: "PR-2026-0035", no: "PR-2026-0035", date: "2026-03-28", requester: "طارق الوزير", desc: "طلب شراء — فيتامين C فوار", qty: 250, est: 275000, status: "مرفوض" },
];

export const JOURNALS: Journal[] = [
  { id: "JE-0001", no: "FYE-2026-001", date: "2026-01-01", desc: "القيد الافتتاحي للسنة المالية 2026", kind: "افتتاحي", user: "سمير الحداد", status: "مرحّل", source: "سند قيد افتتاحي مالي", lines: [
    { account: "11111", debit: 250000, credit: 0, currency: "YER", rate: 1, costCenter: "CC-01" },
    { account: "11121", debit: 1450000, credit: 0, currency: "YER", rate: 1, costCenter: "CC-01" },
    { account: "11211", debit: 620000, credit: 0, currency: "YER", rate: 1 },
    { account: "11212", debit: 180000, credit: 0, currency: "YER", rate: 1 },
    { account: "11311", debit: 2300000, credit: 0, currency: "YER", rate: 1 },
    { account: "21111", debit: 0, credit: 940000, currency: "YER", rate: 1 },
    { account: "21211", debit: 0, credit: 85000, currency: "YER", rate: 1 },
    { account: "31111", debit: 0, credit: 3775000, currency: "YER", rate: 1 },
  ]},
  { id: "JE-1001", no: "JE-2026-1001", date: "2026-01-15", desc: "مبيعات نقدية — تحصيل مباشر", kind: "يومية", user: "سمير الحداد", status: "مرحّل", source: "سند قيد يومية", lines: [
    { account: "11111", debit: 96500, credit: 0, currency: "YER", rate: 1, costCenter: "CC-01" },
    { account: "41111", debit: 0, credit: 90000, currency: "YER", rate: 1, costCenter: "CC-012" },
    { account: "21211", debit: 0, credit: 6500, currency: "YER", rate: 1 },
  ]},
  { id: "JE-1002", no: "JE-2026-1002", date: "2026-01-22", desc: "مبيعات آجلة — مستشفى النور ومجمع الريان", kind: "يومية", user: "سمير الحداد", status: "مرحّل", source: "سند قيد يومية", lines: [
    { account: "11211", debit: 210000, credit: 0, currency: "YER", rate: 1 },
    { account: "41112", debit: 0, credit: 200000, currency: "YER", rate: 1, costCenter: "CC-012" },
    { account: "21211", debit: 0, credit: 10000, currency: "YER", rate: 1 },
  ]},
  { id: "JE-1003", no: "JE-2026-1003", date: "2026-02-03", desc: "فاتورة مشتريات آجلة — شركة الدواء الحديث", kind: "يومية", user: "هدى العامري", status: "مرحّل", source: "فاتورة مشتريات", lines: [
    { account: "11311", debit: 154000, credit: 0, currency: "YER", rate: 1, costCenter: "CC-011" },
    { account: "21211", debit: 7700, credit: 0, currency: "YER", rate: 1 },
    { account: "21111", debit: 0, credit: 161700, currency: "YER", rate: 1 },
  ]},
  { id: "JE-1004", no: "PV-2026-0104", date: "2026-02-10", desc: "مسيرات رواتب شهر يناير 2026", kind: "صرف", user: "سمير الحداد", status: "مرحّل", source: "سند صرف", lines: [
    { account: "51111", debit: 185000, credit: 0, currency: "YER", rate: 1, costCenter: "CC-01" },
    { account: "11121", debit: 0, credit: 185000, currency: "YER", rate: 1 },
  ]},
  { id: "JE-1005", no: "RC-2026-0105", date: "2026-02-18", desc: "سند قبض — دفعة من مستشفى النور التخصصي", kind: "قبض", user: "سمير الحداد", status: "مرحّل", source: "سند قبض", lines: [
    { account: "11111", debit: 130000, credit: 0, currency: "YER", rate: 1 },
    { account: "11211", debit: 0, credit: 130000, currency: "YER", rate: 1 },
  ]},
  { id: "JE-1006", no: "PV-2026-0106", date: "2026-03-02", desc: "سند صرف — سداد دفعة لمؤسسة الخليج", kind: "صرف", user: "هدى العامري", status: "مرحّل", source: "سند صرف", lines: [
    { account: "21111", debit: 90000, credit: 0, currency: "YER", rate: 1 },
    { account: "11121", debit: 0, credit: 90000, currency: "YER", rate: 1 },
  ]},
  { id: "JE-1007", no: "JE-2026-1007", date: "2026-03-11", desc: "إيجار المقر الرئيسي — الربع الأول", kind: "يومية", user: "سمير الحداد", status: "مرحّل", source: "سند قيد يومية", lines: [
    { account: "51211", debit: 24500, credit: 0, currency: "YER", rate: 1, costCenter: "CC-01" },
    { account: "11111", debit: 0, credit: 24500, currency: "YER", rate: 1 },
  ]},
  { id: "JE-1008", no: "JE-2026-1008", date: "2026-03-20", desc: "قسط استهلاك المعدات الطبية — مارس", kind: "يومية", user: "سمير الحداد", status: "مرحّل", source: "سند قيد يومية", lines: [
    { account: "51311", debit: 32000, credit: 0, currency: "YER", rate: 1, costCenter: "CC-01" },
    { account: "11421", debit: 0, credit: 32000, currency: "YER", rate: 1 },
  ]},
  { id: "JE-1009", no: "JE-2026-1009", date: "2026-03-25", desc: "خدمات طبية لنزلاء — تحليلي: أحمد الشامي", kind: "يومية", user: "سمير الحداد", status: "مرحّل", source: "سند قيد يومية", lines: [
    { account: "11212", debit: 45000, credit: 0, currency: "YER", rate: 1, analytical: "AN-001" },
    { account: "41211", debit: 0, credit: 45000, currency: "YER", rate: 1, costCenter: "CC-021" },
  ]},
  { id: "JE-1010", no: "REQ-2026-0004", date: "2026-03-27", desc: "طلب قيد — حملة تسويق رقمية (بانتظار موافقة المدير المالي)", kind: "طلب", user: "طارق الوزير", status: "بانتظار الموافقة", source: "طلب سند قيد يومية", lines: [
    { account: "51411", debit: 40000, credit: 0, currency: "YER", rate: 1, costCenter: "CC-012" },
    { account: "11111", debit: 0, credit: 40000, currency: "YER", rate: 1 },
  ]},
];

export const PERM_MODULES = ["لوحة التحكم", "المخازن", "المشتريات", "المبيعات", "الحسابات العامة", "إدارة النظام", "التقارير"];
export const PERM_ACTIONS = ["عرض", "إنشاء", "تعديل", "حذف / إلغاء", "تصدير تقارير", "إقفال فترات"];

export const CHANGELOG = [
  { v: "3.0.0", date: "2026-03-29", tag: "إصدار رئيسي", items: ["إعادة تسمية النظام إلى «النظام المالي المتكامل» مع هوية بصرية جديدة", "هيكلة قوائم من ثلاثة مستويات تغطي كل شاشة وتقاريرها", "توليد أرقام وترميز تلقائي لكل السندات والفواتير", "استيراد بيانات جماعي (CSV) مع معاينة وتحقق من التكرار", "سلة محذوفات مع استعادة وحذف نهائي (صيانة البيانات)", "فاتورة مشتريات آجل مع سجل دفعات وتسوية", "الحسابات الوسطية وبيانات الصناديق كإعدادات تكامل محاسبي"] },
  { v: "2.9.2", date: "2025-11-02", tag: "إصلاحات", items: ["إصلاح انحراف التقريب في فواتير العملات الأجنبية", "معالجة تعليق شاشة الجرد عند تجاوز 5,000 سطر", "تحسين زمن استجابة ميزان المراجعة بنسبة 64%"] },
  { v: "2.9.0", date: "2025-08-20", tag: "ميزات جديدة", items: ["إضافة سندات التحويل بين المخازن مع تسعير تلقائي", "حدود ائتمانية للعملاء مع تنبيهات فورية", "تصدير التقارير إلى Excel وPDF"] },
  { v: "2.8.4", date: "2025-05-11", tag: "أمان", items: ["ترقية مصادقة JWT إلى OAuth2 مع تحديث تلقائي للرموز", "سجل تدقيق كامل لكل عمليات الحذف والإلغاء", "تشفير كلمات المرور بخوارزمية Argon2id"] },
  { v: "2.8.0", date: "2025-02-27", tag: "ميزات جديدة", items: ["دليل حسابات هرمي من 5 مستويات (نمط يمين سوفت التجاري)", "إقفال الفترات المالية مع حماية الكتابة", "شاشة تفضيلات متكاملة (خطوط، اتجاه، تنسيقات)"] },
];

export const SIDEBAR_BGS = [
  { id: "ocean", name: "أعماق المحيط", style: "linear-gradient(168deg,#05263d,#0a5c8f)" },
  { id: "abyss", name: "الليل القطبي", style: "linear-gradient(168deg,#060b16,#0f3050)" },
  { id: "royal", name: "النيلي الملكي", style: "linear-gradient(168deg,#171a45,#3d35b4)" },
  { id: "dune", name: "الرمال الذهبية", style: "linear-gradient(168deg,#241a08,#7a5a17)" },
  { id: "emerald", name: "الزمردي", style: "linear-gradient(168deg,#04281f,#0e6e52)" },
  { id: "crimson", name: "القرمزي", style: "linear-gradient(168deg,#2b0a12,#8a2340)" },
];

/* قوالب الاستيراد (عينة CSV لكل دليل) */
export const IMPORT_SAMPLES: Record<string, { headers: string[]; rows: string[][] }> = {
  units: { headers: ["الاسم", "الرمز"], rows: [["دستة", "دستة"], ["جرام", "جرام"]] },
  groups: { headers: ["الاسم", "ملاحظات"], rows: [["أدوية أطفال", "جرعات خاصة"], ["مضادات التهاب", ""]] },
  warehouses: { headers: ["الاسم", "الأمين", "الموقع", "السعة"], rows: [["مخزن الطوارئ", "أمن المخازن", "بدروم المقر", "800 موقع"]] },
  items: { headers: ["الاسم", "المجموعة", "الوحدة", "التكلفة", "السعر", "أدنى", "أقصى"], rows: [["أسبرين 81mg", "GR-02", "UN-02", "450", "650", "300", "2500"]] },
  suppliers: { headers: ["الاسم", "الهاتف", "المدينة", "التصنيف"], rows: [["شركة الأدوية الوطنية", "01-200-100", "صنعاء", "أدوية"]] },
  customers: { headers: ["الاسم", "الهاتف", "المدينة", "التصنيف", "حد الائتمان"], rows: [["صيدلية الأمل", "02-118-305", "عدن", "صيدليات", "100000"]] },
  cashboxes: { headers: ["الاسم", "العملة", "رصيد افتتاحي", "الأمين", "الحساب"], rows: [["صندوق المقصف", "YER", "15000", "محاسب الفرع", "11111"]] },
  costCenters: { headers: ["الاسم", "مركز أب", "المسؤول"], rows: [["قسم المحاسبة", "CC-01", "سمير الحداد"]] },
  branches: { headers: ["الاسم", "المدير", "الهاتف"], rows: [["فرع تعز", "أ. صلاح الحمادي", "04-556-120"]] },
  departments: { headers: ["الاسم", "الفرع", "الرئيس"], rows: [["قسم الموارد البشرية", "BR-01", "أ. أمل الشرعبي"]] },
  users: { headers: ["الاسم", "اسم المستخدم", "الدور", "الفرع"], rows: [["نجوى الكمالي", "n.kamali", "محاسب رئيسي", "BR-03"]] },
  analyticals: { headers: ["الاسم", "الهاتف", "القسم / الغرفة"], rows: [["عمر صالح بامؤمن", "771-209-455", "قسم الباطنية — غرفة 209"]] },
};
