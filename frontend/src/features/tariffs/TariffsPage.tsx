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
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '../../shared/ui/PageHeader';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { tariffsApi } from './api';
import type { GasTariff, GasTariffForm } from './types';

const DEFAULT_FORM: GasTariffForm = { tarifa: '', fijoMesEur: '', variableEurKwh: '', vigenciaDesde: '' };
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function validate(form: GasTariffForm, isEdit: boolean, t: (key: string) => string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!isEdit && !form.tarifa.trim()) errors.tarifa = t('tariffs.codigoRequired');
  if (!form.fijoMesEur.trim()) errors.fijoMesEur = t('tariffs.required');
  else if (isNaN(Number(form.fijoMesEur)) || Number(form.fijoMesEur) < 0) errors.fijoMesEur = t('tariffs.mustBePositive');
  if (!form.variableEurKwh.trim()) errors.variableEurKwh = t('tariffs.required');
  else if (isNaN(Number(form.variableEurKwh)) || Number(form.variableEurKwh) < 0) errors.variableEurKwh = t('tariffs.mustBePositive');
  if (!form.vigenciaDesde.trim()) errors.vigenciaDesde = t('tariffs.vigenciaRequired');
  else if (!DATE_RE.test(form.vigenciaDesde)) errors.vigenciaDesde = t('tariffs.vigenciaFormat');
  return errors;
}

function fmtEur(val: number) {
  return val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

export function TariffsPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<GasTariff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTarifa, setEditingTarifa] = useState<string | null>(null);
  const [formData, setFormData] = useState<GasTariffForm>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<GasTariff | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await tariffsApi.getAll());
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  function handleOpenCreate() {
    setEditingTarifa(null);
    setFormData(DEFAULT_FORM);
    setFormErrors({});
    setFormOpen(true);
  }

  function handleOpenEdit(row: GasTariff) {
    setEditingTarifa(row.tarifa);
    setFormData({ tarifa: row.tarifa, fijoMesEur: String(row.fijoMesEur), variableEurKwh: String(row.variableEurKwh), vigenciaDesde: row.vigenciaDesde });
    setFormErrors({});
    setFormOpen(true);
  }

  async function handleSave() {
    const errors = validate(formData, editingTarifa !== null, t);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    const payload: GasTariff = { tarifa: formData.tarifa, fijoMesEur: Number(formData.fijoMesEur), variableEurKwh: Number(formData.variableEurKwh), vigenciaDesde: formData.vigenciaDesde };
    setSaving(true);
    try {
      if (editingTarifa !== null) {
        await tariffsApi.update(editingTarifa, payload);
        setSuccessMsg(t('tariffs.updated'));
      } else {
        await tariffsApi.create(payload);
        setSuccessMsg(t('tariffs.created'));
      }
      setFormOpen(false);
      await loadData();
    } catch (e) {
      setFormErrors({ _global: e instanceof Error ? e.message : t('common.errorSave') });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await tariffsApi.delete(deleteTarget.tarifa);
      setSuccessMsg(t('tariffs.deleted'));
      setDeleteTarget(null);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.errorDelete'));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const columns: GridColDef<GasTariff>[] = [
    { field: 'tarifa', headerName: t('tariffs.colTarifa'), width: 120 },
    { field: 'fijoMesEur', headerName: t('tariffs.colFijoMes'), flex: 1, minWidth: 130, renderCell: (p) => fmtEur(p.row.fijoMesEur) },
    { field: 'variableEurKwh', headerName: t('tariffs.colVariableKwh'), flex: 1, minWidth: 160, renderCell: (p) => fmtEur(p.row.variableEurKwh) },
    { field: 'vigenciaDesde', headerName: t('tariffs.colVigenciaDesde'), width: 140 },
    {
      field: '_actions', headerName: '', width: 100, sortable: false, filterable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" aria-label={t('common.save')} onClick={() => handleOpenEdit(params.row)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" aria-label={t('common.delete')} color="error" onClick={() => setDeleteTarget(params.row)}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title={t('tariffs.title')} action={<Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>{t('tariffs.newTariff')}</Button>} />
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <DataGrid rows={rows} columns={columns} getRowId={(r) => r.tarifa} autoHeight pageSizeOptions={[10, 25]} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} disableRowSelectionOnClick slots={{ noRowsOverlay: () => <Box sx={{ p: 3, textAlign: 'center' }}>{t('common.noData')}</Box> }} />

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTarifa ? t('tariffs.editTariff') : t('tariffs.newTariff')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {formErrors._global && <Alert severity="error">{formErrors._global}</Alert>}
          <TextField label={t('tariffs.codigoTarifa')} value={formData.tarifa} onChange={(e) => setFormData((p) => ({ ...p, tarifa: e.target.value }))} error={!!formErrors.tarifa} helperText={formErrors.tarifa ?? t('tariffs.helperCodigo')} disabled={editingTarifa !== null} required fullWidth />
          <TextField label={t('tariffs.fijoMes')} value={formData.fijoMesEur} onChange={(e) => setFormData((p) => ({ ...p, fijoMesEur: e.target.value }))} error={!!formErrors.fijoMesEur} helperText={formErrors.fijoMesEur} inputProps={{ inputMode: 'decimal' }} required fullWidth />
          <TextField label={t('tariffs.variableKwh')} value={formData.variableEurKwh} onChange={(e) => setFormData((p) => ({ ...p, variableEurKwh: e.target.value }))} error={!!formErrors.variableEurKwh} helperText={formErrors.variableEurKwh} inputProps={{ inputMode: 'decimal' }} required fullWidth />
          <TextField label={t('tariffs.vigenciaDesde')} value={formData.vigenciaDesde} onChange={(e) => setFormData((p) => ({ ...p, vigenciaDesde: e.target.value }))} error={!!formErrors.vigenciaDesde} helperText={formErrors.vigenciaDesde ?? t('tariffs.helperVigencia')} required fullWidth />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)} disabled={saving}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={() => { void handleSave(); }} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}>{t('common.save')}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={deleteTarget !== null} title={t('tariffs.deleteTitle')} message={t('tariffs.deleteMessage', { tarifa: deleteTarget?.tarifa ?? '' })} onConfirm={() => { void handleDeleteConfirm(); }} onCancel={() => setDeleteTarget(null)} loading={deleting} />

      <Snackbar open={successMsg !== null} autoHideDuration={3000} onClose={() => setSuccessMsg(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSuccessMsg(null)}>{successMsg}</Alert>
      </Snackbar>
    </Box>
  );
}
