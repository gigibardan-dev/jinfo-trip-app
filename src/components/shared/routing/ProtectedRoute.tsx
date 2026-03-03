import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<'admin' | 'guide' | 'tourist' | 'superadmin'>;
  requireAuth?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  allowedRoles, 
  requireAuth = true 
}: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-soft">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (requireAuth && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user has required role
  // SuperAdmin has access to all admin routes automatically
  if (profile) {
    const userRole = profile.role as string;
    const hasAccess = allowedRoles.includes(userRole as any) || 
      (userRole === 'superadmin' && allowedRoles.includes('admin'));
    
    if (!hasAccess) {
      setTimeout(() => {
        toast({
          title: "Acces interzis",
          description: "Nu ai permisiuni pentru această pagină.",
          variant: "destructive",
        });
      }, 100);

      return <Navigate to="/" replace />;
    }
  }

  // User is authorized
  return <>{children}</>;
};
