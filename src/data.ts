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

export interface Account { code: string; name: string; en: string; level: number; parent: string; type: "أصول" | "خصوم" | "إيرادات" | "مصروفات"; posting: boolean; analytical?: boolean }
export interface InvDoc { id: string; type: string; date: string; ref: string; warehouse: string; toWarehouse?: string; user: string; status: "مرحّل" | "ملغي"; lines: { item: string; qty: number; cost: number }[]; note?: string }
export interface Invoice { id: string; no: string; date: string; partner: string; payType: "نقدي" | "آجل"; currency: string; rate: number; costCenter: string; status: "مرحّلة" | "ملغاة"; lines: { item: string; qty: number; price: number; disc: number }[]; vat: number; note?: string; paid?: number }
export interface JournalLine { account: string; debit: number; credit: number; currency: string; rate: number; analytical?: string; costCenter?: string }
export interface Journal { id: string; no: string; date: string; desc: string; kind: "افتتاحي" | "يومية" | "قبض" | "صرف" | "طلب"; lines: JournalLine[]; user: string; status: "مرحّل" | "ملغي" | "بانتظار الموافقة"; source?: string }

/* ── دليل الحسابات: 5 مستويات (نمط يمين سوفت التجاري) ──
   1-الأصول  2-الخصوم (تشمل حقوق الملكية)  3-المصروفات  4-الإيرادات */
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
  { code: "22", name: "حقوق الملكية", en: "Equity", level: 2, parent: "2", type: "خصوم", posting: false },
  { code: "221", name: "رأس المال", en: "Capital", level: 3, parent: "22", type: "خصوم", posting: false },
  { code: "2211", name: "رأس المال المصرح", en: "Authorized Capital", level: 4, parent: "221", type: "خصوم", posting: false },
  { code: "22111", name: "رأس المال — الشركاء", en: "Partners Capital", level: 5, parent: "2211", type: "خصوم", posting: true },
  { code: "222", name: "الاحتياطيات والأرباح", en: "Retained Earnings", level: 3, parent: "22", type: "خصوم", posting: false },
  { code: "2221", name: "أرباح محتجزة", en: "Retained Profits", level: 4, parent: "222", type: "خصوم", posting: false },
  { code: "22211", name: "أرباح سنوات سابقة", en: "Prior Years Profits", level: 5, parent: "2221", type: "خصوم", posting: true },
  /* ── 3: المصروفات ── */
  { code: "3", name: "المصروفات", en: "Expenses", level: 1, parent: "", type: "مصروفات", posting: false },
  { code: "31", name: "المصروفات التشغيلية", en: "Operating Expenses", level: 2, parent: "3", type: "مصروفات", posting: false },
  { code: "311", name: "الرواتب والأجور", en: "Salaries", level: 3, parent: "31", type: "مصروفات", posting: false },
  { code: "3111", name: "رواتب الموظفين", en: "Staff Salaries", level: 4, parent: "311", type: "مصروفات", posting: false },
  { code: "31111", name: "رواتب إدارية وطبية", en: "Admin & Medical Salaries", level: 5, parent: "3111", type: "مصروفات", posting: true },
  { code: "312", name: "الإيجارات والمرافق", en: "Rent & Utilities", level: 3, parent: "31", type: "مصروفات", posting: false },
  { code: "3121", name: "الإيجارات", en: "Rent", level: 4, parent: "312", type: "مصروفات", posting: false },
  { code: "31211", name: "إيجار المقر الرئيسي", en: "HQ Rent", level: 5, parent: "3121", type: "مصروفات", posting: true },
  { code: "313", name: "الاستهلاكات", en: "Depreciation", level: 3, parent: "31", type: "مصروفات", posting: false },
  { code: "3131", name: "استهلاك أصول ثابتة", en: "FA Depreciation", level: 4, parent: "313", type: "مصروفات", posting: false },
  { code: "31311", name: "استهلاك المعدات الطبية", en: "Medical Equip. Depr.", level: 5, parent: "3131", type: "مصروفات", posting: true },
  { code: "314", name: "مصاريف تسويقية", en: "Marketing", level: 3, parent: "31", type: "مصروفات", posting: false },
  { code: "3141", name: "إعلان ودعاية", en: "Advertising", level: 4, parent: "314", type: "مصروفات", posting: false },
  { code: "31411", name: "حملات رقمية", en: "Digital Campaigns", level: 5, parent: "3141", type: "مصروفات", posting: true },
  { code: "315", name: "تكلفة المبيعات", en: "COGS", level: 3, parent: "31", type: "مصروفات", posting: false },
  { code: "3151", name: "تكلفة البضاعة المباعة", en: "Cost of Goods Sold", level: 4, parent: "315", type: "مصروفات", posting: false },
  { code: "31511", name: "تكلفة مبيعات محلية", en: "Local COGS", level: 5, parent: "3151", type: "مصروفات", posting: true },
  /* ── 4: الإيرادات ── */
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
  { code: "414", name: "إيرادات الأنشطة المتخصصة", en: "Specialized Activities Revenue", level: 3, parent: "41", type: "إيرادات", posting: false },
  { code: "4141", name: "إيرادات أنشطة متنوعة", en: "Misc. Activities Revenue", level: 4, parent: "414", type: "إيرادات", posting: false },
  { code: "41411", name: "إيراد الأنشطة المتخصصة", en: "Specialized Activity Income", level: 5, parent: "4141", type: "إيرادات", posting: true },
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

/* ── بيانات أساسية إضافية: الأدوار، البنوك، شروط وطرق الدفع، تصنيفات الشركاء ── */
export const ROLES_DIR: AnyR[] = [
  { id: "RL-01", name: "مدير النظام", desc: "صلاحيات كاملة على كل الوحدات وإعدادات النظام", level: 1 },
  { id: "RL-02", name: "محاسب رئيسي", desc: "الحسابات العامة، القيود، والتقارير المالية", level: 2 },
  { id: "RL-03", name: "أمين مخزن", desc: "المخازن والحركات المخزنية والجرد", level: 3 },
  { id: "RL-04", name: "مسؤولة مشتريات", desc: "المشتريات والموردون وعروض الأسعار", level: 3 },
  { id: "RL-05", name: "مسؤول مبيعات", desc: "المبيعات والعملاء والفواتير", level: 3 },
  { id: "RL-06", name: "مدقق خارجي", desc: "عرض وتقارير فقط دون أي تعديل", level: 4 },
];

export const BANKS: AnyR[] = [
  { id: "BK-01", name: "بنك الكريمي الإسلامي", branch: "فرع حدة — صنعاء", iban: "YE12 KRAI 0001 2345 6789", swift: "KRAIYESA", currency: "YER", account: "11121", balance: 1450000 },
  { id: "BK-02", name: "بنك التضامن الإسلامي", branch: "فرع المعلا — عدن", iban: "YE34 TADH 0009 8765 4321", swift: "TADHYESA", currency: "YER", account: "11122", balance: 820000 },
  { id: "BK-03", name: "بنك اليمن الدولي", branch: "المركز الرئيسي", iban: "YE56 IBAK 0005 5555 1111", swift: "IBAKYESA", currency: "USD", account: "11121", balance: 14500 },
];

