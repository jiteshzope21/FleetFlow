import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  Phone,
  Mail,
  Edit2,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { IUser, UserRole } from '../../types/index.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { Alert } from '../../components/ui/Alert.js';
import { Breadcrumbs } from '../../components/shared/Breadcrumbs.js';
import { EmptyState } from '../../components/shared/EmptyState.js';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog.js';
import { api } from '../../lib/api.js';
import { formatDateTime } from '../../lib/utils.js';

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must include at least 1 uppercase letter')
    .regex(/[0-9]/, 'Must include at least 1 number'),
  role: z.enum([
    'MANAGER',
    'DISPATCHER',
    'ACCOUNTANT',
    'FLEET_MANAGER',
    'MAINTENANCE_MANAGER',
    'DRIVER',
    'VIEWER',
  ]),
  phone: z.string().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

const editUserSchema = z.object({
  name: z.string().min(2).max(100),
  role: z.enum([
    'MANAGER',
    'DISPATCHER',
    'ACCOUNTANT',
    'FLEET_MANAGER',
    'MAINTENANCE_MANAGER',
    'DRIVER',
    'VIEWER',
  ]),
  phone: z.string().optional(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

export const UserListPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals & Dialogs
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [statusToggleUser, setStatusToggleUser] = useState<IUser | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const canManageUsers =
    currentUser?.role === 'COMPANY_OWNER' ||
    currentUser?.role === 'MANAGER' ||
    currentUser?.role === 'SUPER_ADMIN';

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (searchTerm) params.search = searchTerm;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/users', { params });
      if (res.data?.success) {
        setUsers(res.data.data);
        if (res.data.meta) {
          setTotal(res.data.meta.total || 0);
          setTotalPages(res.data.meta.totalPages || 1);
        }
      }
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Create User Form
  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors, isSubmitting: isCreating },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'DISPATCHER' },
  });

  const onCreateUser = async (data: CreateUserFormData) => {
    try {
      setModalError(null);
      await api.post('/users', data);
      setIsCreateModalOpen(false);
      resetCreate();
      setSuccessBanner(`Team member ${data.name} added successfully.`);
      setTimeout(() => setSuccessBanner(null), 4000);
      fetchUsers();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to create user.');
    }
  };

  // Edit User Form
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: isEditing },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  });

  const onOpenEdit = (targetUser: IUser) => {
    setEditingUser(targetUser);
    setModalError(null);
    resetEdit({
      name: targetUser.name,
      role: (targetUser.role as any) || 'VIEWER',
      phone: targetUser.phone || '',
    });
  };

  const onUpdateUser = async (data: EditUserFormData) => {
    if (!editingUser) return;
    try {
      setModalError(null);
      await api.patch(`/users/${editingUser._id || editingUser.id}`, data);
      setEditingUser(null);
      setSuccessBanner(`User updated successfully.`);
      setTimeout(() => setSuccessBanner(null), 4000);
      fetchUsers();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to update user.');
    }
  };

  // Status Toggle
  const onToggleStatusConfirm = async () => {
    if (!statusToggleUser) return;
    try {
      const nextStatus = statusToggleUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.patch(`/users/${statusToggleUser._id || statusToggleUser.id}/status`, {
        status: nextStatus,
      });
      setStatusToggleUser(null);
      setSuccessBanner(`Account marked as ${nextStatus}.`);
      setTimeout(() => setSuccessBanner(null), 4000);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status.');
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'COMPANY_OWNER':
        return 'primary';
      case 'SUPER_ADMIN':
        return 'danger';
      case 'MANAGER':
        return 'info';
      case 'DISPATCHER':
      case 'FLEET_MANAGER':
        return 'warning';
      case 'DRIVER':
        return 'success';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumbs items={[{ label: 'Team & User Management' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Team & User Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Assign role-based access for dispatchers, accountants, fleet managers, and drivers.
          </p>
        </div>

        {canManageUsers && (
          <Button
            onClick={() => {
              setModalError(null);
              setIsCreateModalOpen(true);
            }}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Add Team Member
          </Button>
        )}
      </div>

      {successBanner && (
        <Alert variant="success" title="Success">
          {successBanner}
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:flex-1">
              <Input
                placeholder="Search by name, email or phone..."
                leftIcon={<Search className="w-4 h-4" />}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                className="w-full sm:w-44 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Roles</option>
                <option value="COMPANY_OWNER">Company Owner</option>
                <option value="MANAGER">Manager</option>
                <option value="DISPATCHER">Dispatcher</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="FLEET_MANAGER">Fleet Manager</option>
                <option value="MAINTENANCE_MANAGER">Maintenance Manager</option>
                <option value="DRIVER">Driver</option>
                <option value="VIEWER">Viewer</option>
              </select>

              <select
                className="w-full sm:w-36 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title="No Team Members Found"
              description="No members match your current filter criteria. You can create a new team member."
              actionText={canManageUsers ? 'Add Team Member' : undefined}
              onAction={canManageUsers ? () => setIsCreateModalOpen(true) : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Assigned Role</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5">Last Login</th>
                  {canManageUsers && <th className="px-5 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {users.map((u) => {
                  const isCurrent = (u._id || u.id) === (currentUser?._id || currentUser?.id);
                  const isOwner = u.role === 'COMPANY_OWNER';

                  return (
                    <tr
                      key={u._id || u.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold text-xs flex items-center justify-center shrink-0">
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">
                              {u.name}
                              {isCurrent && (
                                <span className="ml-1.5 text-[10px] text-brand-600 dark:text-brand-400 font-semibold">
                                  (You)
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={getRoleBadgeVariant(u.role)} size="sm">
                          {u.role.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'} size="sm">
                          {u.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                        {u.phone || '—'}
                      </td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                        {formatDateTime(u.lastLoginAt)}
                      </td>
                      {canManageUsers && (
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isOwner && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onOpenEdit(u)}
                                title="Edit Role & Details"
                                className="h-8 w-8 p-0"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            {!isCurrent && !isOwner && (
                              <Button
                                variant={u.status === 'ACTIVE' ? 'ghost' : 'outline'}
                                size="sm"
                                onClick={() => setStatusToggleUser(u)}
                                title={u.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                                className={`h-8 w-8 p-0 ${
                                  u.status === 'ACTIVE' ? 'text-rose-600 hover:text-rose-700' : 'text-emerald-600'
                                }`}
                              >
                                {u.status === 'ACTIVE' ? (
                                  <UserX className="w-3.5 h-3.5" />
                                ) : (
                                  <UserCheck className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Total <strong className="text-slate-700 dark:text-slate-200">{total}</strong> members in workspace
          </div>
          <div className="flex items-center gap-2">
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Add User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Company Team Member"
        description="Create an account associated with your transport workspace."
      >
        {modalError && (
          <Alert variant="error" title="Error" className="mb-4">
            {modalError}
          </Alert>
        )}

        <form onSubmit={handleCreateSubmit(onCreateUser)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="David Miller"
            error={createErrors.name?.message}
            {...registerCreate('name')}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="david@company.com"
            error={createErrors.email?.message}
            {...registerCreate('email')}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Workspace Role
            </label>
            <select
              className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              {...registerCreate('role')}
            >
              <option value="MANAGER">Manager</option>
              <option value="DISPATCHER">Dispatcher (Shipments & Trips)</option>
              <option value="ACCOUNTANT">Accountant (Invoices & Expenses)</option>
              <option value="FLEET_MANAGER">Fleet Manager (Vehicles & Utilization)</option>
              <option value="MAINTENANCE_MANAGER">Maintenance Manager</option>
              <option value="DRIVER">Driver</option>
              <option value="VIEWER">Viewer (Read-Only)</option>
            </select>
            {createErrors.role?.message && (
              <p className="text-xs text-rose-500">{createErrors.role.message}</p>
            )}
          </div>

          <Input
            label="Initial Password"
            type="password"
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            error={createErrors.password?.message}
            {...registerCreate('password')}
          />

          <Input
            label="Phone (Optional)"
            type="tel"
            placeholder="+1-555-0144"
            error={createErrors.phone?.message}
            {...registerCreate('phone')}
          />

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isCreating}>
              Create Member Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit Team Member"
        description={`Update role and profile information for ${editingUser?.name}.`}
      >
        {modalError && (
          <Alert variant="error" title="Error" className="mb-4">
            {modalError}
          </Alert>
        )}

        <form onSubmit={handleEditSubmit(onUpdateUser)} className="space-y-4">
          <Input
            label="Full Name"
            error={editErrors.name?.message}
            {...registerEdit('name')}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Role Permission
            </label>
            <select
              className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              {...registerEdit('role')}
            >
              <option value="MANAGER">Manager</option>
              <option value="DISPATCHER">Dispatcher</option>
              <option value="ACCOUNTANT">Accountant</option>
              <option value="FLEET_MANAGER">Fleet Manager</option>
              <option value="MAINTENANCE_MANAGER">Maintenance Manager</option>
              <option value="DRIVER">Driver</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>

          <Input
            label="Phone Number"
            error={editErrors.phone?.message}
            {...registerEdit('phone')}
          />

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingUser(null)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isEditing}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Status Toggle Confirmation */}
      <ConfirmationDialog
        isOpen={!!statusToggleUser}
        onClose={() => setStatusToggleUser(null)}
        onConfirm={onToggleStatusConfirm}
        title={statusToggleUser?.status === 'ACTIVE' ? 'Deactivate User Account' : 'Reactivate User Account'}
        message={
          statusToggleUser?.status === 'ACTIVE'
            ? `Are you sure you want to deactivate ${statusToggleUser?.name}? They will immediately lose access to this company workspace until reactivated.`
            : `Reactivate account for ${statusToggleUser?.name}? They will be able to log in and access permitted modules.`
        }
        confirmText={statusToggleUser?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        isDangerous={statusToggleUser?.status === 'ACTIVE'}
      />
    </div>
  );
};
