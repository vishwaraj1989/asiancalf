import React, { useState, useContext } from 'react';
import api from '../services/api';
import AuthContext from '../context/AuthContext';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      const token = res.data.data.token;
      login(token);
      navigate('/');
    } catch (err) {
      alert('Login failed');
    }
  };

  return (
    <Box component="form" onSubmit={submit} sx={{ maxWidth: 480 }}>
      <Typography variant="h5" gutterBottom>Login</Typography>
      <TextField label="Email" fullWidth margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField label="Password" type="password" fullWidth margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button type="submit" variant="contained" sx={{ mt: 2 }}>Login</Button>
    </Box>
  );
}
