import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import TextField from '@mui/material/TextField';

interface ASLPasswordProps {
  passwordError: boolean;
  passwordErrorMessage: string;
  onPasswordChange?: (value: string) => void;
}

function ASLPassword({passwordError, passwordErrorMessage, onPasswordChange}: ASLPasswordProps) {
  return (
    <FormControl>
      <FormLabel htmlFor="password">Password</FormLabel>
      <TextField
        required
        fullWidth
        name="password"
        placeholder="••••••"
        type="password"
        id="password"
        autoComplete="new-password"
        variant="outlined"
        error={passwordError}
        helperText={passwordErrorMessage}
        color={passwordError ? 'error' : 'primary'}
        onChange={(e) => onPasswordChange?.(e.target.value)}
      />
    </FormControl>
  );
}


export default ASLPassword;