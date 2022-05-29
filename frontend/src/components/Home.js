import * as React from 'react';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { Link } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';



const theme = createTheme();

export default function Home() {

    return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <main>
      <div className="container">
        <div className="item"></div>
        <div className="item"></div>
        <div className="item"></div>        
        <div class="title">
        <Container maxWidth="sm">
            <Typography component="h1" variant="h2" align="center" sx={{color : '#fff'}} gutterBottom>
              Python AI
            </Typography>
            <Typography variant="h5" align="center" sx={{color : '#fff'}} paragraph>
              Have some fun with our Python AI tools.
            </Typography>
            <Stack sx={{ pt: 4 }} direction="row" spacing={2} justifyContent="center" >
              <Link to="/face_swapper">
                <Button style={{backgroundColor: "#97CC04"}} variant="contained">Face swapper</Button>
              </Link>
              <Link to="/face_filter">
                <Button style={{backgroundColor: "#EEB902"}} variant="contained">Face Filter</Button>
              </Link>
            </Stack>
          </Container>
          </div>
      </div>

      </main>








    </ThemeProvider>
  );
}