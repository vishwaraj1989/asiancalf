import { MenuItem, TextField } from '@mui/material';
import { categoryDepartments, categoryLeaves, categoryParents } from '../utils/categoryTaxonomy';

export default function CategoryHierarchyFields({
  categories,
  values,
  onChange,
  required = false,
  disabled = false,
}) {
  const departments = categoryDepartments(categories);
  const parents = categoryParents(categories, values.department);
  const leaves = categoryLeaves(categories, values.department, values.productCategory);

  const update = (changes) => onChange({ ...values, ...changes });

  return <>
    <TextField
      select
      required={required}
      label="Department"
      value={values.department}
      disabled={disabled || categories.length === 0}
      onChange={(event) => update({
        department: event.target.value,
        productCategory: '',
        subcategory: '',
        categoryId: '',
      })}
    >
      <MenuItem value="">Select department</MenuItem>
      {departments.map((department) => <MenuItem key={department} value={department}>{department}</MenuItem>)}
    </TextField>
    <TextField
      select
      required={required}
      label="Category"
      value={values.productCategory}
      disabled={disabled || !values.department}
      onChange={(event) => update({
        productCategory: event.target.value,
        subcategory: '',
        categoryId: '',
      })}
    >
      <MenuItem value="">Select category</MenuItem>
      {parents.map((parent) => <MenuItem key={parent} value={parent}>{parent}</MenuItem>)}
    </TextField>
    <TextField
      select
      required={required}
      label="Subcategory"
      value={values.categoryId}
      disabled={disabled || !values.productCategory}
      onChange={(event) => {
        const selected = leaves.find((category) => category._id === event.target.value);
        update({ subcategory: selected?.name || '', categoryId: event.target.value });
      }}
    >
      <MenuItem value="">Select subcategory</MenuItem>
      {leaves.map((category) => <MenuItem key={category._id} value={category._id}>{category.name}</MenuItem>)}
    </TextField>
  </>;
}
