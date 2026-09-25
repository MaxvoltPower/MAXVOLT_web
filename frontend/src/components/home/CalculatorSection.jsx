// ============================================================
// MAXVOLT — Inverter + Battery calculator
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '@context/ProductsContext';
import { applianceList } from '@data/products';
import { useToast } from '@components/ui/Toast';
import { openWhatsapp } from '@lib/utils';
import Button from '@components/ui/Button';

function requiredInverterVA(loadWatts) {
  const raw = loadWatts * 1.6;
  const sizes = [
    600, 700, 750, 800, 850, 900, 1000, 1100, 1200, 1400, 1500, 1600, 1800,
    2000, 2500, 3000, 4000, 5000,
  ];
  return sizes.find((s) => s >= raw) || 5000;
}

function requiredBatteryAh(loadWatts, hours) {
  const raw = (loadWatts * hours) / (12 * 0.85 * 0.6);
  const sizes = [100, 120, 135, 150, 160, 180, 200, 220, 250, 300];
  return sizes.find((s) => s >= raw) || 300;
}

/**
 * Prefer structured numeric fields written by the API/seed script.
 * Fall back to string parsing only if a legacy product has no numeric field.
 */
function getProductVa(product) {
  if (!product) return 0;
  if (typeof product.vaNumeric === 'number' && Number.isFinite(product.vaNumeric)) {
    return product.vaNumeric;
  }
  const raw = product.va;
  if (!raw) return 0;
  const s = String(raw).trim();
  const kMatch = s.match(/(\d+(?:\.\d+)?)\s*k\s*va/i);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);
  const vaMatch = s.match(/(\d+(?:\.\d+)?)\s*va/i);
  if (vaMatch) return Math.round(parseFloat(vaMatch[1]));
  const m = s.match(/\d+(?:\.\d+)?/);
  return m ? Math.round(parseFloat(m[0])) : 0;
}

function getProductAh(product) {
  if (!product) return 0;
  if (typeof product.capacityAh === 'number' && Number.isFinite(product.capacityAh)) {
    return product.capacityAh;
  }
  const raw = product.capacity;
  if (!raw) return 0;
  const s = String(raw).trim();
  const ahMatch = s.match(/(\d+(?:\.\d+)?)\s*ah/i);
  if (ahMatch) return Math.round(parseFloat(ahMatch[1]));
  const nums = s.match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length === 0) return 0;
  return Math.round(Math.max(...nums.map(Number)));
}

function scoreProduct(product, targets) {
  const category = product.category;
  if (category === 'homeInverters' || category === 'inverter') {
    const va = getProductVa(product);
    if (!va) return 9999;
    return Math.abs(va - targets.va) + (va < targets.va ? 500 : 0);
  }
  if (category === 'homeInverterBatteries') {
    const ah = getProductAh(product);
    if (!ah) return 9999;
    return Math.abs(ah - targets.ah) + (ah < targets.ah ? 500 : 0);
  }
  return 9999;
}

function productUrl(p) {
  return `/product/${p.id || p._id}`;
}

