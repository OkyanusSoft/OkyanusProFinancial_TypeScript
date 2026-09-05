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
  cr: "اليمن — صنعاء",
  site: "https://okyanus-soft.com/",
};

export type AnyR = Record<string, any> & { id: string };

export interface Account { code: string; name: string; en: string; level: number; parent: string; type: "أصول" | "خصوم" | "إيرادات" | "مصروفات"; posting: boolean; analytical?: boolean }
/* سير حالة المستند: مسودة ← معتمد ← مرحّل ← ملغي */
export interface InvDoc { id: string; type: string; date: string; ref: string; warehouse: string; toWarehouse?: string; user: string; status: "مسودة" | "معتمد" | "مرحّل" | "ملغي"; lines: { item: string; qty: number; cost: number }[]; note?: string; subType?: string; partyKind?: "supplier" | "customer" | "cashbox"; party?: string; extRef?: string; clearAccount?: string; approvedBy?: string; postedBy?: string }
export interface Invoice { id: string; no: string; date: string; partner: string; payType: "نقدي" | "آجل"; currency: string; rate: number; costCenter: string; status: "مسودة" | "معتمدة" | "مرحّلة" | "ملغاة"; lines: { item: string; qty: number; price: number; disc: number }[]; vat: number; note?: string; paid?: number; approvedBy?: string; postedBy?: string }
export interface JournalLine { account: string; debit: number; credit: number; currency: string; rate: number; analytical?: string; costCenter?: string }
export interface Journal { id: string; no: string; date: string; desc: string; kind: "افتتاحي" | "يومية" | "قبض" | "صرف" | "طلب"; lines: JournalLine[]; user: string; status: "مرحّل" | "ملغي" | "بانتظار الموافقة" | "مسودة"; source?: string }

/* ── دليل الحسابات: 5 مستويات (نمط يمين سوفت التجاري) ──
   1-الأصول  2-الخصوم (تشمل حقوق الملكية)  3-المصروفات  4-الإيرادات */
export const ACCOUNTS: Account[] = [
  { code: "1", name: "الأصول", en: "Assets", level: 1, parent: "", type: "أصول", posting: false },
  { code: "11", name: "الأصول المتداولة", en: "Current Assets", level: 2, parent: "1", type: "أصول", posting: false },
  { code: "111", name: "النقدية والبنوك", en: "Cash & Banks", level: 3, parent: "11", type: "أصول", posting: false },
  { code: "1111", name: "الصناديق النقدية", en: "Cash Boxes", level: 4, parent: "111", type: "أصول", posting: false },
  { code: "11111", name: "الصندوق الرئيسي", en: "Main Cash Box", level: 5, parent: "1111", type: "أصول", posting: true },
  { code: "11112", name: "صندوق فرع عمران", en: "Amran Branch Box", level: 5, parent: "1111", type: "أصول", posting: true },
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
  { code: "11311", name: "المخزون الرئيسي — صنعاء", en: "Main Stock - Sanaa", level: 5, parent: "1131", type: "أصول", posting: true },
  { code: "11312", name: "مخزون فرع عمران", en: "Amran Branch Stock", level: 5, parent: "1131", type: "أصول", posting: true },
  { code: "11313", name: "مخزون فرع ذمار", en: "Dhamar Branch Stock", level: 5, parent: "1131", type: "أصول", posting: true },
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
  /* حسابات ربط المجموعات — تكلفة ومبيعات الأجهزة والمعدات */
  { code: "31512", name: "تكلفة مبيعات الأجهزة والمعدات", en: "Devices COGS", level: 5, parent: "3151", type: "مصروفات", posting: true },
  { code: "41113", name: "مبيعات الأجهزة والمعدات", en: "Devices Sales", level: 5, parent: "4111", type: "إيرادات", posting: true },
];

