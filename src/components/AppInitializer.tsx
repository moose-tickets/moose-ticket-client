import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchInfractionTypes, fetchInfractionCategories } from '../store/slices/infractionTypeSlice';

interface AppInitializerProps {
  children: React.ReactNode;
}

export const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    // Load infraction types when the app starts and user is authenticated
    if (isAuthenticated) {
      console.log('🔄 Loading infraction types...');
      
      // Fetch infraction types with basic parameters
      dispatch(fetchInfractionTypes({
        isActive: true,
        limit: 100
      }));
      
      // Fetch categories
      dispatch(fetchInfractionCategories());
    }
  }, [dispatch, isAuthenticated]);

  return <>{children}</>;
};

export default AppInitializer;