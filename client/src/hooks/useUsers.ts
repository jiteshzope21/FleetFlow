import { useState, useEffect, useCallback } from 'react';
import { userService, UserQueryParams } from '../services/user.service.js';
import { IUser } from '../types/index.js';

export function useUsers(initialParams?: UserQueryParams) {
  const [users, setUsers] = useState<IUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (params?: UserQueryParams) => {
    try {
      setLoading(true);
      setError(null);
      const res = await userService.getUsers(params);
      if (res.success && res.data) {
        setUsers(res.data);
        if (res.meta) {
          setTotal(res.meta.total || 0);
          setTotalPages(res.meta.totalPages || 1);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(initialParams);
  }, [fetchUsers, initialParams]);

  return { users, total, totalPages, loading, error, fetchUsers };
}
