import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import UpdateIcon from '@mui/icons-material/Update';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '../../shared/ui/PageHeader';
import { billingApi } from './api';
import type { BillingResult, BillingError } from './types';

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

interface ErrorRow extends BillingError {
  _idx: number;
}

export function BillingPage() {
  const [period, setPeriod] = useState('');
  const [periodError, setPeriodError] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BillingResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  async function handleRun() {
    if (!period.trim()) { setPeriodError('El periodo es requerido'); return; }
    if (!PERIOD_RE.test(period)) { setPeriodError('Formato YYYY-MM (ej: 2026-01)'); return; }
    setPeriodError('');
    setRunError(null);
    setResult(null);
    setRunning(true);
    try {
      const res = await billingApi.run(period);
      setResult(res);
    } catch (e) {
      setRunError(e instanceof Error ? e.message : 'Error al ejecutar facturación');
    } finally {
      setRunning(false);
    }
  }

  const errorColumns: GridColDef<ErrorRow>[] = [
    { field: 'cups', headerName: 'CUPS', flex: 2, minWidth: 180 },
    { field: 'error', headerName: 'Error', flex: 3, minWidth: 240 },
  ];

  const errorRows: ErrorRow[] = (result?.errors ?? []).map((e, i) => ({ ...e, _idx: i }));

  return (
    <Box>
      <PageHeader title="Facturación" />

      <Box sx={{ maxWidth: 600, mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <TextField
            label="Periodo (YYYY-MM)"
            value={period}
            onChange={(e) => { setPeriod(e.target.value); setPeriodError(''); }}
            error={!!periodError}
            helperText={periodError || 'Ej: 2026-01'}
            sx={{ flex: 1 }}
            disabled={running}
          />
          <Button
            variant="contained"
            size="large"
            color="secondary"
            startIcon={running ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
            onClick={() => { void handleRun(); }}
            disabled={running}
            sx={{ mt: '4px', minWidth: 180, height: 56 }}
          >
            {running ? 'Ejecutando…' : 'Ejecutar Facturación'}
          </Button>
        </Stack>
      </Box>

      {runError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setRunError(null)}>
          {runError}
        </Alert>
      )}

      {result && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Resultado para el periodo <strong>{result.period}</strong>
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ borderLeft: 4, borderColor: 'secondary.main' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircleIcon color="success" />
                    <Box>
                      <Typography variant="h4" color="secondary.main">{result.invoicesCreated}</Typography>
                      <Typography variant="body2" color="text.secondary">Facturas creadas</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ borderLeft: 4, borderColor: 'primary.main' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <UpdateIcon color="primary" />
                    <Box>
                      <Typography variant="h4" color="primary.main">{result.invoicesUpdated}</Typography>
                      <Typography variant="body2" color="text.secondary">Facturas actualizadas</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ borderLeft: 4, borderColor: result.errors.length > 0 ? 'error.main' : 'success.main' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <ErrorIcon color={result.errors.length > 0 ? 'error' : 'success'} />
                    <Box>
                      <Typography variant="h4" color={result.errors.length > 0 ? 'error.main' : 'success.main'}>
                        {result.errors.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Errores</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {result.errors.length > 0 && (
            <Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="h6" color="error" sx={{ mb: 1 }}>
                CUPS con errores de facturación
              </Typography>
              <DataGrid
                rows={errorRows}
                columns={errorColumns}
                getRowId={(r) => r._idx}
                autoHeight
                pageSizeOptions={[10, 25]}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                disableRowSelectionOnClick
              />
            </Box>
          )}

          {result.errors.length === 0 && result.invoicesCreated + result.invoicesUpdated > 0 && (
            <Alert severity="success">
              ✅ Facturación completada sin errores. Ve a <strong>Facturas</strong> para ver el resultado.
            </Alert>
          )}

          {result.errors.length === 0 && result.invoicesCreated + result.invoicesUpdated === 0 && (
            <Alert severity="info">
              No hay puntos de suministro activos con datos suficientes para el periodo {result.period}.
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
}