export default function CalculatorSection() {
  const { groupedProducts } = useProducts();
  const { showToast } = useToast();
  const [appliances, setAppliances] = useState(
    applianceList.map((a) => ({ ...a, enabled: a.default > 0, qty: a.default }))
  );
  const [backupHours, setBackupHours] = useState(3);
  const [result, setResult] = useState(null);

  const toggleAppliance = (id) => {
    setAppliances((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, enabled: !a.enabled, qty: !a.enabled && a.qty === 0 ? 1 : a.qty }
          : a
      )
    );
  };

  const updateQty = (id, qty) => {
    setAppliances((prev) =>
      prev.map((a) => (a.id === id ? { ...a, qty: Math.max(0, qty) } : a))
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const active = appliances.filter((a) => a.enabled && a.qty > 0);
    const totalWatts = active.reduce((sum, a) => sum + a.qty * a.watts, 0);

    if (totalWatts === 0) {
      showToast('Please select at least one appliance.', 'warning');
      return;
    }

    const targets = {
      va: requiredInverterVA(totalWatts),
      ah: requiredBatteryAh(totalWatts, backupHours),
    };

    const inverters = (groupedProducts.homeInverters || [])
      .filter((p) => p.active !== false && (p.stock === undefined || p.stock > 0))
      .map((p) => ({ p, score: scoreProduct(p, targets) }))
      .sort((a, b) => a.score - b.score);

    const batteries = (groupedProducts.homeInverterBatteries || [])
      .filter((p) => p.active !== false && (p.stock === undefined || p.stock > 0))
      .map((p) => ({ p, score: scoreProduct(p, targets) }))
      .sort((a, b) => a.score - b.score);

    const validInverter = inverters.find((i) => {
      const va = getProductVa(i.p);
      return va >= totalWatts * 0.8;
    });

    const validBattery = batteries.find((b) => {
      const ah = getProductAh(b.p);
      return ah >= targets.ah * 0.8;
    });

    setResult({
      totalWatts,
      hours: backupHours,
      inverter: validInverter?.p || inverters[0]?.p || null,
      battery: validBattery?.p || batteries[0]?.p || null,
      targets,
      valid: !!(validInverter && validBattery),
      active,
    });
  };

  return (
    <section className="band" id="calculator">
      <div className="section-header">
        <span className="eyebrow">Backup Planner</span>
        <h2>Find the Right Inverter &amp; Battery</h2>
        <p>
          Tell us what you need to power, and we'll recommend the best combination
          from our available products.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="surface">
          <h4 className="text-lg sm:text-xl font-bold text-center mb-5 sm:mb-6 text-[var(--text)]">
            Select Your Appliances
          </h4>

          <div className="space-y-2.5 mb-6 max-h-[420px] overflow-y-auto pr-1">
            {appliances.map((appliance) => (
              <div
                key={appliance.id}
                className={`grid grid-cols-[36px_1fr_76px_40px] sm:grid-cols-[40px_1fr_100px_60px] gap-2 sm:gap-3 items-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-[1.5px] transition-all ${
                  appliance.enabled
                    ? 'border-brand/60 bg-brand/5'
                    : 'border-[var(--border)] bg-[var(--bg-muted)]'
                }`}
              >
                <div className="text-lg sm:text-xl text-center">{appliance.icon}</div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs sm:text-sm text-[var(--text)] truncate">
                    {appliance.name}
                  </div>
                  <div className="text-[10px] sm:text-xs text-[var(--text-subtle)]">
                    ~{appliance.watts}W each
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  max="20"
                  inputMode="numeric"
                  value={appliance.qty}
                  onChange={(e) => updateQty(appliance.id, parseInt(e.target.value, 10) || 0)}
                  disabled={!appliance.enabled}
                  aria-label={`Quantity for ${appliance.name}`}
                  className="w-full px-2 py-1.5 sm:py-2 text-center text-xs sm:text-sm rounded-lg disabled:opacity-50"
                />
                <label className="flex items-center justify-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appliance.enabled}
                    onChange={() => toggleAppliance(appliance.id)}
                    className="w-5 h-5 accent-accent cursor-pointer"
                    aria-label={`Enable ${appliance.name}`}
                  />
                </label>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[var(--bg-muted)] border-[1.5px] border-[var(--border)] mb-6">
            <label className="font-semibold text-sm text-[var(--text)]">
              Required Backup Time (hours)
            </label>
            <input
              type="number"
              min="1"
              max="24"
              step="0.5"
              inputMode="decimal"
              value={backupHours}
              onChange={(e) => setBackupHours(parseFloat(e.target.value) || 3)}
              className="w-24 sm:w-28 px-3 py-2 text-center text-base font-semibold rounded-lg"
            />
          </div>

          <Button type="submit" variant="secondary" className="w-full py-3.5 sm:py-4 text-sm sm:text-base">
            ⚡ Find My Best Match
          </Button>

          <p className="text-center text-xs text-[var(--text-subtle)] mt-3">
            🔒 No spam. We'll only contact you with your recommendation.
          </p>
        </div>
      </form>

      {result && (
        <div className="mt-8 sm:mt-10 max-w-3xl mx-auto">
          <ResultCard result={result} onReset={() => setResult(null)} />
        </div>
      )}
    </section>
  );
}

function ResultCard({ result, onReset }) {
  const { totalWatts, hours, inverter, battery, targets, valid, active } = result;

  if (!valid) {
    return (
      <div className="p-5 sm:p-6 rounded-2xl bg-red-500/10 border-l-4 border-red-500 text-[var(--text)]">
        <h3 className="text-red-400 mb-3 text-lg">
          Requirement Exceeds Available Solutions
        </h3>
        <p className="text-sm sm:text-base">
          Your estimated load of <strong>{totalWatts}W</strong> requires ~
          <strong>{targets.va}VA</strong> inverter and ~
          <strong>{targets.ah}Ah</strong> battery, which is beyond our current stock.
        </p>
        <p className="mt-3 text-sm">Please contact us directly for a custom solution.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/contact#quotation"
            className="inline-flex px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-b from-brand to-brand-dark text-white font-semibold text-sm"
          >
            Get Custom Quote
          </Link>
          <button
            onClick={() =>
              openWhatsapp(
                `Hi MAXVOLT, I need a custom power solution for ${totalWatts}W load. Please help.`
              )
            }
            className="inline-flex px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-b from-accent to-accent-dark text-white font-semibold text-sm"
          >
            Contact on WhatsApp
          </button>
        </div>
      </div>
    );
  }

  const itemsSummary = active.map((a) => `${a.name} ×${a.qty}`).join(' · ');

  const waMessage = `Hi MAXVOLT, based on my requirement (${itemsSummary}), my estimated load is ${totalWatts}W with ${hours}h backup. Please quote for: ${
    inverter ? `${inverter.brand} ${inverter.model}` : `${targets.va}VA inverter`
  } + ${battery ? `${battery.brand} ${battery.model}` : `${targets.ah}Ah battery`}.`;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-emerald-500/10 border-l-4 border-emerald-500 text-[var(--text)]">
      <h3 className="text-emerald-400 mb-4 text-lg">✓ Best Match Found</h3>

      <div className="p-4 rounded-xl bg-[var(--bg-elev)] border border-[var(--border)] mb-4 space-y-2 text-sm sm:text-base">
        <div><strong>Your items:</strong> {itemsSummary}</div>
        <div><strong>Estimated Load:</strong> {totalWatts}W</div>
        <div><strong>Backup Time:</strong> {hours} hour(s)</div>
        <div>
          <strong>Recommended Inverter:</strong>{' '}
          {inverter ? (
            <>
              <Link to={productUrl(inverter)} className="text-brand-light hover:text-accent-light">
                {inverter.brand} {inverter.model}
              </Link>{' '}
              <span className="text-[var(--text-subtle)]">({inverter.va})</span>
            </>
          ) : (
            <>~{targets.va}VA <span className="text-[var(--text-subtle)]">(contact us)</span></>
          )}
        </div>
        <div>
          <strong>Recommended Battery:</strong>{' '}
          {battery ? (
            <>
              <Link to={productUrl(battery)} className="text-brand-light hover:text-accent-light">
                {battery.brand} {battery.model}
              </Link>{' '}
              <span className="text-[var(--text-subtle)]">({battery.capacity})</span>
            </>
          ) : (
            <>~{targets.ah}Ah <span className="text-[var(--text-subtle)]">(contact us)</span></>
          )}
        </div>
      </div>

      <p className="text-[var(--text-muted)] text-xs sm:text-sm mb-4">
        This is an estimate based on typical usage. For precise sizing and pricing,
        contact our experts.
      </p>

      <div className="flex flex-wrap gap-2">
        <Link
          to="/contact#quotation"
          className="inline-flex px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-b from-brand to-brand-dark text-white font-semibold text-sm"
        >
          Get Personalized Quote
        </Link>
        <button
          onClick={() => openWhatsapp(waMessage)}
          className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-b from-accent to-accent-dark text-white font-semibold text-sm"
        >
          Send via WhatsApp
        </button>
        <button
          onClick={onReset}
          className="inline-flex px-4 sm:px-5 py-2.5 rounded-xl border-[1.5px] border-[var(--border-strong)] font-semibold hover:bg-[var(--bg-muted)] text-sm"
        >
          Recalculate
        </button>
      </div>
    </div>
  );
}