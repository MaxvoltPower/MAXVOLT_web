// ============================================================
// MAXVOLT — Inverter + Battery calculator (intelligent)
// ------------------------------------------------------------
// Two modes:
//   1) GUIDED  — pick appliances from a list (classic mode)
//   2) SMART   — type what you need in plain English
//
// Both produce the same recommendation engine:
//   · required inverter VA
//   · required battery Ah
//   · best matching inverter + battery from live stock
//   · a plain-language explanation
// ============================================================

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '@context/ProductsContext';
import { applianceList } from '@data/products';
import { useToast } from '@components/ui/Toast';
import { openWhatsapp, parseNeedsText } from '@lib/utils';
import Button from '@components/ui/Button';

// ------------------------------------------------------------
// Sizing math
// ------------------------------------------------------------

function requiredInverterVA(loadWatts) {
  // 1.6× safety factor, then snap up to the nearest standard size
  const raw = loadWatts * 1.6;
  const sizes = [
    600, 700, 750, 800, 850, 900, 1000, 1100, 1200, 1400, 1500, 1600, 1800,
    2000, 2500, 3000, 4000, 5000,
  ];
  return sizes.find((s) => s >= raw) || 5000;
}

function requiredBatteryAh(loadWatts, hours) {
  // Wh = W × h; battery Ah at 12V with 0.85 inverter efficiency
  // and 0.6 depth-of-discharge for lead-acid longevity.
  const raw = (loadWatts * hours) / (12 * 0.85 * 0.6);
  const sizes = [100, 120, 135, 150, 160, 180, 200, 220, 250, 300];
  return sizes.find((s) => s >= raw) || 300;
}

// ------------------------------------------------------------
// Product attribute parsers (prefer structured numeric fields)
// ------------------------------------------------------------

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

// ------------------------------------------------------------
// Recommendation scoring
// ------------------------------------------------------------

function scoreInverter(product, targetVa) {
  const va = getProductVa(product);
  if (!va) return 9999;
  // Penalize undersized options heavily; prefer the smallest that still meets
  const meets = va >= targetVa;
  const distance = Math.abs(va - targetVa);
  return distance + (meets ? 0 : 2000);
}

function scoreBattery(product, targetAh) {
  const ah = getProductAh(product);
  if (!ah) return 9999;
  const meets = ah >= targetAh;
  const distance = Math.abs(ah - targetAh);
  return distance + (meets ? 0 : 2000);
}

function pickBest(pool, target, scoreFn) {
  const scored = pool
    .filter((p) => p.active !== false)
    .map((p) => ({ product: p, score: scoreFn(p, target) }))
    .sort((a, b) => a.score - b.score);

  // Prefer the best option that actually meets the requirement
  const meets = scored.find((s) => {
    if (scoreFn === scoreInverter) return getProductVa(s.product) >= target;
    return getProductAh(s.product) >= target;
  });

  return {
    best: meets?.product || scored[0]?.product || null,
    meetsRequirement: !!meets,
    alternatives: scored.slice(1, 4).map((s) => s.product),
  };
}

// ------------------------------------------------------------
// Main component
// ------------------------------------------------------------