export const PAYTERMS: AnyR[] = [
  { id: "PT-01", name: "نقدي فوري", kind: "طريقة دفع", days: 0, note: "سداد كامل عند التسليم" },
  { id: "PT-02", name: "آجل 15 يوم", kind: "شرط دفع", days: 15, note: "يستحق خلال أسبوعين" },
  { id: "PT-03", name: "آجل 30 يوم", kind: "شرط دفع", days: 30, note: "الشرط القياسي للموردين" },
  { id: "PT-04", name: "آجل 60 يوم", kind: "شرط دفع", days: 60, note: "للعقود الكبرى" },
  { id: "PT-05", name: "تحويل بنكي", kind: "طريقة دفع", days: 0, note: "عبر الحسابات البنكية المعتمدة" },
  { id: "PT-06", name: "شيك مؤجل", kind: "طريقة دفع", days: 0, note: "بشيك مصرفي بتاريخ استحقاق" },
];

export const PARTNER_CATS: AnyR[] = [
  { id: "PC-01", name: "أدوية", scope: "موردون", note: "شركات ومصانع الأدوية" },
  { id: "PC-02", name: "مستلزمات", scope: "موردون", note: "المستلزمات الطبية" },
  { id: "PC-03", name: "أجهزة", scope: "موردون", note: "التجهيزات والمعدات" },
  { id: "PC-04", name: "تحاليل", scope: "موردون", note: "المختبرات وخدمات التحاليل" },
  { id: "PC-05", name: "مستشفيات", scope: "عملاء", note: "المستشفيات الحكومية والخاصة" },
  { id: "PC-06", name: "صيدليات", scope: "عملاء", note: "الصيدليات ومنافذ البيع" },
  { id: "PC-07", name: "مجمعات", scope: "عملاء", note: "المجمعات والمراكز الطبية" },
  { id: "PC-08", name: "منظمات", scope: "عملاء", note: "المنظمات والجهات الدولية" },
];

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
    { account: "22111", debit: 0, credit: 3775000, currency: "YER", rate: 1 },
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
    { account: "31111", debit: 185000, credit: 0, currency: "YER", rate: 1, costCenter: "CC-01" },
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
    { account: "31211", debit: 24500, credit: 0, currency: "YER", rate: 1, costCenter: "CC-01" },
    { account: "11111", debit: 0, credit: 24500, currency: "YER", rate: 1 },
  ]},
  { id: "JE-1008", no: "JE-2026-1008", date: "2026-03-20", desc: "قسط استهلاك المعدات الطبية — مارس", kind: "يومية", user: "سمير الحداد", status: "مرحّل", source: "سند قيد يومية", lines: [
    { account: "31311", debit: 32000, credit: 0, currency: "YER", rate: 1, costCenter: "CC-01" },
    { account: "11421", debit: 0, credit: 32000, currency: "YER", rate: 1 },
  ]},
  { id: "JE-1009", no: "JE-2026-1009", date: "2026-03-25", desc: "خدمات طبية لنزلاء — تحليلي: أحمد الشامي", kind: "يومية", user: "سمير الحداد", status: "مرحّل", source: "سند قيد يومية", lines: [
    { account: "11212", debit: 45000, credit: 0, currency: "YER", rate: 1, analytical: "AN-001" },
    { account: "41211", debit: 0, credit: 45000, currency: "YER", rate: 1, costCenter: "CC-021" },
  ]},
  { id: "JE-1010", no: "REQ-2026-0004", date: "2026-03-27", desc: "طلب قيد — حملة تسويق رقمية (بانتظار موافقة المدير المالي)", kind: "طلب", user: "طارق الوزير", status: "بانتظار الموافقة", source: "طلب سند قيد يومية", lines: [
    { account: "31411", debit: 40000, credit: 0, currency: "YER", rate: 1, costCenter: "CC-012" },
    { account: "11111", debit: 0, credit: 40000, currency: "YER", rate: 1 },
  ]},
];

export const PERM_MODULES = ["لوحة التحكم", "المخازن", "المشتريات", "المبيعات", "الحسابات العامة", "إدارة النظام", "التقارير"];
export const PERM_ACTIONS = ["عرض", "إنشاء", "تعديل", "حذف / إلغاء", "تصدير تقارير", "إقفال فترات"];

export const CHANGELOG = [
  { v: "3.1.0", date: "2026-03-29", tag: "معمارية ومزامنة", items: [
    "الخادم المركزي server/: Express + MySQL 8 + WebSocket مع JWT وRate Limiting",
    "نظام Migrations مرقّم آمن للتكرار: إضافة/تعديل أي جدول أو عمود لأي نشاط",
    "قاعدة بيانات تكيفية: 21 نظاماً متخصصاً بجداول مرنة (JSON) دون تغيير المخطط",
    "مزامنة دمج مركزي لحظية حقيقية بين النوافذ (الأحدث يفوز — لا حذف لبيانات أي جهاز)",
    "نشر الحذف عبر Tombstones + الاستبدال الشامل عبر رقم الجيل Gen",
    "شاشة فحص التزامن والحمل: فحص صحة المنظومة واختبار 100 مستخدم متزامن",
    "هوية جهاز ثابتة مع تسمية من الإعدادات ونبضات كل 5 ثوانٍ",
  ]},
  { v: "3.0.0", date: "2026-03-29", tag: "إصدار رئيسي", items: ["إعادة تسمية النظام إلى «النظام المالي المتكامل» مع هوية بصرية جديدة", "هيكلة قوائم من ثلاثة مستويات تغطي كل شاشة وتقاريرها", "توليد أرقام وترميز تلقائي لكل السندات والفواتير", "استيراد بيانات جماعي (CSV) مع معاينة وتحقق من التكرار", "سلة محذوفات مع استعادة وحذف نهائي (صيانة البيانات)", "فاتورة مشتريات آجل مع سجل دفعات وتسوية", "الحسابات الوسطية وبيانات الصناديق كإعدادات تكامل محاسبي"] },
  { v: "2.9.2", date: "2025-11-02", tag: "إصلاحات", items: ["إصلاح انحراف التقريب في فواتير العملات الأجنبية", "معالجة تعليق شاشة الجرد عند تجاوز 5,000 سطر", "تحسين زمن استجابة ميزان المراجعة بنسبة 64%"] },
  { v: "2.9.0", date: "2025-08-20", tag: "ميزات جديدة", items: ["إضافة سندات التحويل بين المخازن مع تسعير تلقائي", "حدود ائتمانية للعملاء مع تنبيهات فورية", "تصدير التقارير إلى Excel وPDF"] },
  { v: "2.8.4", date: "2025-05-11", tag: "أمان", items: ["ترقية مصادقة JWT إلى OAuth2 مع تحديث تلقائي للرموز", "سجل تدقيق كامل لكل عمليات الحذف والإلغاء", "تشفير كلمات المرور بخوارزمية Argon2id"] },
  { v: "2.8.0", date: "2025-02-27", tag: "ميزات جديدة", items: ["دليل حسابات هرمي من 5 مستويات (نمط يمين سوفت التجاري)", "إقفال الفترات المالية مع حماية الكتابة", "شاشة تفضيلات متكاملة (خطوط، اتجاه، تنسيقات)"] },
];

