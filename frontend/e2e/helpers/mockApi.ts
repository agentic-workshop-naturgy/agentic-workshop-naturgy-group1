import { Page, Request, Route } from '@playwright/test';

type SupplyPoint = {
  cups: string;
  zona: string;
  tarifa: string;
  estado: 'ACTIVO' | 'INACTIVO';
};

type Reading = {
  id: number;
  cups: string;
  fecha: string;
  lecturaM3: number;
  tipo: 'REAL' | 'ESTIMADA';
};

type Tariff = {
  tarifa: string;
  fijoMesEur: number;
  variableEurKwh: number;
  vigenciaDesde: string;
};

type ConversionFactor = {
  id: number;
  zona: string;
  mes: string;
  coefConv: number;
  pcsKwhM3: number;
};

type Tax = {
  taxCode: string;
  taxRate: number;
  vigenciaDesde: string;
};

type InvoiceLine = {
  id: number;
  tipoLinea: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  importe: number;
};

type Invoice = {
  numeroFactura: string;
  cups: string;
  periodoInicio: string;
  periodoFin: string;
  base: number;
  impuestos: number;
  total: number;
  fechaEmision: string;
  lines: InvoiceLine[];
};

type BillingResult = {
  period: string;
  invoicesCreated: number;
  invoicesUpdated: number;
  errors: Array<{ cups: string; error: string }>;
};

type MockState = {
  supplyPoints: SupplyPoint[];
  readings: Reading[];
  tariffs: Tariff[];
  conversionFactors: ConversionFactor[];
  taxes: Tax[];
  invoices: Invoice[];
  nextReadingId: number;
  nextConversionFactorId: number;
};

export type MockApiOptions = {
  seed?: Partial<MockState>;
  billingForcedErrors?: Array<{ cups: string; error: string }>;
  failPdfFor?: string[];
};

function defaultState(): MockState {
  return {
    supplyPoints: [
      { cups: 'ES1234567890123456', zona: 'Centro', tarifa: 'T1', estado: 'ACTIVO' },
    ],
    readings: [
      { id: 1, cups: 'ES1234567890123456', fecha: '2024-06-01', lecturaM3: 1500, tipo: 'REAL' },
    ],
    tariffs: [
      { tarifa: 'T1', fijoMesEur: 10, variableEurKwh: 0.15, vigenciaDesde: '2024-01-01' },
      { tarifa: 'T2', fijoMesEur: 12, variableEurKwh: 0.14, vigenciaDesde: '2024-01-01' },
    ],
    conversionFactors: [
      { id: 1, zona: 'Centro', mes: '2024-06', coefConv: 1.05, pcsKwhM3: 10.5 },
    ],
    taxes: [
      { taxCode: 'IVA21', taxRate: 0.21, vigenciaDesde: '2024-01-01' },
      { taxCode: 'IVA', taxRate: 0.21, vigenciaDesde: '2024-01-01' },
    ],
    invoices: [
      {
        numeroFactura: 'F-202406-0001',
        cups: 'ES1234567890123456',
        periodoInicio: '2024-06-01',
        periodoFin: '2024-06-30',
        base: 100,
        impuestos: 21,
        total: 121,
        fechaEmision: '2024-06-30',
        lines: [
          { id: 1, tipoLinea: 'ENERGIA', descripcion: 'Consumo', cantidad: 100, precioUnitario: 1, importe: 100 },
        ],
      },
    ],
    nextReadingId: 2,
    nextConversionFactorId: 2,
  };
}

function mergeState(seed?: Partial<MockState>): MockState {
  const base = defaultState();
  if (!seed) return base;
  return {
    ...base,
    ...seed,
    supplyPoints: seed.supplyPoints ?? base.supplyPoints,
    readings: seed.readings ?? base.readings,
    tariffs: seed.tariffs ?? base.tariffs,
    conversionFactors: seed.conversionFactors ?? base.conversionFactors,
    taxes: seed.taxes ?? base.taxes,
    invoices: seed.invoices ?? base.invoices,
    nextReadingId: seed.nextReadingId ?? base.nextReadingId,
    nextConversionFactorId: seed.nextConversionFactorId ?? base.nextConversionFactorId,
  };
}

