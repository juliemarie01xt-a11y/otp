"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { LucideShield, LucideUsers, LucideBan, LucideRefreshCcw, LucideActivity, LucideCheckCircle2, LucideXCircle, LucideArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedUserLogs, setSelectedUserLogs] = useState<any>(null);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  const handleViewLogs = async (userId: string) => {
    setSelectedUserLogs({ id: userId, logs: [] });
    setLogsModalOpen(true);
    setLogsLoading(true);
    try {
      const res = await axios.get('/api/admin/users/logs?userId=' + userId);
      setSelectedUserLogs({ id: userId, logs: res.data.logs || [] });
    } catch (err: any) {
      alert('Failed to load logs: ' + err.message);
    } finally {
      setLogsLoading(false);
    }
  };


  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/users');
      setUsers(res.data.users || []);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: string, reason?: string) => {
    if (action === 'ban' && !confirm('Are you sure you want to ban this user?')) return;
    if (action === 'unban' && !confirm('Are you sure you want to unban this user?')) return;
    if (action === 'reset_trust' && !confirm('Reset trust score to 50?')) return;

    try {
      await axios.post('/api/admin/users/action', { userId, action, reason });
      await fetchUsers();
    } catch (err: any) {
      alert('Action failed: ' + (err.response?.data?.error || err.message));
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-32">
      {logsModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><LucideActivity className="w-5 h-5 text-blue-500"/> Activity Logs</h2>
              <button onClick={() => setLogsModalOpen(false)} className="text-slate-500 hover:text-white">
                <LucideXCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {logsLoading ? (
                <div className="text-center p-12 text-slate-500 flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  Loading precise timestamps...
                </div>
              ) : selectedUserLogs?.logs?.length === 0 ? (
                <div className="text-center p-8 text-slate-500">No logs found for this user.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950 text-slate-400">
                    <tr>
                      <th className="p-3 rounded-tl-lg">Service</th>
                      <th className="p-3">Number</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Created At</th>
                      <th className="p-3 rounded-tr-lg">Cancelled At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {selectedUserLogs?.logs?.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-800/20">
                        <td className="p-3 font-medium text-slate-300">{log.service || 'Unknown'}</td>
                        <td className="p-3 font-mono text-slate-300">+{log.phone_number || 'Pending'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${log.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400' : log.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="p-3 text-red-400 text-xs font-medium">{log.cancelled_at ? new Date(log.cancelled_at).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition">
              <LucideArrowLeft className="w-5 h-5 text-slate-300" />
            </Link>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <LucideUsers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">User Management</h1>
              <p className="text-sm text-slate-400 font-medium">Manage bans, trust scores, and abuse</p>
            </div>
          </div>
          <button onClick={fetchUsers} className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-700">
            <LucideRefreshCcw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 font-medium">
            Error: {error}
          </div>
        )}

        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/50 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">User ID / Telegram</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Balance</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Activity</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Trust Score</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Status</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading users...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">No users found.</td></tr>
                ) : users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/20 transition">
                    <td className="p-4">
                      <div className="font-mono text-xs text-slate-500 mb-1">{u.id}</div>
                      <div className="flex items-center gap-2 text-slate-300 font-medium">
                        {u.telegram_id ? (
                          <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-xs border border-blue-500/20">TG: {u.telegram_id}</span>
                        ) : (
                          <span className="text-slate-600 text-xs italic">Unlinked</span>
                        )}
                        {u.is_email_verified && <LucideCheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </div>
                    </td>
                    <td className="p-4 font-mono font-medium text-emerald-400">
                      ${Number(u.balance || 0).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Success:</span>
                          <span className="text-emerald-400 font-bold">{u.total_completed || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Cancels:</span>
                          <span className="text-red-400 font-bold">{u.total_cancels || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">24h Cancels:</span>
                          <span className="text-amber-400 font-bold">{u.recent_cancels_24h || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${u.trust_score >= 50 ? 'bg-emerald-500' : u.trust_score >= 20 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(100, Math.max(0, u.trust_score || 0))}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-300">{u.trust_score || 0}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {u.is_banned ? (
                        <div>
                          <span className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-md text-xs font-bold">
                            <LucideBan className="w-3.5 h-3.5" /> BANNED
                          </span>
                          <div className="text-xs text-slate-500 mt-1 max-w-[200px] truncate" title={u.ban_reason || ''}>
                            {u.ban_reason}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md text-xs font-bold">
                          <LucideActivity className="w-3.5 h-3.5" /> ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">

                        <button 
                          onClick={() => handleViewLogs(u.id)}
                          className="px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-600/40 text-xs font-bold transition"
                        >
                          Logs
                        </button>
                        <button 
                          onClick={() => handleAction(u.id, 'reset_trust')}
}
                          className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 text-xs font-medium transition"
                        >
                          Reset Trust
                        </button>
                        {u.is_banned ? (
                          <button 
                            onClick={() => handleAction(u.id, 'unban')}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-500 text-xs font-bold transition shadow-lg shadow-emerald-900/20"
                          >
                            Unban
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleAction(u.id, 'ban', 'Manual Admin Ban')}
                            className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-500 text-xs font-bold transition shadow-lg shadow-red-900/20"
                          >
                            Ban User
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
