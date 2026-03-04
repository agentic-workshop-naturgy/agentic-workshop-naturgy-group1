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
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Switch from '@mui/material/Switch';
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

const DEFAULT_FORM: SupplyPointForm = { cups: '', zona: '', tarifa: '', estado: 'ACTIVO', servigas: false, contratoDual: false };

function validate(form: SupplyPointForm, isEdit: boolean, t: (k: string) => string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!isEdit && !form.cups.trim()) errors.cups = t('supplyPoints.cupsRequired');
  if (!form.zona.trim()) errors.zona = t('supplyPoints.zoneRequired');
  if (!form.tarifa.trim()) errors.tarifa = t('supplyPoints.tariffRequired');
  return errors;
}

export function SupplyPointsPage() {
  const { t } = useTranslation();
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
      setError(e instanceof Error ? e.message : t('common.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void loadData(); }, [loadData]);

  function handleOpenCreate() {
    setEditingCups(null);
    setFormData(DEFAULT_FORM);
    setFormErrors({});
    setFormOpen(true);
  }

  function handleOpenEdit(row: SupplyPoint) {
    setEditingCups(row.cups);
    setFormData({ cups: row.cups, zona: row.zona, tarifa: row.tarifa, estado: row.estado, servigas: row.servigas ?? false, contratoDual: row.contratoDual ?? false });
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
      setFormErrors({ _global: e instanceof Error ? e.message : t('common.errorSaving') });
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
      setError(e instanceof Error ? e.message : t('common.errorDeleting'));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const columns: GridColDef<SupplyPoint>[] = [
    { field: 'cups', headerName: t('supplyPoints.cups'), flex: 2, minWidth: 180 },
    { field: 'zona', headerName: t('supplyPoints.zone'), flex: 1, minWidth: 100 },
    { field: 'tarifa', headerName: t('supplyPoints.tariff'), flex: 1, minWidth: 100 },
    {
      field: 'estado',
      headerName: t('supplyPoints.status'),
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
      field: 'servigas',
      headerName: 'ServiGas',
      flex: 1,
      minWidth: 110,
      renderCell: (params) => (
        <Chip
          label={params.row.servigas ? t('supplyPoints.yes') : t('supplyPoints.no')}
          color={params.row.servigas ? 'secondary' : 'default'}
          size="small"
          variant={params.row.servigas ? 'filled' : 'outlined'}
        />
      ),
    },
    {
      field: 'contratoDual',
      headerName: t('supplyPoints.dualContract'),
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        <Chip
          label={params.row.contratoDual ? t('supplyPoints.yes') : t('supplyPoints.no')}
          color={params.row.contratoDual ? 'info' : 'default'}
          size="small"
          variant={params.row.contratoDual ? 'filled' : 'outlined'}
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
        title={t('supplyPoints.title')}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            {t('supplyPoints.newBtn')}
          </Button>
        }
      />
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Box sx={{ width: '100%', overflowX: 'auto' }}>
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
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCups ? t('supplyPoints.editTitle') : t('supplyPoints.createTitle')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {formErrors._global && <Alert severity="error">{formErrors._global}</Alert>}
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
            label={t('supplyPoints.zone')}
            value={formData.zona}
            onChange={(e) => setFormData((p) => ({ ...p, zona: e.target.value }))}
            error={!!formErrors.zona}
            helperText={formErrors.zona}
            required
            fullWidth
          />
          <TextField
            label={t('supplyPoints.tariff')}
            value={formData.tarifa}
            onChange={(e) => setFormData((p) => ({ ...p, tarifa: e.target.value }))}
            error={!!formErrors.tarifa}
            helperText={formErrors.tarifa}
            required
            fullWidth
          />
          <FormControl fullWidth error={!!formErrors.estado}>
            <InputLabel id="estado-label">{t('supplyPoints.status')}</InputLabel>
            <Select
              labelId="estado-label"
              label={t('supplyPoints.status')}
              value={formData.estado}
              onChange={(e) => setFormData((p) => ({ ...p, estado: e.target.value as 'ACTIVO' | 'INACTIVO' }))}
            >
              {ESTADO_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </Select>
            {formErrors.estado && <FormHelperText>{formErrors.estado}</FormHelperText>}
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={formData.servigas}
                onChange={(e) => setFormData((p) => ({ ...p, servigas: e.target.checked }))}
                color="secondary"
              />
            }
            label={t('supplyPoints.servigas')}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.contratoDual}
                onChange={(e) => setFormData((p) => ({ ...p, contratoDual: e.target.checked }))}
                color="info"
              />
            }
            label={t('supplyPoints.dualContract')}
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
        message={t('supplyPoints.deleteMsg', { cups: deleteTarget?.cups ?? '' })}
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
