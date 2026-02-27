import { useState, useEffect, useCallback } from 'react';
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

function validate(form: GasTariffForm, isEdit: boolean): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!isEdit && !form.tarifa.trim()) errors.tarifa = 'Código tarifa es requerido';
  if (!form.fijoMesEur.trim()) errors.fijoMesEur = 'Requerido';
  else if (isNaN(Number(form.fijoMesEur)) || Number(form.fijoMesEur) < 0) errors.fijoMesEur = 'Debe ser >= 0';
  if (!form.variableEurKwh.trim()) errors.variableEurKwh = 'Requerido';
  else if (isNaN(Number(form.variableEurKwh)) || Number(form.variableEurKwh) < 0) errors.variableEurKwh = 'Debe ser >= 0';
  if (!form.vigenciaDesde.trim()) errors.vigenciaDesde = 'Fecha de vigencia es requerida';
  else if (!DATE_RE.test(form.vigenciaDesde)) errors.vigenciaDesde = 'Formato YYYY-MM-DD';
  return errors;
}

function fmtEur(val: number) {
  return val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

export function TariffsPage() {
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
      setError(e instanceof Error ? e.message : 'Error al cargar datos');
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
    const errors = validate(formData, editingTarifa !== null);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    const payload: GasTariff = { tarifa: formData.tarifa, fijoMesEur: Number(formData.fijoMesEur), variableEurKwh: Number(formData.variableEurKwh), vigenciaDesde: formData.vigenciaDesde };
    setSaving(true);
    try {
      if (editingTarifa !== null) {
        await tariffsApi.update(editingTarifa, payload);
        setSuccessMsg('Tarifa actualizada');
      } else {
        await tariffsApi.create(payload);
        setSuccessMsg('Tarifa creada');
      }
      setFormOpen(false);
      await loadData();
    } catch (e) {
      setFormErrors({ _global: e instanceof Error ? e.message : 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await tariffsApi.delete(deleteTarget.tarifa);
      setSuccessMsg('Tarifa eliminada');
      setDeleteTarget(null);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const columns: GridColDef<GasTariff>[] = [
    { field: 'tarifa', headerName: 'Tarifa', width: 120 },
    { field: 'fijoMesEur', headerName: 'Fijo/Mes (€)', flex: 1, minWidth: 130, renderCell: (p) => fmtEur(p.row.fijoMesEur) },
    { field: 'variableEurKwh', headerName: 'Variable (€/kWh)', flex: 1, minWidth: 160, renderCell: (p) => fmtEur(p.row.variableEurKwh) },
    { field: 'vigenciaDesde', headerName: 'Vigencia Desde', width: 140 },
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
      <PageHeader title="Tarifario" action={<Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>Nueva Tarifa</Button>} />
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <DataGrid rows={rows} columns={columns} getRowId={(r) => r.tarifa} autoHeight pageSizeOptions={[10, 25]} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} disableRowSelectionOnClick slots={{ noRowsOverlay: () => <Box sx={{ p: 3, textAlign: 'center' }}>Sin datos</Box> }} />

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTarifa ? 'Editar Tarifa' : 'Nueva Tarifa'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {formErrors._global && <Alert severity="error">{formErrors._global}</Alert>}
          <TextField label="Código Tarifa" value={formData.tarifa} onChange={(e) => setFormData((p) => ({ ...p, tarifa: e.target.value }))} error={!!formErrors.tarifa} helperText={formErrors.tarifa ?? 'Ej: RL1'} disabled={editingTarifa !== null} required fullWidth />
          <TextField label="Término Fijo (€/mes)" value={formData.fijoMesEur} onChange={(e) => setFormData((p) => ({ ...p, fijoMesEur: e.target.value }))} error={!!formErrors.fijoMesEur} helperText={formErrors.fijoMesEur} inputProps={{ inputMode: 'decimal' }} required fullWidth />
          <TextField label="Término Variable (€/kWh)" value={formData.variableEurKwh} onChange={(e) => setFormData((p) => ({ ...p, variableEurKwh: e.target.value }))} error={!!formErrors.variableEurKwh} helperText={formErrors.variableEurKwh} inputProps={{ inputMode: 'decimal' }} required fullWidth />
          <TextField label="Vigencia Desde (YYYY-MM-DD)" value={formData.vigenciaDesde} onChange={(e) => setFormData((p) => ({ ...p, vigenciaDesde: e.target.value }))} error={!!formErrors.vigenciaDesde} helperText={formErrors.vigenciaDesde ?? 'Ej: 2026-01-01'} required fullWidth />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={() => { void handleSave(); }} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={deleteTarget !== null} title="Eliminar Tarifa" message={`¿Eliminar la tarifa ${deleteTarget?.tarifa ?? ''}?`} onConfirm={() => { void handleDeleteConfirm(); }} onCancel={() => setDeleteTarget(null)} loading={deleting} />

      <Snackbar open={successMsg !== null} autoHideDuration={3000} onClose={() => setSuccessMsg(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSuccessMsg(null)}>{successMsg}</Alert>
      </Snackbar>
    </Box>
  );
}
