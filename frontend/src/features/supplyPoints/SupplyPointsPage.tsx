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
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '../../shared/ui/PageHeader';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { supplyPointsApi } from './api';
import type { SupplyPoint, SupplyPointForm } from './types';
import { ESTADO_OPTIONS } from './types';
import { clientesApi } from '../clientes/api';
import type { Cliente } from '../clientes/types';

const DEFAULT_FORM: SupplyPointForm = {
  cups: '', zona: '', tarifa: '', estado: 'ACTIVO',
  clienteId: null,
  calle: '', numero: '', piso: '', codigoPostal: '', municipio: '', provincia: '',
};

function validate(form: SupplyPointForm, isEdit: boolean, t: (key: string) => string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!isEdit && !form.cups.trim()) errors.cups = t('supplyPoints.cupsRequired');
  if (!form.zona.trim()) errors.zona = t('supplyPoints.zonaRequired');
  if (!form.tarifa.trim()) errors.tarifa = t('supplyPoints.tarifaRequired');
  return errors;
}

export function SupplyPointsPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<SupplyPoint[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCups, setEditingCups] = useState<string | null>(null);
  const [formData, setFormData] = useState<SupplyPointForm>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<SupplyPoint | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pts, cls] = await Promise.all([supplyPointsApi.getAll(), clientesApi.getAll()]);
      setRows(pts);
      setClientes(cls);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  function clienteName(id: number | null) {
    if (id === null) return 'â€”';
    const c = clientes.find((x) => x.id === id);
    return c ? `${c.nombre} ${c.apellidos}` : String(id);
  }

  function handleOpenCreate() {
    setEditingCups(null);
    setFormData(DEFAULT_FORM);
    setFormErrors({});
    setFormOpen(true);
  }

  function handleOpenEdit(row: SupplyPoint) {
    setEditingCups(row.cups);
    setFormData({
      cups: row.cups,
      zona: row.zona,
      tarifa: row.tarifa,
      estado: row.estado,
      clienteId: row.clienteId,
      calle: row.calle ?? '',
      numero: row.numero ?? '',
      piso: row.piso ?? '',
      codigoPostal: row.codigoPostal ?? '',
      municipio: row.municipio ?? '',
      provincia: row.provincia ?? '',
    });
    setFormErrors({});
    setFormOpen(true);
  }

  async function handleSave() {
    const errors = validate(formData, editingCups !== null, t);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setSaving(true);
    try {
      if (editingCups !== null) {
        await supplyPointsApi.update(editingCups, formData);
        setSuccessMsg(t('supplyPoints.updated'));
      } else {
        await supplyPointsApi.create(formData);
        setSuccessMsg(t('supplyPoints.created'));
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
      await supplyPointsApi.delete(deleteTarget.cups);
      setSuccessMsg(t('supplyPoints.deleted'));
      setDeleteTarget(null);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.errorDelete'));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const columns: GridColDef<SupplyPoint>[] = [
    { field: 'cups', headerName: t('supplyPoints.colCups'), flex: 2, minWidth: 180 },
    {
      field: 'clienteId',
      headerName: t('supplyPoints.colCliente'),
      flex: 2,
      minWidth: 160,
      valueGetter: (value: number | null) => clienteName(value),
    },
    { field: 'zona', headerName: t('supplyPoints.colZona'), flex: 1, minWidth: 100 },
    { field: 'tarifa', headerName: t('supplyPoints.colTarifa'), flex: 1, minWidth: 100 },
    { field: 'municipio', headerName: t('supplyPoints.colMunicipio'), flex: 1, minWidth: 120 },
    { field: 'provincia', headerName: t('supplyPoints.colProvincia'), flex: 1, minWidth: 120 },
    {
      field: 'estado',
      headerName: t('supplyPoints.colEstado'),
      flex: 1,
      minWidth: 110,
      renderCell: (params) => (
        <Chip
          label={params.row.estado}
          color={params.row.estado === 'ACTIVO' ? 'success' : 'default'}
          size="small"
        />
      ),
    },
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
        title={t('supplyPoints.title')}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            {t('supplyPoints.new')}
          </Button>
        }
      />
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.cups}
        autoHeight
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        disableRowSelectionOnClick
        slots={{ noRowsOverlay: () => <Box sx={{ p: 3, textAlign: 'center' }}>{t('common.noData')}</Box> }}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCups ? t('supplyPoints.editSupplyPoint') : t('supplyPoints.newSupplyPoint')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {formErrors._global && <Alert severity="error">{formErrors._global}</Alert>}

          {/* Datos bÃ¡sicos */}
          <TextField
            label={t('supplyPoints.cups')}
            value={formData.cups}
            onChange={(e) => setFormData((p) => ({ ...p, cups: e.target.value }))}
            error={!!formErrors.cups}
            helperText={formErrors.cups}
            disabled={editingCups !== null}
            required
            fullWidth
          />
          <TextField
            label={t('supplyPoints.zona')}
            value={formData.zona}
            onChange={(e) => setFormData((p) => ({ ...p, zona: e.target.value }))}
            error={!!formErrors.zona}
            helperText={formErrors.zona}
            required
            fullWidth
          />
          <TextField
            label={t('supplyPoints.tarifa')}
            value={formData.tarifa}
            onChange={(e) => setFormData((p) => ({ ...p, tarifa: e.target.value }))}
            error={!!formErrors.tarifa}
            helperText={formErrors.tarifa}
            required
            fullWidth
          />
          <FormControl fullWidth error={!!formErrors.estado}>
            <InputLabel id="estado-label">{t('supplyPoints.estado')}</InputLabel>
            <Select
              labelId="estado-label"
              label={t('supplyPoints.estado')}
              value={formData.estado}
              onChange={(e) => setFormData((p) => ({ ...p, estado: e.target.value as 'ACTIVO' | 'INACTIVO' }))}
            >
              {ESTADO_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </Select>
            {formErrors.estado && <FormHelperText>{formErrors.estado}</FormHelperText>}
          </FormControl>

          {/* Cliente */}
          <FormControl fullWidth>
            <InputLabel id="cliente-label">{t('supplyPoints.clienteTitular')}</InputLabel>
            <Select
              labelId="cliente-label"
              label={t('supplyPoints.clienteTitular')}
              value={formData.clienteId ?? ''}
              onChange={(e) =>
                setFormData((p) => ({ ...p, clienteId: (e.target.value as unknown as string) === '' ? null : Number(e.target.value) }))
              }
            >
              <MenuItem value="">{t('supplyPoints.notAssigned')}</MenuItem>
              {clientes.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nombre} {c.apellidos} ({c.nif})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Address */}
          <Divider sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">{t('supplyPoints.addressSection')}</Typography>
          </Divider>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label={t('supplyPoints.calle')}
              value={formData.calle}
              onChange={(e) => setFormData((p) => ({ ...p, calle: e.target.value }))}
              fullWidth
              sx={{ flex: 3 }}
            />
            <TextField
              label={t('supplyPoints.numero')}
              value={formData.numero}
              onChange={(e) => setFormData((p) => ({ ...p, numero: e.target.value }))}
              sx={{ flex: 1 }}
            />
          </Box>
          <TextField
            label={t('supplyPoints.piso')}
            value={formData.piso}
            onChange={(e) => setFormData((p) => ({ ...p, piso: e.target.value }))}
            fullWidth
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label={t('supplyPoints.codigoPostal')}
              value={formData.codigoPostal}
              onChange={(e) => setFormData((p) => ({ ...p, codigoPostal: e.target.value }))}
              sx={{ flex: 1 }}
            />
            <TextField
              label={t('supplyPoints.municipio')}
              value={formData.municipio}
              onChange={(e) => setFormData((p) => ({ ...p, municipio: e.target.value }))}
              fullWidth
              sx={{ flex: 2 }}
            />
          </Box>
          <TextField
            label={t('supplyPoints.provincia')}
            value={formData.provincia}
            onChange={(e) => setFormData((p) => ({ ...p, provincia: e.target.value }))}
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

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title={t('supplyPoints.deleteTitle')}
        message={t('supplyPoints.deleteMessage', { cups: deleteTarget?.cups ?? '' })}
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
