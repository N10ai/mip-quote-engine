// =====================
// MIP QUOTE ENGINE - MASTER SCHEMA
// =====================

const baseQuote = {
  meta: {
    quoteNumber: "",
    referenceNumber: "",
    createdAt: "",
    validUntil: "",
    currency: "USD",
    status: "draft",
    createdBy: "",
    notesInternal: ""
  },

  customer: {
    company: "",
    contact: "",
    email: "",
    phone: "",
    taxId: ""
  },

  shipment: {
    mode: "air",
    direction: "international",
    serviceLevel: "door-door",
    incoterm: "EXW",
    groundService: "",
    commodity: "",
    hsCode: "",
    readyDate: "",
    pieces: 0,

    flags: {
      hazardous: false,
      oversized: false,
      refrigerated: false,
      bonded: false,
      ftz: false
    }
  },

  stops: [],

  cargo: [],

  container: {
    type: "NONE",
    items: []
  },

  services: {},

  totals: {
    weight: { kg: 0, lb: 0 },
    volume: { cbm: 0, cft: 0 },
    volumetricWeight: { kg: 0, lb: 0 },
    chargeableWeight: { value: 0, unit: "" }
  },

  rates: {
    airFreightPerKg: 0,
    oceanFreightPerCBM: 0,
    oceanFreightPerContainer: 0,
    groundFreight: 0
  },

  charges: [],

  summary: {
    subtotal: 0,
    taxes: 0,
    total: 0
  },

  logistics: {},
  references: {},
  notes: "",
  terms: ""
};

// Creates a fresh quote every time
export function createEmptyQuote() {
  return JSON.parse(JSON.stringify(baseQuote));
}

// Creates quote number like Q-20260425-213045
export function generateQuoteNumber() {
  const now = new Date();

  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const time = now.toTimeString().slice(0, 8).replaceAll(":", "");

  return `Q-${date}-${time}`;
}
