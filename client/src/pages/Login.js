import { apiUrl } from '../utils/api';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      const response = await fetch(apiUrl('/api/auth/login'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || 'Sign in failed.');
      signIn(body.data);
      navigate(body.data.user.role === 'admin' ? '/admin/products' : body.data.user.role === 'seller' ? '/seller/dashboard' : '/');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  return <Box className="amazon-login-page">
    <Box className="amazon-login-shell">
      <Typography component={RouterLink} to="/" className="amazon-login-logo">asian<span>calf</span></Typography>
      <Box component="form" className="amazon-login-card" onSubmit={submit}>
        <Typography component="h1" className="amazon-login-title">Sign in</Typography>
        {error && <Alert severity="error" className="amazon-login-alert">{error}</Alert>}
        <Box className="amazon-login-field">
          <Typography component="label" htmlFor="login-email">Email or mobile phone number</Typography>
          <TextField id="login-email" required fullWidth type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Box>
        <Box className="amazon-login-field">
          <Box className="amazon-password-label"><Typography component="label" htmlFor="login-password">Password</Typography><Typography component={RouterLink} to="/register">Forgot password?</Typography></Box>
          <TextField id="login-password" required fullWidth type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Box>
        <Button className="amazon-login-submit" type="submit" fullWidth disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button>
        <Typography className="amazon-login-terms">By continuing, you agree to AsianCalf&apos;s Conditions of Use and Privacy Notice.</Typography>
        <Typography className="amazon-login-help">› <RouterLink to="/register">Need help?</RouterLink></Typography>
      </Box>
      <Box className="amazon-login-new"><Typography>New to AsianCalf?</Typography></Box>
      <Button component={RouterLink} to="/register" variant="outlined" fullWidth className="amazon-login-create">Create your AsianCalf account</Button>
    </Box>
  </Box>;
}
