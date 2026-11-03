import { apiUrl, mediaUrl } from '../utils/api';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { Alert, Box, Button, CircularProgress, Divider, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { animateCartToHeader } from '../utils/cartAnimation';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem, wishlistIds, toggleWishlist } = useCart();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(apiUrl(`/api/products/${id}`)).then(async (response) => {
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || 'Product not found.');
      return body.data;
    }).then((item) => {
      setProduct(item);
      setSelectedImage(item.primaryImage || item.images?.[0] || '');
      setSelectedVideo(false);
    }).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <Box className="page-container"><Alert severity="error">{error}</Alert></Box>;
  if (!product) return <Box className="page-container" sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>;

  const sellingPrice = product.salePrice || product.discountPrice || product.price;
  const images = product.images || [];
  const liked = wishlistIds.includes(product._id);
  const isCustomer = user && user.role !== 'admin';
  const addToCart = (event) => { addItem(product); animateCartToHeader(event.currentTarget); };

  return <Box className="page-container"><Paper sx={{ p: { xs: 2, md: 4 } }}><Box className="product-detail-layout">
    <Box className="product-gallery"><Box className="thumbnail-list">{images.map((image) => <button key={image} className={!selectedVideo && selectedImage === image ? 'thumbnail selected-thumbnail' : 'thumbnail'} onMouseEnter={() => { setSelectedImage(image); setSelectedVideo(false); }} onClick={() => { setSelectedImage(image); setSelectedVideo(false); }}><img src={mediaUrl(image)} alt="Product thumbnail" /></button>)}{product.video && <button type="button" className={`thumbnail thumbnail-video ${selectedVideo ? 'selected-thumbnail' : ''}`} aria-label="Play product video" onMouseEnter={() => setSelectedVideo(true)} onClick={() => setSelectedVideo(true)}><video muted preload="metadata" src={mediaUrl(product.video)} /><span className="video-play-icon">▶</span></button>}</Box><Box className="main-image-wrap">{selectedVideo && product.video ? <video controls autoPlay muted playsInline preload="metadata" className="product-video" src={mediaUrl(product.video)}>Your browser does not support product video.</video> : selectedImage ? <img className="main-product-image" src={mediaUrl(selectedImage)} alt={product.name} /> : <Typography>No product image available.</Typography>}</Box></Box>
    <Box><Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 2 }}><Typography variant="h4" component="h1" gutterBottom>{product.name}</Typography>{isCustomer && <Tooltip title={liked ? 'Remove from liked items' : 'Add to liked items'}><IconButton aria-label="Toggle liked item" color={liked ? 'error' : 'default'} onClick={() => toggleWishlist(product._id)}>{liked ? <Favorite /> : <FavoriteBorder />}</IconButton></Tooltip>}</Box><Typography color="text.secondary" sx={{ mb: 2 }}>{[product.department, product.productCategory, product.subcategory].filter(Boolean).join(' › ')}</Typography><Divider sx={{ mb: 2 }} /><Typography className="detail-price">₹{sellingPrice}</Typography>{sellingPrice !== product.price && <Typography className="old-price">M.R.P. ₹{product.price}</Typography>}<Typography sx={{ mt: 2, color: product.stock > 0 ? 'success.main' : 'error.main', fontWeight: 700 }}>{product.stock > 0 ? `In stock (${product.stock} available)` : 'Currently unavailable'}</Typography><Typography sx={{ mt: 3, whiteSpace: 'pre-wrap' }}>{product.description || 'No description available.'}</Typography><Box sx={{ display: 'flex', gap: 2, mt: 4, flexWrap: 'wrap' }}><Button disabled={!product.stock} variant="contained" color="warning" onClick={addToCart}>Add to Cart</Button><Button disabled={!product.stock} variant="contained" onClick={() => { addItem(product); navigate('/cart'); }}>Buy Now</Button></Box></Box>
  </Box></Paper></Box>;
}
