import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { NATURGY } from '../../app/theme';
import { PageHeader } from '../../shared/ui/PageHeader';
import { tariffRecommenderApi } from './api';
import type { TariffRecommendation } from './types';

export function TariffRecommenderPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<TariffRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCups, setExpandedCups] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await tariffRecommenderApi.getAll();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.errorLoading'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const canImprove = data.filter((d) => !d.isOptimal);
  const totalAnnualSavings = canImprove.reduce((sum, d) => sum + d.annualSavingsEur, 0);

  const columns: GridColDef<TariffRecommendation>[] = [
    {
      field: 'cups',
      headerName: 'CUPS',
      flex: 2,
      minWidth: 200,
    },
    {
      field: 'zona',
      headerName: t('tariffRecommender.zone'),
      flex: 0.8,
      minWidth: 80,
    },
    {
      field: 'currentTariff',
      headerName: t('tariffRecommender.currentTariff'),
      flex: 0.8,
      minWidth: 90,
      renderCell: (params: GridRenderCellParams<TariffRecommendation>) => (
        <Chip label={params.value} size="small" variant="outlined" />
      ),
    },
    {
      field: 'recommendedTariff',
      headerName: t('tariffRecommender.recommendedTariff'),
      flex: 0.8,
      minWidth: 110,
      renderCell: (params: GridRenderCellParams<TariffRecommendation>) => {
        const row = params.row;
        return row.isOptimal ? (
          <Chip label={params.value} size="small" color="success" variant="filled" />
        ) : (
          <Chip
            label={params.value}
            size="small"
            sx={{ bgcolor: NATURGY.orange, color: '#fff', fontWeight: 700 }}
          />
        );
      },
    },
    {
      field: 'currentMonthlyCostEur',
      headerName: t('tariffRecommender.currentCost'),
      flex: 1,
      minWidth: 120,
      type: 'number',
      renderCell: (params: GridRenderCellParams<TariffRecommendation>) =>
        `${(params.value as number).toFixed(2)} €`,
    },
    {
      field: 'recommendedMonthlyCostEur',
      headerName: t('tariffRecommender.optimalCost'),
      flex: 1,
      minWidth: 120,
      type: 'number',
      renderCell: (params: GridRenderCellParams<TariffRecommendation>) =>
        `${(params.value as number).toFixed(2)} €`,
    },
    {
      field: 'monthlySavingsEur',
      headerName: t('tariffRecommender.monthlySavings'),
      flex: 1,
      minWidth: 120,
      type: 'number',
      renderCell: (params: GridRenderCellParams<TariffRecommendation>) => {
        const val = params.value as number;
        if (val <= 0) return <CheckCircleIcon color="success" fontSize="small" />;
        return (
          <Typography variant="body2" fontWeight={700} color="warning.main">
            -{val.toFixed(2)} €
          </Typography>
        );
      },
    },
    {
      field: 'annualSavingsEur',
      headerName: t('tariffRecommender.annualSavings'),
      flex: 1,
      minWidth: 120,
      type: 'number',
      renderCell: (params: GridRenderCellParams<TariffRecommendation>) => {
        const val = params.value as number;
        if (val <= 0) return <CheckCircleIcon color="success" fontSize="small" />;
        return (
          <Typography variant="body2" fontWeight={700} color="error.main">
            -{val.toFixed(2)} €
          </Typography>
        );
      },
    },
    {
      field: 'isOptimal',
      headerName: t('tariffRecommender.status'),
      flex: 0.8,
      minWidth: 100,
      renderCell: (params: GridRenderCellParams<TariffRecommendation>) =>
        params.value ? (
          <Chip
            icon={<CheckCircleIcon />}
            label={t('tariffRecommender.optimal')}
            size="small"
            color="success"
            variant="outlined"
          />
        ) : (
          <Chip
            icon={<CompareArrowsIcon />}
            label={t('tariffRecommender.changeSuggested')}
            size="small"
            color="warning"
            variant="filled"
          />
        ),
    },
    {
      field: '_actions',
      headerName: '',
      width: 50,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<TariffRecommendation>) => (
        <Tooltip title={t('tariffRecommender.viewDetail')}>
          <IconButton
            size="small"
            onClick={() =>
              setExpandedCups(expandedCups === params.row.cups ? null : params.row.cups)
            }
          >
            {expandedCups === params.row.cups ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const expandedRow = data.find((d) => d.cups === expandedCups);

  return (
    <Box>
      <PageHeader
        title={t('tariffRecommender.title')}
        action={
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={18} /> : <AutorenewIcon />}
            onClick={() => void load()}
            disabled={loading}
          >
            {t('tariffRecommender.analyze')}
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {data.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="overline" color="text.secondary">
                  {t('tariffRecommender.analyzed')}
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {data.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('tariffRecommender.supplyPoints')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: canImprove.length > 0 ? 'warning.main' : 'success.main',
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="overline" color="text.secondary">
                  {t('tariffRecommender.canImprove')}
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color={canImprove.length > 0 ? 'warning.main' : 'success.main'}
                >
                  {canImprove.length}
                </Typography>
                <Stack direction="row" justifyContent="center" alignItems="center" spacing={0.5}>
                  {canImprove.length > 0 ? (
                    <ErrorOutlineIcon color="warning" fontSize="small" />
                  ) : (
                    <CheckCircleIcon color="success" fontSize="small" />
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {canImprove.length > 0
                      ? t('tariffRecommender.changeRecommended')
                      : t('tariffRecommender.allOptimal')}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: totalAnnualSavings > 0 ? NATURGY.orange : 'success.main',
                bgcolor: totalAnnualSavings > 0 ? 'rgba(245,131,31,0.06)' : undefined,
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="overline" color="text.secondary">
                  {t('tariffRecommender.potentialSavings')}
                </Typography>
                <Stack direction="row" justifyContent="center" alignItems="center" spacing={0.5}>
                  {totalAnnualSavings > 0 && <AssessmentIcon sx={{ color: NATURGY.orange }} />}
                  <Typography
                    variant="h4"
                    fontWeight={700}
                    sx={{ color: totalAnnualSavings > 0 ? NATURGY.orange : 'success.main' }}
                  >
                    {totalAnnualSavings.toFixed(2)} €
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {t('tariffRecommender.perYear')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Main Data Grid */}
      <DataGrid
        rows={data}
        columns={columns}
        getRowId={(row) => row.cups}
        loading={loading}
        autoHeight
        disableRowSelectionOnClick
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        sx={{
          '& .MuiDataGrid-row': {
            cursor: 'pointer',
          },
        }}
        localeText={{
          noRowsLabel: loading ? t('common.loading') : t('tariffRecommender.noData'),
        }}
      />

      {/* Expanded Detail Panel */}
      <Collapse in={expandedRow != null}>
        {expandedRow && (
          <Card elevation={0} sx={{ mt: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <AssessmentIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  {t('tariffRecommender.detailTitle', { cups: expandedRow.cups })}
                </Typography>
              </Stack>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    CUPS
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {expandedRow.cups}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('tariffRecommender.zone')}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {expandedRow.zona}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('tariffRecommender.periodsAnalyzed')}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {expandedRow.periodsAnalyzed}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('tariffRecommender.status')}
                  </Typography>
                  {expandedRow.isOptimal ? (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label={t('tariffRecommender.optimal')}
                      size="small"
                      color="success"
                    />
                  ) : (
                    <Chip
                      icon={<CompareArrowsIcon />}
                      label={`${t('tariffRecommender.switchTo')} ${expandedRow.recommendedTariff}`}
                      size="small"
                      color="warning"
                    />
                  )}
                </Grid>
              </Grid>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                {t('tariffRecommender.comparisonTitle')}
              </Typography>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('tariffRecommender.tariff')}</TableCell>
                      <TableCell align="right">{t('tariffRecommender.fixedCost')}</TableCell>
                      <TableCell align="right">{t('tariffRecommender.variableCost')}</TableCell>
                      <TableCell align="right">{t('tariffRecommender.totalMonthly')}</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expandedRow.comparisons.map((c) => {
                      const isCurrent = c.tarifa === expandedRow.currentTariff;
                      const isBest = c.tarifa === expandedRow.recommendedTariff;
                      return (
                        <TableRow
                          key={c.tarifa}
                          sx={{
                            bgcolor: isBest ? 'rgba(46,125,50,0.06)' : undefined,
                            fontWeight: isCurrent || isBest ? 700 : 400,
                          }}
                        >
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body2" fontWeight={isCurrent || isBest ? 700 : 400}>
                                {c.tarifa}
                              </Typography>
                              {isCurrent && (
                                <Chip label={t('tariffRecommender.current')} size="small" variant="outlined" />
                              )}
                              {isBest && !isCurrent && (
                                <Chip
                                  label={t('tariffRecommender.recommended')}
                                  size="small"
                                  color="success"
                                />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell align="right">{c.fixedCostEur.toFixed(2)} €</TableCell>
                          <TableCell align="right">{c.variableCostEur.toFixed(2)} €</TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              color={isBest ? 'success.main' : 'text.primary'}
                            >
                              {c.avgMonthlyCostEur.toFixed(2)} €
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {isBest && <CheckCircleIcon color="success" fontSize="small" />}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Collapse>
    </Box>
  );
}