/* ═══════ الكتالوج الأمني: شاشات النظام والتقارير وأزرار الإجراءات ═══════
   تُبنى منه مصفوفة الصلاحيات الرباعية (نظام / شاشات / تقارير / أزرار) */
export const MODULE_SCREENS: Record<string, { label: string; screens: { id: string; label: string }[] }> = {
  dash: { label: "لوحة التحكم", screens: [{ id: "dash", label: "لوحة التحكم الرئيسية" }] },
  inv: { label: "المخازن والمستودعات", screens: [{ id: "base", label: "البيانات الأساسية (4 أدلة)" }, { id: "docs", label: "السندات المخزنية (6 أنواع)" }, { id: "pos", label: "شاشة البيع المباشر" }] },
  pur: { label: "المشتريات والموردون", screens: [{ id: "base", label: "إدارة الموردين والتصنيفات" }, { id: "req", label: "طلبات الشراء" }, { id: "quote", label: "عروض الأسعار" }, { id: "inv", label: "فواتير المشتريات" }, { id: "credit", label: "فواتير المشتريات الآجل" }] },
  sal: { label: "المبيعات والعملاء", screens: [{ id: "base", label: "إدارة العملاء والتصنيفات" }, { id: "quote", label: "عروض الأسعار" }, { id: "inv", label: "فواتير المبيعات" }, { id: "ret", label: "مرتجعات المبيعات" }] },
  pos: { label: "نقاط البيع", screens: [{ id: "retail", label: "نمط متاجر التجزئة (باركود وسلة)" }, { id: "rest", label: "نمط المطاعم (الطاولات)" }, { id: "shifts", label: "ورديات الكاشير" }] },
  gl: { label: "الحسابات العامة", screens: [{ id: "base", label: "الأدلة والفترات والعملات (10 شاشات)" }, { id: "docs", label: "القيود والسندات المالية (5 أنواع)" }, { id: "rep", label: "التقارير المالية (4 تقارير)" }] },
  hr: { label: "الموارد البشرية", screens: [{ id: "emp", label: "ملفات الموظفين" }, { id: "att", label: "الحضور والانصراف" }, { id: "rw", label: "المكافآت والإنذارات" }, { id: "leave", label: "الإجازات والأذونات" }, { id: "pay", label: "كشوف الرواتب المرحّلة" }] },
  ast: { label: "الأصول الثابتة", screens: [{ id: "reg", label: "سجل الأصول" }, { id: "dep", label: "الإهلاك بالقسط الثابت" }, { id: "rep", label: "تقارير الأصول" }] },
  adm: { label: "إدارة النظام", screens: [{ id: "users", label: "المستخدمون والصلاحيات" }, { id: "act", label: "تفعيل الأنظمة والأنشطة (مالك)" }, { id: "mon", label: "مراقبة النشاط والأجهزة" }, { id: "set", label: "الإعدادات العامة وقاعدة البيانات" }, { id: "prefs", label: "التفضيلات" }] },
  help: { label: "المساعدة", screens: [{ id: "guide", label: "دليل المستخدم ووثائق المطورين" }] },
};

export const REPORTS: { id: string; name: string; module: string }[] = [
  { id: "rep-inv-bal", name: "أرصدة المخازن", module: "inv" },
  { id: "rep-inv-move", name: "حركة الأصناف", module: "inv" },
  { id: "rep-inv-card", name: "بطاقة صنف", module: "inv" },
  { id: "rep-inv-watch", name: "مراقبة المخزون", module: "inv" },
  { id: "rep-inv-count", name: "جرد المخزون", module: "inv" },
  { id: "rep-pur", name: "تقارير المشتريات", module: "pur" },
  { id: "rep-sal", name: "تقارير المبيعات (يومي/شهري/سنوي)", module: "sal" },
  { id: "rep-gl-stmt", name: "كشف حساب", module: "gl" },
  { id: "rep-gl-trial", name: "ميزان المراجعة", module: "gl" },
  { id: "rep-gl-bs", name: "الميزانية العمومية", module: "gl" },
  { id: "rep-gl-pl", name: "الأرباح والخسائر", module: "gl" },
  { id: "rep-gl-coa", name: "دليل الحسابات", module: "gl" },
  { id: "rep-hr-pay", name: "كشف الرواتب الشهري", module: "hr" },
  { id: "rep-hr-att", name: "تقرير الحضور والانصراف", module: "hr" },
  { id: "rep-ast-reg", name: "سجل الأصول الثابتة", module: "ast" },
  { id: "rep-ast-dep", name: "جدول الإهلاك السنوي", module: "ast" },
];
export const REPORT_ACTIONS = ["عرض", "Excel", "PDF", "طباعة"];
export const BUTTON_ACTIONS = ["إضافة", "تعديل", "حذف", "ترحيل", "اعتماد", "إلغاء/تراجع", "طباعة", "تصدير", "استيراد", "إقفال"];

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
  banks: { headers: ["الاسم", "الفرع", "الآيبان", "سويفت", "العملة", "الحساب", "الرصيد"], rows: [["بنك الأمل", "فرع كريتر", "YE78 AMAL 0001 1111 2222", "AMALYESA", "YER", "11121", "500000"]] },
  payTerms: { headers: ["الاسم", "النوع", "الأيام", "ملاحظة"], rows: [["آجل 45 يوم", "شرط دفع", "45", "خاص بالمقاولين"]] },
  partnerCats: { headers: ["الاسم", "النطاق", "ملاحظة"], rows: [["خدمات لوجستية", "موردون", "شركات النقل والتخليص"]] },
  roles: { headers: ["الاسم", "الوصف", "المستوى"], rows: [["مشرف تقارير", "عرض وإصدار التقارير فقط", "3"]] },
};

/* ════════ بنية المزامنة المركزية اللحظية (Central Merge Sync) ════════
   activity_log  : سجل كل عملية على كل جهاز (لا يُحذف أبداً)
   deletions     : سجل الحذف (Tombstones) — ينتشر لكل الأجهزة
   device_registry: الأجهزة المسجلة في الشبكة وحالتها اللحظية        */
export interface Activity {
  id: string; ts: number; user: string; role: string; device: string; deviceId: string;
  category: string; action: string; type: "create" | "update" | "delete" | "login" | "sync";
}
export interface Device {
  id: string; name: string; user: string; role: string; category: string;
  lastSeen: number; online: boolean; ops: number; ip: string;
}
export interface Tombstone { id: string; coll: string; recordId: string; label: string; by: string; ts: number }

export const ACTIVITY_CATS = ["المالية", "الأصول", "المخازن", "المشتريات", "المبيعات", "نقاط البيع", "الموارد", "النظام"];

