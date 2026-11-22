import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SellerRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  return ['seller', 'admin'].includes(user?.role) ? children : <Navigate to="/login" replace state={{ from: location }} />;
}
