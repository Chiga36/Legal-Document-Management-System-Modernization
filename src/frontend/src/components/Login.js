import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Box, 
  Link,
  InputAdornment,
  IconButton,
  CircularProgress,
  Divider,
  FormControlLabel,
  Checkbox,
  Snackbar
} from '@material-ui/core';
import { 
  Visibility, 
  VisibilityOff, 
  LockOutlined as LockIcon 
} from '@material-ui/icons';
import { Alert } from '@material-ui/lab';
import axios from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  // Auth context for login functionality
  const { login } = useAuth();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [requireMfa, setRequireMfa] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Handle login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // First stage login - email and password
      const response = await axios.post('/api/auth/login', {
        email,
        password,
        ...(requireMfa && { mfaToken })
      });
      
      // Check if MFA is required
      if (response.data.requireMfa) {
        setRequireMfa(true);
        setLoading(false);
        return;
      }
      
      // Store authentication data
      const { token, user } = response.data;
      
      // Update authentication context
      login(token, user, rememberMe);
      
      // Redirect will be handled by the AuthContext
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.error || 
        'Authentication failed. Please check your credentials.'
      );
      setLoading(false);
    }
  };
  
  // Handle password visibility toggle
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <Grid container justifyContent="center">
      <Grid item xs={12} sm={8} md={6} lg={4}>
        <Paper elevation={3}>
          <Box p={4}>
            <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
              <LockIcon fontSize="large" color="primary" />
              <Typography component="h1" variant="h5">
                Legal DMS Login
              </Typography>
            </Box>
            
            {error && (
              <Alert severity="error" style={{ marginBottom: 16 }}>
                {error}
              </Alert>
            )}
            
            <form onSubmit={handleSubmit}>
              {!requireMfa ? (
                // Email and password form
                <>
                  <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    inputProps={{
                      'data-testid': 'email-input'
                    }}
                  />
                  
                  <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleTogglePasswordVisibility}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    inputProps={{
                      'data-testid': 'password-input'
                    }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        value="remember"
                        color="primary"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                    }
                    label="Remember me"
                  />
                </>
              ) : (
                // MFA form
                <>
                  <Typography variant="body1" paragraph>
                    A two-factor authentication code is required to continue. Please enter the code from your authenticator app.
                  </Typography>
                  
                  <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    id="mfaToken"
                    label="MFA Code"
                    name="mfaToken"
                    autoComplete="off"
                    autoFocus
                    value={mfaToken}
                    onChange={(e) => setMfaToken(e.target.value)}
                    inputProps={{
                      maxLength: 6,
                      'data-testid': 'mfa-input'
                    }}
                  />
                </>
              )}
              
              <Box mt={2}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  data-testid="login-button"
                >
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : requireMfa ? (
                    'Verify'
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </Box>
              
              <Box mt={2} display="flex" justifyContent="space-between">
                <Link href="#" variant="body2" onClick={(e) => {
                  e.preventDefault();
                  // Handle forgot password logic
                }}>
                  Forgot password?
                </Link>
                
                {requireMfa && (
                  <Link href="#" variant="body2" onClick={(e) => {
                    e.preventDefault();
                    setRequireMfa(false);
                  }}>
                    Back to login
                  </Link>
                )}
              </Box>
            </form>
            
            <Box mt={4}>
              <Divider />
              <Box mt={2} textAlign="center">
                <Typography variant="body2" color="textSecondary">
                  For account assistance, please contact your system administrator
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Login;