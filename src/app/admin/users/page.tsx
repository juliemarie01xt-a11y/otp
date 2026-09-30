"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { LucideShield, LucideUsers, LucideBan, LucideRefreshCcw, LucideActivity, LucideCheckCircle2, LucideXCircle, LucideArrowLeft, LucideSearch, LucideMail, LucideFileText } from 'lucide-react';
import Link from 'next/link';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [profileTab, setProfileTab] = useState('logs');
  const [manualBalance, setManualBalance] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await axios.get('/api/admin/users');
      setUsers(res.data.users || []);
      
      // Update selected user if modal is open to reflect new bans/trust instantly
      setSelectedUser((prev: any) => {
        if (!prev) return prev;
        const updated = res.data.users?.find((u: any) => u.id === prev.id);
        return updated ? { ...updated, logs: prev.logs } : prev;
      });
      
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: string, reason?: string) => {
    if (action === 'ban' && !confirm('Are you sure you want to ban this user?')) return;
    if (action === 'unban' && !confirm('Are you sure you want to unban this user?')) return;
    if (action === 'reset_trust' && !confirm('Reset trust score to 50?')) return;

    try {
      await axios.post('/api/admin/users/action', { userId, action, reason });
      await fetchUsers(true);
      
      // Update selected user state if modal is open
      if (selectedUser && selectedUser.id === userId && action === 'update_notes') {
         setSelectedUser({...selectedUser, admin_notes: reason});
         alert('Notes saved successfully!');
      }
    } catch (err: any) {
      alert('Action failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const openMasterProfile = async (u: any) => {
    setSelectedUser({ ...u, logs: [], deposits: [] });
    setProfileTab('logs');
    setNotes(u.admin_notes || '');
    setLogsModalOpen(true);
    setLogsLoading(true);
    try {
      const res = await axios.get('/api/admin/users/logs?userId=' + u.id);
      setSelectedUser({ ...u, logs: res.data.logs || [], deposits: res.data.deposits || [] });
    } catch (err: any) {
      alert('Failed to load logs: ' + err.message);
    } finally {
      setLogsLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.email || '').toLowerCase().includes(search.toLowerCase()) || 
    (u.telegram_id || '').includes(search) ||
    u.id.includes(search)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-32">
      {logsModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><LucideMail className="w-5 h-5 text-blue-500"/> {selectedUser.email}</h2>
                <div className="text-xs text-slate-500 font-mono mt-1">{selectedUser.id}</div>
              </div>
              <button onClick={() => setLogsModalOpen(false)} className="text-slate-500 hover:text-white">
                <LucideXCircle className="w-8 h-8" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Top Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Wallet Balance</div>
                    <div className="text-2xl font-black text-emerald-400">${Number(selectedUser.balance || 0).toFixed(2)}</div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <input 
                      type="number" 
                      placeholder="+5 or -5" 
                      value={manualBalance} 
                      onChange={e => setManualBalance(e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none" 
                    />
                    <button 
                      onClick={() => { 
                        if(!manualBalance) return;
                        if(confirm(`Are you sure you want to add/deduct ${manualBalance} to this user?`)) {
                           handleAction(selectedUser.id, 'add_balance', manualBalance); 
                           setManualBalance(''); 
                        }
                      }} 
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-3 rounded uppercase"
                    >
                      Apply
                    </button>
                  </div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Trust Score</div>
                  <div className={`text-2xl font-black ${selectedUser.trust_score >= 50 ? 'text-emerald-400' : selectedUser.trust_score >= 20 ? 'text-amber-400' : 'text-red-400'}`}>
                    {selectedUser.trust_score || 0}
                  </div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Success Rate</div>
                  <div className="text-2xl font-black text-blue-400">{selectedUser.success_rate || 0}%</div>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                 <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 font-bold text-slate-300"><LucideFileText className="w-4 h-4"/> Admin Notes & Reports</div>
                    <button onClick={() => handleAction(selectedUser.id, 'update_notes', notes)} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded font-bold">Save Notes</button>
                 </div>
                 <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    placeholder="Add notes about this user, spam reports, or ban reasons..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500 min-h-[100px]"
                 />
              </div>

              {/* Activity Log */}
              <div>
                <div className="flex items-center gap-4 mb-4 pb-2 border-b border-slate-800">
                  <button 
                    onClick={() => setProfileTab('logs')}
                    className={`text-lg font-bold flex items-center gap-2 px-2 py-1 ${profileTab === 'logs' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <LucideActivity className="w-5 h-5"/> Activation Logs
                  </button>
                  <button 
                    onClick={() => setProfileTab('deposits')}
                    className={`text-lg font-bold flex items-center gap-2 px-2 py-1 ${profileTab === 'deposits' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <LucideActivity className="w-5 h-5"/> Transactions
                  </button>
                </div>
                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  {logsLoading ? (
                    <div className="text-center p-12 text-slate-500 flex flex-col items-center">
                      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      Fetching complete history...
                    </div>
                  ) : profileTab === 'logs' ? (
                     selectedUser?.logs?.length === 0 ? (
                      <div className="text-center p-8 text-slate-500">No purchases yet.</div>
                    ) : (
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900 text-slate-400">
                          <tr>
                            <th className="p-3">Service</th>
                            <th className="p-3">Number</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Created At</th>
                            <th className="p-3">Cancelled At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {selectedUser?.logs?.map((log: any) => (
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
                    )
                  ) : (
                    selectedUser?.deposits?.length === 0 ? (
                      <div className="text-center p-8 text-slate-500">No transactions yet.</div>
                    ) : (
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900 text-slate-400">
                          <tr>
                            <th className="p-3">Txn Hash</th>
                            <th className="p-3">Wallet (To)</th>
                            <th className="p-3">Requested ($)</th>
                            <th className="p-3">Crypto Paid</th>
                            <th className="p-3">Credited ($)</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {selectedUser?.deposits?.map((dep: any) => (
                            <tr key={dep.id} className="hover:bg-slate-800/20">
                              <td className="p-3 font-mono text-slate-400 text-[10px] break-all max-w-[120px]">{dep.txn_id || dep.id.split('-')[0] + '...'}</td>
                              <td className="p-3 font-mono text-slate-400 text-[10px] break-all max-w-[120px]">{dep.payment_wallet || '-'}</td>
                              <td className="p-3 text-slate-300 font-medium">${Number(dep.amount).toFixed(2)}</td>
                              <td className="p-3">
                                {dep.currency ? <span className="font-bold text-blue-400">{dep.crypto_amount} {dep.currency}</span> : <span className="text-slate-500">-</span>}
                              </td>
                              <td className="p-3">
                                {dep.usd_credit ? <span className="font-bold text-emerald-400">${Number(dep.usd_credit).toFixed(2)}</span> : <span className="text-slate-500">-</span>}
                              </td>
                              <td className="p-3">
                                {dep.status === 'COMPLETED' ? (
                                  <div className="flex flex-col">
                                    <span className="text-emerald-500 font-bold text-xs">COMPLETED</span>
                                    {dep.invoice_status === 'mismatch' && <span className="text-amber-500 text-[10px]">(Overpaid)</span>}
                                    {dep.invoice_status === 'expired' && <span className="text-amber-500 text-[10px]">(Underpaid)</span>}
                                  </div>
                                ) : (
                                  <span className="text-amber-500 font-bold text-xs">{dep.status}</span>
                                )}
                              </td>
                              <td className="p-3 text-slate-400 text-xs">{new Date(dep.created_at).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition">
              <LucideArrowLeft className="w-5 h-5 text-slate-300" />
            </Link>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <LucideUsers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">User Management</h1>
              <p className="text-sm text-slate-400 font-medium">Master Dashboard</p>
            </div>
          </div>
          <button onClick={() => fetchUsers(false)} className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-700">
            <LucideRefreshCcw className="w-4 h-4" /> Refresh
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="max-w-6xl mx-auto relative">
           <LucideSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
           <input 
             type="text"
             placeholder="Search users by Email, Telegram ID, or UUID..."
             value={search}
             onChange={e => setSearch(e.target.value)}
             className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white font-medium focus:outline-none focus:border-indigo-500 shadow-inner"
           />
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
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">User (Email)</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Balance</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Activity</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Trust Score</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Status</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading users...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">No users found.</td></tr>
                ) : filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/20 transition">
                    <td className="p-4">
                      <button onClick={() => openMasterProfile(u)} className="text-left font-bold text-white hover:text-blue-400 transition mb-1 flex items-center gap-2">
                        {u.email}
                      </button>
                      <div className="flex items-center gap-2 text-slate-300 font-medium">
                        {u.telegram_id ? (
                          <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-xs border border-blue-500/20">TG: {u.telegram_id}</span>
                        ) : (
                          <span className="text-slate-600 text-xs italic">Unlinked</span>
                        )}
                        {u.is_email_verified && <span title="Email Verified"><LucideCheckCircle2 className="w-4 h-4 text-emerald-500" /></span>}
                      </div>
                    </td>
                    <td className="p-4 font-mono font-medium text-emerald-400">
                      ${Number(u.balance || 0).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Rate:</span>
                          <span className="text-blue-400 font-bold">{u.success_rate || 0}%</span>
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
                          onClick={() => openMasterProfile(u)}
                          className="px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-600/40 text-xs font-bold transition"
                        >
                          Profile
                        </button>
                        <button 
                          onClick={() => handleAction(u.id, 'reset_trust')}
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
