import { useState } from 'react';
import { useProducts } from '@context/ProductsContext';
import { applianceList } from '@data/products';
import { useToast } from '@components/ui/Toast';
import { openWhatsapp } from '@lib/utils';
import Button from '@components/ui/Button';
import { Link } from 'react-router-dom';

function requiredInverterVA(loadWatts) {
  const raw = loadWatts * 1.6;
  const sizes = [600, 700, 750, 800, 850, 900, 1000, 1100, 1200, 1400, 1500, 1600, 1800, 2000, 2500, 3000, 4000, 5000];
  return sizes.find((s) => s >= raw) || 5000;
}

function requiredBatteryAh(loadWatts, hours) {
  const raw = (loadWatts * hours) / (12 * 0.85 * 0.6);
  const sizes = [100, 120, 135, 150, 160, 180, 200, 220, 250, 300];
  return sizes.find((s) => s >= raw) || 300;
}

function scoreProduct(product, targets) {
  const category = product.category;

  if (category === 'homeInverters' || category === 'inverter') {
    const va = parseInt(String(product.va || '').replace(/\D/g, ''), 10) || 0;
    if (!va) return 9999;
    const diff = Math.abs(va - targets.va);
    const penalty = va < targets.va ? 500 : 0;
    return diff + penalty;
  }

  if (category === 'homeInverterBatteries') {
    const ah = parseInt(String(product.capacity || '').replace(/\D/g, ''), 10) || 0;
    if (!ah) return 9999;
    const diff = Math.abs(ah - targets.ah);
    const penalty = ah < targets.ah ? 500 : 0;
    return diff + penalty;
  }

  return 9999;
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
      const va = parseInt(String(i.p.va || '').replace(/\D/g, ''), 10) || 0;
      return va >= totalWatts * 0.8;
    });

    const validBattery = batteries.find((b) => {
      const ah = parseInt(String(b.p.capacity || '').replace(/\D/g, ''), 10) || 0;
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
    <section className="light-bg" id="calculator">
      <div className="section-header">
        <h2>Find the Right Inverter &amp; Battery</h2>
        <p>Tell us what you need to power, and we'll recommend the best combination from our available products.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="surface">
          <h4 className="text-xl font-bold text-center mb-6">Select Your Appliances</h4>

          <div className="space-y-3 mb-6 max-h-[420px] overflow-y-auto pr-1">
            {appliances.map((appliance) => (
              <div
                key={appliance.id}
                className="grid grid-cols-[40px_1fr_100px_60px] gap-3 items-center px-4 py-3 rounded-xl border-[1.5px] border-dark-border bg-dark-muted hover:border-secondary hover:bg-secondary/5 transition-all"
              >
                <div className="text-xl text-center">{appliance.icon}</div>
                <div>
                  <div className="font-semibold text-sm text-[var(--text)]">{appliance.name}</div>
                  <div className="text-xs text-[var(--text-subtle)]">~{appliance.watts}W each</div>
                </div>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={appliance.qty}
                  onChange={(e) => updateQty(appliance.id, parseInt(e.target.value, 10) || 0)}
                  disabled={!appliance.enabled}
                  className="w-full px-2.5 py-2 text-center text-sm rounded-lg"
                />
                <label className="flex items-center justify-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appliance.enabled}
                    onChange={() => toggleAppliance(appliance.id)}
                    className="w-5 h-5 accent-secondary cursor-pointer"
                  />
                </label>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-dark-muted border-[1.5px] border-dark-border mb-6">
            <label className="font-semibold text-sm text-[var(--text)]">
              Required Backup Time (hours)
            </label>
            <input
              type="number"
              min="1"
              max="24"
              step="0.5"
              value={backupHours}
              onChange={(e) => setBackupHours(parseFloat(e.target.value) || 3)}
              className="w-28 px-3.5 py-2.5 text-center text-base font-semibold rounded-lg"
            />
          </div>

          <Button type="submit" variant="primary" className="w-full py-4 text-base">
            ⚡ Find My Best Match
          </Button>

          <p className="text-center text-xs text-[var(--text-subtle)] mt-3">
            🔒 No spam. We'll only contact you with your recommendation.
          </p>
        </div>
      </form>

      {result && (
        <div className="mt-10 max-w-3xl mx-auto">
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
      <div className="p-6 rounded-2xl bg-red-500/10 border-l-4 border-red-500 text-[var(--text)]">
        <h3 className="text-red-400 mb-3">Requirement Exceeds Available Solutions</h3>
        <p>
          Your estimated load of <strong>{totalWatts}W</strong> requires ~
          <strong>{targets.va}VA</strong> inverter and ~<strong>{targets.ah}Ah</strong> battery,
          which is beyond our current stock.
        </p>
        <p className="mt-3">Please contact us directly for a custom solution.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/#quotation" className="inline-flex px-5 py-2.5 rounded-xl bg-gradient-to-br from-primary-light to-primary text-white font-semibold">
            Get Custom Quote
          </Link>
          <button
            onClick={() =>
              openWhatsapp(
                `Hi MAXVOLT, I need a custom power solution for ${totalWatts}W load. Please help.`
              )
            }
            className="inline-flex px-5 py-2.5 rounded-xl bg-gradient-to-br from-secondary to-secondary-light text-white font-semibold"
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
    <div className="p-6 rounded-2xl bg-emerald-500/10 border-l-4 border-emerald-500 text-[var(--text)]">
      <h3 className="text-emerald-400 mb-4">✓ Best Match Found</h3>

      <div className="p-4 rounded-xl bg-dark-elevated border border-dark-border mb-4 space-y-2">
        <div><strong>Your items:</strong> {itemsSummary}</div>
        <div><strong>Estimated Load:</strong> {totalWatts}W</div>
        <div><strong>Backup Time:</strong> {hours} hour(s)</div>
        <div>
          <strong>Recommended Inverter:</strong>{' '}
          {inverter ? (
            <>
              <Link to={`/product/${inverter.id || inverter._id}`} className="text-accent hover:text-secondary-light">
                {inverter.brand} {inverter.model}
              </Link>{' '}
              <span className="text-[var(--text-subtle)]">({inverter.va})</span>
            </>
          ) : (
            <>
              ~{targets.va}VA <span className="text-[var(--text-subtle)]">(contact us)</span>
            </>
          )}
        </div>
        <div>
          <strong>Recommended Battery:</strong>{' '}
          {battery ? (
            <>
              <Link to={`/product/${battery.id || battery._id}`} className="text-accent hover:text-secondary-light">
                {battery.brand} {battery.model}
              </Link>{' '}
              <span className="text-[var(--text-subtle)]">({battery.capacity})</span>
            </>
          ) : (
            <>
              ~{targets.ah}Ah <span className="text-[var(--text-subtle)]">(contact us)</span>
            </>
          )}
        </div>
      </div>

      <p className="text-[var(--text-muted)] text-sm mb-4">
        This is an estimate based on typical usage. For precise sizing and pricing, contact our experts.
      </p>

      <div className="flex flex-wrap gap-2">
        <Link
          to="/#quotation"
          className="inline-flex px-5 py-2.5 rounded-xl bg-gradient-to-br from-primary-light to-primary text-white font-semibold"
        >
          Get Personalized Quote
        </Link>
        <button
          onClick={() => openWhatsapp(waMessage)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-secondary to-secondary-light text-white font-semibold"
        >
          Send via WhatsApp
        </button>
        <button
          onClick={onReset}
          className="inline-flex px-5 py-2.5 rounded-xl border-2 border-dark-border-strong font-semibold hover:bg-dark-muted"
        >
          Recalculate
        </button>
      </div>
    </div>
  );
}