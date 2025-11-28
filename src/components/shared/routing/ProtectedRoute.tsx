import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<'admin' | 'guide' | 'tourist'>;
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
  if (profile && !allowedRoles.includes(profile.role as any)) {
    // Show toast notification using useEffect to avoid rendering issues
    setTimeout(() => {
      toast({
        title: "Acces interzis",
        description: "Nu ai permisiuni pentru această pagină.",
        variant: "destructive",
      });
    }, 100);

    // Redirect based on role
    const redirectPath = 
      profile.role === 'guide' ? '/' : 
      profile.role === 'admin' ? '/' : 
      '/';
    
    return <Navigate to={redirectPath} replace />;
  }

  // User is authorized
  return <>{children}</>;
};
