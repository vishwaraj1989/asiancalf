import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function AdminRoute({ children }) { const { user } = useAuth(); const location = useLocation(); return user?.role === 'admin' ? children : <Navigate to="/login" replace state={{ from: location }} />; }
