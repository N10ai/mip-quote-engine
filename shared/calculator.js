// =====================
// MIP QUOTE ENGINE - CALCULATOR
// =====================

function toKg(value, unit) {
  value = Number(value) || 0;
  return unit === "lb" ? value / 2.20462 : value;
}

function toCm(value, unit) {
  value = Number(value) || 0;

  if (unit === "in") return value * 2.54;
  if (unit === "m") return value * 100;
  if (unit === "ft") return value * 30.48;

  return value;
}

function kgToLb(kg) {
  return kg * 2.20462;
}

function cbmToCft(cbm) {
  return cbm * 35.3147;
}

export function calculateQuote(quote) {
  let totalWeightKg = 0;
  let totalCBM = 0;
  let totalPieces = 0;

  for (const item of quote.cargo) {
    const qty = Number(item.quantity) || 0;

    const weightKg = toKg(item.weight?.value, item.weight?.unit);

    const L = toCm(item.dimensions?.length, item.dimensions?.unit);
    const W = toCm(item.dimensions?.width, item.dimensions?.unit);
    const H = toCm(item.dimensions?.height, item.dimensions?.unit);

    const cbm = L > 0 && W > 0 && H > 0 && qty > 0
      ? (L * W * H * qty) / 1000000
      : 0;

    item.volume = {
      cbm: Number(cbm.toFixed(4)),
      cft: Number(cbmToCft(cbm).toFixed(2))
    };

    totalWeightKg += weightKg * qty;
    totalCBM += cbm;
    totalPieces += qty;
  }

  const volumetricWeightKg = totalCBM * 167;

  let chargeable = 0;
  let chargeUnit = "kg";

  if (quote.shipment.mode === "air") {
    chargeable = Math.max(totalWeightKg, volumetricWeightKg);
    chargeUnit = "kg";
  }

  if (quote.shipment.mode === "ocean") {
    if (quote.container.type === "FCL") {
      chargeable = quote.container.items.reduce(
        (sum, c) => sum + (Number(c.quantity) || 0),
        0
      );
      chargeUnit = "container";
    } else {
      chargeable = totalCBM;
      chargeUnit = "cbm";
    }
  }

  if (quote.shipment.mode === "ground") {
    chargeable = totalWeightKg;
    chargeUnit = "kg";
  }

  quote.shipment.pieces = totalPieces;

  quote.totals.weight.kg = Number(totalWeightKg.toFixed(2));
  quote.totals.weight.lb = Number(kgToLb(totalWeightKg).toFixed(2));

  quote.totals.volume.cbm = Number(totalCBM.toFixed(4));
  quote.totals.volume.cft = Number(cbmToCft(totalCBM).toFixed(2));

  quote.totals.volumetricWeight.kg = Number(volumetricWeightKg.toFixed(2));
  quote.totals.volumetricWeight.lb = Number(kgToLb(volumetricWeightKg).toFixed(2));

  quote.totals.chargeableWeight.value = Number(chargeable.toFixed(2));
  quote.totals.chargeableWeight.unit = chargeUnit;

  // Auto-detect cargo flags
  quote.shipment.flags.hazardous = quote.cargo.some(c => c.cargoType === "hazardous");
  quote.shipment.flags.oversized = quote.cargo.some(c => c.cargoType === "oversized");
  quote.shipment.flags.refrigerated = quote.cargo.some(c => c.cargoType === "refrigerated");

  // Recalculate charges
  let subtotal = 0;

  quote.charges = quote.charges.map(charge => {
    let amount = 0;
    let quantity = Number(charge.quantity) || 0;

    if (charge.autoQuantity) {
      if (charge.type === "per_kg") quantity = quote.totals.chargeableWeight.value;
      if (charge.type === "per_cbm") quantity = quote.totals.volume.cbm;
      if (charge.type === "per_container") quantity = quote.totals.chargeableWeight.value;
      if (charge.type === "per_piece") quantity = quote.shipment.pieces;
    }

    if (charge.type === "flat") {
      amount = Number(charge.rate) || 0;
      quantity = 1;
    } else {
      amount = (Number(charge.rate) || 0) * quantity;
    }

    if (Number(charge.minimum) > 0) {
      amount = Math.max(amount, Number(charge.minimum));
    }

    subtotal += amount;

    return {
      ...charge,
      quantity,
      amount: Number(amount.toFixed(2))
    };
  });

  quote.summary.subtotal = Number(subtotal.toFixed(2));
  quote.summary.taxes = Number(quote.summary.taxes || 0);
  quote.summary.total = Number((quote.summary.subtotal + quote.summary.taxes).toFixed(2));

  return quote;
}