/* سجل الأجهزة في الشبكة (الأجهزة البعيدة — يُبث منها العمليات اللحظية) */
export const DEVICES: Device[] = [
  { id: "DV-CASH1", name: "كاشير الاستقبال 1", user: "نبيل سعيد", role: "نقاط البيع", category: "نقاط البيع", lastSeen: 0, online: true, ops: 142, ip: "192.168.1.21" },
  { id: "DV-SALES", name: "جهاز المبيعات 2", user: "طارق الوزير", role: "مسؤول مبيعات", category: "المبيعات", lastSeen: 0, online: true, ops: 98, ip: "192.168.1.24" },
  { id: "DV-FIN", name: "جهاز الحسابات 1", user: "سمير الحداد", role: "محاسب رئيسي", category: "المالية", lastSeen: 0, online: true, ops: 210, ip: "192.168.1.30" },
  { id: "DV-WH", name: "جهاز المخازن", user: "عادل الحميري", role: "أمين مخزن", category: "المخازن", lastSeen: 0, online: false, ops: 76, ip: "192.168.1.33" },
  { id: "DV-PUR", name: "جهاز المشتريات", user: "هدى العامري", role: "مسؤولة مشتريات", category: "المشتريات", lastSeen: 0, online: true, ops: 64, ip: "192.168.1.36" },
  { id: "DV-HR", name: "جهاز الموارد البشرية", user: "أمل الشرعبي", role: "موارد بشرية", category: "الموارد", lastSeen: 0, online: false, ops: 41, ip: "192.168.1.40" },
].map((d) => ({ ...d, lastSeen: Date.now() - Math.floor(Math.random() * 240_000) }));

/* بث تاريخي لآخر 12 ساعة حتى تمتلئ شاشة المراقبة منذ اللحظة الأولى */
const _now = Date.now();
const _H = 3600_000;
type _Seed = [number, number, string, Activity["type"]]; /* [قبل كم دقيقة, فهرس الجهاز, الوصف, النوع] */
const _seed: _Seed[] = [
  [11.6 * 60, 2, "ترحيل القيد الافتتاحي للسنة المالية 2026", "create"],
  [11.1 * 60, 2, "مراجعة أرصدة الصندوق الرئيسي والبنوك", "update"],
  [10.4 * 60, 3, "سند توريد مخزني GRN-0114 (سيفترياكسون + قفازات)", "create"],
  [9.7 * 60, 0, "فاتورة نقاط البيع PV-2026-0240 (نقدي)", "create"],
  [9.2 * 60, 1, "عرض سعر QT-2026-0047 — صيدلية ابن سينا", "create"],
  [8.6 * 60, 4, "فاتورة مشتريات آجلة PIN-2026-0109 (مختبرات فارما كير)", "create"],
  [8.0 * 60, 2, "سند قبض RC-2026-0105 — دفعة مستشفى النور 130,000", "create"],
  [7.3 * 60, 5, "تحديث بيانات موظف — قسم المختبرات", "update"],
  [6.8 * 60, 0, "فاتورة نقاط البيع PV-2026-0241 (نقدي)", "create"],
  [6.1 * 60, 3, "تحويل مخزني TR-0007 — من الرئيسي إلى فرع عدن", "create"],
  [5.6 * 60, 2, "قيد إيجار المقر الرئيسي — الربع الأول", "create"],
  [5.0 * 60, 1, "فاتورة مبيعات SIN-2026-0245 (آجل) — ابن سينا", "create"],
  [4.4 * 60, 4, "عروض أسعار شراء PQ-2026-0022 — ميديكال بلس", "create"],
  [3.9 * 60, 2, "قسط استهلاك المعدات الطبية — مارس", "create"],
  [3.3 * 60, 0, "فاتورة نقاط البيع PV-2026-0242 (نقدي)", "create"],
  [2.8 * 60, 5, "مسير رواتب — مراجعة الحضور والانصراف", "update"],
  [2.2 * 60, 3, "جرد دوري JC-0001 — مخزن فرع عدن", "create"],
  [1.7 * 60, 1, "مرتجع مبيعات SRT-2026-0017 — صيدلية الأمل", "create"],
  [1.2 * 60, 2, "قيد خدمات طبية — تحليلي: أحمد الشامي 45,000", "create"],
  [0.7 * 60, 4, "سند صرف PV-2026-0106 — سداد دفعة لمؤسسة الخليج", "create"],
  [0.4 * 60, 0, "مزامنة تلقائية — استلام 4 سجلات جديدة", "sync"],
  [0.15 * 60, 1, "فاتورة مبيعات SIN-2026-0251 — مستشفى النور (نقدي)", "create"],
];
export const ACTIVITY_SEED: Activity[] = _seed.map(([min, di, action, type], i) => {
  const d = DEVICES[di % DEVICES.length];
  return {
    id: `SEED-${i}`, ts: _now - min * 60_000, user: d.user, role: d.role,
    device: d.name, deviceId: d.id, category: d.category, action, type,
  };
}).sort((a, b) => b.ts - a.ts);

/* ════════════════════════════════════════════════════════════
   الأنظمة المتخصصة حسب طبيعة النشاط (21 نظاماً) — بنية تكيفية
   كل وحدة متخصصة تُعرَّف بالحقول وتُخزن في سجلات مرنة
   ════════════════════════════════════════════════════════════ */
export interface SpecField { k: string; label: string; type?: "text" | "number" | "date" | "select"; opts?: string[]; amount?: boolean; req?: boolean; span?: boolean }
export interface SpecEntity { id: string; label: string; icon: string; fields: SpecField[]; seed: AnyR[]; statusField?: string; statuses?: string[]; amountField?: string }
export interface ActivityDef {
  id: string; name: string; icon: string; color: string; desc: string;
  posMode: "retail" | "restaurant" | "none";
  terminology: { pos: string; customer: string; item: string; sale: string };
  glCredit: string; entities: SpecEntity[];
}
const F = (k: string, label: string, type: SpecField["type"] = "text", opts?: string[], amount?: boolean, req?: boolean, span?: boolean): SpecField =>
  ({ k, label, type, opts, amount, req, span });
const E = (id: string, label: string, icon: string, fields: SpecField[], seed: AnyR[], statusField?: string, statuses?: string[], amountField?: string): SpecEntity =>
  ({ id, label, icon, fields, seed, statusField, statuses, amountField });

