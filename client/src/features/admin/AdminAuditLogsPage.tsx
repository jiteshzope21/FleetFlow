import React, { useEffect, useState } from 'react';
import { ClipboardList, RefreshCw, ChevronLeft, ChevronRight, ShieldCheck, Filter } from 'lucide-react';
import { adminService } from '../../services/admin.service.js';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAuditLogs({
        page,
        limit: 20,
        action: actionFilter || undefined,
      });
      setLogs(res.logs);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Platform Administrative Audit Trail
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {total} Events Recorded
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of all privileged administrative actions, company suspensions, plan adjustments, and security operations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Administrative Actions</option>
            <option value="COMPANY_SUSPENDED">COMPANY_SUSPENDED</option>
            <option value="COMPANY_ACTIVATED">COMPANY_ACTIVATED</option>
            <option value="PLAN_CREATED">PLAN_CREATED</option>
            <option value="PLAN_UPDATED">PLAN_UPDATED</option>
            <option value="USER_STATUS_UPDATE">USER_STATUS_UPDATE</option>
            <option value="SUPER_ADMIN_BOOTSTRAP">SUPER_ADMIN_BOOTSTRAP</option>
          </select>
          <button
            onClick={fetchLogs}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-rose-500 mb-2" />
            <p className="text-xs">Querying audit trail...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs italic">
            No audit records found matching your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Actor (Administrator)</th>
                  <th className="px-5 py-3.5">Action Code</th>
                  <th className="px-5 py-3.5">Target Scope</th>
                  <th className="px-5 py-3.5">Audit Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="px-5 py-4 font-sans">
                      <p className="font-bold text-slate-200 text-xs">{log.actorEmail}</p>
                      <span className="text-[10px] text-rose-400 font-bold">{log.actorRole}</span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-bold text-rose-400 text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {log.action}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-sans text-slate-300 font-medium">
                      {log.targetType}
                    </td>

                    <td className="px-5 py-4 font-sans">
                      <div className="max-w-md text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800/60">
                        {log.details?.reason && (
                          <p className="text-slate-300 font-semibold mb-0.5">
                            Reason: <span className="italic font-normal">{log.details.reason}</span>
                          </p>
                        )}
                        <pre className="text-[10px] text-slate-500 overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(log.details || {}, null, 1)}
                        </pre>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-sans">
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
    </div>
  );
};
