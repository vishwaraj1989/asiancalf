import React, { useState } from 'react';
import api from '../services/api';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', { name, email, password });
      navigate('/login');
    } catch (err) {
      alert('Registration failed');
    }
  };

  return (
    <Box component="form" onSubmit={submit} sx={{ maxWidth: 480 }}>
      <Typography variant="h5" gutterBottom>Register</Typography>
      <TextField label="Full name" fullWidth margin="normal" value={name} onChange={(e) => setName(e.target.value)} />
      <TextField label="Email" fullWidth margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField label="Password" type="password" fullWidth margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button type="submit" variant="contained" sx={{ mt: 2 }}>Register</Button>
    </Box>
  );
}
