import { useMemo, useState } from "react";
import { useApp } from "../store";
import { I, Empty } from "../ui";

interface CartLine { item: string; name: string; qty: number; price: number }

export default function POS() {
  const app = useApp();
  /* النمط يتحول تلقائياً: تفعيل نظام المطاعم ← مطاعم وطاولات، تعطيله ← سوبر ماركت وتجزئة */
  const restOn = app.activeSystems.includes("restaurants");
  const act = restOn
    ? app.activities.find((a) => a.id === "restaurants")
    : app.activities.find((a) => a.id === app.primaryActivity && a.id !== "restaurants") || app.activities.find((a) => a.id === app.primaryActivity);
  const mode = restOn ? "restaurant" : "retail";
  const term = act?.terminology;
  const vatRate = app.settings.vat;

  return (
    <div className="anim-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: `linear-gradient(135deg, ${act?.color || "var(--brand)"}, var(--brand2))` }}>
            <I n={mode === "restaurant" ? "bld" : "tag"} size={23} />
          </span>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight">نظام نقاط البيع — {mode === "restaurant" ? "مطاعم وطاولات" : "سوبر ماركت ومتاجر تجزئة"}</h1>
            <p className="text-mute text-[0.82rem] font-medium mt-0.5">
              نمط متكيف تلقائياً مع النشاط الأساسي «{act?.name || "—"}» — بيع فوري يخصم المخزون ويرحّل قيداً متوازناً
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)]">النشاط: {act?.name}</span>
          <span className="chip bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
            <I n="swap" size={11} /> {restOn ? "المطاعم مفعّل ← نمط الطاولات" : "المطاعم معطّل ← نمط التجزئة"}
          </span>
        </div>
      </div>
      {mode === "restaurant" ? <RestaurantPOS /> : <RetailPOS />}
    </div>
  );
}

function usePosCart() {
  const app = useApp();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [pay, setPay] = useState<"cash" | "card">("cash");
  const [done, setDone] = useState<string | null>(null);
  const vatRate = app.settings.vat;
  const subtotal = cart.reduce((a, l) => a + l.qty * l.price, 0);
  const vat = subtotal * (vatRate / 100);
  const total = subtotal + vat;
  const add = (item: string, name: string, price: number) => {
    setCart((old) => {
      const i = old.findIndex((l) => l.item === item);
      return i >= 0 ? old.map((l, j) => (j === i ? { ...l, qty: l.qty + 1 } : l)) : [...old, { item, name, qty: 1, price }];
    });
    setDone(null);
  };
  const setQty = (i: number, q: number) => setCart((old) => q <= 0 ? old.filter((_, j) => j !== i) : old.map((l, j) => (j === i ? { ...l, qty: q } : l)));
  const checkout = () => {
    const res = app.posSale(cart.map((l) => ({ item: l.item, qty: l.qty, price: l.price })), pay);
    if (res.ok) { setDone(res.msg); setCart([]); }
    else app.toast(res.msg, "err");
  };
  return { app, cart, setCart, pay, setPay, done, vatRate, subtotal, vat, total, add, setQty, checkout };
}

