import { createTheme, ThemeProvider } from '@mui/material/styles';

export const theme = createTheme({
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          height: '100%',
        },
        body: {
          height: '100%',
          '& #root': {
            height: '100%',
          },
        },
      },
    },
  },
});
