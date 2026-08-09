import React from 'react';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  const img = (product.images && product.images[0]) || '/placeholder.png';
  const price = product.salePrice || product.price;
  return (
    <Card>
      <CardMedia component={Link} to={`/products/${product._id}`} image={img} sx={{ height: 200 }} />
      <CardContent>
        <Typography variant="subtitle1">{product.name}</Typography>
        <Typography variant="body2" color="text.secondary">₹{price}</Typography>
      </CardContent>
      <CardActions>
        <Button size="small" component={Link} to={`/products/${product._id}`}>View</Button>
      </CardActions>
    </Card>
  );
}
