import { useEffect, useState, ChangeEvent } from 'react';
import GraphicalPassword, { GraphicalAnimalOption, ANIMAL_POOL } from '../auth components/GraphicalPW';

// Material UI Imports
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import ButtonBase from '@mui/material/ButtonBase';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';

type Mode = 'signup' | 'login';

const actionButtonStyles = {
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
};

const imageSelectorStyles = (isSelected: boolean) => ({
  width: '100%',
  position: 'relative',
  borderRadius: '12px',
  overflow: 'hidden',
  border: '2px solid',
  borderColor: isSelected ? 'primary.main' : 'divider',
  backgroundColor: isSelected ? 'action.selected' : 'background.paper',
  boxShadow: isSelected ? 2 : 1,
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'scale(1.03)',
    borderColor: isSelected ? 'primary.main' : 'text.secondary',
    boxShadow: 3,
  },
});

export default function GraphicalAuthPage() {
  const [mode, setMode] = useState<Mode>('signup');
  const [userId, setUserId] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [verificationGridFaces, setVerificationGridFaces] = useState<string[]>([]);
  const [verificationGridMessage, setVerificationGridMessage] = useState<string>('');
  const [verificationAnimalArray, setVerificationAnimalArray] = useState<{id: string; url: string; name: string;}[]>([]);
  const [signupAnimalOptions, setSignupAnimalOptions] = useState<GraphicalAnimalOption[]>([]);
  const [verificationAnimalOptions, setVerificationAnimalOptions] = useState<GraphicalAnimalOption[]>([]);

  // Signup State
  const [lovedOneImg, setLovedOneImg] = useState<string>('');
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>('');

  // Login verification selections
  const [verificationFace, setVerificationFace] = useState<string>('');
  const [verificationAnimal, setVerificationAnimal] = useState<string>('');

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
            return;
          }

          reject(new Error('Unable to read uploaded image.'));
        };
        reader.onerror = () => reject(new Error('Unable to read uploaded image.'));
        reader.readAsDataURL(file);
      });

      setLovedOneImg(dataUrl);
    }
  };

  const loadVerificationGrid = async (targetUserId: string) => {
    const grid = await GraphicalPassword.getVerificationGridFaces(targetUserId);
    setVerificationGridFaces(grid.success ? grid.faceChallenges : []);
    setVerificationAnimalOptions(grid.success ? grid.animalOptions : []);
    setVerificationAnimalArray(grid.success ? grid.animalArray : []);
    setVerificationGridMessage(grid.message);
  };

  useEffect(() => {
    let isActive = true;

    if (mode === 'signup') {
      GraphicalPassword.getEnrollmentGrid(userId)
        .then((grid) => {
          if (isActive) {
            setSignupAnimalOptions(grid.success ? grid.animalOptions : []);
          }
        })
        .catch(() => {
          if (isActive) {
            setSignupAnimalOptions([]);
          }
        });

      return () => {
        isActive = false;
      };
    }

    if (mode !== 'login') {
      return () => {
        isActive = false;
      };
    }

    const trimmedId = userId.trim();
    if (!trimmedId) {
      setVerificationGridFaces([]);
      setVerificationAnimalArray([]);
      setVerificationGridMessage('');
      return () => {
        isActive = false;
      };
    }

    const timer = window.setTimeout(() => {
      loadVerificationGrid(trimmedId).catch(() => {
        if (isActive) {
          setVerificationGridFaces([]);
          setVerificationAnimalOptions([]);
          setVerificationAnimalArray([]);
        }
      });
    }, 350);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [mode, userId]);

  const handleSignup = async () => {
    const result = await GraphicalPassword.registerUser({
      id: userId,
      lovedOneImg,
      animalId: selectedAnimalId,
      animalArray: ANIMAL_POOL
    });

    setIsSuccess(result.success);
    setMessage(result.message);
  };

  const handleLogin = async () => {
    const result = await GraphicalPassword.verifyPassword(userId, verificationFace, verificationAnimal);

    setIsSuccess(result.success);
    setMessage(result.message);
  };

  const handleReset = () => {
    setUserId('');
    setLovedOneImg('');
    setSelectedAnimalId('');
    setVerificationFace('');
    setVerificationAnimal('');
    setVerificationAnimalArray([]);
    setVerificationAnimalOptions([]);
    setSignupAnimalOptions([]);
    setMessage('');
  };

  const signupAnimals = signupAnimalOptions;
  const loginAnimals = verificationAnimalArray.length
    ? verificationAnimalArray
        .map((animalId) => {const id = typeof animalId === "string" ? animalId : animalId.id;
          return verificationAnimalOptions.find((opt) => opt.id === id);})
        .filter((animal): animal is GraphicalAnimalOption => Boolean(animal))
    : verificationAnimalOptions;

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Card sx={{ borderRadius: '16px', boxShadow: 3, overflow: 'hidden' }}>
        
        {/* Toggle Header Tabs */}
        <Stack direction="row" spacing={1} sx={{ p: 1.5, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Button
            fullWidth
            onClick={() => { setMode('signup'); handleReset(); }}
            sx={{
              py: 1.5,
              textTransform: 'none',
              fontWeight: 'bold',
              borderRadius: '10px',
              bgcolor: mode === 'signup' ? 'primary.main' : 'transparent',
              color: mode === 'signup' ? 'primary.contrastText' : 'text.secondary',
              '&:hover': { bgcolor: mode === 'signup' ? 'primary.dark' : 'action.hover' },
            }}
          >
            Create Account
          </Button>
          <Button
            fullWidth
            onClick={() => { setMode('login'); setMessage(''); setIsSuccess(false); }}
            sx={{
              py: 1.5,
              textTransform: 'none',
              fontWeight: 'bold',
              borderRadius: '10px',
              bgcolor: mode === 'login' ? 'primary.main' : 'transparent',
              color: mode === 'login' ? 'primary.contrastText' : 'text.secondary',
              '&:hover': { bgcolor: mode === 'login' ? 'primary.dark' : 'action.hover' },
            }}
          >
            Sign In
          </Button>
        </Stack>

        <CardContent sx={{ p: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', textTransform: 'uppercase', tracking: 'wider', color: 'text.secondary', mb: 1 }}>
              User Identifier
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="e.g. johndoe123"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              slotProps={{
                input: {
                  sx: { borderRadius: '12px' }
                }
              }}
            />
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* SIGNUP WORKFLOW */}
          {mode === 'signup' && (
            <Stack spacing={4}>
              {/* Step 1 */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                  1. Upload a Trusted Face
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 2 }}>
                  Upload a photo of a close individual. You will pick this person out of a lineup to gain access.
                </Typography>
                
                <Stack direction="row" spacing={2} alignItems="center">
                  <ButtonBase
                    component="label"
                    sx={{
                      width: 110,
                      height: 110,
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      bgcolor: 'action.hover',
                      '&:hover': { borderColor: 'primary.main', bgcolor: 'action.selected' }
                    }}
                  >
                    <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                    {lovedOneImg ? (
                      <Box component="img" src={lovedOneImg} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Stack alignItems="center">
                        <Typography sx={{ fontSize: '1.5rem' }}>📷</Typography>
                        <Typography variant="caption" color="textSecondary">Upload</Typography>
                      </Stack>
                    )}
                  </ButtonBase>
                  {lovedOneImg && (
                    <Paper variant="outlined" sx={{ px: 2, py: 0.5, borderRadius: '20px', bgcolor: 'success.light', borderColor: 'success.main' }}>
                      <Typography variant="caption" sx={{ color: 'success.contrastText', fontWeight: 'bold' }}>✓ Locked In</Typography>
                    </Paper>
                  )}
                </Stack>
              </Box>

              {/* Step 2 */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                  2. Connect Your Secret Animal Pair
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 2 }}>
                  This acts as the second phase token for your authentication challenge pattern.
                </Typography>

                <Grid container spacing={2}>
                  {signupAnimals.map((animal) => {
                    const isSelected = selectedAnimalId === animal.id;
                    return (
                      <Grid size={4} key={animal.id}>
                        <ButtonBase onClick={() => setSelectedAnimalId(animal.id)} sx={imageSelectorStyles(isSelected)}>
                          <Box component="img" src={animal.url} sx={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
                          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0,0,0,0.5)', py: 0.25, textAlign: 'center' }}>
                            <Typography sx={{ color: 'white', fontSize: '10px', fontWeight: 'medium' }}>{animal.name}</Typography>
                          </Box>
                          {isSelected && (
                            <Box sx={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20, bgcolor: 'primary.main', color: 'white', borderRadius: '50%', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: 1 }}>✓</Box>
                          )}
                        </ButtonBase>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>

              <Button fullWidth color="primary" variant="contained" onClick={handleSignup} sx={actionButtonStyles}>
                Secure & Register Account
              </Button>
            </Stack>
          )}

          {/* SIGN IN WORKFLOW */}
          {mode === 'login' && (
            <Stack spacing={4}>
              {/* Challenge Grid 1 */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                  1. Which is your uploaded identity image?
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 2 }}>
                    The images are loaded from the backend for the user identifier you entered.
                </Typography>

                  {verificationGridMessage && (
                    <Alert severity={verificationGridFaces.length ? 'info' : 'warning'} sx={{ mb: 2, borderRadius: '12px' }}>
                      {verificationGridMessage}
                    </Alert>
                  )}

                <Grid container spacing={2}>
                  {verificationGridFaces.map((faceUrl, idx) => {
                    const isSelected = verificationFace === faceUrl;
                    return (
                      <Grid size={4} key={idx}>
                        <ButtonBase onClick={() => setVerificationFace(faceUrl)} sx={imageSelectorStyles(isSelected)}>
                          <Box component="img" src={faceUrl} sx={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
                          {isSelected && (
                            <Box sx={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20, bgcolor: 'primary.main', color: 'white', borderRadius: '50%', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: 1 }}>✓</Box>
                          )}
                        </ButtonBase>
                      </Grid>
                    );
                  })}
                </Grid>
                {!verificationGridFaces.length && !verificationGridMessage && (
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2 }}>
                    Enter a user ID to load the login challenge images.
                  </Typography>
                )}
              </Box>

              {/* Challenge Grid 2 */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                  2. Confirm your secret animal association
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 2 }}>
                  Select the target security pattern identifier.
                </Typography>

                <Grid container spacing={2}>
                  {loginAnimals.map((animal) => {
                    const isSelected = verificationAnimal === animal.id;

                    return (
                      <Grid size={4} key={animal.id}>
                        <ButtonBase onClick={() => setVerificationAnimal(animal.id)} sx={imageSelectorStyles(isSelected)}>
                          <Box component="img" src={animal.url} sx={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
                          {isSelected && (
                            <Box sx={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20, bgcolor: 'primary.main', color: 'white', borderRadius: '50%', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: 1 }}>✓</Box>
                          )}
                        </ButtonBase>
                      </Grid>
                    );
                  })}
                </Grid>

    
              </Box>

              <Button fullWidth color="success" variant="contained" onClick={handleLogin} sx={actionButtonStyles}>
                Verify Security Pattern
              </Button>
            </Stack>
          )}

          {message && (
            <Alert 
              severity={isSuccess ? 'success' : 'error'} 
              sx={{ mt: 4, borderRadius: '12px', fontWeight: 'medium' }}
            >
              {message}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}