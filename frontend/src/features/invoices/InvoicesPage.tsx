import { useState, useEffect, useCallback, useMemo } from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Divider from '@mui/material/Divider';
import Fade from '@mui/material/Fade';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import EuroIcon from '@mui/icons-material/Euro';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import GasMeterIcon from '@mui/icons-material/GasMeter';
import CloseIcon from '@mui/icons-material/Close';
import DateRangeIcon from '@mui/icons-material/DateRange';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '../../shared/ui/PageHeader';
import { invoicesApi } from './api';
import type { Invoice, InvoiceLine } from './types';

/* ── Helpers ───────────────────────────────────────────────── */

function fmtEur(val: number) {
  return val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

function fmtNum(val: number, decimals = 3) {
  return val.toLocaleString('es-ES', { maximumFractionDigits: decimals });
}

/* ── Summary card used at the top ──────────────────────────── */

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}

function SummaryCard({ icon, label, value, color, bgColor }: SummaryCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        flex: 1,
        minWidth: 180,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        transition: 'box-shadow 0.2s, transform 0.2s',
        '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
        <Avatar sx={{ bgcolor: bgColor, color, width: 48, height: 48 }}>
          {icon}
        </Avatar>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
            {label}
          </Typography>
          <Typography variant="h6" fontWeight={700} color={color}>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

/* ── Detail field inside the dialog ────────────────────────── */

interface DetailField {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

function DetailRow({ label, value, icon }: DetailField) {
  return (
    <Grid size={{ xs: 6, sm: 4 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        {icon}
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.4, fontSize: '0.68rem' }}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="body2" fontWeight={600}>{value}</Typography>
    </Grid>
  );
}

/* ── Line type chip color mapping ──────────────────────────── */

function lineTypeColor(tipo: string): 'primary' | 'secondary' | 'warning' | 'info' | 'default' {
  const t = tipo.toLowerCase();
  if (t.includes('fijo') || t.includes('term_fijo')) return 'primary';
  if (t.includes('variable') || t.includes('term_variable')) return 'secondary';
  if (t.includes('impuesto') || t.includes('iva') || t.includes('ieh')) return 'warning';
  return 'info';
}

/* ================================================================
   InvoicesPage – Main component
   ================================================================ */

export function InvoicesPage() {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [filterCups, setFilterCups] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterFecha, setFilterFecha] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);

  const [pdfLoading, setPdfLoading] = useState<string | null>(null);

  /* ── Derived stats ───────────────────────────────────────── */
  const stats = useMemo(() => {
    const count = rows.length;
    const totalBase = rows.reduce((s, r) => s + r.base, 0);
    const totalTax = rows.reduce((s, r) => s + r.impuestos, 0);
    const totalAmount = rows.reduce((s, r) => s + r.total, 0);
    return { count, totalBase, totalTax, totalAmount };
  }, [rows]);

  const hasActiveFilters = !!(filterCups || filterPeriod || filterFecha);

  /* ── Data fetching ───────────────────────────────────────── */

  const loadData = useCallback(async (cups?: string, period?: string, fechaEmision?: string) => {
    setLoading(true);
    setError(null);
    try {
      setRows(await invoicesApi.getAll(cups, period, fechaEmision));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  function handleFilter() {
    void loadData(filterCups || undefined, filterPeriod || undefined, filterFecha || undefined);
  }

  function handleClear() {
    setFilterCups('');
    setFilterPeriod('');
    setFilterFecha('');
    void loadData();
  }

  async function handleViewDetail(invoice: Invoice) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailInvoice(null);
    try {
      const full = await invoicesApi.getOne(invoice.numeroFactura);
      setDetailInvoice(full);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar detalle');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleDownloadPdf(invoiceId: string) {
    setPdfLoading(invoiceId);
    try {
      const blob = await invoicesApi.downloadPdf(invoiceId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMsg('PDF descargado correctamente');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al descargar PDF');
    } finally {
      setPdfLoading(null);
    }
  }

  /* ── Column definitions ──────────────────────────────────── */

  const columns: GridColDef<Invoice>[] = [
    {
      field: 'numeroFactura',
      headerName: 'Nº Factura',
      flex: 2,
      minWidth: 220,
      renderCell: (p) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <ReceiptLongIcon sx={{ fontSize: 18, color: 'primary.main', opacity: 0.7 }} />
          <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace', letterSpacing: -0.3 }}>
            {p.row.numeroFactura}
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'cups',
      headerName: 'CUPS',
      flex: 2,
      minWidth: 180,
      renderCell: (p) => (
        <Chip
          label={p.row.cups}
          size="small"
          variant="outlined"
          sx={{ fontFamily: 'monospace', fontSize: '0.75rem', borderColor: 'divider' }}
        />
      ),
    },
    {
      field: 'periodoInicio',
      headerName: 'Periodo',
      width: 190,
      renderCell: (p) => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <DateRangeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2">
            {p.row.periodoInicio} — {p.row.periodoFin}
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'base',
      headerName: 'Base (€)',
      width: 120,
      headerAlign: 'right',
      align: 'right',
      renderCell: (p) => (
        <Typography variant="body2" color="text.secondary">{fmtEur(p.row.base)}</Typography>
      ),
    },
    {
      field: 'impuestos',
      headerName: 'Impuestos (€)',
      width: 130,
      headerAlign: 'right',
      align: 'right',
      renderCell: (p) => (
        <Typography variant="body2" color="text.secondary">{fmtEur(p.row.impuestos)}</Typography>
      ),
    },
    {
      field: 'total',
      headerName: 'Total (€)',
      width: 130,
      headerAlign: 'right',
      align: 'right',
      renderCell: (p) => (
        <Box
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            px: 1.5,
            py: 0.4,
            borderRadius: 2,
            fontWeight: 700,
            fontSize: '0.85rem',
          }}
        >
          {fmtEur(p.row.total)}
        </Box>
      ),
    },
    {
      field: 'fechaEmision',
      headerName: 'Emisión',
      width: 120,
      renderCell: (p) => (
        <Typography variant="body2" color="text.secondary">{p.row.fechaEmision}</Typography>
      ),
    },
    {
      field: '_actions',
      headerName: 'Acciones',
      width: 130,
      sortable: false,
      filterable: false,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Ver detalle" arrow>
            <IconButton
              size="small"
              onClick={() => { void handleViewDetail(params.row); }}
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.dark' },
                width: 32,
                height: 32,
              }}
            >
              <VisibilityIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Descargar PDF" arrow>
            <IconButton
              size="small"
              onClick={() => { void handleDownloadPdf(params.row.numeroFactura); }}
              disabled={pdfLoading === params.row.numeroFactura}
              sx={{
                bgcolor: 'secondary.main',
                color: 'secondary.contrastText',
                '&:hover': { bgcolor: 'secondary.dark' },
                width: 32,
                height: 32,
              }}
            >
              {pdfLoading === params.row.numeroFactura
                ? <CircularProgress size={14} color="inherit" />
                : <DownloadIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const lineColumns: GridColDef<InvoiceLine>[] = [
    {
      field: 'tipoLinea',
      headerName: 'Tipo',
      width: 180,
      renderCell: (p) => (
        <Chip
          label={p.row.tipoLinea}
          size="small"
          color={lineTypeColor(p.row.tipoLinea)}
          variant="filled"
          sx={{ fontWeight: 600, fontSize: '0.72rem' }}
        />
      ),
    },
    { field: 'descripcion', headerName: 'Descripción', flex: 2, minWidth: 180 },
    {
      field: 'cantidad',
      headerName: 'Cantidad',
      width: 120,
      type: 'number',
      headerAlign: 'right',
      align: 'right',
      renderCell: (p) => fmtNum(p.row.cantidad),
    },
    {
      field: 'precioUnitario',
      headerName: 'Precio Unit.',
      width: 130,
      headerAlign: 'right',
      align: 'right',
      renderCell: (p) => fmtEur(p.row.precioUnitario),
    },
    {
      field: 'importe',
      headerName: 'Importe (€)',
      width: 130,
      headerAlign: 'right',
      align: 'right',
      renderCell: (p) => (
        <Typography fontWeight={700} variant="body2" color="primary">
          {fmtEur(p.row.importe)}
        </Typography>
      ),
    },
  ];

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <Box>
      <PageHeader
        title="Facturas"
        action={
          <Chip
            icon={<ReceiptLongIcon />}
            label={`${stats.count} factura${stats.count !== 1 ? 's' : ''}`}
            color="primary"
            variant="outlined"
          />
        }
      />

      {/* ── Summary cards ─────────────────────────────────── */}
      <Fade in={!loading && rows.length > 0}>
        <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap" useFlexGap>
          <SummaryCard
            icon={<ReceiptLongIcon />}
            label="Total Facturas"
            value={String(stats.count)}
            color="#002855"
            bgColor="#E8EEF5"
          />
          <SummaryCard
            icon={<AccountBalanceIcon />}
            label="Base Imponible"
            value={fmtEur(stats.totalBase)}
            color="#1A4A7A"
            bgColor="#E8EEF5"
          />
          <SummaryCard
            icon={<TrendingUpIcon />}
            label="Impuestos"
            value={fmtEur(stats.totalTax)}
            color="#F39200"
            bgColor="#FEF3E0"
          />
          <SummaryCard
            icon={<EuroIcon />}
            label="Importe Total"
            value={fmtEur(stats.totalAmount)}
            color="#64BE28"
            bgColor="#EDF7E4"
          />
        </Stack>
      </Fade>

      {/* ── Filter bar ────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          border: '1px solid',
          borderColor: hasActiveFilters ? 'secondary.main' : 'divider',
          borderRadius: 3,
          overflow: 'hidden',
          transition: 'border-color 0.3s',
        }}
      >
        <Box
          onClick={() => setFiltersOpen((o) => !o)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2.5,
            py: 1.5,
            cursor: 'pointer',
            bgcolor: hasActiveFilters ? 'rgba(100,190,40,0.06)' : 'transparent',
            transition: 'background-color 0.3s',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <FilterListIcon sx={{ mr: 1, color: hasActiveFilters ? 'secondary.main' : 'text.secondary' }} />
          <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
            Filtros
            {hasActiveFilters && (
              <Chip label="activos" size="small" color="secondary" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />
            )}
          </Typography>
          {filtersOpen ? <ExpandLessIcon color="action" /> : <ExpandMoreIcon color="action" />}
        </Box>

        <Collapse in={filtersOpen}>
          <Divider />
          <Box sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
              <TextField
                label="CUPS"
                placeholder="ES00..."
                value={filterCups}
                onChange={(e) => setFilterCups(e.target.value)}
                size="small"
                sx={{ minWidth: 220 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <GasMeterIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label="Periodo"
                placeholder="YYYY-MM"
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                size="small"
                sx={{ minWidth: 160 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarMonthIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label="Fecha Emisión"
                placeholder="YYYY-MM-DD"
                value={filterFecha}
                onChange={(e) => setFilterFecha(e.target.value)}
                size="small"
                sx={{ minWidth: 200 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <DateRangeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button
                variant="contained"
                color="primary"
                startIcon={<SearchIcon />}
                onClick={handleFilter}
                sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
              >
                Buscar
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleClear}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Limpiar
                </Button>
              )}
            </Stack>
          </Box>
        </Collapse>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Data grid ─────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(r) => r.numeroFactura}
          autoHeight
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#F8F9FA',
              borderBottom: '2px solid',
              borderColor: 'divider',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              color: 'text.secondary',
            },
            '& .MuiDataGrid-row': {
              transition: 'background-color 0.15s',
              '&:hover': { bgcolor: 'rgba(0,40,85,0.04)' },
            },
            '& .MuiDataGrid-row:nth-of-type(even)': {
              bgcolor: 'rgba(0,0,0,0.015)',
            },
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
              borderColor: 'rgba(0,0,0,0.06)',
            },
          }}
          slots={{
            noRowsOverlay: () => (
              <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', py: 6 }}>
                <ReceiptLongIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary" fontWeight={500}>
                  Sin facturas disponibles
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Ejecuta la facturación para generar facturas
                </Typography>
              </Stack>
            ),
          }}
        />
      </Paper>

      {/* ── Invoice Detail Dialog ─────────────────────────── */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, overflow: 'hidden' },
        }}
      >
        {/* Dialog header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #002855 0%, #1A4A7A 100%)',
            color: '#fff',
            px: 3,
            py: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 40, height: 40 }}>
            <PictureAsPdfIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight={700}>
              Detalle de Factura
            </Typography>
            {detailInvoice && (
              <Typography variant="body2" sx={{ opacity: 0.8, fontFamily: 'monospace' }}>
                {detailInvoice.numeroFactura}
              </Typography>
            )}
          </Box>
          <IconButton onClick={() => setDetailOpen(false)} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff' } }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          {detailLoading && <LinearProgress />}
          {detailInvoice && (
            <Box sx={{ p: 3 }}>
              {/* Detail fields */}
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
                <Grid container spacing={2.5}>
                  <DetailRow icon={<ReceiptLongIcon sx={{ fontSize: 14, color: 'primary.main' }} />} label="Nº Factura" value={detailInvoice.numeroFactura} />
                  <DetailRow icon={<GasMeterIcon sx={{ fontSize: 14, color: 'primary.main' }} />} label="CUPS" value={detailInvoice.cups} />
                  <DetailRow icon={<CalendarMonthIcon sx={{ fontSize: 14, color: 'primary.main' }} />} label="Periodo Inicio" value={detailInvoice.periodoInicio} />
                  <DetailRow icon={<CalendarMonthIcon sx={{ fontSize: 14, color: 'primary.main' }} />} label="Periodo Fin" value={detailInvoice.periodoFin} />
                  <DetailRow icon={<DateRangeIcon sx={{ fontSize: 14, color: 'primary.main' }} />} label="Fecha Emisión" value={detailInvoice.fechaEmision} />
                </Grid>
              </Paper>

              {/* Totals row */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      textAlign: 'center',
                      borderRadius: 2,
                      borderColor: 'divider',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-2px)' },
                    }}
                  >
                    <AccountBalanceIcon sx={{ fontSize: 28, color: 'primary.light', mb: 0.5 }} />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5 }}>
                      Base Imponible
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="primary.main">
                      {fmtEur(detailInvoice.base)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      textAlign: 'center',
                      borderRadius: 2,
                      borderColor: 'divider',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-2px)' },
                    }}
                  >
                    <TrendingUpIcon sx={{ fontSize: 28, color: 'warning.main', mb: 0.5 }} />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5 }}>
                      Impuestos
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="warning.main">
                      {fmtEur(detailInvoice.impuestos)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper
                    sx={{
                      p: 2.5,
                      textAlign: 'center',
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #002855 0%, #1A4A7A 100%)',
                      color: '#fff',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-2px)' },
                    }}
                  >
                    <EuroIcon sx={{ fontSize: 28, opacity: 0.8, mb: 0.5 }} />
                    <Typography variant="caption" display="block" sx={{ opacity: 0.8, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5 }}>
                      Total
                    </Typography>
                    <Typography variant="h5" fontWeight={800}>
                      {fmtEur(detailInvoice.total)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Lines section */}
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <ReceiptLongIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700}>
                  Líneas de Factura
                </Typography>
                {detailInvoice.lines && (
                  <Chip label={detailInvoice.lines.length} size="small" color="primary" variant="outlined" sx={{ height: 22 }} />
                )}
              </Stack>

              {detailInvoice.lines && detailInvoice.lines.length > 0 ? (
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  <DataGrid
                    rows={detailInvoice.lines}
                    columns={lineColumns}
                    autoHeight
                    hideFooter={detailInvoice.lines.length <= 10}
                    disableRowSelectionOnClick
                    sx={{
                      border: 'none',
                      '& .MuiDataGrid-columnHeaders': { bgcolor: '#F8F9FA' },
                      '& .MuiDataGrid-columnHeaderTitle': {
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.4,
                        color: 'text.secondary',
                      },
                      '& .MuiDataGrid-row:nth-of-type(even)': { bgcolor: 'rgba(0,0,0,0.015)' },
                    }}
                  />
                </Paper>
              ) : (
                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                  <Typography color="text.secondary">Sin líneas de detalle</Typography>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          {detailInvoice && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={pdfLoading === detailInvoice.numeroFactura ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
              onClick={() => { void handleDownloadPdf(detailInvoice.numeroFactura); }}
              disabled={pdfLoading === detailInvoice.numeroFactura}
              sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
            >
              Descargar PDF
            </Button>
          )}
          <Button onClick={() => setDetailOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Success snackbar ──────────────────────────────── */}
      <Snackbar open={successMsg !== null} autoHideDuration={3000} onClose={() => setSuccessMsg(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setSuccessMsg(null)} sx={{ borderRadius: 2 }}>
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
