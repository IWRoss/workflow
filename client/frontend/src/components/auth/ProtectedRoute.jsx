import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { usePermissions


 } from "../../hooks/usePermissions";
const ProtectedRoute = ({ children,requiredPermission }) => {
  const { isAuthenticated, loading } = useAuth();
  const { hasPermission } = usePermissions();

  if (loading) {
    return <div>Loading...</div>; 
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded shadow-md text-center">
                    <h2 className="text-2xl font-bold mb-4 text-red-600">Access Denied</h2>
                    <p className="text-gray-600 mb-4">
                        You don't have permission to access this page.
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

  return children;
};

export default ProtectedRoute;