export default function CalculatorSection() {
  const { groupedProducts, loading } = useProducts();
  const { showToast } = useToast();

  const [mode, setMode] = useState('smart'); // 'smart' | 'guided'
  const [smartText, setSmartText] = useState('');
  const [guidedAppliances, setGuidedAppliances] = useState(
    applianceList.map((a) => ({ ...a, enabled: a.default > 0, qty: a.default }))
  );
  const [guidedHours, setGuidedHours] = useState(3);
  const [result, setResult] = useState(null);

  // --- Guided helpers ---
  const toggleAppliance = (id) => {
    setGuidedAppliances((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, enabled: !a.enabled, qty: !a.enabled && a.qty === 0 ? 1 : a.qty }
          : a
      )
    );
  };

  const updateGuidedQty = (id, qty) => {
    setGuidedAppliances((prev) =>
      prev.map((a) => (a.id === id ? { ...a, qty: Math.max(0, qty) } : a))
    );
  };

  // --- Live preview of smart input ---
  const smartPreview = useMemo(() => {
    if (mode !== 'smart' || !smartText.trim()) return null;
    return parseNeedsText(smartText);
  }, [mode, smartText]);

  // --- Guided totals ---
  const guidedTotals = useMemo(() => {
    const active = guidedAppliances.filter((a) => a.enabled && a.qty > 0);
    const watts = active.reduce((sum, a) => sum + a.qty * a.watts, 0);
    return { active, watts };
  }, [guidedAppliances]);

  // ------------------------------------------------------------
  // Compute the recommendation (shared by both modes)
  // ------------------------------------------------------------
  const computeRecommendation = ({ watts, hours, itemsSummary, source }) => {
    if (!watts || watts <= 0) {
      showToast('Please specify at least one appliance.', 'warning');
      return;
    }
    if (!hours || hours <= 0) {
      showToast('Please specify backup hours.', 'warning');
      return;
    }

    const targetVa = requiredInverterVA(watts);
    const targetAh = requiredBatteryAh(watts, hours);

    const inverters = groupedProducts.homeInverters || [];
    const batteries = groupedProducts.homeInverterBatteries || [];

    const inverterPick = pickBest(inverters, targetVa, scoreInverter);
    const batteryPick = pickBest(batteries, targetAh, scoreBattery);

    // Realistic runtime for the picked battery
    let estimatedRuntime = null;
    if (batteryPick.best) {
      const ah = getProductAh(batteryPick.best);
      if (ah > 0) {
        estimatedRuntime = (ah * 12 * 0.85 * 0.6) / watts;
      }
    }

    const noInverter = inverters.length === 0;
    const noBattery = batteries.length === 0;

    setResult({
      source,
      totalWatts: watts,
      hours,
      targetVa,
      targetAh,
      inverter: inverterPick.best,
      battery: batteryPick.best,
      inverterMeets: inverterPick.meetsRequirement,
      batteryMeets: batteryPick.meetsRequirement,
      inverterAlts: inverterPick.alternatives,
      batteryAlts: batteryPick.alternatives,
      estimatedRuntime,
      itemsSummary,
      noInverter,
      noBattery,
      valid: !noInverter && !noBattery && (inverterPick.meetsRequirement || batteryPick.meetsRequirement),
    });
  };

  // ------------------------------------------------------------
  // Submit handlers
  // ------------------------------------------------------------

  const handleGuidedSubmit = (e) => {
    e.preventDefault();
    if (guidedTotals.watts === 0) {
      showToast('Please select at least one appliance.', 'warning');
      return;
    }
    computeRecommendation({
      watts: guidedTotals.watts,
      hours: guidedHours,
      itemsSummary: guidedTotals.active
        .map((a) => `${a.name} ×${a.qty}`)
        .join(' · '),
      source: 'guided',
    });
  };

  const handleSmartSubmit = (e) => {
    e.preventDefault();
    const parsed = parseNeedsText(smartText);
    if (parsed.matched.length === 0) {
      showToast(
        "I couldn't spot any appliances. Try something like: '2 fans, 3 lights and a fridge for 5 hours'.",
        'warning'
      );
      return;
    }
    if (!parsed.hours) {
      showToast(
        "Please mention how many hours of backup you need (e.g. 'for 4 hours').",
        'warning'
      );
      return;
    }
    computeRecommendation({
      watts: parsed.watts,
      hours: parsed.hours,
      itemsSummary: parsed.matched
        .map((m) => `${m.name} ×${m.qty}`)
        .join(' · '),
      source: 'smart',
    });
  };

  const reset = () => setResult(null);

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <section className="band" id="calculator">
      <div className="section-header">
        <span className="eyebrow">Backup Planner</span>
        <h2>Find the Right Inverter &amp; Battery</h2>
        <p>
          Tell us what you need to power — in your own words, or by picking from
          a list. We'll match you with the best combination from our live stock.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-center">
        <div className="inline-flex rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] p-1">
          <button
            type="button"
            onClick={() => {
              setMode('smart');
              setResult(null);
            }}
            className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'smart'
                ? 'bg-gradient-to-b from-accent to-accent-dark text-white shadow-md shadow-accent/25'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            ✨ Smart Mode
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('guided');
              setResult(null);
            }}
            className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'guided'
                ? 'bg-gradient-to-b from-brand to-brand-dark text-white shadow-md shadow-brand/25'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            📋 Guided Mode
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* -------- SMART MODE -------- */}
        {mode === 'smart' && (
          <form onSubmit={handleSmartSubmit} className="surface">
            <h4 className="text-lg sm:text-xl font-bold mb-3 text-[var(--text)]">
              Describe what you need
            </h4>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Example: <em>"I want to run 2 fans, 3 LED lights, 1 fridge and a TV for 4 hours."</em>
            </p>

            <textarea
              value={smartText}
              onChange={(e) => setSmartText(e.target.value)}
              rows={4}
              placeholder="Type your requirement here..."
              className="w-full mb-3"
              aria-label="Describe your backup requirement"
            />

            {/* Live preview of what we detected */}
            {smartPreview && smartPreview.matched.length > 0 && (
              <div className="mb-4 p-4 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
                <div className="text-xs uppercase tracking-widest text-[var(--text-subtle)] mb-2 font-bold">
                  What I understood
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {smartPreview.matched.map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/30 text-xs font-semibold text-[var(--text)]"
                    >
                      <span>{m.icon}</span>
                      {m.name} × {m.qty}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-[var(--text-subtle)]">Total load: </span>
                    <strong>{smartPreview.watts}W</strong>
                  </div>
                  <div>
                    <span className="text-[var(--text-subtle)]">Backup: </span>
                    <strong>
                      {smartPreview.hours ? `${smartPreview.hours} hour(s)` : 'not specified'}
                    </strong>
                  </div>
                </div>
                {smartPreview.confidence < 0.7 && (
                  <p className="text-xs text-amber-400 mt-2">
                    ⚠️ Not very confident — double-check the detected items.
                  </p>
                )}
              </div>
            )}

            {smartPreview && smartPreview.matched.length === 0 && smartText.trim() && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
                I couldn't spot any appliances yet. Try words like "fan", "light",
                "fridge", "TV", "AC", "computer", "router", etc.
              </div>
            )}

            <Button type="submit" variant="secondary" className="w-full py-3.5">
              ⚡ Analyse &amp; Recommend
            </Button>

            <p className="text-center text-xs text-[var(--text-subtle)] mt-3">
              🔒 No spam. We'll only use this to size your recommendation.
            </p>
          </form>
        )}

        {/* -------- GUIDED MODE -------- */}
        {mode === 'guided' && (
          <form onSubmit={handleGuidedSubmit} className="surface">
            <h4 className="text-lg sm:text-xl font-bold text-center mb-5 sm:mb-6 text-[var(--text)]">
              Select Your Appliances
            </h4>

            <div className="space-y-2.5 mb-6 max-h-[420px] overflow-y-auto pr-1">
              {guidedAppliances.map((appliance) => (
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
                    onChange={(e) =>
                      updateGuidedQty(appliance.id, parseInt(e.target.value, 10) || 0)
                    }
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

            {/* Live total */}
            {guidedTotals.watts > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] text-sm">
                <strong>Estimated load:</strong> {guidedTotals.watts}W
                <span className="text-[var(--text-subtle)]">
                  {' '}
                  ({guidedTotals.active.length} appliance type
                  {guidedTotals.active.length === 1 ? '' : 's'})
                </span>
              </div>
            )}

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
                value={guidedHours}
                onChange={(e) => setGuidedHours(parseFloat(e.target.value) || 3)}
                className="w-24 sm:w-28 px-3 py-2 text-center text-base font-semibold rounded-lg"
              />
            </div>

            <Button type="submit" variant="secondary" className="w-full py-3.5 sm:py-4 text-sm sm:text-base">
              ⚡ Find My Best Match
            </Button>

            <p className="text-center text-xs text-[var(--text-subtle)] mt-3">
              🔒 No spam. We'll only contact you with your recommendation.
            </p>
          </form>
        )}
      </div>

      {/* -------- RESULT -------- */}
      {result && (
        <div className="mt-8 sm:mt-10 max-w-3xl mx-auto">
          <ResultCard result={result} onReset={reset} loading={loading} />
        </div>
      )}
    </section>
  );
}

