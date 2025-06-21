import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  fetchInfractionTypes, 
  fetchInfractionCategories,
  selectInfractionTypes,
  selectFilteredInfractionTypes,
  selectInfractionTypesLoading,
  selectInfractionTypesError,
  selectInfractionCategories,
  selectInfractionTypeFilters,
  setFilter,
  clearFilters,
  clearError
} from '../store/slices/infractionTypeSlice';

export const useInfractionTypes = () => {
  const dispatch = useAppDispatch();
  
  const infractionTypes = useAppSelector(selectInfractionTypes);
  const filteredInfractionTypes = useAppSelector(selectFilteredInfractionTypes);
  const loading = useAppSelector(selectInfractionTypesLoading);
  const error = useAppSelector(selectInfractionTypesError);
  const categories = useAppSelector(selectInfractionCategories);
  const filters = useAppSelector(selectInfractionTypeFilters);

  // Auto-fetch infraction types on mount
  useEffect(() => {
    if (infractionTypes.length === 0) {
      dispatch(fetchInfractionTypes());
      dispatch(fetchInfractionCategories());
    }
  }, [dispatch, infractionTypes.length]);

  // Methods to interact with the store
  const refetchInfractionTypes = (params?: Parameters<typeof fetchInfractionTypes>[0]) => {
    dispatch(fetchInfractionTypes(params));
  };

  const setInfractionTypeFilter = (key: keyof typeof filters, value: any) => {
    dispatch(setFilter({ key, value }));
  };

  const clearInfractionTypeFilters = () => {
    dispatch(clearFilters());
  };

  const clearInfractionTypeError = () => {
    dispatch(clearError());
  };

  return {
    // Data
    infractionTypes,
    filteredInfractionTypes,
    categories,
    filters,
    
    // State
    loading,
    error,
    
    // Actions
    refetchInfractionTypes,
    setInfractionTypeFilter,
    clearInfractionTypeFilters,
    clearInfractionTypeError,
  };
};

export default useInfractionTypes;