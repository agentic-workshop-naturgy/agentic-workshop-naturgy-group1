import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  action?: ReactNode;
}

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="h4" sx={{ flexGrow: 1, fontWeight: 700 }}>
          {title}
        </Typography>
        {action}
      </Box>
      <Divider sx={{ borderColor: 'divider' }} />
    </Box>
  );
}