export const ACTIVITIES: ActivityDef[] = [
  { id: "factories", name: "المصانع والإنتاج", icon: "server", color: "#6366f1", posMode: "none", desc: "أوامر الإنتاج، خطوط التجميع، وتكاليف التصنيع", glCredit: "41411",
    terminology: { pos: "الإنتاج", customer: "العميل الصناعي", item: "المنتج", sale: "أمر إنتاج" },
    entities: [
      E("wo", "أوامر الإنتاج", "receipt", [F("no", "رقم الأمر", "text", undefined, false, true), F("product", "المنتج", "text", undefined, false, true), F("qty", "الكمية", "number", undefined, false, true), F("cost", "التكلفة", "number", undefined, true), F("date", "تاريخ البدء", "date")],
        [{ id: "WO-01", code: "WO-01", no: "WO-2026-01", product: "عبوات بلاستيك 1لتر", qty: 5000, cost: 125000, date: "2026-03-02", status: "قيد الإنتاج" }, { id: "WO-02", code: "WO-02", no: "WO-2026-02", product: "أغطية محكمة", qty: 8000, cost: 64000, date: "2026-03-10", status: "مكتمل" }],
        "status", ["مخطط", "قيد الإنتاج", "مكتمل", "متوقف"], "cost"),
      E("lines", "خطوط الإنتاج", "swap", [F("name", "اسم الخط", "text", undefined, false, true, true), F("capacity", "الطاقة اليومية", "number"), F("supervisor", "المشرف")],
        [{ id: "LN-01", code: "LN-01", name: "خط الحقن A", capacity: 2000, supervisor: "م. خالد", status: "يعمل" }, { id: "LN-02", code: "LN-02", name: "خط التجميع B", capacity: 3500, supervisor: "م. سالم", status: "صيانة" }],
        "status", ["يعمل", "صيانة", "متوقف"]),
    ] },
  { id: "restaurants", name: "المطاعم", icon: "bld", color: "#f59e0b", posMode: "restaurant", desc: "طاولات، طلبات مطبخ، وفواتير مطاعم", glCredit: "41411",
    terminology: { pos: "الكاشير", customer: "الزبون", item: "الطبق", sale: "طلب" },
    entities: [
      E("menu", "قائمة الأصناف", "tag", [F("name", "الطبق", "text", undefined, false, true, true), F("cat", "التصنيف", "select", ["مقبلات", "أطباق رئيسية", "مشروبات", "حلويات"]), F("price", "السعر", "number", undefined, true, true)],
        [{ id: "MN-01", code: "MN-01", name: "مندي لحم", cat: "أطباق رئيسية", price: 2500, status: "متاح" }, { id: "MN-02", code: "MN-02", name: "شاورما دجاج", cat: "أطباق رئيسية", price: 1200, status: "متاح" }, { id: "MN-03", code: "MN-03", name: "عصير مانجو", cat: "مشروبات", price: 500, status: "نفد" }],
        "status", ["متاح", "نفد"]),
      E("kitchen", "طلبات المطبخ", "receipt", [F("table", "الطاولة", "text", undefined, false, true), F("items", "الأصناف", "text", undefined, false, true, true), F("total", "الإجمالي", "number", undefined, true)],
        [{ id: "KT-01", code: "KT-01", table: "طاولة 4", items: "مندي لحم ×2، سلطة", total: 5300, status: "قيد التحضير" }, { id: "KT-02", code: "KT-02", table: "طاولة 7", items: "شاورما ×3", total: 3600, status: "جاهز" }],
        "status", ["جديد", "قيد التحضير", "جاهز", "مُقدَّم"], "total"),
    ] },
  { id: "hotels", name: "الفنادق", icon: "bld", color: "#0ea5e9", posMode: "restaurant", desc: "حجوزات الغرف، النزلاء، والفواتير الفندقية", glCredit: "41411",
    terminology: { pos: "الاستقبال", customer: "النزيل", item: "الغرفة", sale: "حجز" },
    entities: [
      E("book", "حجوزات الغرف", "cal", [F("guest", "النزيل", "text", undefined, false, true), F("room", "الغرفة", "text", undefined, false, true), F("in", "تاريخ الدخول", "date", undefined, false, true), F("out", "تاريخ الخروج", "date"), F("amount", "قيمة الحجز", "number", undefined, true)],
        [{ id: "HB-01", code: "HB-01", guest: "أحمد الشامي", room: "204", in: "2026-03-20", out: "2026-03-25", amount: 75000, status: "مقيم" }, { id: "HB-02", code: "HB-02", guest: "منى السقاف", room: "310", in: "2026-03-28", out: "2026-04-02", amount: 90000, status: "مؤكد" }],
        "status", ["مؤكد", "مقيم", "غادر", "ملغي"], "amount"),
    ] },
  { id: "hospitals", name: "المستشفيات", icon: "pulse", color: "#ef4444", posMode: "none", desc: "المرضى، الأقسام، والفواتير الطبية", glCredit: "41211",
    terminology: { pos: "الاستقبال", customer: "المريض", item: "الخدمة", sale: "فاتورة طبية" },
    entities: [
      E("pat", "سجل المرضى", "users", [F("name", "اسم المريض", "text", undefined, false, true, true), F("dept", "القسم", "select", ["باطنية", "جراحة", "أطفال", "نساء", "عيون"]), F("phone", "الهاتف"), F("balance", "الرصيد", "number", undefined, true)],
        [{ id: "PT-01", code: "PT-01", name: "أحمد محمد الشامي", dept: "باطنية", phone: "777-102-334", balance: 62000, status: "منوّم" }, { id: "PT-02", code: "PT-02", name: "سالم الحضرمي", dept: "جراحة", phone: "733-881-210", balance: 48500, status: "منوّم" }],
        "status", ["منوّم", "خارجي", "خروج"], "balance"),
      E("op", "العمليات الجراحية", "pulse", [F("patient", "المريض", "text", undefined, false, true), F("type", "نوع العملية", "text", undefined, false, true), F("cost", "التكلفة", "number", undefined, true), F("date", "التاريخ", "date")],
        [{ id: "OP-01", code: "OP-01", patient: "سالم الحضرمي", type: "استئصال زائدة", cost: 120000, date: "2026-03-22", status: "ناجحة" }],
        "status", ["مجدولة", "جارية", "ناجحة"], "cost"),
    ] },
  { id: "clinics", name: "العيادات الطبية", icon: "pulse", color: "#ec4899", posMode: "none", desc: "مواعيد العيادات والكشوفات", glCredit: "41211",
    terminology: { pos: "الاستقبال", customer: "المريض", item: "الكشف", sale: "كشف" },
    entities: [
      E("apt", "مواعيد العيادة", "cal", [F("patient", "المريض", "text", undefined, false, true), F("doctor", "الطبيب", "text", undefined, false, true), F("date", "الموعد", "date", undefined, false, true), F("fee", "الأجرة", "number", undefined, true)],
        [{ id: "AP-01", code: "AP-01", patient: "فاطمة العمودي", doctor: "د. لمى", date: "2026-03-30", fee: 5000, status: "مؤكد" }, { id: "AP-02", code: "AP-02", patient: "خالد باوزير", doctor: "د. نبيل", date: "2026-03-30", fee: 7000, status: "بالانتظار" }],
        "status", ["بالانتظار", "مؤكد", "مكتمل", "ملغي"], "fee"),
    ] },
  { id: "construction", name: "المقاولات", icon: "bld", color: "#8b5cf6", posMode: "none", desc: "المشاريع، المستخلصات، والعقود", glCredit: "41411",
    terminology: { pos: "الموقع", customer: "المالك", item: "البند", sale: "مستخلص" },
    entities: [
      E("proj", "المشاريع", "bld", [F("name", "المشروع", "text", undefined, false, true, true), F("owner", "المالك"), F("value", "قيمة العقد", "number", undefined, true), F("progress", "نسبة الإنجاز %", "number")],
        [{ id: "PR-01", code: "PR-01", name: "برج المكلا السكني", owner: "مؤسسة الإعمار", value: 45000000, progress: 62, status: "جارٍ" }, { id: "PR-02", code: "PR-02", name: "ترميم مدرسة النور", owner: "وزارة التربية", value: 8500000, progress: 100, status: "مسلَّم" }],
        "status", ["جارٍ", "متوقف", "مسلَّم"], "value"),
      E("ipc", "المستخلصات", "receipt", [F("project", "المشروع", "text", undefined, false, true), F("no", "رقم المستخلص", "text", undefined, false, true), F("amount", "القيمة", "number", undefined, true), F("date", "التاريخ", "date")],
        [{ id: "IP-01", code: "IP-01", project: "برج المكلا", no: "IPC-04", amount: 5600000, date: "2026-03-15", status: "معتمد" }],
        "status", ["مقدَّم", "معتمد", "مدفوع"], "amount"),
    ] },
  { id: "gas", name: "محطات البترول", icon: "pulse", color: "#22c55e", posMode: "retail", desc: "المضخات، الخزانات، وبيع الوقود", glCredit: "41111",
    terminology: { pos: "المضخة", customer: "العميل", item: "الوقود", sale: "تعبئة" },
    entities: [
      E("tank", "الخزانات", "server", [F("name", "الخزان", "text", undefined, false, true), F("fuel", "الوقود", "select", ["بنزين 95", "بنزين 91", "ديزل"]), F("cap", "السعة (لتر)", "number"), F("level", "الرصيد الحالي", "number")],
        [{ id: "TK-01", code: "TK-01", name: "خزان A1", fuel: "بنزين 95", cap: 40000, level: 28000, status: "جيد" }, { id: "TK-02", code: "TK-02", name: "خزان D1", fuel: "ديزل", cap: 30000, level: 4000, status: "منخفض" }],
        "status", ["جيد", "منخفض", "فارغ"]),
    ] },
  { id: "utilities", name: "محطات الكهرباء والمياه", icon: "pulse", color: "#eab308", posMode: "none", desc: "العدادات، المشتركين، والفواتير الخدمية", glCredit: "41411",
    terminology: { pos: "التحصيل", customer: "المشترك", item: "الخدمة", sale: "فاتورة خدمية" },
    entities: [
      E("meter", "العدادات والمشتركون", "globe", [F("name", "المشترك", "text", undefined, false, true), F("type", "الخدمة", "select", ["كهرباء", "مياه"]), F("meter", "رقم العداد"), F("bill", "الفاتورة", "number", undefined, true)],
        [{ id: "MT-01", code: "MT-01", name: "حي السلام", type: "كهرباء", meter: "EL-8841", bill: 12500, status: "مسددة" }, { id: "MT-02", code: "MT-02", name: "مصنع الثلج", type: "مياه", meter: "WT-2210", bill: 8400, status: "مستحقة" }],
        "status", ["مسددة", "مستحقة", "متأخرة"], "bill"),
    ] },
  { id: "travel", name: "السفريات والسياحة", icon: "globe", color: "#14b8a6", posMode: "retail", desc: "التذاكر، الحجوزات، والباقات السياحية", glCredit: "41411",
    terminology: { pos: "الحجوزات", customer: "المسافر", item: "التذكرة", sale: "حجز" },
    entities: [
      E("ticket", "تذاكر الطيران", "clip", [F("passenger", "المسافر", "text", undefined, false, true), F("route", "المسار", "text", undefined, false, true), F("date", "تاريخ السفر", "date", undefined, false, true), F("price", "السعر", "number", undefined, true)],
        [{ id: "TT-01", code: "TT-01", passenger: "عمر بامؤمن", route: "عدن → القاهرة", date: "2026-04-05", price: 95000, status: "مؤكد" }],
        "status", ["مؤكد", "بانتظار", "صادر", "ملغي"], "price"),
      E("pkg", "الباقات السياحية", "globe", [F("name", "الباقة", "text", undefined, false, true, true), F("days", "عدد الأيام", "number"), F("price", "السعر", "number", undefined, true)],
        [{ id: "PK-01", code: "PK-01", name: "رحلة سقطرى 5 أيام", days: 5, price: 180000, status: "متاحة" }],
        "status", ["متاحة", "محجوزة"], "price"),
    ] },
  { id: "sports", name: "النوادي الرياضية", icon: "users", color: "#84cc16", posMode: "retail", desc: "الاشتراكات، الأعضاء، والحصص التدريبية", glCredit: "41411",
    terminology: { pos: "الاستقبال", customer: "العضو", item: "الاشتراك", sale: "اشتراك" },
    entities: [
      E("member", "الأعضاء والاشتراكات", "users", [F("name", "العضو", "text", undefined, false, true), F("plan", "الباقة", "select", ["شهري", "ربع سنوي", "سنوي"]), F("fee", "الرسوم", "number", undefined, true), F("expiry", "تاريخ الانتهاء", "date")],
        [{ id: "MB-01", code: "MB-01", name: "طارق الوزير", plan: "سنوي", fee: 60000, expiry: "2027-01-15", status: "نشط" }, { id: "MB-02", code: "MB-02", name: "هدى العامري", plan: "شهري", fee: 8000, expiry: "2026-04-10", status: "نشط" }],
        "status", ["نشط", "منتهٍ", "موقوف"], "fee"),
    ] },
  { id: "tailoring", name: "الخياطة", icon: "edit", color: "#a855f7", posMode: "retail", desc: "طلبات التفصيل والقياسات", glCredit: "41411",
    terminology: { pos: "المحل", customer: "الزبون", item: "القطعة", sale: "طلب تفصيل" },
    entities: [
      E("order", "طلبات التفصيل", "edit", [F("customer", "الزبون", "text", undefined, false, true), F("item", "القطعة", "select", ["ثوب", "بدلة", "قميص", "فستان"]), F("measure", "القياسات", "text", undefined, false, true, true), F("price", "السعر", "number", undefined, true), F("due", "تاريخ التسليم", "date")],
        [{ id: "TL-01", code: "TL-01", customer: "سالم الحضرمي", item: "ثوب", measure: "طول 150، كتف 48", price: 12000, due: "2026-04-01", status: "قيد التفصيل" }],
        "status", ["قيد التفصيل", "جاهز", "مسلَّم"], "price"),
    ] },
  { id: "gold", name: "الذهب والمجوهرات", icon: "coins", color: "#f59e0b", posMode: "retail", desc: "المشغولات، الأوزان، والعيارات", glCredit: "41111",
    terminology: { pos: "المعرض", customer: "العميل", item: "المشغول", sale: "بيع ذهب" },
    entities: [
      E("piece", "المشغولات الذهبية", "coins", [F("name", "المشغول", "text", undefined, false, true), F("karat", "العيار", "select", ["24", "22", "21", "18"]), F("weight", "الوزن (جرام)", "number"), F("price", "السعر", "number", undefined, true)],
        [{ id: "GD-01", code: "GD-01", name: "أسورة عريضة", karat: "21", weight: 24.5, price: 1420000, status: "معروض" }, { id: "GD-02", code: "GD-02", name: "خاتم سوليتير", karat: "18", weight: 6.2, price: 540000, status: "محجوز" }],
        "status", ["معروض", "محجوز", "مبيع"], "price"),
    ] },
  { id: "carrental", name: "تأجير السيارات والصيانة", icon: "truck", color: "#3b82f6", posMode: "retail", desc: "الأسطول، عقود التأجير، وأوامر الصيانة", glCredit: "41411",
    terminology: { pos: "المكتب", customer: "المستأجر", item: "السيارة", sale: "عقد تأجير" },
    entities: [
      E("fleet", "الأسطول", "truck", [F("car", "السيارة", "text", undefined, false, true), F("plate", "اللوحة"), F("rate", "أجرة اليوم", "number", undefined, true)],
        [{ id: "FL-01", code: "FL-01", car: "هيونداي إلنترا 2024", plate: "12345/عدن", rate: 25000, status: "متاحة" }, { id: "FL-02", code: "FL-02", car: "تويوتا هايس 2023", plate: "67890/عدن", rate: 40000, status: "مؤجرة" }],
        "status", ["متاحة", "مؤجرة", "صيانة"]),
      E("maint", "أوامر الصيانة", "gear", [F("car", "السيارة", "text", undefined, false, true), F("job", "الإصلاح", "text", undefined, false, true), F("cost", "التكلفة", "number", undefined, true)],
        [{ id: "MN-11", code: "MN-11", car: "هيونداي إلنترا", job: "تغيير زيت وفلاتر", cost: 18000, status: "جارٍ" }],
        "status", ["جارٍ", "جاهز", "مسلَّم"], "cost"),
    ] },
  { id: "exchange", name: "الصرافة والحوالات", icon: "swap", color: "#06b6d4", posMode: "retail", desc: "أسعار الصرف، الحوالات، وعمليات البيع والشراء", glCredit: "41411",
    terminology: { pos: "الصراف", customer: "العميل", item: "العملة", sale: "حوالة" },
    entities: [
      E("rem", "الحوالات", "swap", [F("sender", "المرسل", "text", undefined, false, true), F("receiver", "المستفيد", "text", undefined, false, true), F("amount", "المبلغ", "number", undefined, true), F("fee", "العمولة", "number", undefined, true)],
        [{ id: "RM-01", code: "RM-01", sender: "أحمد الشامي", receiver: "سالم الحضرمي", amount: 250000, fee: 2500, status: "مسلَّمة" }],
        "status", ["قيد الإرسال", "مسلَّمة", "ملغاة"], "amount"),
    ] },
  { id: "institutes", name: "المعاهد والمراكز التعليمية", icon: "file", color: "#8b5cf6", posMode: "retail", desc: "المتدربون، الدورات، والرسوم", glCredit: "41411",
    terminology: { pos: "التسجيل", customer: "المتدرب", item: "الدورة", sale: "تسجيل" },
    entities: [
      E("course", "الدورات", "file", [F("name", "الدورة", "text", undefined, false, true, true), F("trainer", "المدرب"), F("fee", "الرسوم", "number", undefined, true), F("seats", "المقاعد", "number")],
        [{ id: "CR-01", code: "CR-01", name: "دبلوم محاسبة", trainer: "أ. سمير", fee: 45000, seats: 30, status: "مفتوح" }, { id: "CR-02", code: "CR-02", name: "لغة إنجليزية IELTS", trainer: "أ. أمل", fee: 30000, seats: 25, status: "مكتمل" }],
        "status", ["مفتوح", "مكتمل", "ملغي"], "fee"),
    ] },
  { id: "schools", name: "المدارس", icon: "file", color: "#22c55e", posMode: "none", desc: "الطلاب، الصفوف، والمصروفات الدراسية", glCredit: "41411",
    terminology: { pos: "القبول", customer: "الطالب", item: "الصف", sale: "تسجيل طالب" },
    entities: [
      E("student", "الطلاب", "users", [F("name", "الطالب", "text", undefined, false, true, true), F("grade", "الصف", "select", ["أول", "ثاني", "ثالث", "رابع", "خامس", "سادس"]), F("fee", "الرسوم", "number", undefined, true), F("guardian", "ولي الأمر")],
        [{ id: "ST-01", code: "ST-01", name: "محمد أحمد", grade: "ثالث", fee: 85000, guardian: "أحمد محمد", status: "مسجَّل" }, { id: "ST-02", code: "ST-02", name: "سارة خالد", grade: "خامس", fee: 90000, guardian: "خالد سالم", status: "مسجَّل" }],
        "status", ["مسجَّل", "منسحب", "موقوف"], "fee"),
    ] },
  { id: "universities", name: "الجامعات", icon: "file", color: "#3b82f6", posMode: "none", desc: "الطلبة الجامعيون، التخصصات، والساعات المعتمدة", glCredit: "41411",
    terminology: { pos: "القبول والتسجيل", customer: "الطالب", item: "التخصص", sale: "تسجيل جامعي" },
    entities: [
      E("univ", "الطلبة الجامعيون", "users", [F("name", "الطالب", "text", undefined, false, true, true), F("major", "التخصص", "select", ["طب", "هندسة", "حاسب آلي", "إدارة أعمال"]), F("credits", "الساعات", "number"), F("fee", "الرسوم", "number", undefined, true)],
        [{ id: "UN-01", code: "UN-01", name: "عمر بامؤمن", major: "هندسة", credits: 18, fee: 350000, status: "منتظم" }],
        "status", ["منتظم", "مؤجل", "موقوف"], "fee"),
    ] },
  { id: "mobilefix", name: "صيانة الجولات", icon: "gear", color: "#f97316", posMode: "retail", desc: "أجهزة العملاء وأوامر الإصلاح", glCredit: "41411",
    terminology: { pos: "الاستقبال", customer: "العميل", item: "الجهاز", sale: "أمر صيانة" },
    entities: [
      E("fix", "أوامر الصيانة", "gear", [F("customer", "العميل", "text", undefined, false, true), F("device", "الجهاز", "text", undefined, false, true), F("issue", "العطل", "text", undefined, false, true, true), F("cost", "التكلفة", "number", undefined, true)],
        [{ id: "FX-01", code: "FX-01", customer: "طارق الوزير", device: "iPhone 14", issue: "تبديل شاشة", cost: 35000, status: "قيد الإصلاح" }],
        "status", ["قيد الإصلاح", "جاهز", "مسلَّم"], "cost"),
    ] },
  { id: "shares", name: "الأسهم والمساهمون", icon: "chart", color: "#6366f1", posMode: "none", desc: "المساهمون، الأسهم، وتوزيعات الأرباح", glCredit: "41411",
    terminology: { pos: "السجل", customer: "المساهم", item: "السهم", sale: "توزيع أرباح" },
    entities: [
      E("holder", "المساهمون", "chart", [F("name", "المساهم", "text", undefined, false, true, true), F("shares", "عدد الأسهم", "number", undefined, false, true), F("value", "القيمة", "number", undefined, true)],
        [{ id: "SH-01", code: "SH-01", name: "أروى المقطري", shares: 5000, value: 2500000, status: "نشط" }, { id: "SH-02", code: "SH-02", name: "سمير الحداد", shares: 3000, value: 1500000, status: "نشط" }],
        "status", ["نشط", "مجمَّد"], "value"),
    ] },
  { id: "halls", name: "الصالات والمناسبات", icon: "bld", color: "#ec4899", posMode: "restaurant", desc: "حجوزات الصالات والمناسبات", glCredit: "41411",
    terminology: { pos: "الحجوزات", customer: "العميل", item: "الصالة", sale: "حجز مناسبة" },
    entities: [
      E("hall", "حجوزات الصالات", "cal", [F("client", "العميل", "text", undefined, false, true), F("hall", "الصالة", "select", ["القاعة الكبرى", "قاعة الياسمين", "قاعة المرجان"]), F("date", "تاريخ المناسبة", "date", undefined, false, true), F("amount", "القيمة", "number", undefined, true)],
        [{ id: "HL-01", code: "HL-01", client: "أسرة الشامي", hall: "القاعة الكبرى", date: "2026-04-20", amount: 350000, status: "مؤكد" }],
        "status", ["مؤكد", "مبدئي", "ملغي", "منتهٍ"], "amount"),
    ] },
  { id: "archive", name: "الأرشفة", icon: "clip", color: "#64748b", posMode: "none", desc: "الوثائق والأرشفة الإلكترونية", glCredit: "41411",
    terminology: { pos: "الأرشيف", customer: "الجهة", item: "الوثيقة", sale: "توثيق" },
    entities: [
      E("doc", "الوثائق المؤرشفة", "clip", [F("title", "عنوان الوثيقة", "text", undefined, false, true, true), F("cat", "التصنيف", "select", ["عقود", "فواتير", "مراسلات", "قرارات"]), F("date", "التاريخ", "date"), F("ref", "المرجع")],
        [{ id: "DC-01", code: "DC-01", title: "عقد إيجار المقر", cat: "عقود", date: "2026-01-10", ref: "AR-2026-001", status: "مؤرشف" }],
        "status", ["مؤرشف", "قيد المراجعة", "منتهي"]),
    ] },
];

