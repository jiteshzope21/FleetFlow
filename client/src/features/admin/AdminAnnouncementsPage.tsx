import React, { useEffect, useState } from 'react';
import { Megaphone, Plus, RefreshCw, Trash2, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { adminService, AdminAnnouncement } from '../../services/admin.service.js';

export const AdminAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Create Modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'CRITICAL'>('NORMAL');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'OWNERS' | 'DISPATCHERS'>('ALL');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      await adminService.createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        priority,
        targetAudience,
        isPublished: true,
      });
      setModalOpen(false);
      setTitle('');
      setContent('');
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to publish announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (ann: AdminAnnouncement) => {
    try {
      await adminService.updateAnnouncement(ann._id, { isPublished: !ann.isPublished });
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to update publication state');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this broadcast announcement?')) return;
    try {
      await adminService.deleteAnnouncement(id);
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Platform Broadcast Announcements
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Broadcast platform maintenance windows, feature updates, and urgent alerts across all tenants.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Announcement
          </button>
          <button
            onClick={fetchAnnouncements}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-rose-500 mb-2" />
          <p className="text-xs">Loading announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-950/80 border border-slate-800 text-center text-slate-500 text-xs italic">
          No platform announcements published yet. Click "Create Announcement" to post your first broadcast.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {announcements.map((ann) => (
            <div
              key={ann._id}
              className={`p-6 rounded-2xl bg-slate-950/80 border flex flex-col justify-between space-y-4 ${
                ann.priority === 'CRITICAL'
                  ? 'border-rose-700/80'
                  : ann.priority === 'HIGH'
                  ? 'border-amber-700/80'
                  : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        ann.priority === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800/80'
                          : ann.priority === 'HIGH'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800/80'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {ann.priority}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                      Audience: {ann.targetAudience}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(ann._id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-base font-bold text-white mt-3">{ann.title}</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  {new Date(ann.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleTogglePublish(ann)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded transition-colors ${
                    ann.isPublished
                      ? 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900/60'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {ann.isPublished ? 'Published to Tenants' : 'Draft / Unpublished'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">New Platform Broadcast Announcement</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Headline Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Planned Infrastructure Upgrade: FleetFlow 4.5"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Priority Alert Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Target Audience</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="ALL">All Carrier Tenants</option>
                    <option value="OWNERS">Company Owners Only</option>
                    <option value="DISPATCHERS">Dispatchers Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Announcement Body Content</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide clear operational context and scheduled timings for transport companies..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors"
                >
                  {submitting ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
