import { apiUrl, mediaUrl } from '../utils/api';
import { Alert, Box, Button, Divider, Paper, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const initialForm = { name: '', email: '', phone: '', message: '', product: '' };

export default function Inquiry() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(initialForm);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const productId = searchParams.get('product');

  useEffect(() => {
    if (!productId) return;
    setForm((current) => ({ ...current, product: productId }));
    fetch(apiUrl(`/api/products/${productId}`)).then((response) => response.json()).then((body) => {
      if (body.success) setProduct(body.data);
      else setError('The selected product is no longer available.');
    }).catch(() => setError('Unable to load the selected product.'));
  }, [productId]);

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault(); setError(''); setSuccess(''); setSubmitting(true);
    try {
      const response = await fetch(apiUrl('/api/inquiries'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.errors?.[0]?.msg || body.message || 'Unable to send your inquiry.');
      setSuccess(body.message); setForm((current) => ({ ...initialForm, product: current.product }));
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  const productImage = product?.primaryImage || product?.images?.[0];
  return <Box className="page-container inquiry-page"><Paper className="inquiry-card"><Typography variant="overline" className="inquiry-eyebrow">Talk to the seller</Typography><Typography variant="h3" component="h1">Purchase from seller</Typography><Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>Send your details and the seller will contact you.</Typography>{product && <Paper variant="outlined" sx={{ display: 'flex', gap: 2, p: 2, mb: 3, alignItems: 'center', bgcolor: 'grey.50' }}>{productImage && <Box component="img" src={mediaUrl(productImage)} alt={product.name} sx={{ width: 92, height: 92, objectFit: 'contain', bgcolor: 'white' }} />}<Box sx={{ minWidth: 0 }}><Typography variant="subtitle2" color="text.secondary">Selected product</Typography><Typography variant="h6">{product.name}</Typography><Typography variant="body2" color="text.secondary">Product ID: {product._id}</Typography><Typography variant="body2" color="text.secondary">{[product.department, product.productCategory, product.subcategory].filter(Boolean).join(' › ')}</Typography></Box></Paper>}{productId && !product && !error && <Alert severity="info" sx={{ mb: 2 }}>Loading selected product details…</Alert>}{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}<Divider sx={{ mb: 3 }} /><Box component="form" onSubmit={submit} className="inquiry-form"><TextField required label="Your name" name="name" value={form.name} onChange={update} autoComplete="name" /><TextField required label="Email address" name="email" type="email" value={form.email} onChange={update} autoComplete="email" /><TextField required label="Phone / WhatsApp number" name="phone" value={form.phone} onChange={update} autoComplete="tel" /><TextField required label="How can we help?" name="message" value={form.message} onChange={update} multiline minRows={5} placeholder="Tell us about quantity, delivery location, or anything else." /><Button type="submit" variant="contained" disabled={submitting || (Boolean(productId) && !product)}>{submitting ? 'Sending…' : 'Send inquiry to seller'}</Button></Box></Paper></Box>;
}
