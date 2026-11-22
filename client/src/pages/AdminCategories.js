import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, IconButton, MenuItem, Snackbar, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PageMessage from './PageMessage';
import { useAuth } from '../context/AuthContext';
import { apiUrl, mediaUrl } from '../utils/api';

const emptyForm = { name: '', slug: '', level: 1, parentId: '', departmentId: '', image: '', description: '', isActive: true, sortOrder: 0 };

export default function AdminCategories() {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const loadCategories = async () => {
    try {
      const response = await fetch(apiUrl('/api/categories'));
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || 'Categories could not be loaded.');
      setCategories(body.data || []);
    } catch (loadError) { setError(loadError.message); }
  };

  useEffect(() => { loadCategories(); }, []);

  const departments = useMemo(() => categories.filter((item) => item.level === 1 || (!item.level && item.department === item.name)), [categories]);
  const mainCategories = useMemo(() => categories.filter((item) =>
    item.level === 2
    || (!item.level && item.parentId && item.departmentId)
  ).filter((item) => (item.departmentId || '').toString() === departmentId), [categories, departmentId]);
  const subcategories = useMemo(() => categories.filter((item) =>
    item.level === 3
    || (!item.level && item.parentId)
  ).filter((item) => (item.parentId || '').toString() === categoryId), [categories, categoryId]);

  const normalizedSearch = search.trim().toLowerCase();
  const visibleDepartments = departments.filter((item) => item.name.toLowerCase().includes(normalizedSearch));
  const visibleMainCategories = mainCategories.filter((item) => item.name.toLowerCase().includes(normalizedSearch));
  const visibleSubcategories = subcategories.filter((item) => item.name.toLowerCase().includes(normalizedSearch));

  const selectedDepartment = departments.find((item) => item._id === departmentId);
  const selectedCategory = mainCategories.find((item) => item._id === categoryId);
  const selectedSubcategory = subcategories.find((item) => item._id === subcategoryId);

  const selectDepartment = (item) => {
    setDepartmentId(item._id);
    setCategoryId('');
    setSubcategoryId('');
  };

  const setNewForm = (level, parentId = '', department = departmentId) => {
    setEditingId('');
    setForm({
      ...emptyForm,
      level,
      parentId,
      departmentId: level === 1 ? '' : department,
    });
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    if (item.level === 3) setSubcategoryId(item._id);
    setForm({
      name: item.name || '',
      slug: item.slug || '',
      level: item.level || 3,
      parentId: item.parentId || '',
      departmentId: item.departmentId || departmentId,
      image: item.image || '',
      description: item.description || '',
      isActive: item.isActive !== false && item.active !== false,
      sortOrder: item.sortOrder || 0,
    });
  };

  const saveCategory = async (event) => {
    event.preventEvent?.();
    event.preventDefault();
    setError('');
    try {
      const response = await fetch(apiUrl(editingId ? `/api/categories/${editingId}` : '/api/categories'), {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || 'Category could not be saved.');
      setToast(editingId ? 'Category updated.' : 'Category added.');
      setEditingId('');
      setForm(emptyForm);
      await loadCategories();
    } catch (saveError) { setError(saveError.message); }
  };

  const deleteCategory = async (item) => {
    if (!window.confirm(`Delete “${item.name}”?`)) return;
    setError('');
    try {
      const response = await fetch(apiUrl(`/api/categories/${item._id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || 'Category could not be deleted.');
      setToast('Category deleted.');
      if (item._id === departmentId) setDepartmentId('');
      if (item._id === categoryId) setCategoryId('');
      await loadCategories();
    } catch (deleteError) { setError(deleteError.message); }
  };

  const reorder = async (item, direction) => {
    const siblings = categories.filter((candidate) => {
      if (item.level === 1) return candidate.level === 1;
      return (candidate.parentId || '').toString() === (item.parentId || '').toString();
    }).sort((left, right) => (left.sortOrder || 0) - (right.sortOrder || 0));
    const index = siblings.findIndex((candidate) => candidate._id === item._id);
    const swap = siblings[index + direction];
    if (!swap) return;
    try {
      await Promise.all([item, swap].map((candidate) => fetch(apiUrl(`/api/categories/${candidate._id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sortOrder: siblings.findIndex((sibling) => sibling._id === candidate._id) + (candidate === item ? direction : -direction) }),
      })));
      await loadCategories();
    } catch (reorderError) { setError(reorderError.message); }
  };

  const uploadImage = async (event) => {
    if (!editingId || !event.target.files?.[0]) return;
    setError('');
    const data = new FormData();
    data.append('image', event.target.files[0]);
    try {
      const response = await fetch(apiUrl(`/api/categories/${editingId}/image`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || 'Image could not be uploaded.');
      setForm((current) => ({ ...current, image: body.data.image }));
      await loadCategories();
      setToast('Category image uploaded.');
    } catch (uploadError) { setError(uploadError.message); }
  };

  const renderItem = (item, level) => (
    <Box key={item._id} className={`category-picker-item ${level === 1 && departmentId === item._id ? 'selected' : ''} ${level === 2 && categoryId === item._id ? 'selected' : ''}`}>
      <Button
        className="category-picker-name"
        onClick={() => level === 1 ? selectDepartment(item) : level === 2 ? (setCategoryId(item._id), setSubcategoryId('')) : (setSubcategoryId(item._id), startEdit(item))}
      >
        {item.image && <img src={mediaUrl(item.image)} alt="" />}
        <span>{item.name}</span>
      </Button>
      <Box className="category-picker-actions">
        <IconButton size="small" aria-label="Move up" onClick={() => reorder(item, -1)}><ArrowUpwardIcon fontSize="small" /></IconButton>
        <IconButton size="small" aria-label="Move down" onClick={() => reorder(item, 1)}><ArrowDownwardIcon fontSize="small" /></IconButton>
        <IconButton size="small" aria-label="Edit" onClick={() => startEdit(item)}><EditOutlinedIcon fontSize="small" /></IconButton>
        <IconButton size="small" aria-label="Delete" onClick={() => deleteCategory(item)}><DeleteOutlineIcon fontSize="small" /></IconButton>
      </Box>
    </Box>
  );

  return <PageMessage title="Category manager">
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <TextField fullWidth label="Search departments, categories or subcategories" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ mb: 2 }} />
    <Typography className="category-selected-path" sx={{ mb: 2 }}>
      Selected: {[selectedDepartment?.name, selectedCategory?.name, selectedSubcategory?.name].filter(Boolean).join(' → ') || 'No category selected'}
    </Typography>
    <Box className="category-manager-grid">
      <Box className="category-manager-column">
        <Box className="category-manager-column-header"><Typography>Departments</Typography><IconButton onClick={() => setNewForm(1)} aria-label="Add department"><AddIcon /></IconButton></Box>
        <Box className="category-manager-list">{visibleDepartments.map((item) => renderItem(item, 1))}</Box>
      </Box>
      <Box className="category-manager-column">
        <Box className="category-manager-column-header"><Typography>Main categories</Typography><IconButton disabled={!departmentId} onClick={() => setNewForm(2, departmentId, departmentId)} aria-label="Add main category"><AddIcon /></IconButton></Box>
        <Box className="category-manager-list">{visibleMainCategories.map((item) => renderItem(item, 2))}</Box>
      </Box>
      <Box className="category-manager-column">
        <Box className="category-manager-column-header"><Typography>Subcategories</Typography><IconButton disabled={!categoryId} onClick={() => setNewForm(3, categoryId, departmentId)} aria-label="Add subcategory"><AddIcon /></IconButton></Box>
        <Box className="category-manager-list">{visibleSubcategories.map((item) => renderItem(item, 3))}</Box>
      </Box>
    </Box>

    <Box component="form" onSubmit={saveCategory} className="category-editor">
      <Typography variant="h6">{editingId ? 'Edit category' : `Add ${form.level === 1 ? 'department' : form.level === 2 ? 'main category' : 'subcategory'}`}</Typography>
      <TextField select label="Level" value={form.level} onChange={(event) => setNewForm(Number(event.target.value), form.level === 1 ? '' : form.parentId, form.departmentId)} sx={{ minWidth: 180 }}>
        <MenuItem value={1}>Department</MenuItem>
        <MenuItem value={2}>Main category</MenuItem>
        <MenuItem value={3}>Subcategory</MenuItem>
      </TextField>
      {form.level > 1 && <TextField select required label="Department" value={form.departmentId} onChange={(event) => setForm((current) => ({ ...current, departmentId: event.target.value, parentId: '' }))}>
        {departments.map((item) => <MenuItem key={item._id} value={item._id}>{item.name}</MenuItem>)}
      </TextField>}
      {form.level === 3 && <TextField select required label="Main category" value={form.parentId} onChange={(event) => setForm((current) => ({ ...current, parentId: event.target.value }))}>
        {categories.filter((item) => item.level === 2 && (item.departmentId || '').toString() === form.departmentId).map((item) => <MenuItem key={item._id} value={item._id}>{item.name}</MenuItem>)}
      </TextField>}
      {form.level === 2 && <TextField select required label="Department parent" value={form.parentId} onChange={(event) => setForm((current) => ({ ...current, parentId: event.target.value, departmentId: event.target.value }))}>
        {departments.map((item) => <MenuItem key={item._id} value={item._id}>{item.name}</MenuItem>)}
      </TextField>}
      <TextField required label="Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
      <TextField label="SEO slug" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
      <TextField type="number" label="Sort order" value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))} />
      <TextField select label="Status" value={form.isActive ? 'active' : 'inactive'} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.value === 'active' }))}>
        <MenuItem value="active">Active</MenuItem>
        <MenuItem value="inactive">Inactive</MenuItem>
      </TextField>
      <TextField multiline minRows={2} label="Description" value={form.description} sx={{ gridColumn: '1 / -1' }} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
      {editingId && <Button component="label" variant="outlined" sx={{ justifySelf: 'start' }}>Upload category image<input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} /></Button>}
      <Box sx={{ gridColumn: '1 / -1', display: 'flex', gap: 1 }}>
        <Button type="submit" variant="contained" disabled={!form.name}>Save category</Button>
        {editingId && <Button onClick={() => { setEditingId(''); setForm(emptyForm); }}>Cancel</Button>}
      </Box>
    </Box>
    <Snackbar open={Boolean(toast)} autoHideDuration={3500} onClose={() => setToast('')}><Alert severity="success" variant="filled">{toast}</Alert></Snackbar>
  </PageMessage>;
}
