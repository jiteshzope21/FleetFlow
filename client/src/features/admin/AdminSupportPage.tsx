import React, { useEffect, useState } from 'react';
import { LifeBuoy, RefreshCw, Send, X, MessageSquare, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminService, AdminSupportTicket } from '../../services/admin.service.js';

export const AdminSupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  // Selected Ticket Drawer / Conversation
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicket | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [replying, setReplying] = useState<boolean>(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await adminService.getSupportTickets({
        page,
        limit: 15,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setTickets(res.tickets);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [page, statusFilter, priorityFilter]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;
    setReplying(true);
    try {
      const updated = await adminService.addTicketReply(selectedTicket._id, replyText.trim());
      setSelectedTicket(updated);
      setReplyText('');
      fetchTickets();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return;
    try {
      const updated = await adminService.updateSupportTicket(selectedTicket._id, { status });
      setSelectedTicket(updated);
      fetchTickets();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Carrier Support Queue
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {total} Total
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Resolve technical, operational, and billing inquiries submitted by carrier workspaces.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
          <button
            onClick={fetchTickets}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-rose-500 mb-2" />
            <p className="text-xs">Loading support tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs italic">
            No support tickets in queue matching your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Ticket # & Subject</th>
                  <th className="px-5 py-3.5">Company Carrier</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Updated</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tickets.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <span className="font-mono text-[10px] text-rose-400 font-bold">{t.ticketNumber}</span>
                        <p className="font-bold text-slate-200 text-xs line-clamp-1">{t.subject}</p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-300">{t.companyId?.name || 'Company'}</p>
                      <p className="text-[11px] text-slate-500">{t.userId?.name || t.userId?.email}</p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          t.priority === 'URGENT'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800/80'
                            : t.priority === 'HIGH'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/80'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          t.status === 'OPEN'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800/80'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/80'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-400 text-[11px] font-medium">{t.category}</td>

                    <td className="px-5 py-4 text-slate-500 text-[11px]">
                      {new Date(t.updatedAt).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-600/40 text-[11px] font-bold transition-colors"
                      >
                        Open Ticket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Conversation Drawer */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-slate-950 border-l border-slate-800 h-full flex flex-col p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="font-mono text-xs text-rose-400 font-bold">{selectedTicket.ticketNumber}</span>
                <h2 className="text-base font-bold text-white mt-0.5">{selectedTicket.subject}</h2>
                <p className="text-xs text-slate-400">Carrier: {selectedTicket.companyId?.name || 'Company'}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status and Action Buttons */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-white">{selectedTicket.status}</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedTicket.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleUpdateStatus('RESOLVED')}
                    className="px-2.5 py-1 rounded bg-emerald-600/20 text-emerald-400 border border-emerald-600/40 text-[10px] font-bold"
                  >
                    Mark Resolved
                  </button>
                )}
                {selectedTicket.status !== 'CLOSED' && (
                  <button
                    onClick={() => handleUpdateStatus('CLOSED')}
                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-[10px] font-bold"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>

            {/* Conversation Thread Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {selectedTicket.messages?.map((msg, i) => (
                <div
                  key={msg._id || i}
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    msg.senderRole === 'SUPER_ADMIN'
                      ? 'bg-rose-950/30 border-rose-800/60 ml-6'
                      : 'bg-slate-900 border-slate-800 mr-6'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">
                      {msg.senderName} ({msg.senderRole})
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))}
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendReply} className="border-t border-slate-800 pt-4 flex gap-2">
              <textarea
                rows={2}
                placeholder="Type response as Super Admin..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
              />
              <button
                type="submit"
                disabled={replying || !replyText.trim()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 transition-colors self-end"
              >
                <Send className="w-3.5 h-3.5" />
                {replying ? 'Sending...' : 'Reply'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
