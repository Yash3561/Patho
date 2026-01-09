export const AuditLog = ({ logs }: { logs: string[] }) => (
    <div className="bg-[#020617] border border-slate-800 font-mono text-[11px] p-3 h-48 overflow-y-auto rounded-lg">
        <div className="text-slate-500 mb-2 uppercase tracking-tighter font-bold flex justify-between items-center">
            <span>System Audit Trail</span>
            <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            </div>
        </div>
        <div className="space-y-1">
            {logs.length === 0 && (
                <div className="text-slate-700 italic">No activity recorded...</div>
            )}
            {logs.map((log, i) => (
                <div key={i} className="text-emerald-500/80">
                    <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                    <span className="typing-effect">{log}</span>
                </div>
            ))}
        </div>
    </div>
);
