import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{padding:24}}>Checking…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <div>Forbidden</div>;
  return children;
}