/* الحسابات التحليلية تبدأ من الصفر — تتحرك عبر قيود اليومية المرتبطة بها */
export const ANALYTICALS: AnyR[] = [
  { id: "AN-001", code: "AN-001", name: "أحمد محمد الشامي", linkedAccount: "11212", open: 0, debit: 0, credit: 0, phone: "777-102-334", note: "قسم الباطنية — غرفة 204" },
  { id: "AN-002", code: "AN-002", name: "سالم عبدالله الحضرمي", linkedAccount: "11212", open: 0, debit: 0, credit: 0, phone: "733-881-210", note: "قسم الجراحة — غرفة 118" },
  { id: "AN-003", code: "AN-003", name: "منى عوض السقاف", linkedAccount: "11212", open: 0, debit: 0, credit: 0, phone: "711-455-902", note: "قسم النساء — غرفة 305" },
  { id: "AN-004", code: "AN-004", name: "خالد سالم باوزير", linkedAccount: "11212", open: 0, debit: 0, credit: 0, phone: "770-233-481", note: "قسم الأطفال — غرفة 210" },
  { id: "AN-005", code: "AN-005", name: "فاطمة حسن العمودي", linkedAccount: "11212", open: 0, debit: 0, credit: 0, phone: "736-604-118", note: "قسم العيون — غرفة 122" },
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

/* كل مجموعة مرتبطة بثلاثة حسابات في الدليل المحاسبي (نمط الأنظمة القوية):
   stockAccount: يُستخدم في قيود التوريد والمشتريات (مخزون المجموعة)
   cogsAccount : يُستخدم في قيود الصرف والجرد والتكلفة عند البيع
   salesAccount: يُستخدم في قيود إيرادات المبيعات والمرتجعات                    */
export const GROUPS: AnyR[] = [
  { id: "GR-01", code: "GR-01", name: "مضادات حيوية", note: "تتطلب وصفة طبية", stockAccount: "11311", cogsAccount: "31511", salesAccount: "41111" },
  { id: "GR-02", code: "GR-02", name: "مسكنات وخافضات حرارة", note: "الأعلى دوراناً", stockAccount: "11311", cogsAccount: "31511", salesAccount: "41111" },
  { id: "GR-03", code: "GR-03", name: "فيتامينات ومكملات", note: "", stockAccount: "11311", cogsAccount: "31511", salesAccount: "41111" },
  { id: "GR-04", code: "GR-04", name: "مستلزمات طبية", note: "استهلاكية", stockAccount: "11311", cogsAccount: "31511", salesAccount: "41111" },
  { id: "GR-05", code: "GR-05", name: "محاليل وحقن", note: "تخزين بارد", stockAccount: "11311", cogsAccount: "31511", salesAccount: "41111" },
  { id: "GR-06", code: "GR-06", name: "أجهزة قياس", note: "أصول دورانية — حسابات مستقلة للتكلفة والمبيعات", stockAccount: "11311", cogsAccount: "31512", salesAccount: "41113" },
];

export const WAREHOUSES: AnyR[] = [
  { id: "WH-01", code: "WH-01", name: "المخزن الرئيسي — صنعاء", keeper: "عادل الحميري", location: "حزيز، المنطقة الصناعية", capacity: "12,000 موقع", active: true, account: "11311" },
  { id: "WH-02", code: "WH-02", name: "مخزن الفرع — عمران", keeper: "سميرة النجار", location: "عمران، الشارع العام", capacity: "4,500 موقع", active: true, account: "11312" },
  { id: "WH-03", code: "WH-03", name: "مخزن الفرع — ذمار", keeper: "فهد باشراحيل", location: "ذمار، شارع صنعاء", capacity: "2,200 موقع", active: true, account: "11313" },
];

/* الكميات تبدأ من الصفر — تدخل عبر سند قيد افتتاحي مخزني أو سند توريد */
export const ITEMS: AnyR[] = [
  { id: "IT-1001", code: "IT-1001", name: "باراسيتامول 500mg أقراص", group: "GR-02", unit: "UN-02", barcode: "6210001001", cost: 850, price: 1150, min: 200, max: 2000, qty: {} },
  { id: "IT-1002", code: "IT-1002", name: "أموكسيسيلين 500mg كبسول", group: "GR-01", unit: "UN-02", barcode: "6210001002", cost: 1450, price: 1980, min: 150, max: 1500, qty: {} },
  { id: "IT-1003", code: "IT-1003", name: "فيتامين C + زنك فوار", group: "GR-03", unit: "UN-02", barcode: "6210001003", cost: 1100, price: 1500, min: 100, max: 900, qty: {} },
  { id: "IT-1004", code: "IT-1004", name: "سيفترياكسون 1g حقن", group: "GR-05", unit: "UN-06", barcode: "6210001004", cost: 2200, price: 2950, min: 300, max: 2500, qty: {} },
  { id: "IT-1005", code: "IT-1005", name: "محلول نورمال سالين 500ml", group: "GR-05", unit: "UN-01", barcode: "6210001005", cost: 620, price: 890, min: 400, max: 3000, qty: {} },
  { id: "IT-1006", code: "IT-1006", name: "جهاز قياس ضغط رقمي", group: "GR-06", unit: "UN-01", barcode: "6210001006", cost: 18500, price: 24900, min: 20, max: 150, qty: {} },
  { id: "IT-1007", code: "IT-1007", name: "قفازات طبية معقمة (100)", group: "GR-04", unit: "UN-02", barcode: "6210001007", cost: 1900, price: 2600, min: 250, max: 2200, qty: {} },
  { id: "IT-1008", code: "IT-1008", name: "أوميغا 3 كبسولات 1000mg", group: "GR-03", unit: "UN-02", barcode: "6210001008", cost: 3400, price: 4500, min: 80, max: 700, qty: {} },
  { id: "IT-1009", code: "IT-1009", name: "أنسولين مخلوط 100IU", group: "GR-05", unit: "UN-06", barcode: "6210001009", cost: 5600, price: 7200, min: 120, max: 800, qty: {} },
  { id: "IT-1010", code: "IT-1010", name: "جهاز قياس سكر + شرائط", group: "GR-06", unit: "UN-01", barcode: "6210001010", cost: 14200, price: 19400, min: 25, max: 180, qty: {} },
];

/* الأرصدة تبدأ من الصفر — تتكون عبر فواتير المشتريات والسداد */
export const SUPPLIERS: AnyR[] = [
  { id: "SP-01", code: "SP-01", name: "شركة الدواء الحديث المتحدة", phone: "01-448-210", city: "صنعاء", category: "أدوية", balance: 0, account: "21111", creditDays: 45, active: true },
  { id: "SP-02", code: "SP-02", name: "مؤسسة الخليج للمستلزمات الطبية", phone: "02-331-908", city: "عدن", category: "مستلزمات", balance: 0, account: "21111", creditDays: 30, active: true },
  { id: "SP-03", code: "SP-03", name: "شركة ميديكال بلس للتجهيزات", phone: "05-662-774", city: "المكلا", category: "أجهزة", balance: 0, account: "21111", creditDays: 60, active: true },
  { id: "SP-04", code: "SP-04", name: "مختبرات فارما كير", phone: "01-220-315", city: "صنعاء", category: "تحاليل", balance: 0, account: "21111", creditDays: 30, active: true },
];

/* الأرصدة تبدأ من الصفر — تتكون عبر فواتير المبيعات الآجلة والتحصيل */
export const CUSTOMERS: AnyR[] = [
  { id: "CU-01", code: "CU-01", name: "مستشفى النور التخصصي", phone: "01-505-100", city: "صنعاء", category: "مستشفيات", balance: 0, creditLimit: 500000, account: "11211", active: true },
  { id: "CU-02", code: "CU-02", name: "صيدلية الشفاء المركزية", phone: "02-244-871", city: "عدن", category: "صيدليات", balance: 0, creditLimit: 150000, account: "11211", active: true },
  { id: "CU-03", code: "CU-03", name: "مؤسسة الصحة للجميع", phone: "05-310-226", city: "المكلا", category: "منظمات", balance: 0, creditLimit: 200000, account: "11211", active: true },
  { id: "CU-04", code: "CU-04", name: "مجمع الريان الطبي", phone: "01-617-402", city: "تعز", category: "مجمعات", balance: 0, creditLimit: 120000, account: "11211", active: true },
  { id: "CU-05", code: "CU-05", name: "صيدلية ابن سينا", phone: "02-883-519", city: "عدن", category: "صيدليات", balance: 0, creditLimit: 200000, account: "11211", active: true },
];

/* الأرصدة الافتتاحية صفر — تدخل عبر سند قيد افتتاحي مالي أو سند قبض */
export const CASHBOXES: AnyR[] = [
  { id: "CB-01", code: "CB-01", name: "الصندوق الرئيسي", currency: "YER", open: 0, keeper: "عادل الحميري", account: "11111", active: true },
  { id: "CB-02", code: "CB-02", name: "صندوق فرع عمران", currency: "YER", open: 0, keeper: "إبراهيم المنصور", account: "11112", active: true },
  { id: "CB-03", code: "CB-03", name: "صندوق النقد الأجنبي", currency: "USD", open: 0, keeper: "سمير الحداد", account: "11121", active: true },
];

export const COST_CENTERS: AnyR[] = [
  { id: "CC-01", code: "CC-01", name: "الإدارة العامة", parent: "", manager: "م.وائل الشرفي" },
  { id: "CC-02", code: "CC-02", name: "فرع عمران", parent: "", manager: "إبراهيم المنصور" },
  { id: "CC-03", code: "CC-03", name: "فرع ذمار", parent: "", manager: "عبدالقادر الكحلاني" },
  { id: "CC-011", code: "CC-011", name: "قسم المشتريات", parent: "CC-01", manager: "أ. هدى العامري" },
  { id: "CC-012", code: "CC-012", name: "قسم المبيعات", parent: "CC-01", manager: "أ. طارق الوزير" },
  { id: "CC-021", code: "CC-021", name: "صيدلية الفرع", parent: "CC-02", manager: "د. لمى العطاس" },
];

export const BRANCHES: AnyR[] = [
  { id: "BR-01", code: "BR-01", name: "المركز الرئيسي — صنعاء", manager: "م.وائل الشرفي", phone: "01-448-210", main: true },
  { id: "BR-02", code: "BR-02", name: "فرع عمران", manager: "إبراهيم المنصور", phone: "07-331-908", main: false },
  { id: "BR-03", code: "BR-03", name: "فرع ذمار", manager: "عبدالقادر الكحلاني", phone: "06-662-774", main: false },
];

/* الإدارات — كيانات إدارية عليا في الهيكل التنظيمي (تُدار من الموارد البشرية) */
export const DEPARTMENTS: AnyR[] = [
  { id: "DP-01", code: "DP-01", name: "الإدارة المالية", head: "سمير الحداد" },
  { id: "DP-02", code: "DP-02", name: "إدارة المشتريات", head: "هدى العامري" },
  { id: "DP-03", code: "DP-03", name: "إدارة المبيعات", head: "طارق الوزير" },
  { id: "DP-04", code: "DP-04", name: "إدارة المخازن", head: "عادل الحميري" },
  { id: "DP-05", code: "DP-05", name: "إدارة الموارد البشرية", head: "أ. أمل الشرعبي" },
];

/* سجل الشركات — قائمة الشركات المتاحة في شاشة تسجيل الدخول (تُدار من الإعدادات ← الشركات والفروع) */
export const COMPANIES: AnyR[] = [
  { id: "CO-01", code: "CO-01", name: "شركة أوكيانوس للتجارة والاستثمار", en: "Okyanus Trading & Investment", active: true },
];

/* الأقسام — وحدات فرعية مرتبطة بالإدارات (تُدار من الموارد البشرية) */
export const SECTIONS: AnyR[] = [
  { id: "SC-01", code: "SC-01", name: "قسم الحسابات العامة", dept: "DP-01", head: "نجوى الكمالي" },
  { id: "SC-02", code: "SC-02", name: "قسم الخزينة والصناديق", dept: "DP-01", head: "عمر صالح" },
  { id: "SC-03", code: "SC-03", name: "قسم التوريدات", dept: "DP-02", head: "فهد باشراحيل" },
  { id: "SC-04", code: "SC-04", name: "قسم المبيعات المحلية", dept: "DP-03", head: "لمى العطاس" },
  { id: "SC-05", code: "SC-05", name: "قسم المخزن الرئيسي", dept: "DP-04", head: "عادل الحميري" },
  { id: "SC-06", code: "SC-06", name: "قسم شؤون الموظفين", dept: "DP-05", head: "أمل الشرعبي" },
];

/* مستخدم واحد فقط — مدير النظام، لبدء إدخال البيانات الحقيقية */
export const USERS: AnyR[] = [
  { id: "U-01", code: "U-01", name: "م.وائل الشرفي", username: "admin", role: "مدير النظام", branch: "BR-01", active: true, lastLogin: "" },
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

/* السندات المخزنية فارغة — تبدأ من سند قيد افتتاحي مخزني */
export const INV_DOCS: InvDoc[] = [];

/* فواتير المشتريات فارغة */
export const PURCHASES: Invoice[] = [];

/* فواتير المبيعات والمرتجعات وعروض الأسعار وطلبات الشراء — فارغة */
export const SALES: Invoice[] = [];
export const RETURNS: Invoice[] = [];
export const QUOTES: AnyR[] = [];
export const REQUESTS: AnyR[] = [];

/* قيود اليومية فارغة — ميزان المراجعة يبدأ من الصفر، ويُبنى عبر سند قيد افتتاحي مالي ثم قيود اليومية */
export const JOURNALS: Journal[] = [];

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
  hr: { label: "الموارد البشرية", screens: [{ id: "org", label: "الهيكل الإداري والتنظيمي" }, { id: "emp", label: "ملفات الموظفين" }, { id: "att", label: "الحضور والانصراف" }, { id: "rw", label: "المكافآت والإنذارات" }, { id: "leave", label: "الإجازات والأذونات" }, { id: "pay", label: "كشوف الرواتب المرحّلة" }] },
  ast: { label: "الأصول الثابتة", screens: [{ id: "reg", label: "سجل الأصول" }, { id: "dep", label: "الإهلاك بالقسط الثابت" }, { id: "rep", label: "تقارير الأصول" }] },
  adm: { label: "إدارة النظام", screens: [{ id: "users", label: "المستخدمون والصلاحيات" }, { id: "appr", label: "الاعتمادات وسير حالة المستندات" }, { id: "act", label: "تفعيل الأنظمة والأنشطة (مالك)" }, { id: "mon", label: "مراقبة النشاط والأجهزة" }, { id: "set", label: "الإعدادات العامة وقاعدة البيانات" }, { id: "co", label: "الشركات والفروع" }, { id: "prefs", label: "التفضيلات" }] },
  help: { label: "المساعدة", screens: [{ id: "guide", label: "دليل المستخدم ووثائق المطورين" }] },
};

export const REPORTS: { id: string; name: string; module: string }[] = [
  { id: "rep-inv-bal", name: "أرصدة المخازن", module: "inv" },
  { id: "rep-inv-move", name: "حركة الأصناف", module: "inv" },
  { id: "rep-inv-card", name: "بطاقة صنف", module: "inv" },
  { id: "rep-inv-watch", name: "مراقبة المخزون", module: "inv" },
  { id: "rep-inv-count", name: "جرد المخزون", module: "inv" },
  { id: "rep-inv-journal", name: "سجل حركة السندات", module: "inv" },
  { id: "rep-inv-valuation", name: "تقييم المخزون", module: "inv" },
  { id: "rep-inv-reorder", name: "اقتراحات إعادة الطلب", module: "inv" },
  { id: "rep-inv-transfers", name: "سجل التحويلات بين المخازن", module: "inv" },
  { id: "rep-inv-slow", name: "الأصناف الراكدة", module: "inv" },
  { id: "rep-pur", name: "تقارير المشتريات", module: "pur" },
  { id: "rep-sal", name: "تقارير المبيعات (يومي/شهري/سنوي)", module: "sal" },
  { id: "rep-gl-stmt", name: "كشف حساب", module: "gl" },
  { id: "rep-gl-trial", name: "ميزان المراجعة", module: "gl" },
  { id: "rep-gl-bs", name: "الميزانية العمومية", module: "gl" },
  { id: "rep-gl-pl", name: "الأرباح والخسائر", module: "gl" },
  { id: "rep-gl-journal", name: "حركة القيود المحاسبية", module: "gl" },
  { id: "rep-gl-coa", name: "دليل الحسابات", module: "gl" },
  { id: "rep-hr-pay", name: "كشف الرواتب الشهري", module: "hr" },
  { id: "rep-hr-att", name: "تقرير الحضور والانصراف", module: "hr" },
  { id: "rep-ast-reg", name: "سجل الأصول الثابتة", module: "ast" },
  { id: "rep-ast-dep", name: "جدول الإهلاك السنوي", module: "ast" },
];
export const REPORT_ACTIONS = ["عرض", "Excel", "PDF", "طباعة"];
/* الصلاحيات الرسمية الثمانية على مستوى الأزرار + إلغاء بأثر عكسي */
export const BUTTON_ACTIONS = ["إضافة", "تعديل", "بحث", "حذف", "استعراض", "طباعة", "اعتماد", "ترحيل", "إلغاء ترحيل", "إلغاء"];

export const SIDEBAR_BGS = [
  { id: "ocean", name: "أعماق المحيط", style: "linear-gradient(168deg,#05263d,#0a5c8f)" },
  { id: "abyss", name: "الليل القطبي", style: "linear-gradient(168deg,#060b16,#0f3050)" },
  { id: "royal", name: "النيلي الملكي", style: "linear-gradient(168deg,#171a45,#3d35b4)" },
  { id: "dune", name: "الرمال الذهبية", style: "linear-gradient(168deg,#241a08,#7a5a17)" },
  { id: "emerald", name: "الزمردي", style: "linear-gradient(168deg,#04281f,#0e6e52)" },
  { id: "crimson", name: "القرمزي", style: "linear-gradient(168deg,#2b0a12,#8a2340)" },
  /* ── الأنماط الفاخرة ── */
  { id: "sapphire", name: "الياقوتي الليلي", style: "linear-gradient(172deg,#0a1128 0%,#16305c 52%,#27618f 100%)" },
  { id: "malachite", name: "الزبرجد الملكي", style: "linear-gradient(172deg,#02201a 0%,#0a4a3c 55%,#12805f 100%)" },
  { id: "burgundy", name: "البورغندي الأرستقراطي", style: "linear-gradient(172deg,#1c0812 0%,#4e1330 55%,#82264c 100%)" },
  { id: "violet", name: "البنفسجي العميق", style: "linear-gradient(172deg,#140a2b 0%,#391a6e 55%,#5c33a8 100%)" },
  { id: "bronze", name: "البرونزي الفحمي", style: "linear-gradient(172deg,#0d0b09 0%,#292019 55%,#5a4526 100%)" },
];

/* قوالب الاستيراد (عينة CSV لكل دليل) */
export const IMPORT_SAMPLES: Record<string, { headers: string[]; rows: string[][] }> = {
  units: { headers: ["الاسم", "الرمز"], rows: [["دستة", "دستة"], ["جرام", "جرام"]] },
  groups: { headers: ["الكود", "اسم المجموعة", "حساب المخزون", "حساب تكلفة المبيعات", "حساب الإيراد", "ملاحظات"], rows: [["GR-07", "أدوية أطفال", "11311", "31511", "41111", "جرعات خاصة"], ["GR-08", "مضادات التهاب", "11311", "31511", "41111", ""]] },
  warehouses: { headers: ["الاسم", "الأمين", "الحساب", "الموقع", "السعة"], rows: [["مخزن الطوارئ", "أمن المخازن", "11311", "بدروم المقر", "800 موقع"]] },
  items: { headers: ["الاسم", "المجموعة", "الوحدة", "التكلفة", "السعر", "أدنى", "أقصى"], rows: [["أسبرين 81mg", "GR-02", "UN-02", "450", "650", "300", "2500"]] },
  suppliers: { headers: ["الاسم", "الهاتف", "المدينة", "التصنيف"], rows: [["شركة الأدوية الوطنية", "01-200-100", "صنعاء", "أدوية"]] },
  customers: { headers: ["الاسم", "الهاتف", "المدينة", "التصنيف", "حد الائتمان"], rows: [["صيدلية الأمل", "02-118-305", "عدن", "صيدليات", "100000"]] },
  cashboxes: { headers: ["الاسم", "العملة", "رصيد افتتاحي", "الأمين", "الحساب"], rows: [["صندوق المقصف", "YER", "15000", "محاسب الفرع", "11111"]] },
  costCenters: { headers: ["الاسم", "مركز أب", "المسؤول"], rows: [["قسم المحاسبة", "CC-01", "سمير الحداد"]] },
  companies: { headers: ["الاسم", "الاسم اللاتيني"], rows: [["مجموعة المحيط الطبية", "Ocean Medical Group"]] },
  branches: { headers: ["الاسم", "المدير", "الهاتف"], rows: [["فرع تعز", "أ. صلاح الحمادي", "04-556-120"]] },
  departments: { headers: ["الاسم", "الرئيس"], rows: [["إدارة تقنية المعلومات", "م. خالد باصهيب"]] },
  sections: { headers: ["الاسم", "الإدارة", "الرئيس"], rows: [["قسم الدعم الفني", "DP-06", "م. سالم بامؤمن"]] },
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
  [6.1 * 60, 3, "تحويل مخزني TR-0007 — من الرئيسي إلى فرع عمران", "create"],
  [5.6 * 60, 2, "قيد إيجار المقر الرئيسي — الربع الأول", "create"],
  [5.0 * 60, 1, "فاتورة مبيعات SIN-2026-0245 (آجل) — ابن سينا", "create"],
  [4.4 * 60, 4, "عروض أسعار شراء PQ-2026-0022 — ميديكال بلس", "create"],
  [3.9 * 60, 2, "قسط استهلاك المعدات الطبية — مارس", "create"],
  [3.3 * 60, 0, "فاتورة نقاط البيع PV-2026-0242 (نقدي)", "create"],
  [2.8 * 60, 5, "مسير رواتب — مراجعة الحضور والانصراف", "update"],
  [2.2 * 60, 3, "جرد دوري JC-0001 — مخزن فرع عمران", "create"],
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
/* حركات الموارد البشرية فارغة — تبدأ بإدخال الحضور والمكافآت والإنذارات والإجازات فعلياً */
export const HR_ATTENDANCE: AnyR[] = [];
export const HR_REWARDS: AnyR[] = [];
export const HR_WARNINGS: AnyR[] = [];
export const HR_LEAVES: AnyR[] = [];

/* ── بيانات الأصول الثابتة ── */
export const ASSETS: AnyR[] = [
  { id: "FA-01", code: "FA-01", name: "جهاز أشعة رقمي", group: "معدات طبية", cost: 4500000, salvage: 500000, life: 10, purchase: "2024-01-15", location: "المستشفى — قسم الأشعة", status: "في الخدمة" },
  { id: "FA-02", code: "FA-02", name: "سيارة نقل مبردة", group: "وسائل نقل", cost: 2800000, salvage: 400000, life: 8, purchase: "2025-03-01", location: "المخزن الرئيسي", status: "في الخدمة" },
  { id: "FA-03", code: "FA-03", name: "مولد كهرباء 500KVA", group: "معدات", cost: 3200000, salvage: 300000, life: 12, purchase: "2023-06-10", location: "المقر الرئيسي", status: "في الخدمة" },
  { id: "FA-04", code: "FA-04", name: "أثاث مكتبي متكامل", group: "أثاث", cost: 600000, salvage: 60000, life: 5, purchase: "2025-09-20", location: "الإدارة العامة", status: "في الخدمة" },
];

/* ── كتالوج شاشات الوصول السريع (المفضلات) ── */
export const QUICK_CATALOG: { module: string; path: string; label: string; icon: string; group: string }[] = [
  { module: "dashboard", path: "", label: "لوحة التحكم", icon: "dash", group: "عام" },
  { module: "inv", path: "base.items", label: "دليل الأصناف", icon: "box", group: "المخازن" },
  { module: "inv", path: "base.wh", label: "دليل المخازن", icon: "bld", group: "المخازن" },
  { module: "inv", path: "base.groups", label: "دليل المجموعات", icon: "layers", group: "المخازن" },
  { module: "inv", path: "mv.open", label: "سند قيد افتتاحي مخزني", icon: "cal", group: "المخازن" },
  { module: "inv", path: "mv.grn", label: "سند توريد مخزني", icon: "down", group: "المخازن" },
  { module: "inv", path: "mv.iss", label: "سند صرف مخزني", icon: "wallet", group: "المخازن" },
  { module: "inv", path: "mv.tr", label: "سند تحويل مخزني", icon: "swap", group: "المخازن" },
  { module: "inv", path: "mv.count", label: "جرد مخزني", icon: "clip", group: "المخازن" },
  { module: "inv", path: "rep.bal", label: "أرصدة المخازن", icon: "bld", group: "المخازن" },
  { module: "inv", path: "rep.card", label: "بطاقة صنف", icon: "receipt", group: "المخازن" },
  { module: "inv", path: "rep.watch", label: "مراقبة المخزون", icon: "eye", group: "المخازن" },
  { module: "inv", path: "rep.valuation", label: "تقييم المخزون", icon: "coins", group: "المخازن" },
  { module: "pur", path: "base.sup", label: "إدارة الموردين", icon: "users", group: "المشتريات" },
  { module: "pur", path: "mv.req", label: "طلبات الشراء", icon: "clip", group: "المشتريات" },
  { module: "pur", path: "mv.quote", label: "عروض أسعار الموردين", icon: "file", group: "المشتريات" },
  { module: "pur", path: "mv.inv", label: "فواتير المشتريات", icon: "receipt", group: "المشتريات" },
  { module: "pur", path: "mv.credit", label: "فواتير المشتريات الآجل", icon: "wallet", group: "المشتريات" },
  { module: "pur", path: "rep.rep", label: "تقارير المشتريات", icon: "chart", group: "المشتريات" },
  { module: "sal", path: "base.cus", label: "إدارة العملاء", icon: "users", group: "المبيعات" },
  { module: "sal", path: "mv.quote", label: "عروض أسعار العملاء", icon: "file", group: "المبيعات" },
  { module: "sal", path: "mv.inv", label: "فواتير المبيعات", icon: "tag", group: "المبيعات" },
  { module: "sal", path: "mv.ret", label: "مرتجعات المبيعات", icon: "undo", group: "المبيعات" },
  { module: "sal", path: "rep.rep", label: "تقارير المبيعات", icon: "chart", group: "المبيعات" },
  { module: "pos", path: "", label: "نقاط البيع", icon: "coins", group: "نقاط البيع" },
  { module: "gl", path: "mv.je", label: "سند قيد يومية", icon: "book", group: "الحسابات" },
  { module: "gl", path: "mv.rc", label: "سند قبض", icon: "down", group: "الحسابات" },
  { module: "gl", path: "mv.pv", label: "سند صرف", icon: "wallet", group: "الحسابات" },
  { module: "gl", path: "rep.trial", label: "ميزان المراجعة", icon: "scale", group: "الحسابات" },
  { module: "gl", path: "rep.stmt", label: "كشف حساب", icon: "file", group: "الحسابات" },
  { module: "gl", path: "rep.bs", label: "الميزانية العمومية", icon: "bld", group: "الحسابات" },
  { module: "gl", path: "rep.pl", label: "الأرباح والخسائر", icon: "chart", group: "الحسابات" },
  { module: "hr", path: "emp", label: "ملفات الموظفين", icon: "users", group: "الموارد البشرية" },
  { module: "hr", path: "att", label: "الحضور والانصراف", icon: "clock", group: "الموارد البشرية" },
  { module: "hr", path: "pay", label: "كشوف الرواتب", icon: "wallet", group: "الموارد البشرية" },
  { module: "ast", path: "reg", label: "سجل الأصول الثابتة", icon: "bld", group: "الأصول" },
  { module: "ast", path: "dep", label: "الإهلاك بالقسط الثابت", icon: "scale", group: "الأصول" },
  { module: "adm", path: "monitor", label: "مراقبة النشاط", icon: "pulse", group: "إدارة النظام" },
  { module: "adm", path: "activation", label: "تفعيل الأنظمة والأنشطة", icon: "gear", group: "إدارة النظام" },
  { module: "help", path: "", label: "دليل المستخدم", icon: "life", group: "المساعدة" },
];

/* ── رقم سري لصاحب النظام (شاشة تفعيل الأنظمة) ── */
export const OWNER_PIN = "1234";
