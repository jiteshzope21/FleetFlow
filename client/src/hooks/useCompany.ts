import { useState, useEffect, useCallback } from 'react';
import { companyService } from '../services/company.service.js';
import { ICompany } from '../types/index.js';

export function useCompany() {
  const [company, setCompany] = useState<ICompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await companyService.getProfile();
      if (res.success && res.data) {
        setCompany(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch company profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = async (data: Partial<ICompany>) => {
    const res = await companyService.updateProfile(data);
    if (res.success && res.data) {
      setCompany(res.data);
    }
    return res;
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { company, loading, error, fetchProfile, updateProfile };
}
