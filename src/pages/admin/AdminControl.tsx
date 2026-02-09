import { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { type UserRole, type UserProfile } from '@/types/rbac';
import { Shield, Users, Activity, Lock, Search, Check, X, RefreshCw, Key, FileUp } from 'lucide-react';
import { ScheduleUpload } from '@/components/admin/ScheduleUpload';
import { ScheduleHistory } from '@/components/admin/ScheduleHistory';

export function AdminControlPage() {
    const { role, user } = useAuth();
    const [activeTab, setActiveTab] = useState<'users' | 'permissions' | 'logs' | 'schedule'>('users');
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        if (role === 'Admin') fetchUsers();
        if (activeTab === 'logs' && role === 'Admin') fetchLogs();
    }, [role, activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('profiles').select('*').order('full_name');
            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        try {
            const { data } = await supabase.from('audit_logs').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(50);
            if (data) setLogs(data);
        } catch (e) {
            console.error('Logs fetch error type:', e);
        }
    };

    const logAction = async (action: string, details: object) => {
        try {
            await supabase.from('audit_logs').insert({
                user_id: user?.id,
                action,
                details
            });
            fetchLogs();
        } catch (e) {
            console.error('Audit log failed:', e);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (userId === user?.id && newRole !== 'Admin') {
            alert('Security Restriction: You cannot remove your own Admin privileges.');
            return;
        }
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
        try {
            const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
            if (error) throw error;
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as UserRole } : u));
            logAction('ROLE_CHANGE', { target_user: userId, new_role: newRole });
            alert('Role updated successfully.');
        } catch (err: any) {
            alert('Failed to update role. Ensure you have admin privileges and policies are set.');
        }
    };

    const handleResetPassword = async (email: string) => {
        if (!email) return;
        if (!confirm(`Send password reset email to ${email}?`)) return;
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });
            if (error) throw error;
            logAction('PASSWORD_RESET', { target_email: email });
            alert(`Password reset link sent to ${email}.`);
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
    };

    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        // Default is_active to true if undefined
        const isActive = currentStatus !== false;

        if (userId === user?.id) {
            alert('Security Restriction: You cannot disable your own account.');
            return;
        }

        if (!confirm(`Are you sure you want to ${isActive ? 'disable' : 'enable'} this account?`)) return;
        try {
            const { error } = await supabase.from('profiles').update({ is_active: !isActive }).eq('id', userId);
            if (error) throw error;
            setUsers(users.map(u => u.id === userId ? { ...u, is_active: !isActive } : u));
            logAction('STATUS_CHANGE', { target_user: userId, new_status: !isActive });
        } catch (err: any) {
            alert('Failed to update status. Database columns might be missing.');
        }
    };

    if (role !== 'Admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                <Shield size={64} className="text-red-500" />
                <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
                <p className="text-gray-600 max-w-md">You do not have permission to view the Admin Control Center. Please contact your system administrator.</p>
                <div className="flex gap-4">
                    <Button onClick={() => window.history.back()} variant="outline">Go Back</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
                    <Shield className="text-primary" /> Admin Control Center
                </h1>
                <p className="text-text-muted">Manage system users, permissions, and security settings.</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-3 font-medium text-sm transition-colors flex flex-shrink-0 items-center gap-2 ${activeTab === 'users' ? 'border-b-2 border-primary text-primary' : 'text-text-muted hover:text-text-main'}`}
                >
                    <Users size={16} /> User Management
                </button>
                <button
                    onClick={() => setActiveTab('permissions')}
                    className={`px-4 py-3 font-medium text-sm transition-colors flex flex-shrink-0 items-center gap-2 ${activeTab === 'permissions' ? 'border-b-2 border-primary text-primary' : 'text-text-muted hover:text-text-main'}`}
                >
                    <Lock size={16} /> Permissions Matrix
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-4 py-3 font-medium text-sm transition-colors flex flex-shrink-0 items-center gap-2 ${activeTab === 'logs' ? 'border-b-2 border-primary text-primary' : 'text-text-muted hover:text-text-main'}`}
                >
                    <Activity size={16} /> Audit Logs
                </button>
                <button
                    onClick={() => setActiveTab('schedule')}
                    className={`px-4 py-3 font-medium text-sm transition-colors flex flex-shrink-0 items-center gap-2 ${activeTab === 'schedule' ? 'border-b-2 border-primary text-primary' : 'text-text-muted hover:text-text-main'}`}
                >
                    <FileUp size={16} /> Schedule Management
                </button>
            </div>

            {/* Content */}
            {activeTab === 'users' && (
                <Card className="p-6">
                    <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button onClick={fetchUsers} variant="outline" className="text-xs py-1 px-3">Refresh List</Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="border-b border-gray-100 text-sm text-text-muted uppercase tracking-wider">
                                    <th className="p-3">User</th>
                                    <th className="p-3">Role</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.filter(u =>
                                (u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
                                ).map((u) => (
                                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="p-3">
                                            <div className="font-medium text-text-main">{u.full_name || 'No Name'}</div>
                                            <div className="text-xs text-text-muted">{u.email}</div>
                                            {u.id === user?.id && <span className="text-[10px] bg-blue-100 text-blue-800 px-1 rounded">You</span>}
                                        </td>
                                        <td className="p-3">
                                            <select
                                                value={u.role || 'Staff'}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                className="bg-white border border-gray-200 text-sm rounded px-2 py-1 focus:ring-2 focus:ring-primary cursor-pointer hover:border-gray-300 transition-colors"
                                            >
                                                <option value="Admin">Admin</option>
                                                <option value="Manager">Manager</option>
                                                <option value="Staff">Staff</option>
                                            </select>
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {u.is_active !== false ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleResetPassword(u.email)}
                                                    className="text-xs py-1 px-3 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                    title="Send Password Reset Email"
                                                >
                                                    <Key size={14} className="mr-1" /> Reset
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => toggleUserStatus(u.id, u.is_active !== false)}
                                                    className={`text-xs py-1 px-3 ${u.is_active !== false ? "text-red-600 border-red-200 hover:bg-red-50" : "text-green-600 border-green-200 hover:bg-green-50"}`}
                                                >
                                                    {u.is_active !== false ? 'Disable' : 'Enable'}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && !loading && (
                                    <tr><td colSpan={4} className="p-8 text-center text-text-muted">No users found.</td></tr>
                                )}
                                {loading && (
                                    <tr><td colSpan={4} className="p-8 text-center text-text-muted">Loading users...</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {activeTab === 'permissions' && (
                <Card className="p-6">
                    <h3 className="font-bold text-lg mb-4">Role Permission Matrix</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[500px]">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="p-3 text-left">Feature / Permission</th>
                                    <th className="p-3 text-center w-32">Admin</th>
                                    <th className="p-3 text-center w-32">Manager</th>
                                    <th className="p-3 text-center w-32">Staff</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <tr>
                                    <td className="p-3 font-medium">Manage Users & Roles</td>
                                    <td className="p-3 text-center"><Check size={18} className="mx-auto text-green-600" /></td>
                                    <td className="p-3 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                                    <td className="p-3 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-medium">Access Admin Control</td>
                                    <td className="p-3 text-center"><Check size={18} className="mx-auto text-green-600" /></td>
                                    <td className="p-3 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                                    <td className="p-3 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-medium">Edit System Settings</td>
                                    <td className="p-3 text-center"><Check size={18} className="mx-auto text-green-600" /></td>
                                    <td className="p-3 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                                    <td className="p-3 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-medium">Export Data</td>
                                    <td className="p-3 text-center"><Check size={18} className="mx-auto text-green-600" /></td>
                                    <td className="p-3 text-center"><Check size={18} className="mx-auto text-green-600" /></td>
                                    <td className="p-3 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-medium">Delete Records</td>
                                    <td className="p-3 text-center"><Check size={18} className="mx-auto text-green-600" /></td>
                                    <td className="p-3 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                                    <td className="p-3 text-center"><X size={18} className="mx-auto text-gray-300" /></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {activeTab === 'logs' && (
                <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">System Audit Logs</h3>
                        <Button variant="outline" className="text-xs py-1 px-3" onClick={fetchLogs}><RefreshCw size={14} className="mr-1" /> Refresh</Button>
                    </div>
                    {logs.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-text-muted uppercase text-xs">
                                    <tr>
                                        <th className="p-3">Time</th>
                                        <th className="p-3">User</th>
                                        <th className="p-3">Action</th>
                                        <th className="p-3">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {logs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="p-3 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                                            <td className="p-3">{log.profiles?.full_name || 'Unknown'}</td>
                                            <td className="p-3 font-medium">{log.action}</td>
                                            <td className="p-3 text-text-muted font-mono text-xs">{JSON.stringify(log.details)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="mt-4 p-8 border border-dashed border-gray-200 rounded-lg text-center bg-gray-50">
                            <Activity className="mx-auto text-gray-400 mb-2" size={32} />
                            <p className="text-text-muted">No logs found.</p>
                            <p className="text-xs text-gray-400 mt-2">Run the SQL extension script to create the audit_logs table.</p>
                        </div>
                    )}
                </Card>
            )}
            {activeTab === 'schedule' && (
                <div className="space-y-6">
                    <ScheduleUpload />
                    <ScheduleHistory />
                </div>
            )}
        </div>
    );
}
