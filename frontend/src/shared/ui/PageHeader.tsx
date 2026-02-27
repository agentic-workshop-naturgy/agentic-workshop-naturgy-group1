import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  action?: ReactNode;
}

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
      <Typography variant="h4" sx={{ flexGrow: 1 }}>
        {title}
      </Typography>
      {action}
    </Box>
  );
}
