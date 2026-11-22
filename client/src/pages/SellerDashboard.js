import { apiUrl, mediaUrl } from '../utils/api';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Pagination, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { EmailOutlined, PhoneOutlined, WhatsApp } from '@mui/icons-material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED'];
const statusColor = { NEW: 'info', CONTACTED: 'warning', CONVERTED: 'success', CLOSED: 'default' };
const displayDate = (value) => value ? new Date(value).toLocaleDateString('en-GB') : '—';

export default function SellerDashboard() {
  const { user, token } = useAuth();
  const [inquiries, setInquiries] = useState([]); const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState(''); const [searchInput, setSearchInput] = useState(''); const [status, setStatus] = useState(''); const [date, setDate] = useState(''); const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [selected, setSelected] = useState(null); const [saving, setSaving] = useState(false); const [stats, setStats] = useState({});
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }), [token]);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search); if (status) params.set('status', status); if (date) params.set('date', date);
      const response = await fetch(apiUrl(`/api/seller/inquiries?${params}`), { headers }); const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || 'Unable to load inquiries. Please try again.');
      setInquiries(body.data); setPagination(body.pagination); setStats(body.stats || {});
    } catch (err) { setError(err.message || 'Unable to load inquiries. Please try again.'); } finally { setLoading(false); }
  }, [date, headers, page, search, status]);
  useEffect(() => { load(); }, [load]);
  const updateInquiry = async () => {
    setSaving(true); setError('');
    try {
      const response = await fetch(apiUrl(`/api/seller/inquiries/${selected._id}`), { method: 'PATCH', headers, body: JSON.stringify({ status: selected.status, sellerNote: selected.sellerNote || '' }) });
      const body = await response.json(); if (!response.ok || !body.success) throw new Error(body.message || 'Unable to save the inquiry.');
      setSelected(null); await load();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const phone = selected?.phone?.replace(/\D/g, ''); const image = selected?.product?.primaryImage || selected?.product?.images?.[0];
  return <Box className="page-container" sx={{ py: { xs: 2, md: 4 } }}>
    <Typography variant="h3" component="h1" sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>Seller Dashboard</Typography>
    <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>Welcome, {user?.name || 'Seller'}</Typography>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
      {[['Total Inquiries', Object.values(stats).reduce((total, count) => total + count, 0)], ...STATUSES.map((item) => [item[0] + item.slice(1).toLowerCase(), stats[item] || 0])].map(([label, total]) => <Card key={label} variant="outlined"><CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}><Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="h4">{total}</Typography></CardContent></Card>)}
    </Box>
    <Paper sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField fullWidth size="small" label="Search customer, phone, email or product" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { setPage(1); setSearch(searchInput); } }} />
        <Button variant="outlined" onClick={() => { setPage(1); setSearch(searchInput); }}>Search</Button>
        <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Status</InputLabel><Select label="Status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><MenuItem value="">All statuses</MenuItem>{STATUSES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl>
        <TextField size="small" label="Date" type="date" InputLabelProps={{ shrink: true }} value={date} onChange={(event) => { setDate(event.target.value); setPage(1); }} />
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /><Typography sx={{ mt: 1 }}>Loading inquiries...</Typography></Box> : inquiries.length === 0 ? <Box sx={{ py: 6, textAlign: 'center' }}><Typography variant="h6">No inquiries yet.</Typography><Typography color="text.secondary">Customer inquiries for your products will appear here.</Typography></Box> : <>
        <TableContainer sx={{ overflowX: 'auto' }}><Table size="small" sx={{ minWidth: 900 }}><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Customer</TableCell><TableCell>Phone</TableCell><TableCell>Email</TableCell><TableCell>Product</TableCell><TableCell>Message</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead><TableBody>{inquiries.map((inquiry) => <TableRow key={inquiry._id} hover><TableCell>{displayDate(inquiry.createdAt)}</TableCell><TableCell>{inquiry.name}</TableCell><TableCell>{inquiry.phone}</TableCell><TableCell>{inquiry.email}</TableCell><TableCell>{inquiry.product?.name || inquiry.productName || 'Product unavailable'}</TableCell><TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inquiry.message}</TableCell><TableCell><Chip size="small" label={inquiry.status} color={statusColor[inquiry.status] || 'default'} /></TableCell><TableCell><Button size="small" onClick={() => setSelected({ ...inquiry })}>View</Button></TableCell></TableRow>)}</TableBody></Table></TableContainer>
        {pagination?.pages > 1 && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}><Pagination count={pagination.pages} page={page} onChange={(_, value) => setPage(value)} /></Box>}
      </>}
    </Paper>
    <Dialog open={Boolean(selected)} onClose={() => !saving && setSelected(null)} fullWidth maxWidth="sm"><DialogTitle>Inquiry details</DialogTitle>{selected && <><DialogContent dividers><Typography variant="subtitle1" fontWeight={700}>Customer Details</Typography><Typography>Name: {selected.name}</Typography><Typography>Email: {selected.email}</Typography><Typography>Phone / WhatsApp: {selected.phone}</Typography><Stack direction="row" spacing={1} sx={{ my: 1.5 }}><Button size="small" component="a" href={`tel:${selected.phone}`} startIcon={<PhoneOutlined />}>Call</Button><Button size="small" component="a" target="_blank" rel="noreferrer" href={`https://wa.me/${phone}`} startIcon={<WhatsApp />}>WhatsApp</Button><Button size="small" component="a" href={`mailto:${selected.email}`} startIcon={<EmailOutlined />}>Email</Button></Stack><Typography variant="subtitle1" fontWeight={700} sx={{ mt: 2 }}>Product Details</Typography><Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>{image && <Box component="img" src={mediaUrl(image)} alt={selected.product?.name} sx={{ height: 65, width: 65, objectFit: 'contain' }} />}<Box><Typography>{selected.product?.name || selected.productName}</Typography><Typography variant="body2" color="text.secondary">Product ID: {selected.product?._id || selected.product}</Typography></Box></Box><Typography variant="subtitle1" fontWeight={700} sx={{ mt: 2 }}>Inquiry</Typography><Typography sx={{ whiteSpace: 'pre-wrap' }}>{selected.message}</Typography><FormControl fullWidth sx={{ mt: 2 }}><InputLabel>Status</InputLabel><Select label="Status" value={selected.status} onChange={(event) => setSelected({ ...selected, status: event.target.value })}>{STATUSES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl><TextField fullWidth sx={{ mt: 2 }} label="Seller Note" multiline minRows={3} value={selected.sellerNote || ''} onChange={(event) => setSelected({ ...selected, sellerNote: event.target.value })} /></DialogContent><DialogActions><Button onClick={() => setSelected(null)} disabled={saving}>Cancel</Button><Button variant="contained" onClick={updateInquiry} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></DialogActions></>}</Dialog>
  </Box>;
}
