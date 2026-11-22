import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import MyOrders from './pages/MyOrders';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminProducts from './pages/AdminProducts';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import AdminRoute from './routes/AdminRoute';
import ProtectedRoute from './routes/ProtectedRoute';
import Account from './pages/Account';
import Inquiry from './pages/Inquiry';
import SellerDashboard from './pages/SellerDashboard';
import SellerRoute from './routes/SellerRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css';

export default function App() {
  return (
    <div className="app-root">
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/order-success/:id" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
          <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/inquiry" element={<Inquiry />} />
          <Route path="/seller/dashboard" element={<SellerRoute><SellerDashboard /></SellerRoute>} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
          <Route path="/admin/products/add" element={<AdminRoute><AdminProducts /></AdminRoute>} />
          <Route path="/admin/products/edit/:id" element={<AdminRoute><AdminProducts /></AdminRoute>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
