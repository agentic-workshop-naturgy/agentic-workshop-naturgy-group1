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
import { taxesApi } from './api';
import type { Tax, TaxForm } from './types';

const DEFAULT_FORM: TaxForm = { taxCode: '', taxRate: '', vigenciaDesde: '' };
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function validate(form: TaxForm, isEdit: boolean): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!isEdit && !form.taxCode.trim()) errors.taxCode = 'Código impuesto es requerido';
  if (!form.taxRate.trim()) errors.taxRate = 'Requerido';
  else {
    const v = Number(form.taxRate);
    if (isNaN(v) || v < 0 || v > 1) errors.taxRate = 'Debe ser un decimal en [0, 1] (ej: 0.21)';
  }
  if (!form.vigenciaDesde.trim()) errors.vigenciaDesde = 'Fecha de vigencia es requerida';
  else if (!DATE_RE.test(form.vigenciaDesde)) errors.vigenciaDesde = 'Formato YYYY-MM-DD';
  return errors;
}

export function TaxesPage() {
  const [rows, setRows] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [formData, setFormData] = useState<TaxForm>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Tax | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await taxesApi.getAll());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  function handleOpenCreate() {
    setEditingCode(null);
    setFormData(DEFAULT_FORM);
    setFormErrors({});
    setFormOpen(true);
  }

  function handleOpenEdit(row: Tax) {
    setEditingCode(row.taxCode);
    setFormData({ taxCode: row.taxCode, taxRate: String(row.taxRate), vigenciaDesde: row.vigenciaDesde });
    setFormErrors({});
    setFormOpen(true);
  }

  async function handleSave() {
    const errors = validate(formData, editingCode !== null);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    const payload: Tax = { taxCode: formData.taxCode, taxRate: Number(formData.taxRate), vigenciaDesde: formData.vigenciaDesde };
    setSaving(true);
    try {
      if (editingCode !== null) {
        await taxesApi.update(editingCode, payload);
        setSuccessMsg('Impuesto actualizado');
      } else {
        await taxesApi.create(payload);
        setSuccessMsg('Impuesto creado');
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
      await taxesApi.delete(deleteTarget.taxCode);
      setSuccessMsg('Impuesto eliminado');
      setDeleteTarget(null);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const columns: GridColDef<Tax>[] = [
    { field: 'taxCode', headerName: 'Código', width: 120 },
    {
      field: 'taxRate', headerName: 'Tasa (%)', width: 120,
      renderCell: (p) => `${(p.row.taxRate * 100).toFixed(2)}%`,
    },
    { field: 'vigenciaDesde', headerName: 'Vigencia Desde', flex: 1, minWidth: 140 },
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
      <PageHeader title="Impuestos (IVA)" action={<Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>Nuevo Impuesto</Button>} />
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <DataGrid rows={rows} columns={columns} getRowId={(r) => r.taxCode} autoHeight pageSizeOptions={[10, 25]} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} disableRowSelectionOnClick slots={{ noRowsOverlay: () => <Box sx={{ p: 3, textAlign: 'center' }}>Sin datos. Añade IVA con taxCode=IVA</Box> }} />

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCode ? 'Editar Impuesto' : 'Nuevo Impuesto'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {formErrors._global && <Alert severity="error">{formErrors._global}</Alert>}
          <TextField label="Código" value={formData.taxCode} onChange={(e) => setFormData((p) => ({ ...p, taxCode: e.target.value }))} error={!!formErrors.taxCode} helperText={formErrors.taxCode ?? 'Ej: IVA'} disabled={editingCode !== null} required fullWidth />
          <TextField label="Tasa (0 a 1)" value={formData.taxRate} onChange={(e) => setFormData((p) => ({ ...p, taxRate: e.target.value }))} error={!!formErrors.taxRate} helperText={formErrors.taxRate ?? 'Ej: 0.21 para 21%'} inputProps={{ inputMode: 'decimal' }} required fullWidth />
          <TextField label="Vigencia Desde (YYYY-MM-DD)" value={formData.vigenciaDesde} onChange={(e) => setFormData((p) => ({ ...p, vigenciaDesde: e.target.value }))} error={!!formErrors.vigenciaDesde} helperText={formErrors.vigenciaDesde ?? 'Ej: 2026-01-01'} required fullWidth />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={() => { void handleSave(); }} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={deleteTarget !== null} title="Eliminar Impuesto" message={`¿Eliminar el impuesto ${deleteTarget?.taxCode ?? ''}?`} onConfirm={() => { void handleDeleteConfirm(); }} onCancel={() => setDeleteTarget(null)} loading={deleting} />

      <Snackbar open={successMsg !== null} autoHideDuration={3000} onClose={() => setSuccessMsg(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSuccessMsg(null)}>{successMsg}</Alert>
      </Snackbar>
    </Box>
  );
}
