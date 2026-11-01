import { apiUrl } from '../utils/api';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const initialForm = { name: '', mobile: '', email: '', password: '', confirmPassword: '' };

export default function Register() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...registration } = form;
      const response = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registration),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || 'Could not create your account.');
      signIn(body.data);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  };

  return <Box className="amazon-login-page">
    <Box className="amazon-login-shell">
      <Typography component={RouterLink} to="/" className="amazon-login-logo">asian<span>calf</span></Typography>
      <Box component="form" className="amazon-login-card" onSubmit={submit}>
        <Typography component="h1" className="amazon-login-title">Create account</Typography>
        {error && <Alert severity="error" className="amazon-login-alert">{error}</Alert>}
        <Box className="amazon-login-field">
          <Typography component="label" htmlFor="register-name">Your name</Typography>
          <TextField id="register-name" required fullWidth autoComplete="name" value={form.name} onChange={updateField('name')} />
        </Box>
        <Box className="amazon-login-field">
          <Typography component="label" htmlFor="register-mobile">Mobile number <span aria-hidden="true">(optional)</span></Typography>
          <TextField id="register-mobile" fullWidth type="tel" autoComplete="tel" value={form.mobile} onChange={updateField('mobile')} />
        </Box>
        <Box className="amazon-login-field">
          <Typography component="label" htmlFor="register-email">Email</Typography>
          <TextField id="register-email" required fullWidth type="email" autoComplete="email" value={form.email} onChange={updateField('email')} />
        </Box>
        <Box className="amazon-login-field">
          <Typography component="label" htmlFor="register-password">Password</Typography>
          <TextField id="register-password" required fullWidth type="password" autoComplete="new-password" helperText="At least 6 characters" value={form.password} onChange={updateField('password')} />
        </Box>
        <Box className="amazon-login-field">
          <Typography component="label" htmlFor="register-confirm-password">Re-enter password</Typography>
          <TextField id="register-confirm-password" required fullWidth type="password" autoComplete="new-password" value={form.confirmPassword} onChange={updateField('confirmPassword')} />
        </Box>
        <Button className="amazon-login-submit" type="submit" fullWidth disabled={loading}>{loading ? 'Creating account...' : 'Create your AsianCalf account'}</Button>
        <Typography className="amazon-login-terms">By creating an account, you agree to AsianCalf&apos;s Conditions of Use and Privacy Notice.</Typography>
        <Typography className="amazon-login-help">Already have an account? <RouterLink to="/login">Sign in</RouterLink></Typography>
      </Box>
    </Box>
  </Box>;
}
