import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import CssBaseline from '@mui/material/CssBaseline';

export default function HomePage() {
  return (
    <>
      <CssBaseline enableColorScheme />
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            component="h1"
            variant="h3"
            sx={{ fontWeight: 'bold', mb: 2 }}
          >
            Accessibility Auth Library
          </Typography>
          <Typography
            variant="h5"
            color="textSecondary"
            sx={{ mb: 4 }}
          >
            Choose an authentication method to continue
          </Typography>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          sx={{ justifyContent: 'center' }}
        >
          <Card
            sx={{
              flex: 1,
              maxWidth: 300,
              transition: 'transform 0.3s, boxShadow 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              },
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 'bold', mb: 2 }}
              >
                ASL Authentication
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mb: 3 }}
              >
                Create a secure passphrase using American Sign Language gestures
              </Typography>
              <Button
                variant="contained"
                fullWidth
                component={Link}
                to="/asl"
                sx={{
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: '12px',
                    padding: '12px 24px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    transform: 'translateY(-2px)',
                    },
                }}
                >
                ASL Login / Signup
                </Button>
            </CardContent>
          </Card>

          <Card
            sx={{
              flex: 1,
              maxWidth: 300,
              transition: 'transform 0.3s, boxShadow 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              },
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 'bold', mb: 2 }}
              >
                Graphical Authentication
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mb: 3 }}
              >
                Create a password by selecting a sequence of images
              </Typography>
              <Button
                variant="contained"
                fullWidth
                component={Link}
                to="/graphical"
                sx={{
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: '12px',
                    padding: '12px 24px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    transform: 'translateY(-2px)',
                    },
                }}
              >
                Graphical Login / Signup
              </Button>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </>
  );
}
