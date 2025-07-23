'use client'
import { Button, TextField, Typography, Container, Box, CircularProgress } from "@mui/material";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";


export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // checks if the user is leased
        const response = await fetch('/api/users/check');
        if (response.ok) {
          const data = await response.json();
          if (data.valid) {
            if(process.env.GAME_BROWSER === "true") router.push('/game_browser');
            else router.push('/game');
          } 
          else {
            setIsCheckingUser(false); // New/unleased user, create user
          }
        } else {
          // failover if api breaks
          setIsCheckingUser(false);
        }
      } catch (error) {
        console.error("Failed to check user", error);
        setIsCheckingUser(false); // On network error, show form
      }
    };

    checkUser();
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!name.trim()) {
      setError("Empty name provided");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'User creation process failed.');
      }

      if(process.env.GAME_BROWSER === "true") router.push('/game_browser');
      else router.push('/game');

    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (isCheckingUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'white',
        }}
      >
        <Typography component="h1" variant="h5" color="primary">
          Register
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Name"
            name="name"
            autoComplete="name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
          />
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Register'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}