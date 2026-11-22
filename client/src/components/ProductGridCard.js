import { mediaUrl } from '../utils/api';
import { Box, Card, CardActionArea, CardContent, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const priceFor = (product) => product.salePrice || product.discountPrice || product.price;

export default function ProductGridCard({ product, image }) {
  return <Card className="photo-card">
    <CardActionArea component={RouterLink} to={`/products/${product._id}`}>
      <Box className="product-image-frame">{image ? <img className="uploaded-product-image" src={mediaUrl(image)} alt={product.name} /> : <Typography color="text.secondary">Image unavailable</Typography>}</Box>
      <CardContent className="product-card-content">
        <Typography className="product-card-category">{product.productCategory || product.department || 'Featured item'}</Typography>
        <Typography className="product-card-name">{product.name}</Typography>
        <Box className="product-card-bottom">
          <Typography className="product-card-price">₹{Number(priceFor(product) || 0).toLocaleString('en-IN')}</Typography>
          <Typography className="product-card-view">View details →</Typography>
        </Box>
      </CardContent>
    </CardActionArea>
  </Card>;
}
