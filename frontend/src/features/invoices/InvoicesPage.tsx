import { useState, useEffect, useCallback } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '../../shared/ui/PageHeader';
import { invoicesApi } from './api';
import type { Invoice, InvoiceLine } from './types';

function fmtEur(val: number) {
  return val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

interface DetailField {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailField) {
  return (
    <Grid size={{ xs: 6, sm: 4 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={500}>{value}</Typography>
    </Grid>
  );
}

export function InvoicesPage() {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [filterCups, setFilterCups] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterFecha, setFilterFecha] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);

  const [pdfLoading, setPdfLoading] = useState<string | null>(null);

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
      setSuccessMsg('PDF descargado');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al descargar PDF');
    } finally {
      setPdfLoading(null);
    }
  }

  const columns: GridColDef<Invoice>[] = [
    { field: 'numeroFactura', headerName: 'Nº Factura', flex: 2, minWidth: 200 },
    { field: 'cups', headerName: 'CUPS', flex: 2, minWidth: 180 },
    { field: 'periodoInicio', headerName: 'Periodo Inicio', width: 130 },
    { field: 'periodoFin', headerName: 'Periodo Fin', width: 120 },
    { field: 'base', headerName: 'Base (€)', width: 110, renderCell: (p) => fmtEur(p.row.base) },
    { field: 'impuestos', headerName: 'Impuestos (€)', width: 130, renderCell: (p) => fmtEur(p.row.impuestos) },
    { field: 'total', headerName: 'Total (€)', width: 110, renderCell: (p) => <Typography fontWeight={700}>{fmtEur(p.row.total)}</Typography> },
    { field: 'fechaEmision', headerName: 'Emisión', width: 110 },
    {
      field: '_actions', headerName: '', width: 120, sortable: false, filterable: false,
      renderCell: (params) => (
        <Stack direction="row">
          <IconButton size="small" aria-label="ver detalle" onClick={() => { void handleViewDetail(params.row); }}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label="descargar PDF"
            color="secondary"
            onClick={() => { void handleDownloadPdf(params.row.numeroFactura); }}
            disabled={pdfLoading === params.row.numeroFactura}
          >
            {pdfLoading === params.row.numeroFactura
              ? <CircularProgress size={16} />
              : <DownloadIcon fontSize="small" />}
          </IconButton>
        </Stack>
      ),
    },
  ];

  const lineColumns: GridColDef<InvoiceLine>[] = [
    { field: 'tipoLinea', headerName: 'Tipo', width: 160, renderCell: (p) => <Chip label={p.row.tipoLinea} size="small" variant="outlined" /> },
    { field: 'descripcion', headerName: 'Descripción', flex: 2, minWidth: 160 },
    { field: 'cantidad', headerName: 'Cantidad', width: 110, type: 'number', renderCell: (p) => p.row.cantidad.toLocaleString('es-ES', { maximumFractionDigits: 3 }) },
    { field: 'precioUnitario', headerName: 'Precio Unit.', width: 120, renderCell: (p) => fmtEur(p.row.precioUnitario) },
    { field: 'importe', headerName: 'Importe (€)', width: 120, renderCell: (p) => <Typography fontWeight={600}>{fmtEur(p.row.importe)}</Typography> },
  ];

  return (
    <Box>
      <PageHeader title="Facturas" />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          <TextField label="CUPS" value={filterCups} onChange={(e) => setFilterCups(e.target.value)} size="small" sx={{ minWidth: 200 }} />
          <TextField label="Periodo (YYYY-MM)" value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} size="small" sx={{ minWidth: 160 }} />
          <TextField label="Fecha Emisión (YYYY-MM-DD)" value={filterFecha} onChange={(e) => setFilterFecha(e.target.value)} size="small" sx={{ minWidth: 200 }} />
          <Button variant="outlined" startIcon={<SearchIcon />} onClick={handleFilter}>Buscar</Button>
          <Button variant="text" onClick={handleClear}>Limpiar</Button>
        </Stack>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(r) => r.numeroFactura}
        autoHeight
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        disableRowSelectionOnClick
        slots={{ noRowsOverlay: () => <Box sx={{ p: 3, textAlign: 'center' }}>Sin facturas. Ejecuta la facturación primero.</Box> }}
      />

      {/* Invoice Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PictureAsPdfIcon color="secondary" />
          Detalle de Factura
          {detailInvoice && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {detailInvoice.numeroFactura}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {detailLoading && <LinearProgress />}
          {detailInvoice && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <DetailRow label="Nº Factura" value={detailInvoice.numeroFactura} />
                <DetailRow label="CUPS" value={detailInvoice.cups} />
                <DetailRow label="Periodo Inicio" value={detailInvoice.periodoInicio} />
                <DetailRow label="Periodo Fin" value={detailInvoice.periodoFin} />
                <DetailRow label="Fecha Emisión" value={detailInvoice.fechaEmision} />
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Base Imponible</Typography>
                    <Typography variant="h6">{fmtEur(detailInvoice.base)}</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Impuestos</Typography>
                    <Typography variant="h6">{fmtEur(detailInvoice.impuestos)}</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Total</Typography>
                    <Typography variant="h5" fontWeight={700}>{fmtEur(detailInvoice.total)}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Líneas de Factura</Typography>

              {detailInvoice.lines && detailInvoice.lines.length > 0 ? (
                <DataGrid
                  rows={detailInvoice.lines}
                  columns={lineColumns}
                  autoHeight
                  hideFooter={detailInvoice.lines.length <= 10}
                  disableRowSelectionOnClick
                />
              ) : (
                <Typography color="text.secondary">Sin líneas de detalle</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {detailInvoice && (
            <Button
              variant="outlined"
              startIcon={pdfLoading === detailInvoice.numeroFactura ? <CircularProgress size={16} /> : <DownloadIcon />}
              onClick={() => { void handleDownloadPdf(detailInvoice.numeroFactura); }}
              disabled={pdfLoading === detailInvoice.numeroFactura}
            >
              Descargar PDF
            </Button>
          )}
          <Button onClick={() => setDetailOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={successMsg !== null} autoHideDuration={3000} onClose={() => setSuccessMsg(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSuccessMsg(null)}>{successMsg}</Alert>
      </Snackbar>
    </Box>
  );
}