function CartPanel({ c, itemLabel, saleLabel }: { c: ReturnType<typeof usePosCart>; itemLabel: string; saleLabel: string }) {
  return (
    <div className="card p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-base flex items-center gap-2"><I n="receipt" size={18} className="text-[var(--brand)]" /> {saleLabel}</h3>
        <span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)]">{c.cart.length} {itemLabel}</span>
      </div>
      <div className="flex-1 overflow-auto space-y-2 min-h-[120px] max-h-[300px]">
        {c.cart.length === 0 ? <Empty msg="لم تُضف أصناف بعد — اختر من القائمة" /> : c.cart.map((l, i) => (
          <div key={l.item} className="flex items-center gap-2 p-2.5 rounded-xl bg-panel border border-line/70">
            <div className="flex-1 min-w-0"><div className="text-[0.8rem] font-bold truncate">{l.name}</div><div className="font-num text-[0.66rem] text-mute">{c.app.fmtN(l.price)} × {l.qty}</div></div>
            <div className="flex items-center gap-1">
              <button className="w-6 h-6 grid place-items-center rounded-md bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)] hover:opacity-80" onClick={() => c.setQty(i, l.qty - 1)}>−</button>
              <span className="font-num font-bold text-[0.8rem] w-6 text-center">{l.qty}</span>
              <button className="w-6 h-6 grid place-items-center rounded-md bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)] hover:opacity-80" onClick={() => c.setQty(i, l.qty + 1)}>+</button>
            </div>
            <span className="font-num font-bold text-[0.82rem] w-20 text-end">{c.app.fmtN(l.qty * l.price)}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-line space-y-1.5">
        <div className="flex justify-between text-[0.78rem] font-bold text-soft"><span>الإجمالي الفرعي</span><span className="font-num">{c.app.fmtN(c.subtotal)}</span></div>
        <div className="flex justify-between text-[0.78rem] font-bold text-soft"><span>ضريبة ({c.vatRate}%)</span><span className="font-num">{c.app.fmtN(c.vat)}</span></div>
        <div className="flex justify-between text-[1.05rem] font-display font-bold"><span>الإجمالي</span><span className="font-num text-[var(--brand)]">{c.app.fmtN(c.total)} ر.ي</span></div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {([["cash", "نقدي", "coins"], ["card", "بطاقة", "wallet"]] as const).map(([v, l, ic]) => (
          <button key={v} onClick={() => c.setPay(v)} className={`py-2.5 rounded-xl text-[0.82rem] font-bold flex items-center justify-center gap-2 transition-all border ${c.pay === v ? "text-[var(--brandink)] border-transparent shadow-lg" : "bg-surface border-line text-mute hover:text-ink"}`}
            style={c.pay === v ? { background: "linear-gradient(135deg, var(--brand), var(--brand2))" } : undefined}>
            <I n={ic} size={16} /> {l}
          </button>
        ))}
      </div>
      <button className="btn btn-brand w-full mt-2.5 !py-3 !text-[0.95rem]" onClick={c.checkout} disabled={c.cart.length === 0}>
        <I n="check" size={18} /> إتمام البيع وترحيل القيد
      </button>
      {c.done && <div className="mt-2 p-2.5 rounded-xl bg-[color-mix(in_srgb,var(--good)_10%,transparent)] border border-[color-mix(in_srgb,var(--good)_30%,transparent)] text-[0.78rem] font-bold text-[var(--good)] flex items-center gap-2"><I n="check" size={15} /> تم البيع {c.done} وخصم المخزون</div>}
    </div>
  );
}

function RetailPOS() {
  const c = usePosCart();
  const [q, setQ] = useState("");
  const items = c.app.db.items.filter((i: any) => !q || i.name.includes(q) || String(i.code).includes(q));
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 card p-4">
        <div className="relative w-full max-w-sm mb-3.5">
          <I n="search" size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-mute" />
          <input className="input !ps-9" placeholder="بحث فوري بالاسم أو الباركود…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 overflow-auto max-h-[520px]">
          {items.map((it: any) => {
            const qty = c.app.itemQty(it.id);
            const out = qty <= 0;
            return (
              <button key={it.id} disabled={out} onClick={() => c.add(it.id, it.name, it.price)}
                className={`card card-lift p-3 text-start relative overflow-hidden ${out ? "opacity-45 pointer-events-none" : ""}`}>
                <span className="absolute top-2 end-2 chip !text-[0.58rem] !py-0 font-num" style={{ background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)" }} dir="ltr">{qty}</span>
                <span className="w-9 h-9 rounded-lg grid place-items-center bg-[color-mix(in_srgb,var(--brand)_11%,transparent)] text-[var(--brand)] mb-2"><I n="box" size={17} /></span>
                <div className="text-[0.78rem] font-bold leading-5 line-clamp-2 min-h-[40px]">{it.name}</div>
                <div className="font-num font-bold text-[0.85rem] text-[var(--brand)] mt-1">{c.app.fmtN(it.price)} <span className="text-[0.62rem] text-mute">ر.ي</span></div>
                {out && <span className="absolute inset-x-0 bottom-0 py-0.5 text-center text-[0.62rem] font-bold bg-[var(--bad)] text-white">نفد</span>}
              </button>
            );
          })}
        </div>
      </div>
      <CartPanel c={c} itemLabel="صنف" saleLabel="فاتورة البيع" />
    </div>
  );
}

function RestaurantPOS() {
  const c = usePosCart();
  const [table, setTable] = useState<string | null>(null);
  const menu = c.app.specData["restaurants:menu"] || [];
  const tables = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const t = `طاولة ${i + 1}`;
    return { name: t, status: c.cart.length && table === t ? "occupied" : i % 5 === 2 ? "reserved" : "free" };
  }), [c.cart, table]);
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="card p-4">
          <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="bld" size={18} className="text-[var(--warn)]" /> خريطة الطاولات — اختر طاولة لفتح الطلب</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2.5">
            {tables.map((t) => {
              const sel = table === t.name;
              const tone = sel ? "var(--brand)" : t.status === "reserved" ? "var(--warn)" : "var(--good)";
              return (
                <button key={t.name} onClick={() => setTable(t.name)}
                  className={`card card-lift p-3 text-center relative ${sel ? "ring-2 ring-[var(--brand)]" : ""}`}>
                  <I n="users" size={20} className="mx-auto mb-1.5" />
                  <div className="text-[0.76rem] font-bold">{t.name}</div>
                  <div className="text-[0.6rem] font-bold mt-0.5" style={{ color: tone }}>{sel ? "مفتوحة الآن" : t.status === "reserved" ? "محجوزة" : "متاحة"}</div>
                  <span className="absolute top-2 end-2 w-2 h-2 rounded-full" style={{ background: tone }} />
                </button>
              );
            })}
          </div>
        </div>
        <div className="card p-4">
          <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="tag" size={18} className="text-[var(--brand)]" /> قائمة الأصناف {table && <span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)]">{table}</span>}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {(menu.length ? menu : c.app.db.items.map((i: any) => ({ id: i.id, name: i.name, price: i.price }))).map((m: any) => (
              <button key={m.id} onClick={() => { if (!table) { c.app.toast("اختر طاولة أولاً", "err"); return; } c.add(m.id, m.name, m.price); }}
                className="card card-lift p-3 text-start">
                <span className="w-9 h-9 rounded-lg grid place-items-center bg-[color-mix(in_srgb,var(--warn)_14%,transparent)] text-[var(--warn)] mb-2"><I n="bld" size={17} /></span>
                <div className="text-[0.78rem] font-bold leading-5 min-h-[40px]">{m.name}</div>
                <div className="font-num font-bold text-[0.85rem] text-[var(--brand)] mt-1">{c.app.fmtN(m.price)} <span className="text-[0.62rem] text-mute">ر.ي</span></div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <CartPanel c={c} itemLabel="طبق" saleLabel={table ? `طلب ${table}` : "طلب الطاولة"} />
    </div>
  );
}
