import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { useUser } from './UserStorage';
import { Button, TextField, InputAdornment, Snackbar, Alert, Box } from '@mui/material';
import { Lock, Email, Edit as LoginIcon } from '@mui/icons-material';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>(''); // Track the error message
  const { setUser } = useUser();
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const loginMutation = useMutation(
    async (credentials: { email: string; password: string }) => {
      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      return response.json();
    },
    {
      onSuccess: (data) => {
        if (data?.message === 'Invalid credentials provided!') {
          setErrorMessage('Invalid credentials. Please try again.');
          setSnackbarOpen(true);
        } else {
          const user = {
            email,
            password,
            accessToken: data.accessToken,
          };
          setUser(user);
          setErrorMessage('');
          setSnackbarOpen(true);
        }
      },
      onError: (error: any) => {
        setErrorMessage('An error occurred during login. Please try again later.');
        console.error('Login Failed:', error.message);
      },
    }
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(''); // Clear previous error messages
    loginMutation.mutate({ email, password });
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f4f6f9',
        fontFamily: 'Roboto, sans-serif',
      }}
    >
      <Box
        sx={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
          width: '320px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Login Icon */}
        <Box sx={{ marginBottom: '20px' }}>
          <LoginIcon sx={{ fontSize: '50px', color: '#007BFF' }} />
        </Box>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {/* Email Field */}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            margin="normal"
            InputProps={{
              startAdornment: <InputAdornment position="start"><Email /></InputAdornment>,
            }}
            helperText="Enter your email address"
            sx={{
              marginBottom: '20px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              },
              '& .MuiInputLabel-root': {
                fontSize: '16px',
              },
            }}
          />
          
          {/* Password Field */}
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            margin="normal"
            InputProps={{
              startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
            }}
            helperText="Enter your password"
            sx={{
              marginBottom: '30px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              },
              '& .MuiInputLabel-root': {
                fontSize: '16px',
              },
            }}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{
              padding: '12px',
              fontSize: '16px',
              borderRadius: '12px',
              backgroundColor: '#007BFF',
              color: 'white',
              transition: 'background-color 0.3s',
              '&:hover': {
                backgroundColor: '#0056b3',
              },
            }}
            disabled={loginMutation.isLoading} // Disable button during loading
          >
            {loginMutation.isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        {/* Snackbar for Error or Success Messages */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
        >
          <Alert onClose={handleCloseSnackbar} severity="error">
            {errorMessage || 'Login successful!'}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default Login;