// ============================================================
// Result card
// ============================================================

function ResultCard({ result, onReset, loading }) {
  const {
    totalWatts,
    hours,
    targetVa,
    targetAh,
    inverter,
    battery,
    inverterMeets,
    batteryMeets,
    estimatedRuntime,
    itemsSummary,
    noInverter,
    noBattery,
  } = result;

  // ----- Fully blocked case -----
  if (noInverter && noBattery) {
    return (
      <div className="p-5 sm:p-6 rounded-2xl bg-amber-500/10 border-l-4 border-amber-500 text-[var(--text)]">
        <h3 className="text-amber-400 mb-3 text-lg">Product Catalogue Empty</h3>
        <p className="text-sm sm:text-base">
          We currently have no inverters or batteries listed in the catalogue.
          Please contact us directly and we'll source what you need.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/contact#quotation"
            className="inline-flex px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-b from-brand to-brand-dark text-white font-semibold text-sm"
          >
            Get Custom Quote
          </Link>
          <button
            type="button"
            onClick={() =>
              openWhatsapp(
                `Hi MAXVOLT, I need a power solution for ${totalWatts}W load for ${hours} hours. Please help.`
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

  // ----- Partial / exceeds stock -----
  const exceeds = !inverterMeets && !batteryMeets;

  const waMessage = `Hi MAXVOLT, based on my requirement (${itemsSummary}), my estimated load is ${totalWatts}W with ${hours}h backup. Please quote for: ${
    inverter ? `${inverter.brand} ${inverter.model}` : `${targetVa}VA inverter`
  } + ${battery ? `${battery.brand} ${battery.model}` : `${targetAh}Ah battery`}.`;

  return (
    <div
      className={`p-5 sm:p-6 rounded-2xl border-l-4 text-[var(--text)] ${
        exceeds
          ? 'bg-amber-500/10 border-amber-500'
          : 'bg-emerald-500/10 border-emerald-500'
      }`}
    >
      <h3
        className={`mb-4 text-lg ${
          exceeds ? 'text-amber-400' : 'text-emerald-400'
        }`}
      >
        {exceeds ? '⚠️ Closest Match (Limited Stock)' : '✓ Best Match Found'}
      </h3>

      <div className="p-4 rounded-xl bg-[var(--bg-elev)] border border-[var(--border)] mb-4 space-y-2 text-sm sm:text-base">
        <div>
          <strong>Your requirement:</strong> {itemsSummary}
        </div>
        <div>
          <strong>Estimated load:</strong> {totalWatts}W
        </div>
        <div>
          <strong>Backup time:</strong> {hours} hour(s)
        </div>
        <div className="pt-2 border-t border-[var(--border)]">
          <strong>Recommended inverter:</strong>{' '}
          {inverter ? (
            <>
              <Link
                to={`/product/${inverter.id || inverter._id}`}
                className="text-brand-light hover:text-accent-light font-semibold"
              >
                {inverter.brand} {inverter.model}
              </Link>{' '}
              <span className="text-[var(--text-subtle)]">
                ({inverter.va || `${targetVa}VA class`})
              </span>
              {!inverterMeets && (
                <span className="ml-2 text-xs text-amber-400">
                  below ideal {targetVa}VA
                </span>
              )}
            </>
          ) : (
            <>
              ~{targetVa}VA{' '}
              <span className="text-[var(--text-subtle)]">(contact us)</span>
            </>
          )}
        </div>
        <div>
          <strong>Recommended battery:</strong>{' '}
          {battery ? (
            <>
              <Link
                to={`/product/${battery.id || battery._id}`}
                className="text-brand-light hover:text-accent-light font-semibold"
              >
                {battery.brand} {battery.model}
              </Link>{' '}
              <span className="text-[var(--text-subtle)]">
                ({battery.capacity || `${targetAh}Ah class`})
              </span>
              {!batteryMeets && (
                <span className="ml-2 text-xs text-amber-400">
                  below ideal {targetAh}Ah
                </span>
              )}
            </>
          ) : (
            <>
              ~{targetAh}Ah{' '}
              <span className="text-[var(--text-subtle)]">(contact us)</span>
            </>
          )}
        </div>
        {estimatedRuntime && (
          <div className="pt-2 border-t border-[var(--border)]">
            <strong>Estimated runtime with this battery:</strong>{' '}
            {estimatedRuntime.toFixed(1)} hours
          </div>
        )}
      </div>

      <p className="text-[var(--text-muted)] text-xs sm:text-sm mb-4">
        Sizing uses a 1.6× inverter safety factor and a 60% depth-of-discharge for
        lead-acid batteries. Real-world performance varies with load type, wiring
        and battery health. Contact us for a precise assessment.
      </p>

      <div className="flex flex-wrap gap-2">
        <Link
          to="/contact#quotation"
          className="inline-flex px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-b from-brand to-brand-dark text-white font-semibold text-sm"
        >
          Get Personalized Quote
        </Link>
        <button
          type="button"
          onClick={() => openWhatsapp(waMessage)}
          className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-b from-accent to-accent-dark text-white font-semibold text-sm"
        >
          Send via WhatsApp
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex px-4 sm:px-5 py-2.5 rounded-xl border-[1.5px] border-[var(--border-strong)] font-semibold hover:bg-[var(--bg-muted)] text-sm"
        >
          Recalculate
        </button>
      </div>

      {loading && (
        <p className="text-xs text-[var(--text-subtle)] mt-3">
          Products are still loading — results may improve.
        </p>
      )}
    </div>
  );
}