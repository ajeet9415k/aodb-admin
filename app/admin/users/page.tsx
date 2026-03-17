'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Users, ShieldAlert } from 'lucide-react';
import MasterPage, { Column } from '@/components/admin/MasterPage';
import FormModal, { FormRow, FormGroup, FormInput, FormSelect, FormCheckbox, FormSection } from '@/components/admin/FormModal';
import { UserAPI, adminFetcher } from '@/lib/api/admin-client';
import type { AppUser, AppUserCreate, UserRole } from '@/lib/api/admin-types';
import { toast } from '@/lib/toast';

const ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'OPERATOR', 'VIEWER', 'API'];
const ROLE_COLOR: Record<UserRole, string> = { SUPER_ADMIN: 'badge-red', ADMIN: 'badge-amber', SUPERVISOR: 'badge-violet', OPERATOR: 'badge-blue', VIEWER: 'badge-slate', API: 'badge-cyan' };
const EMPTY: AppUserCreate = { tenant_id: '', username: '', email: '', full_name: '', role: 'OPERATOR', is_active: true, metadata: {} };

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [form, setForm] = useState<AppUserCreate>(EMPTY);
  const [password, setPassword] = useState('');
  const [resetModal, setResetModal] = useState<AppUser | null>(null);
  const [newPwd, setNewPwd] = useState('');

  const { data = [], isLoading, error, mutate } = useSWR<AppUser[]>('/api/v1/admin/users', adminFetcher);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(u => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.full_name || '').toLowerCase().includes(q));
  }, [data, search]);

  const stats = [
    { label: 'Total Users', value: data.length },
    { label: 'Active', value: data.filter(u => u.is_active).length, color: 'var(--green)' },
    { label: 'Admins', value: data.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length, color: 'var(--amber)' },
    { label: 'Operators', value: data.filter(u => u.role === 'OPERATOR').length, color: 'var(--blue)' },
  ];

  const columns: Column<AppUser>[] = [
    {
      key: 'full_name', label: 'User', render: r => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.84rem' }}>{r.full_name || r.username}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontFamily: 'IBM Plex Mono, monospace' }}>{r.username}</div>
        </div>
      ),
    },
    { key: 'email', label: 'Email', render: r => <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>{r.email}</span> },
    { key: 'role', label: 'Role', width: '120px', render: r => <span className={`badge ${ROLE_COLOR[r.role]}`}>{r.role.replace('_', ' ')}</span> },
    {
      key: 'last_login_at', label: 'Last Login', width: '140px',
      render: r => r.last_login_at ? (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: 'IBM Plex Mono, monospace' }}>
          {new Date(r.last_login_at).toLocaleDateString()}
        </span>
      ) : <span style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>Never</span>,
    },
    { key: 'is_active', label: 'Status', width: '80px', render: r => <span className={`badge ${r.is_active ? 'badge-green' : 'badge-slate'}`}>{r.is_active ? 'Active' : 'Inactive'}</span> },
  ];

  function openAdd() { setEditing(null); setForm({ ...EMPTY }); setPassword(''); setModalOpen(true); }
  function openEdit(row: AppUser) {
    setEditing(row);
    setForm({ tenant_id: row.tenant_id, org_id: row.org_id, username: row.username, email: row.email, full_name: row.full_name || '', role: row.role, is_active: row.is_active, metadata: row.metadata });
    setPassword('');
    setModalOpen(true);
  }

  async function handleDelete(row: AppUser) {
    try {
      await UserAPI.delete(row.user_id);
      toast.success('User Deleted', `${row.username} has been removed`);
      mutate();
    } catch (e) {
      toast.error('Delete Failed', e instanceof Error ? e.message : 'Failed to delete user');
      throw e;
    }
  }

  async function handleToggle(row: AppUser) {
    try {
      await UserAPI.update(row.user_id, { is_active: !row.is_active });
      toast.success('Status Updated', `${row.username} is now ${!row.is_active ? 'active' : 'inactive'}`);
      mutate();
    } catch (e) {
      toast.error('Toggle Failed', e instanceof Error ? e.message : 'Failed to update status');
      throw e;
    }
  }

  async function handleSubmit() {
    try {
      const payload = { ...form, ...(password ? { password } : {}) };
      if (editing) {
        await UserAPI.update(editing.user_id, payload);
        toast.success('User Updated', `${form.username} has been updated`);
      } else {
        await UserAPI.create(payload);
        toast.success('User Created', `${form.username} has been added`);
      }
      mutate();
    } catch (e) {
      toast.error(editing ? 'Update Failed' : 'Create Failed', e instanceof Error ? e.message : 'Operation failed');
      throw e;
    }
  }

  async function handleResetPassword() {
    if (resetModal && newPwd) {
      try {
        await UserAPI.resetPassword(resetModal.user_id, newPwd);
        toast.success('Password Reset', `Password for ${resetModal.username} has been updated`);
        setResetModal(null);
        setNewPwd('');
      } catch (e) {
        toast.error('Password Reset Failed', e instanceof Error ? e.message : 'Failed to reset password');
        throw e;
      }
    }
  }

  const f = (k: keyof AppUserCreate, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <MasterPage title="Users" subtitle="Platform user accounts — roles, access control and authentication"
        icon={<Users size={18} color="#fff" />} columns={columns}
        data={filtered}
        loading={isLoading} error={error?.message} idKey="user_id"
        searchValue={search} onSearchChange={setSearch} onRefresh={() => mutate()}
        onAdd={openAdd} onEdit={r => openEdit(r as unknown as AppUser)} onDelete={r => handleDelete(r as unknown as AppUser)}
        onToggle={r => handleToggle(r as unknown as AppUser)} hasToggle activeKey="is_active"
        addLabel="Add User" stats={stats}
      />

      <FormModal title={editing ? 'Edit User' : 'New User'} open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} width={580}>
        <FormSection title="Account Info">
          <FormRow cols={1}><FormGroup label="Full Name"><FormInput value={form.full_name || ''} onChange={v => f('full_name', v)} placeholder="Jane Smith" /></FormGroup></FormRow>
          <FormRow>
            <FormGroup label="Username" required><FormInput value={form.username} onChange={v => f('username', v)} placeholder="jsmith" required /></FormGroup>
            <FormGroup label="Email" required><FormInput type="email" value={form.email} onChange={v => f('email', v)} placeholder="jsmith@airport.com" required /></FormGroup>
          </FormRow>
        </FormSection>
        <FormSection title="Access Control">
          <FormRow>
            <FormGroup label="Role"><FormSelect value={form.role} onChange={v => f('role', v as UserRole)} options={ROLES.map(r => ({ value: r, label: r.replace('_', ' ') }))} /></FormGroup>
            <FormGroup label="Status"><div style={{ paddingTop: 6 }}><FormCheckbox label="Active" checked={form.is_active} onChange={v => f('is_active', v)} /></div></FormGroup>
          </FormRow>
        </FormSection>
        {!editing && (
          <FormSection title="Password">
            <FormRow cols={1}><FormGroup label="Initial Password" required={!editing}><FormInput type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" /></FormGroup></FormRow>
          </FormSection>
        )}
        {editing && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', textAlign: 'center', padding: '8px 0' }}>
            To change password, use the Reset Password button in the user list.
          </div>
        )}
      </FormModal>

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="modal-backdrop" onClick={() => setResetModal(null)}>
          <div className="modal-box" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <ShieldAlert size={18} color="var(--amber)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-1)' }}>Reset Password</h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 16 }}>
                Set a new password for <strong>{resetModal.username}</strong>
              </p>
              <FormGroup label="New Password">
                <FormInput type="password" value={newPwd} onChange={setNewPwd} placeholder="Min. 8 characters" />
              </FormGroup>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button className="btn-ghost" onClick={() => setResetModal(null)}>Cancel</button>
                <button className="btn-primary" onClick={handleResetPassword} disabled={!newPwd}>Reset</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
