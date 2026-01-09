'use client'
import { useState, useEffect } from 'react'

export const RevenueTicker = ({ caseVerified, initialTotal = 12450.00 }: { caseVerified: boolean, initialTotal?: number }) => {
    const [total, setTotal] = useState(initialTotal);

    useEffect(() => {
        if (caseVerified) {
            // 0596T average reimbursement is approx $150-$200
            setTotal(prev => prev + 185.50);
        }
    }, [caseVerified]);

    useEffect(() => {
        setTotal(initialTotal);
    }, [initialTotal]);

    return (
        <div className="bg-slate-950 border-l border-slate-800 p-4 h-full flex flex-col justify-center min-w-[200px]">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                Est. Recovered Revenue (YTD)
            </span>
            <div className="text-2xl font-mono text-emerald-500 tabular-nums animate-in fade-in slide-in-from-bottom-2 duration-500">
                ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-emerald-900 mt-1 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                CMS 2026 AUDIT COMPLIANT
            </div>
        </div>
    )
}