/* ── بيانات الموارد البشرية ── */
export const HR_EMPLOYEES: AnyR[] = [
  { id: "EMP-01", code: "EMP-01", name: "سمير الحداد", job: "محاسب رئيسي", dept: "المالية", branch: "BR-01", salary: 180000, phone: "777-111-001", join: "2022-03-01", status: "نشط" },
  { id: "EMP-02", code: "EMP-02", name: "عادل الحميري", job: "أمين مخزن", dept: "المخازن", branch: "BR-01", salary: 120000, phone: "733-222-002", join: "2023-06-15", status: "نشط" },
  { id: "EMP-03", code: "EMP-03", name: "هدى العامري", job: "مسؤولة مشتريات", dept: "المشتريات", branch: "BR-02", salary: 140000, phone: "711-333-003", join: "2023-01-10", status: "نشط" },
  { id: "EMP-04", code: "EMP-04", name: "طارق الوزير", job: "مسؤول مبيعات", dept: "المبيعات", branch: "BR-02", salary: 130000, phone: "770-444-004", join: "2024-02-20", status: "إجازة" },
  { id: "EMP-05", code: "EMP-05", name: "لمى العطاس", job: "صيدلانية", dept: "المبيعات", branch: "BR-02", salary: 160000, phone: "736-555-005", join: "2024-08-05", status: "نشط" },
];
export const HR_ATTENDANCE: AnyR[] = [
  { id: "AT-01", code: "AT-01", emp: "EMP-01", date: "2026-03-29", in: "07:55", out: "16:10", hours: 8.25, status: "حاضر" },
  { id: "AT-02", code: "AT-02", emp: "EMP-02", date: "2026-03-29", in: "08:15", out: "16:30", hours: 8.25, status: "حاضر" },
  { id: "AT-03", code: "AT-03", emp: "EMP-03", date: "2026-03-29", in: "09:05", out: "—", hours: 0, status: "متأخر" },
  { id: "AT-04", code: "AT-04", emp: "EMP-05", date: "2026-03-29", in: "07:50", out: "16:00", hours: 8.1, status: "حاضر" },
];
export const HR_REWARDS: AnyR[] = [
  { id: "RW-01", code: "RW-01", emp: "EMP-01", reason: "إنجاز الإقفال السنوي قبل الموعد", amount: 25000, date: "2026-02-10", status: "مصروفة" },
  { id: "RW-02", code: "RW-02", emp: "EMP-05", reason: "أفضل موظفة مبيعات — فبراير", amount: 15000, date: "2026-03-05", status: "معتمدة" },
];
export const HR_WARNINGS: AnyR[] = [
  { id: "WN-01", code: "WN-01", emp: "EMP-03", reason: "تكرار التأخر عن الدوام", level: "إنذار أول", date: "2026-03-29", status: "مسجَّل" },
];
export const HR_LEAVES: AnyR[] = [
  { id: "LV-01", code: "LV-01", emp: "EMP-04", from: "2026-03-25", to: "2026-04-02", days: 8, type: "سنوية", status: "معتمدة" },
  { id: "LV-02", code: "LV-02", emp: "EMP-02", from: "2026-04-10", to: "2026-04-11", days: 2, type: "طارئة", status: "بانتظار الموافقة" },
];

/* ── بيانات الأصول الثابتة ── */
export const ASSETS: AnyR[] = [
  { id: "FA-01", code: "FA-01", name: "جهاز أشعة رقمي", group: "معدات طبية", cost: 4500000, salvage: 500000, life: 10, purchase: "2024-01-15", location: "المستشفى — قسم الأشعة", status: "في الخدمة" },
  { id: "FA-02", code: "FA-02", name: "سيارة نقل مبردة", group: "وسائل نقل", cost: 2800000, salvage: 400000, life: 8, purchase: "2025-03-01", location: "المخزن الرئيسي", status: "في الخدمة" },
  { id: "FA-03", code: "FA-03", name: "مولد كهرباء 500KVA", group: "معدات", cost: 3200000, salvage: 300000, life: 12, purchase: "2023-06-10", location: "المقر الرئيسي", status: "في الخدمة" },
  { id: "FA-04", code: "FA-04", name: "أثاث مكتبي متكامل", group: "أثاث", cost: 600000, salvage: 60000, life: 5, purchase: "2025-09-20", location: "الإدارة العامة", status: "في الخدمة" },
];

/* ── رقم سري لصاحب النظام (شاشة تفعيل الأنظمة) ── */
export const OWNER_PIN = "1234";
