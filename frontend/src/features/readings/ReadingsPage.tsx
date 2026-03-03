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

function validate(form: GasReadingForm, t: (k: string) => string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.cups.trim()) errors.cups = t('readings.cupsRequired');
  if (!form.fecha.trim()) errors.fecha = t('readings.dateRequired');
  else if (!DATE_RE.test(form.fecha)) errors.fecha = t('readings.dateFormat');
  if (!form.lecturaM3.trim()) errors.lecturaM3 = t('readings.readingRequired');
  else if (isNaN(Number(form.lecturaM3)) || Number(form.lecturaM3) < 0)
    errors.lecturaM3 = t('readings.readingPositive');
  return errors;
}

export function ReadingsPage() {
  const { t } = useTranslation();
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
      setError(e instanceof Error ? e.message : t('common.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
    const errors = validate(formData, t);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    const payload = { cups: formData.cups, fecha: formData.fecha, lecturaM3: Number(formData.lecturaM3), tipo: formData.tipo };
    setSaving(true);
    try {
      if (editingId !== null) {
        await readingsApi.update(editingId, payload);
        setSuccessMsg(t('readings.updated'));
      } else {
        await readingsApi.create(payload);
        setSuccessMsg(t('readings.created'));
      }
      setFormOpen(false);
      await loadData(filterCups || undefined);
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
      await readingsApi.delete(deleteTarget.id);
      setSuccessMsg(t('readings.deleted'));
      setDeleteTarget(null);
      await loadData(filterCups || undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.errorDeleting'));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const columns: GridColDef<GasReading>[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'cups', headerName: t('readings.cups'), flex: 2, minWidth: 180 },
    { field: 'fecha', headerName: t('readings.date'), width: 120 },
    { field: 'lecturaM3', headerName: t('readings.readingM3'), width: 130, type: 'number' },
    { field: 'tipo', headerName: t('readings.type'), width: 110 },
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
        title={t('readings.title')}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            {t('readings.newBtn')}
          </Button>
        }
      />
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label={t('readings.filterByCups')}
            value={filterCups}
            onChange={(e) => setFilterCups(e.target.value)}
            size="small"
            sx={{ minWidth: 240 }}
          />
          <Button variant="outlined" startIcon={<SearchIcon />} onClick={handleFilter}>
            {t('common.search')}
          </Button>
          <Button variant="text" onClick={() => { setFilterCups(''); void loadData(); }}>
            {t('common.clear')}
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
        slots={{ noRowsOverlay: () => <Box sx={{ p: 3, textAlign: 'center' }}>{t('common.noData')}</Box> }}
      />

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId !== null ? t('readings.editTitle') : t('readings.createTitle')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {formErrors._global && <Alert severity="error">{formErrors._global}</Alert>}
          <TextField
            label={t('readings.cups')}
            value={formData.cups}
            onChange={(e) => setFormData((p) => ({ ...p, cups: e.target.value }))}
            error={!!formErrors.cups}
            helperText={formErrors.cups}
            required
            fullWidth
          />
          <TextField
            label={t('readings.date')}
            value={formData.fecha}
            onChange={(e) => setFormData((p) => ({ ...p, fecha: e.target.value }))}
            error={!!formErrors.fecha}
            helperText={formErrors.fecha ?? t('readings.dateExample')}
            required
            fullWidth
          />
          <TextField
            label={t('readings.readingM3')}
            value={formData.lecturaM3}
            onChange={(e) => setFormData((p) => ({ ...p, lecturaM3: e.target.value }))}
            error={!!formErrors.lecturaM3}
            helperText={formErrors.lecturaM3}
            inputProps={{ inputMode: 'decimal' }}
            required
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel id="tipo-label">{t('readings.type')}</InputLabel>
            <Select
              labelId="tipo-label"
              label={t('readings.type')}
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

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t('readings.deleteTitle')}
        message={t('readings.deleteMsg', { id: deleteTarget?.id ?? '' })}
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
