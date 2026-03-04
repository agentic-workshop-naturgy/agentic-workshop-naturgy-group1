import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
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
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
      setError(e instanceof Error ? e.message : t('invoices.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
      setError(e instanceof Error ? e.message : t('invoices.errorDetail'));
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
      setSuccessMsg(t('invoices.pdfDownloaded'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('invoices.errorPdf'));
    } finally {
      setPdfLoading(null);
    }
  }

  const columns: GridColDef<Invoice>[] = [
    { field: 'numeroFactura', headerName: t('invoices.invoiceNumber'), flex: 2, minWidth: 200 },
    { field: 'cups', headerName: t('invoices.cups'), flex: 2, minWidth: 180 },
    { field: 'periodoInicio', headerName: t('invoices.periodStart'), width: 130 },
    { field: 'periodoFin', headerName: t('invoices.periodEnd'), width: 120 },
    { field: 'base', headerName: t('invoices.base'), width: 110, renderCell: (p) => fmtEur(p.row.base) },
    { field: 'impuestos', headerName: t('invoices.taxes'), width: 130, renderCell: (p) => fmtEur(p.row.impuestos) },
    { field: 'total', headerName: t('invoices.total'), width: 110, renderCell: (p) => <Typography fontWeight={700}>{fmtEur(p.row.total)}</Typography> },
    { field: 'fechaEmision', headerName: t('invoices.issueDate'), width: 110 },
    {
      field: '_actions', headerName: '', width: 120, sortable: false, filterable: false,
      renderCell: (params) => (
        <Stack direction="row">
          <IconButton size="small" aria-label={t('invoices.viewDetail')} onClick={() => { void handleViewDetail(params.row); }}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label={t('invoices.downloadPdf')}
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
    { field: 'tipoLinea', headerName: t('invoices.lineType'), width: 160, renderCell: (p) => <Chip label={p.row.tipoLinea} size="small" variant="outlined" /> },
    { field: 'descripcion', headerName: t('invoices.lineDescription'), flex: 2, minWidth: 160 },
    { field: 'cantidad', headerName: t('invoices.lineQuantity'), width: 110, type: 'number', renderCell: (p) => p.row.cantidad.toLocaleString('es-ES', { maximumFractionDigits: 3 }) },
    { field: 'precioUnitario', headerName: t('invoices.lineUnitPrice'), width: 120, renderCell: (p) => fmtEur(p.row.precioUnitario) },
    { field: 'importe', headerName: t('invoices.lineAmount'), width: 120, renderCell: (p) => <Typography fontWeight={600}>{fmtEur(p.row.importe)}</Typography> },
  ];

  return (
    <Box>
      <PageHeader title={t('invoices.title')} />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} flexWrap="wrap" useFlexGap>
          <TextField label={t('invoices.filterCups')} value={filterCups} onChange={(e) => setFilterCups(e.target.value)} size="small" sx={{ minWidth: { sm: 200 } }} />
          <TextField label={t('invoices.filterPeriod')} value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} size="small" sx={{ minWidth: { sm: 160 } }} />
          <TextField label={t('invoices.filterDate')} value={filterFecha} onChange={(e) => setFilterFecha(e.target.value)} size="small" sx={{ minWidth: { sm: 200 } }} />
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<SearchIcon />} onClick={handleFilter}>{t('common.search')}</Button>
            <Button variant="text" onClick={handleClear}>{t('common.clear')}</Button>
          </Stack>
        </Stack>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(r) => r.numeroFactura}
        autoHeight
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        disableRowSelectionOnClick
        slots={{ noRowsOverlay: () => <Box sx={{ p: 3, textAlign: 'center' }}>{t('invoices.noInvoices')}</Box> }}
      />
      </Box>

      {/* Invoice Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PictureAsPdfIcon color="secondary" />
          {t('invoices.detailTitle')}
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
                <DetailRow label={t('invoices.invoiceNumber')} value={detailInvoice.numeroFactura} />
                <DetailRow label={t('invoices.cups')} value={detailInvoice.cups} />
                <DetailRow label={t('invoices.periodStart')} value={detailInvoice.periodoInicio} />
                <DetailRow label={t('invoices.periodEnd')} value={detailInvoice.periodoFin} />
                <DetailRow label={t('invoices.issueDate')} value={detailInvoice.fechaEmision} />
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">{t('invoices.baseAmount')}</Typography>
                    <Typography variant="h6">{fmtEur(detailInvoice.base)}</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">{t('invoices.taxAmount')}</Typography>
                    <Typography variant="h6">{fmtEur(detailInvoice.impuestos)}</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>{t('invoices.totalAmount')}</Typography>
                    <Typography variant="h5" fontWeight={700}>{fmtEur(detailInvoice.total)}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>{t('invoices.invoiceLines')}</Typography>

              {detailInvoice.lines && detailInvoice.lines.length > 0 ? (
                <DataGrid
                  rows={detailInvoice.lines}
                  columns={lineColumns}
                  autoHeight
                  hideFooter={detailInvoice.lines.length <= 10}
                  disableRowSelectionOnClick
                />
              ) : (
                <Typography color="text.secondary">{t('invoices.noLines')}</Typography>
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
              {t('invoices.downloadPdf')}
            </Button>
          )}
          <Button onClick={() => setDetailOpen(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={successMsg !== null} autoHideDuration={3000} onClose={() => setSuccessMsg(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSuccessMsg(null)}>{successMsg}</Alert>
      </Snackbar>
    </Box>
  );
}
