import { useState, useEffect, useCallback } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
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

const DEFAULT_FORM: SupplyPointForm = { cups: '', zona: '', tarifa: '', estado: 'ACTIVO' };

function validate(form: SupplyPointForm, isEdit: boolean): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!isEdit && !form.cups.trim()) errors.cups = 'CUPS es requerido';
  if (!form.zona.trim()) errors.zona = 'Zona es requerida';
  if (!form.tarifa.trim()) errors.tarifa = 'Tarifa es requerida';
  return errors;
}

export function SupplyPointsPage() {
  const [rows, setRows] = useState<SupplyPoint[]>([]);
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
      const data = await supplyPointsApi.getAll();
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  function handleOpenCreate() {
    setEditingCups(null);
    setFormData(DEFAULT_FORM);
    setFormErrors({});
    setFormOpen(true);
  }

  function handleOpenEdit(row: SupplyPoint) {
    setEditingCups(row.cups);
    setFormData({ cups: row.cups, zona: row.zona, tarifa: row.tarifa, estado: row.estado });
    setFormErrors({});
    setFormOpen(true);
  }

  async function handleSave() {
    const errors = validate(formData, editingCups !== null);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setSaving(true);
    try {
      if (editingCups !== null) {
        await supplyPointsApi.update(editingCups, formData);
        setSuccessMsg('Punto de suministro actualizado');
      } else {
        await supplyPointsApi.create(formData);
        setSuccessMsg('Punto de suministro creado');
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
      await supplyPointsApi.delete(deleteTarget.cups);
      setSuccessMsg('Punto de suministro eliminado');
      setDeleteTarget(null);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const columns: GridColDef<SupplyPoint>[] = [
    { field: 'cups', headerName: 'CUPS', flex: 2, minWidth: 180 },
    { field: 'zona', headerName: 'Zona', flex: 1, minWidth: 100 },
    { field: 'tarifa', headerName: 'Tarifa', flex: 1, minWidth: 100 },
    {
      field: 'estado',
      headerName: 'Estado',
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
          <IconButton size="small" aria-label="editar" onClick={() => handleOpenEdit(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label="eliminar" color="error" onClick={() => setDeleteTarget(params.row)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Puntos de Suministro"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Nuevo
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
        slots={{ noRowsOverlay: () => <Box sx={{ p: 3, textAlign: 'center' }}>Sin datos</Box> }}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCups ? 'Editar Punto de Suministro' : 'Nuevo Punto de Suministro'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {formErrors._global && <Alert severity="error">{formErrors._global}</Alert>}
          <TextField
            label="CUPS"
            value={formData.cups}
            onChange={(e) => setFormData((p) => ({ ...p, cups: e.target.value }))}
            error={!!formErrors.cups}
            helperText={formErrors.cups}
            disabled={editingCups !== null}
            required
            fullWidth
          />
          <TextField
            label="Zona"
            value={formData.zona}
            onChange={(e) => setFormData((p) => ({ ...p, zona: e.target.value }))}
            error={!!formErrors.zona}
            helperText={formErrors.zona}
            required
            fullWidth
          />
          <TextField
            label="Tarifa"
            value={formData.tarifa}
            onChange={(e) => setFormData((p) => ({ ...p, tarifa: e.target.value }))}
            error={!!formErrors.tarifa}
            helperText={formErrors.tarifa}
            required
            fullWidth
          />
          <FormControl fullWidth error={!!formErrors.estado}>
            <InputLabel id="estado-label">Estado</InputLabel>
            <Select
              labelId="estado-label"
              label="Estado"
              value={formData.estado}
              onChange={(e) => setFormData((p) => ({ ...p, estado: e.target.value as 'ACTIVO' | 'INACTIVO' }))}
            >
              {ESTADO_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </Select>
            {formErrors.estado && <FormHelperText>{formErrors.estado}</FormHelperText>}
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => { void handleSave(); }}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar Punto de Suministro"
        message={`¿Eliminar el punto de suministro ${deleteTarget?.cups ?? ''}?`}
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
