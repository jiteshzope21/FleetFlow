import React, { useEffect, useState } from 'react';
import { LifeBuoy, Plus, RefreshCw, Send, X, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { api } from '../../lib/api.js';

export const SupportTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Create Ticket Modal State
  const [createModal, setCreateModal] = useState<boolean>(false);
  const [subject, setSubject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [category, setCategory] = useState<string>('GENERAL');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Selected Ticket Drawer
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [replying, setReplying] = useState<boolean>(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/support');
      setTickets(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/support', {
        subject: subject.trim(),
        description: description.trim(),
        priority,
        category,
      });
      setCreateModal(false);
      setSubject('');
      setDescription('');
      fetchTickets();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;
    setReplying(true);
    try {
      const res = await api.post(`/support/${selectedTicket._id}/reply`, {
        message: replyText.trim(),
      });
      setSelectedTicket(res.data?.data);
      setReplyText('');
      fetchTickets();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to reply');
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Help & Customer Support
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Submit inquiries, report platform issues, and communicate directly with the FleetFlow operations team.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" /> Open Support Ticket
          </button>
          <button
            onClick={fetchTickets}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tickets List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-500 mb-2" />
            <p className="text-xs">Loading support tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs italic">
            No support tickets submitted yet. Click "Open Support Ticket" if you need assistance.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {tickets.map((t) => (
              <div
                key={t._id}
                onClick={() => setSelectedTicket(t)}
                className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-brand-600 dark:text-brand-400">
                      {t.ticketNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        t.status === 'OPEN'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-400'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400'
                      }`}
                    >
                      {t.status}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Category: {t.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-1">{t.subject}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{t.description}</p>
                </div>
                <div className="text-right shrink-0 text-xs text-slate-400">
                  <span>{new Date(t.updatedAt).toLocaleDateString()}</span>
                  <p className="text-[11px] text-brand-600 font-semibold mt-1">
                    {t.messages?.length || 1} messages
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Submit New Support Request</h3>
              <button onClick={() => setCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Subject / Issue Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Issue dispatching vehicle to trip #TRP-8821"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="GENERAL">General Operational Inquiry</option>
                    <option value="TECHNICAL">Technical Platform Issue</option>
                    <option value="BILLING">Billing & Subscription</option>
                    <option value="FEATURE_REQUEST">Feature Request</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Urgency Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High (Impacts trip dispatch)</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Detailed Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your issue with error messages, trip IDs, or steps to reproduce..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold"
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Conversation Drawer */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-brand-600">{selectedTicket.ticketNumber}</span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{selectedTicket.subject}</h2>
                <span className="text-[11px] font-semibold text-slate-400">Status: {selectedTicket.status}</span>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {selectedTicket.messages?.map((msg: any, idx: number) => (
                <div
                  key={msg._id || idx}
                  className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                    msg.senderRole === 'SUPER_ADMIN'
                      ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {msg.senderName} ({msg.senderRole === 'SUPER_ADMIN' ? 'Platform Support' : 'You'})
                    </span>
                    <span className="text-[10px] text-slate-400">{new Date(msg.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <form onSubmit={handleSendReply} className="border-t border-slate-200 dark:border-slate-800 pt-3 flex gap-2">
              <textarea
                rows={2}
                placeholder="Type your response..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white resize-none"
              />
              <button
                type="submit"
                disabled={replying || !replyText.trim()}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 self-end"
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
