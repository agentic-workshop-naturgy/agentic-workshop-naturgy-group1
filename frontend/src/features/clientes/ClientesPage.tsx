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
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '../../shared/ui/PageHeader';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { clientesApi } from './api';
import type { Cliente, ClienteForm } from './types';

const DEFAULT_FORM: ClienteForm = {
  nif: '', nombre: '', apellidos: '', email: '', telefono: '', fechaNacimiento: '',
};

function validate(form: ClienteForm, t: (key: string) => string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.nif.trim()) errors.nif = t('clients.nifRequired');
  if (!form.nombre.trim()) errors.nombre = t('clients.nombreRequired');
  if (!form.apellidos.trim()) errors.apellidos = t('clients.apellidosRequired');
  return errors;
}

export function ClientesPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ClienteForm>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await clientesApi.getAll());
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  function handleOpenCreate() {
    setEditingId(null);
    setFormData(DEFAULT_FORM);
    setFormErrors({});
    setFormOpen(true);
  }

  function handleOpenEdit(row: Cliente) {
    setEditingId(row.id);
    setFormData({
      nif: row.nif,
      nombre: row.nombre,
      apellidos: row.apellidos,
      email: row.email ?? '',
      telefono: row.telefono ?? '',
      fechaNacimiento: row.fechaNacimiento ?? '',
    });
    setFormErrors({});
    setFormOpen(true);
  }

  async function handleSave() {
    const errors = validate(formData, t);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setSaving(true);
    try {
      if (editingId !== null) {
        await clientesApi.update(editingId, formData);
        setSuccessMsg(t('clients.updated'));
      } else {
        await clientesApi.create(formData);
        setSuccessMsg(t('clients.created'));
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
      await clientesApi.delete(deleteTarget.id);
      setSuccessMsg(t('clients.deleted'));
      setDeleteTarget(null);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.errorDelete'));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const columns: GridColDef<Cliente>[] = [
    { field: 'nif', headerName: t('clients.colNif'), flex: 1, minWidth: 110 },
    { field: 'nombre', headerName: t('clients.colNombre'), flex: 1, minWidth: 120 },
    { field: 'apellidos', headerName: t('clients.colApellidos'), flex: 2, minWidth: 160 },
    { field: 'email', headerName: t('clients.colEmail'), flex: 2, minWidth: 180 },
    { field: 'telefono', headerName: t('clients.colTelefono'), flex: 1, minWidth: 120 },
    { field: 'fechaNacimiento', headerName: t('clients.colFechaNacimiento'), flex: 1, minWidth: 130 },
    {
      field: '_actions',
      headerName: '',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" aria-label={t('common.save')} onClick={() => handleOpenEdit(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label={t('common.delete')} color="error" onClick={() => setDeleteTarget(params.row)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title={t('clients.title')}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            {t('clients.new')}
          </Button>
        }
      />
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <DataGrid
        rows={rows}
        columns={columns}
        autoHeight
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        disableRowSelectionOnClick
        slots={{ noRowsOverlay: () => <Box sx={{ p: 3, textAlign: 'center' }}>{t('common.noData')}</Box> }}
      />

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId !== null ? t('clients.editClient') : t('clients.newClient')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {formErrors._global && <Alert severity="error">{formErrors._global}</Alert>}
          <TextField
            label={t('clients.nif')}
            value={formData.nif}
            onChange={(e) => setFormData((p) => ({ ...p, nif: e.target.value }))}
            error={!!formErrors.nif}
            helperText={formErrors.nif}
            required
            fullWidth
          />
          <TextField
            label={t('clients.nombre')}
            value={formData.nombre}
            onChange={(e) => setFormData((p) => ({ ...p, nombre: e.target.value }))}
            error={!!formErrors.nombre}
            helperText={formErrors.nombre}
            required
            fullWidth
          />
          <TextField
            label={t('clients.apellidos')}
            value={formData.apellidos}
            onChange={(e) => setFormData((p) => ({ ...p, apellidos: e.target.value }))}
            error={!!formErrors.apellidos}
            helperText={formErrors.apellidos}
            required
            fullWidth
          />
          <TextField
            label={t('clients.email')}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            fullWidth
          />
          <TextField
            label={t('clients.telefono')}
            value={formData.telefono}
            onChange={(e) => setFormData((p) => ({ ...p, telefono: e.target.value }))}
            fullWidth
          />
          <TextField
            label={t('clients.fechaNacimiento')}
            type="date"
            value={formData.fechaNacimiento}
            onChange={(e) => setFormData((p) => ({ ...p, fechaNacimiento: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)} disabled={saving}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={() => { void handleSave(); }}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title={t('clients.deleteTitle')}
        message={t('clients.deleteMessage', { name: deleteTarget?.nombre ?? '', surname: deleteTarget?.apellidos ?? '' })}
        onConfirm={() => { void handleDeleteConfirm(); }}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      <Snackbar
        open={successMsg !== null}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMsg(null)}>{successMsg}</Alert>
      </Snackbar>
    </Box>
  );
}