function jsonResponse(route: Route, status: number, body: unknown): Promise<void> {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function emptyResponse(route: Route, status = 204): Promise<void> {
  return route.fulfill({ status });
}

async function readBody<T>(request: Request): Promise<T> {
  const raw = request.postData() ?? '{}';
  return JSON.parse(raw) as T;
}

function parsePath(url: string): { path: string; search: URLSearchParams } {
  const parsed = new URL(url);
  const fullPath = parsed.pathname;
  const apiBase = '/api/gas';
  const path = fullPath.startsWith(apiBase) ? fullPath.slice(apiBase.length) || '/' : fullPath;
  return { path, search: parsed.searchParams };
}

function startsWithPeriod(dateIso: string, period: string): boolean {
  return dateIso.startsWith(`${period}-`);
}

function runBilling(state: MockState, period: string, forcedErrors?: Array<{ cups: string; error: string }>): BillingResult {
  const errors: Array<{ cups: string; error: string }> = [];
  if (forcedErrors?.length) {
    return { period, invoicesCreated: 0, invoicesUpdated: 0, errors: forcedErrors };
  }

  const monthStart = `${period}-01`;
  const monthEnd = `${period}-30`;
  let invoicesCreated = 0;
  let invoicesUpdated = 0;

  const activeSupplyPoints = state.supplyPoints.filter((sp) => sp.estado === 'ACTIVO');

  for (const sp of activeSupplyPoints) {
    const reading = state.readings.find((r) => r.cups === sp.cups && startsWithPeriod(r.fecha, period));
    const tariff = state.tariffs.find((t) => t.tarifa === sp.tarifa);
    const factor = state.conversionFactors.find((f) => f.zona === sp.zona && f.mes === period);
    const tax = state.taxes[0];

    if (!reading) {
      errors.push({ cups: sp.cups, error: 'Falta lectura para el periodo' });
      continue;
    }
    if (!tariff) {
      errors.push({ cups: sp.cups, error: 'Falta tarifa para el punto de suministro' });
      continue;
    }
    if (!factor) {
      errors.push({ cups: sp.cups, error: 'Falta factor de conversión para la zona y periodo' });
      continue;
    }
    if (!tax) {
      errors.push({ cups: sp.cups, error: 'Falta impuesto configurado' });
      continue;
    }

    const kwh = reading.lecturaM3 * factor.coefConv * factor.pcsKwhM3;
    const base = Number((tariff.fijoMesEur + kwh * tariff.variableEurKwh).toFixed(2));
    const impuestos = Number((base * tax.taxRate).toFixed(2));
    const total = Number((base + impuestos).toFixed(2));
    const numeroFactura = `F-${period.replace('-', '')}-${sp.cups.slice(-4)}`;

    const invoice: Invoice = {
      numeroFactura,
      cups: sp.cups,
      periodoInicio: monthStart,
      periodoFin: monthEnd,
      base,
      impuestos,
      total,
      fechaEmision: monthEnd,
      lines: [
        {
          id: 1,
          tipoLinea: 'ENERGIA',
          descripcion: `Consumo ${period}`,
          cantidad: Number(kwh.toFixed(3)),
          precioUnitario: tariff.variableEurKwh,
          importe: Number((kwh * tariff.variableEurKwh).toFixed(2)),
        },
        {
          id: 2,
          tipoLinea: 'FIJO',
          descripcion: 'Término fijo',
          cantidad: 1,
          precioUnitario: tariff.fijoMesEur,
          importe: tariff.fijoMesEur,
        },
      ],
    };

    const existingIdx = state.invoices.findIndex((inv) => inv.numeroFactura === numeroFactura);
    if (existingIdx >= 0) {
      state.invoices[existingIdx] = invoice;
      invoicesUpdated += 1;
    } else {
      state.invoices.push(invoice);
      invoicesCreated += 1;
    }
  }

  return { period, invoicesCreated, invoicesUpdated, errors };
}

export async function installMockApi(page: Page, options: MockApiOptions = {}): Promise<void> {
  const state = mergeState(options.seed);

  await page.route('**/api/gas/**', async (route, request) => {
    const method = request.method();
    const { path, search } = parsePath(request.url());

    if (path === '/supply-points' && method === 'GET') {
      await jsonResponse(route, 200, state.supplyPoints);
      return;
    }

    if (path === '/supply-points' && method === 'POST') {
      const payload = await readBody<SupplyPoint>(request);
      const exists = state.supplyPoints.some((sp) => sp.cups === payload.cups);
      if (exists) {
        await jsonResponse(route, 409, { message: 'El CUPS ya existe' });
        return;
      }
      state.supplyPoints.push(payload);
      await jsonResponse(route, 201, payload);
      return;
    }

    if (path.startsWith('/supply-points/') && method === 'PUT') {
      const cups = decodeURIComponent(path.split('/').pop() ?? '');
      const payload = await readBody<SupplyPoint>(request);
      const idx = state.supplyPoints.findIndex((sp) => sp.cups === cups);
      if (idx < 0) {
        await jsonResponse(route, 404, { message: 'No encontrado' });
        return;
      }
      state.supplyPoints[idx] = payload;
      await jsonResponse(route, 200, payload);
      return;
    }

    if (path.startsWith('/supply-points/') && method === 'DELETE') {
      const cups = decodeURIComponent(path.split('/').pop() ?? '');
      state.supplyPoints = state.supplyPoints.filter((sp) => sp.cups !== cups);
      await emptyResponse(route);
      return;
    }

    if (path === '/readings' && method === 'GET') {
      const cups = search.get('cups');
      const data = cups ? state.readings.filter((r) => r.cups.includes(cups)) : state.readings;
      await jsonResponse(route, 200, data);
      return;
    }

    if (path === '/readings' && method === 'POST') {
      const payload = await readBody<Omit<Reading, 'id'>>(request);
      const exists = state.readings.some((r) => r.cups === payload.cups && r.fecha === payload.fecha);
      if (exists) {
        await jsonResponse(route, 409, { message: 'Ya existe una lectura para ese CUPS y fecha' });
        return;
      }
      const created: Reading = { id: state.nextReadingId++, ...payload };
      state.readings.push(created);
      await jsonResponse(route, 201, created);
      return;
    }

    if (path.startsWith('/readings/') && method === 'PUT') {
      const id = Number(path.split('/').pop());
      const payload = await readBody<Omit<Reading, 'id'>>(request);
      const idx = state.readings.findIndex((r) => r.id === id);
      if (idx < 0) {
        await jsonResponse(route, 404, { message: 'No encontrado' });
        return;
      }
      state.readings[idx] = { id, ...payload };
      await jsonResponse(route, 200, state.readings[idx]);
      return;
    }

    if (path.startsWith('/readings/') && method === 'DELETE') {
      const id = Number(path.split('/').pop());
      state.readings = state.readings.filter((r) => r.id !== id);
      await emptyResponse(route);
      return;
    }

    if (path === '/tariffs' && method === 'GET') {
      await jsonResponse(route, 200, state.tariffs);
      return;
    }

    if (path === '/tariffs' && method === 'POST') {
      const payload = await readBody<Tariff>(request);
      const exists = state.tariffs.some((t) => t.tarifa === payload.tarifa);
      if (exists) {
        await jsonResponse(route, 409, { message: 'Tarifa duplicada' });
        return;
      }
      state.tariffs.push(payload);
      await jsonResponse(route, 201, payload);
      return;
    }

    if (path.startsWith('/tariffs/') && method === 'PUT') {
      const code = decodeURIComponent(path.split('/').pop() ?? '');
      const payload = await readBody<Tariff>(request);
      const idx = state.tariffs.findIndex((t) => t.tarifa === code);
      if (idx < 0) {
        await jsonResponse(route, 404, { message: 'No encontrado' });
        return;
      }
      state.tariffs[idx] = payload;
      await jsonResponse(route, 200, payload);
      return;
    }

    if (path.startsWith('/tariffs/') && method === 'DELETE') {
      const code = decodeURIComponent(path.split('/').pop() ?? '');
      state.tariffs = state.tariffs.filter((t) => t.tarifa !== code);
      await emptyResponse(route);
      return;
    }

    if (path === '/conversion-factors' && method === 'GET') {
      const zona = search.get('zona');
      const mes = search.get('mes');
      let data = [...state.conversionFactors];
      if (zona) data = data.filter((f) => f.zona.includes(zona));
      if (mes) data = data.filter((f) => f.mes === mes);
      await jsonResponse(route, 200, data);
      return;
    }

    if (path === '/conversion-factors' && method === 'POST') {
      const payload = await readBody<Omit<ConversionFactor, 'id'>>(request);
      if (payload.coefConv <= 0 || payload.pcsKwhM3 <= 0) {
        await jsonResponse(route, 400, { message: 'Valores fuera de rango' });
        return;
      }
      const created: ConversionFactor = { id: state.nextConversionFactorId++, ...payload };
      state.conversionFactors.push(created);
      await jsonResponse(route, 201, created);
      return;
    }

    if (path.startsWith('/conversion-factors/') && method === 'PUT') {
      const id = Number(path.split('/').pop());
      const payload = await readBody<Omit<ConversionFactor, 'id'>>(request);
      const idx = state.conversionFactors.findIndex((f) => f.id === id);
      if (idx < 0) {
        await jsonResponse(route, 404, { message: 'No encontrado' });
        return;
      }
      state.conversionFactors[idx] = { id, ...payload };
      await jsonResponse(route, 200, state.conversionFactors[idx]);
      return;
    }

    if (path.startsWith('/conversion-factors/') && method === 'DELETE') {
      const id = Number(path.split('/').pop());
      state.conversionFactors = state.conversionFactors.filter((f) => f.id !== id);
      await emptyResponse(route);
      return;
    }

    if (path === '/taxes' && method === 'GET') {
      await jsonResponse(route, 200, state.taxes);
      return;
    }

    if (path === '/taxes' && method === 'POST') {
      const payload = await readBody<Tax>(request);
      if (payload.taxRate < 0 || payload.taxRate > 1) {
        await jsonResponse(route, 400, { message: 'Tasa fuera de rango' });
        return;
      }
      const exists = state.taxes.some((t) => t.taxCode === payload.taxCode);
      if (exists) {
        await jsonResponse(route, 409, { message: 'Impuesto duplicado' });
        return;
      }
      state.taxes.push(payload);
      await jsonResponse(route, 201, payload);
      return;
    }

    if (path.startsWith('/taxes/') && method === 'PUT') {
      const code = decodeURIComponent(path.split('/').pop() ?? '');
      const payload = await readBody<Tax>(request);
      const idx = state.taxes.findIndex((t) => t.taxCode === code);
      if (idx < 0) {
        await jsonResponse(route, 404, { message: 'No encontrado' });
        return;
      }
      state.taxes[idx] = payload;
      await jsonResponse(route, 200, payload);
      return;
    }

    if (path.startsWith('/taxes/') && method === 'DELETE') {
      const code = decodeURIComponent(path.split('/').pop() ?? '');
      state.taxes = state.taxes.filter((t) => t.taxCode !== code);
      await emptyResponse(route);
      return;
    }

    if (path === '/billing/run' && method === 'POST') {
      const period = search.get('period') ?? '';
      const result = runBilling(state, period, options.billingForcedErrors);
      await jsonResponse(route, 200, result);
      return;
    }

    if (path === '/invoices' && method === 'GET') {
      const cups = search.get('cups');
      const period = search.get('period');
      const fechaEmision = search.get('fechaEmision');

      let data = [...state.invoices];
      if (cups) data = data.filter((inv) => inv.cups.includes(cups));
      if (period) data = data.filter((inv) => inv.periodoInicio.startsWith(`${period}-`));
      if (fechaEmision) data = data.filter((inv) => inv.fechaEmision === fechaEmision);

      await jsonResponse(route, 200, data);
      return;
    }

    if (path.match(/^\/invoices\/[^/]+$/) && method === 'GET') {
      const id = decodeURIComponent(path.split('/').pop() ?? '');
      const invoice = state.invoices.find((inv) => inv.numeroFactura === id);
      if (!invoice) {
        await jsonResponse(route, 404, { message: 'No encontrado' });
        return;
      }
      await jsonResponse(route, 200, invoice);
      return;
    }

    if (path.match(/^\/invoices\/[^/]+\/pdf$/) && method === 'GET') {
      const id = decodeURIComponent(path.split('/')[2] ?? '');
      if (options.failPdfFor?.includes(id)) {
        await jsonResponse(route, 404, { message: 'No encontrado' });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: '%PDF-1.4\n%Mock PDF\n',
      });
      return;
    }

    await route.continue();
  });
}
