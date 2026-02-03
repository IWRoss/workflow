import { useAuth } from "./useAuth";

export const usePermissions = () => {
    const { user } = useAuth();

    // Function to check if the user has permission for a given feature
    const hasPermission = (cardId) => {
        if (!user || !user.permissions || !user.permissions.features) {
            //console.log("User or user permissions not defined");
            return false;
        }

        const hasAccess = user.permissions.features.includes(cardId);

        return hasAccess;
    };

    //
    const canAccessRoute = (route) => {
        if (!user || !user.permissions) return false;

        return user.permissions.includes(route);
    };

    const getUserDomain = () => {
        return user ? user.domain : null;
    };

    return {
        hasPermission,
        canAccessRoute,
        getUserDomain,
        permissions: user?.permissions || { routes: [], features: [] },
    };
};
