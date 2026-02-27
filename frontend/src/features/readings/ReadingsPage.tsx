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
import InputLabel from '@mui/material/InputLabel';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '../../shared/ui/PageHeader';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { readingsApi } from './api';
import type { GasReading, GasReadingForm } from './types';
import { TIPO_OPTIONS } from './types';

const DEFAULT_FORM: GasReadingForm = { cups: '', fecha: '', lecturaM3: '', tipo: 'REAL' };
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function validate(form: GasReadingForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.cups.trim()) errors.cups = 'CUPS es requerido';
  if (!form.fecha.trim()) errors.fecha = 'Fecha es requerida';
  else if (!DATE_RE.test(form.fecha)) errors.fecha = 'Formato YYYY-MM-DD';
  if (!form.lecturaM3.trim()) errors.lecturaM3 = 'Lectura es requerida';
  else if (isNaN(Number(form.lecturaM3)) || Number(form.lecturaM3) < 0)
    errors.lecturaM3 = 'Debe ser un número >= 0';
  return errors;
}

export function ReadingsPage() {
  const [rows, setRows] = useState<GasReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [filterCups, setFilterCups] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<GasReadingForm>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<GasReading | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async (cups?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await readingsApi.getAll(cups || undefined);
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  function handleFilter() { void loadData(filterCups); }

  function handleOpenCreate() {
    setEditingId(null);
    setFormData(DEFAULT_FORM);
    setFormErrors({});
    setFormOpen(true);
  }

  function handleOpenEdit(row: GasReading) {
    setEditingId(row.id);
    setFormData({ cups: row.cups, fecha: row.fecha, lecturaM3: String(row.lecturaM3), tipo: row.tipo });
    setFormErrors({});
    setFormOpen(true);
  }

  async function handleSave() {
    const errors = validate(formData);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    const payload = { cups: formData.cups, fecha: formData.fecha, lecturaM3: Number(formData.lecturaM3), tipo: formData.tipo };
    setSaving(true);
    try {
      if (editingId !== null) {
        await readingsApi.update(editingId, payload);
        setSuccessMsg('Lectura actualizada');
      } else {
        await readingsApi.create(payload);
        setSuccessMsg('Lectura creada');
      }
      setFormOpen(false);
      await loadData(filterCups || undefined);
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
      await readingsApi.delete(deleteTarget.id);
      setSuccessMsg('Lectura eliminada');
      setDeleteTarget(null);
      await loadData(filterCups || undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const columns: GridColDef<GasReading>[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'cups', headerName: 'CUPS', flex: 2, minWidth: 180 },
    { field: 'fecha', headerName: 'Fecha', width: 120 },
    { field: 'lecturaM3', headerName: 'Lectura (m³)', width: 130, type: 'number' },
    { field: 'tipo', headerName: 'Tipo', width: 110 },
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
        title="Lecturas de Gas"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Nueva
          </Button>
        }
      />
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Filtrar por CUPS"
            value={filterCups}
            onChange={(e) => setFilterCups(e.target.value)}
            size="small"
            sx={{ minWidth: 240 }}
          />
          <Button variant="outlined" startIcon={<SearchIcon />} onClick={handleFilter}>
            Buscar
          </Button>
          <Button variant="text" onClick={() => { setFilterCups(''); void loadData(); }}>
            Limpiar
          </Button>
        </Stack>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <DataGrid
        rows={rows}
        columns={columns}
        autoHeight
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        disableRowSelectionOnClick
        slots={{ noRowsOverlay: () => <Box sx={{ p: 3, textAlign: 'center' }}>Sin datos</Box> }}
      />

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId !== null ? 'Editar Lectura' : 'Nueva Lectura'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {formErrors._global && <Alert severity="error">{formErrors._global}</Alert>}
          <TextField
            label="CUPS"
            value={formData.cups}
            onChange={(e) => setFormData((p) => ({ ...p, cups: e.target.value }))}
            error={!!formErrors.cups}
            helperText={formErrors.cups}
            required
            fullWidth
          />
          <TextField
            label="Fecha (YYYY-MM-DD)"
            value={formData.fecha}
            onChange={(e) => setFormData((p) => ({ ...p, fecha: e.target.value }))}
            error={!!formErrors.fecha}
            helperText={formErrors.fecha ?? 'Ej: 2026-01-31'}
            required
            fullWidth
          />
          <TextField
            label="Lectura (m³)"
            value={formData.lecturaM3}
            onChange={(e) => setFormData((p) => ({ ...p, lecturaM3: e.target.value }))}
            error={!!formErrors.lecturaM3}
            helperText={formErrors.lecturaM3}
            inputProps={{ inputMode: 'decimal' }}
            required
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel id="tipo-label">Tipo</InputLabel>
            <Select
              labelId="tipo-label"
              label="Tipo"
              value={formData.tipo}
              onChange={(e) => setFormData((p) => ({ ...p, tipo: e.target.value as 'REAL' | 'ESTIMADA' }))}
            >
              {TIPO_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </Select>
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

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar Lectura"
        message={`¿Eliminar lectura ID ${deleteTarget?.id ?? ''} del CUPS ${deleteTarget?.cups ?? ''}?`}
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
