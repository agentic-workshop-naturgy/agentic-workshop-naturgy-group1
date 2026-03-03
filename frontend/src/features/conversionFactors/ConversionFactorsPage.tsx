import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '../../shared/ui/PageHeader';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { conversionFactorsApi } from './api';
import type { ConversionFactor, ConversionFactorForm } from './types';

const DEFAULT_FORM: ConversionFactorForm = { zona: '', mes: '', coefConv: '', pcsKwhM3: '' };
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function validate(form: ConversionFactorForm, t: (k: string) => string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.zona.trim()) errors.zona = t('conversionFactors.zoneRequired');
  if (!form.mes.trim()) errors.mes = t('conversionFactors.monthRequired');
  else if (!MONTH_RE.test(form.mes)) errors.mes = t('conversionFactors.monthRequired');
  if (!form.coefConv.trim()) errors.coefConv = t('conversionFactors.coefRequired');
  else if (isNaN(Number(form.coefConv)) || Number(form.coefConv) <= 0) errors.coefConv = t('conversionFactors.coefPositive');
  if (!form.pcsKwhM3.trim()) errors.pcsKwhM3 = t('conversionFactors.pcsRequired');
  else if (isNaN(Number(form.pcsKwhM3)) || Number(form.pcsKwhM3) <= 0) errors.pcsKwhM3 = t('conversionFactors.pcsPositive');
  return errors;
}

export function ConversionFactorsPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<ConversionFactor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [filterZona, setFilterZona] = useState('');
  const [filterMes, setFilterMes] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ConversionFactorForm>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ConversionFactor | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async (zona?: string, mes?: string) => {
    setLoading(true);
    setError(null);
    try {
      setRows(await conversionFactorsApi.getAll(zona, mes));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void loadData(); }, [loadData]);

  function handleFilter() { void loadData(filterZona || undefined, filterMes || undefined); }

  function handleOpenCreate() {
    setEditingId(null);
    setFormData(DEFAULT_FORM);
    setFormErrors({});
    setFormOpen(true);
  }

  function handleOpenEdit(row: ConversionFactor) {
    setEditingId(row.id);
    setFormData({ zona: row.zona, mes: row.mes, coefConv: String(row.coefConv), pcsKwhM3: String(row.pcsKwhM3) });
    setFormErrors({});
    setFormOpen(true);
  }

  async function handleSave() {
    const errors = validate(formData, t);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    const payload = { zona: formData.zona, mes: formData.mes, coefConv: Number(formData.coefConv), pcsKwhM3: Number(formData.pcsKwhM3) };
    setSaving(true);
    try {
      if (editingId !== null) {
        await conversionFactorsApi.update(editingId, payload);
        setSuccessMsg(t('conversionFactors.updated'));
      } else {
        await conversionFactorsApi.create(payload);
        setSuccessMsg(t('conversionFactors.created'));
      }
      setFormOpen(false);
      await loadData(filterZona || undefined, filterMes || undefined);
    } catch (e) {
      setFormErrors({ _global: e instanceof Error ? e.message : t('common.errorSaving') });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await conversionFactorsApi.delete(deleteTarget.id);
      setSuccessMsg(t('conversionFactors.deleted'));
      setDeleteTarget(null);
      await loadData(filterZona || undefined, filterMes || undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.errorDeleting'));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const columns: GridColDef<ConversionFactor>[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'zona', headerName: t('conversionFactors.zone'), flex: 1, minWidth: 100 },
    { field: 'mes', headerName: t('conversionFactors.month'), width: 110 },
    { field: 'coefConv', headerName: t('conversionFactors.coefConv'), flex: 1, minWidth: 120, type: 'number' },
    { field: 'pcsKwhM3', headerName: t('conversionFactors.pcsKwhM3'), flex: 1, minWidth: 130, type: 'number' },
    {
      field: '_actions', headerName: '', width: 100, sortable: false, filterable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" aria-label="editar" onClick={() => handleOpenEdit(params.row)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" aria-label="eliminar" color="error" onClick={() => setDeleteTarget(params.row)}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title={t('conversionFactors.title')} action={<Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>{t('conversionFactors.newBtn')}</Button>} />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField label={t('conversionFactors.zone')} value={filterZona} onChange={(e) => setFilterZona(e.target.value)} size="small" sx={{ minWidth: 150 }} />
          <TextField label={t('conversionFactors.monthFormat')} value={filterMes} onChange={(e) => setFilterMes(e.target.value)} size="small" sx={{ minWidth: 150 }} />
          <Button variant="outlined" startIcon={<SearchIcon />} onClick={handleFilter}>{t('common.search')}</Button>
          <Button variant="text" onClick={() => { setFilterZona(''); setFilterMes(''); void loadData(); }}>{t('common.clear')}</Button>
        </Stack>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <DataGrid rows={rows} columns={columns} autoHeight pageSizeOptions={[10, 25]} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} disableRowSelectionOnClick slots={{ noRowsOverlay: () => <Box sx={{ p: 3, textAlign: 'center' }}>{t('common.noData')}</Box> }} />

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId !== null ? t('conversionFactors.editTitle') : t('conversionFactors.createTitle')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {formErrors._global && <Alert severity="error">{formErrors._global}</Alert>}
          <TextField label={t('conversionFactors.zone')} value={formData.zona} onChange={(e) => setFormData((p) => ({ ...p, zona: e.target.value }))} error={!!formErrors.zona} helperText={formErrors.zona} required fullWidth />
          <TextField label={t('conversionFactors.monthFormat')} value={formData.mes} onChange={(e) => setFormData((p) => ({ ...p, mes: e.target.value }))} error={!!formErrors.mes} helperText={formErrors.mes ?? t('conversionFactors.monthExample')} required fullWidth />
          <TextField label={t('conversionFactors.coefConv')} value={formData.coefConv} onChange={(e) => setFormData((p) => ({ ...p, coefConv: e.target.value }))} error={!!formErrors.coefConv} helperText={formErrors.coefConv} inputProps={{ inputMode: 'decimal' }} required fullWidth />
          <TextField label={t('conversionFactors.pcsKwhM3')} value={formData.pcsKwhM3} onChange={(e) => setFormData((p) => ({ ...p, pcsKwhM3: e.target.value }))} error={!!formErrors.pcsKwhM3} helperText={formErrors.pcsKwhM3} inputProps={{ inputMode: 'decimal' }} required fullWidth />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)} disabled={saving}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={() => { void handleSave(); }} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}>{t('common.save')}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={deleteTarget !== null} title={t('conversionFactors.deleteTitle')} message={t('conversionFactors.deleteMsg', { id: deleteTarget?.id ?? '' })} onConfirm={() => { void handleDeleteConfirm(); }} onCancel={() => setDeleteTarget(null)} loading={deleting} />

      <Snackbar open={successMsg !== null} autoHideDuration={3000} onClose={() => setSuccessMsg(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSuccessMsg(null)}>{successMsg}</Alert>
      </Snackbar>
    </Box>
  );
}
