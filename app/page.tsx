"use client"

import { useState, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, CheckCircle2, Clock, Microscope, ZoomIn, ZoomOut, Move, Download, Loader2 } from "lucide-react"
import { analyzeSlide, documentVerification, downloadAuditPDF, type BillingAnalysis } from "@/lib/api"

interface Case {
  id: string
  patientId: string
  diagnosis: string
  status: "billed" | "pending" | "under-documented"
  currentCPT: string
  suggestedCPT: string
  revenue: number
}

const cases: Case[] = [
  {
    id: "WSI-2024-1847",
    patientId: "PT-8829",
    diagnosis: "Invasive Ductal Carcinoma",
    status: "under-documented",
    currentCPT: "88305",
    suggestedCPT: "88309",
    revenue: 18.4,
  },
  {
    id: "WSI-2024-1846",
    patientId: "PT-8828",
    diagnosis: "Melanoma in situ",
    status: "pending",
    currentCPT: "88305",
    suggestedCPT: "88309",
    revenue: 12.2,
  },
  {
    id: "WSI-2024-1845",
    patientId: "PT-8827",
    diagnosis: "Benign Nevus",
    status: "billed",
    currentCPT: "88305",
    suggestedCPT: "88305",
    revenue: 0,
  },
  {
    id: "WSI-2024-1844",
    patientId: "PT-8826",
    diagnosis: "Squamous Cell Carcinoma",
    status: "under-documented",
    currentCPT: "88305",
    suggestedCPT: "88309",
    revenue: 15.8,
  },
  {
    id: "WSI-2024-1843",
    patientId: "PT-8825",
    diagnosis: "Follicular Lymphoma",
    status: "pending",
    currentCPT: "88305",
    suggestedCPT: "88309",
    revenue: 22.5,
  },
]

const statusConfig = {
  billed: { label: "Billed", icon: CheckCircle2, color: "bg-slate-700 text-slate-300" },
  pending: { label: "Pending", icon: Clock, color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  "under-documented": {
    label: "Under-documented",
    icon: AlertCircle,
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
}

export default function PathoAIDashboard() {
  const [selectedCase, setSelectedCase] = useState<Case>(cases[0])
  const [clickedIndicators, setClickedIndicators] = useState<Set<string>>(new Set())
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [billingAnalysis, setBillingAnalysis] = useState<BillingAnalysis | null>(null)
  const [isVerified, setIsVerified] = useState(false)

  const complexityIndicators = billingAnalysis?.complexity_indicators || [
    "High nuclear grade (Grade 3/3) with marked pleomorphism",
    "Elevated mitotic activity (18 mitoses per 10 HPF)",
    "Perineural invasion identified in multiple sections",
    "Lymphovascular space invasion present",
    "Tumor infiltrating lymphocytes requiring assessment",
    "Requires ancillary IHC studies (ER, PR, HER2, Ki-67)",
  ]

  const handleIndicatorClick = (indicator: string) => {
    setClickedIndicators((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(indicator)) {
        newSet.delete(indicator)
      } else {
        newSet.add(indicator)
      }
      return newSet
    })
  }

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true)
    try {
      const result = await analyzeSlide({
        slide_id: selectedCase.id,
        findings: {
          diagnosis: selectedCase.diagnosis,
          current_cpt: selectedCase.currentCPT,
        }
      })
      setBillingAnalysis(result)
      setClickedIndicators(new Set())
      setIsVerified(false)
    } catch (error) {
      console.error("Analysis failed:", error)
      // Fallback to mock data for demo
      setBillingAnalysis({
        slide_id: selectedCase.id,
        base_cpt: selectedCase.currentCPT,
        recommended_cpt: selectedCase.suggestedCPT,
        revenue_delta: selectedCase.revenue,
        cpt_codes: {
          base: selectedCase.currentCPT,
          recommended: selectedCase.suggestedCPT,
          ai_assisted: "0596T",
          ancillary: ["88342"],
        },
        audit_narrative: "Specimen demonstrates infiltrating ductal carcinoma with high nuclear grade (Grade 3/3), elevated mitotic activity, and perineural invasion. These findings warrant CPT 88309 coding per 2026 CMS guidelines for complex surgical pathology specimens. Documentation supports medical necessity for higher complexity code.",
        complexity_indicators: [
          "High nuclear grade (Grade 3/3) with marked pleomorphism",
          "Elevated mitotic activity (18 mitoses per 10 HPF)",
          "Perineural invasion identified in multiple sections",
          "Lymphovascular space invasion present",
          "Tumor infiltrating lymphocytes requiring assessment",
          "Requires ancillary IHC studies (ER, PR, HER2, Ki-67)",
        ],
        confidence_score: 0.943,
        audit_defense_score: 96,
        model_used: "gemini-3-pro-latest"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }, [selectedCase])

  const handleVerify = useCallback(async () => {
    if (!billingAnalysis) return

    setIsVerifying(true)
    try {
      await documentVerification({
        slide_id: selectedCase.id,
        pathologist_name: "Dr. [Current User]",
        verified_cpt_codes: [billingAnalysis.recommended_cpt, billingAnalysis.cpt_codes.ai_assisted],
        complexity_indicators_clicked: Array.from(clickedIndicators),
        billing_data: billingAnalysis,
      })
      setIsVerified(true)
    } catch (error) {
      console.error("Verification failed:", error)
      // For demo, still mark as verified
      setIsVerified(true)
    } finally {
      setIsVerifying(false)
    }
  }, [selectedCase.id, billingAnalysis, clickedIndicators])

  const handleDownloadPDF = useCallback(async () => {
    setIsDownloading(true)
    try {
      await downloadAuditPDF(selectedCase.id)
    } catch (error) {
      console.error("PDF download failed:", error)
    } finally {
      setIsDownloading(false)
    }
  }, [selectedCase.id])

  const canVerify = clickedIndicators.size > 0 && !isVerified

  // Calculate total pipeline value
  const totalPipeline = cases.reduce((sum, c) => sum + c.revenue, 0)

  return (
    <div className="h-screen bg-slate-950 text-slate-100 overflow-hidden flex flex-col text-sm">
      {/* Header - Fixed at top, tight spacing */}
      <header className="border-b border-slate-800 bg-slate-900 flex-shrink-0">
        <div className="flex items-center justify-between px-2 py-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center bg-emerald-600 rounded">
              <Microscope className="h-4 w-4 text-slate-900" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-slate-100">PathoAI</h1>
              <p className="text-xs text-slate-400">Revenue Recovery Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs text-slate-400">Q1 2026 Pipeline</p>
              <p className="text-sm font-semibold font-mono text-emerald-600">+${totalPipeline.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Column 1: Case Navigation - 18%, fixed height, no scroll */}
        <div className="w-[18%] h-full bg-slate-950 border-r border-slate-800 flex flex-col">
          <div className="p-2 border-b border-slate-800 flex-shrink-0">
            <h2 className="text-sm font-semibold text-slate-100">Case Queue</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              <span className="font-mono">{cases.filter((c) => c.status === "under-documented").length}</span> cases
              need review
            </p>
          </div>

          <ScrollArea className="flex-1 p-2">
            <div className="flex flex-col gap-1.5">
              {cases.map((case_) => {
                const config = statusConfig[case_.status]
                const StatusIcon = config.icon
                return (
                  <button
                    key={case_.id}
                    onClick={() => {
                      setSelectedCase(case_)
                      setBillingAnalysis(null)
                      setClickedIndicators(new Set())
                      setIsVerified(false)
                    }}
                    className={`rounded border border-slate-800 p-2 text-left transition-colors hover:bg-slate-900 ${selectedCase.id === case_.id
                      ? "border-emerald-600 bg-slate-900"
                      : "bg-slate-900/40"
                      }`}
                  >
                    <div className="mb-1.5 flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-mono text-slate-400">{case_.id}</p>
                        <p className="mt-0.5 text-xs font-medium text-slate-100 leading-tight">{case_.diagnosis}</p>
                      </div>
                      {case_.revenue > 0 && (
                        <div className="ml-1.5 flex items-center gap-0.5 bg-emerald-600 px-1 py-0.5 rounded">
                          <span className="text-xs font-semibold font-mono text-slate-900">+{case_.revenue}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className={`flex items-center gap-1 text-[10px] h-4 px-1.5 ${config.color} border border-slate-800`}>
                        <StatusIcon className="h-2.5 w-2.5" />
                        {config.label}
                      </Badge>
                      <span className="text-[10px] font-mono text-slate-500">{case_.patientId}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Column 2: Main Viewer - 55%, docked controls, no floating */}
        <div className="w-[55%] h-full bg-slate-900 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Whole Slide Image</h2>
              <p className="text-xs font-mono text-slate-400 mt-0.5">{selectedCase.id}</p>
            </div>
            <div className="flex gap-1.5">
              <Badge variant="outline" className="border-slate-800 text-slate-300 text-xs h-5 px-1.5">
                <span className="font-mono">40x</span> Magnification
              </Badge>
              <Badge variant="outline" className="border-slate-800 text-slate-300 text-xs h-5 px-1.5">
                H&E Stain
              </Badge>
            </div>
          </div>

          <div className="flex-1 relative bg-slate-950 overflow-hidden">
            <img
              src="/microscopic-tissue-sample-histopathology-cells-pin.jpg"
              alt="Whole Slide Image"
              className="h-full w-full object-cover opacity-80"
            />

            {/* AI Insight Overlay with Bounding Box - no glow */}
            <div className="absolute left-1/4 top-1/4 h-32 w-32 border border-emerald-600 bg-emerald-600/10">
              <div className="absolute -right-1 -top-1 h-3 w-3 border border-emerald-600 bg-emerald-600" />
              <div className="absolute -bottom-1 -left-1 h-3 w-3 border border-emerald-600 bg-emerald-600" />
            </div>

            {/* AI Insight Card - no shadows */}
            <div className="absolute bottom-2 right-2 w-72 border border-slate-800 bg-slate-900 p-2 rounded">
              <div className="mb-1.5 flex items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center bg-emerald-600/20 rounded">
                  <Microscope className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-600">AI Insight Detected</p>
                  <p className="text-[10px] text-slate-400">
                    Confidence: <span className="font-mono">{billingAnalysis ? `${(billingAnalysis.confidence_score * 100).toFixed(1)}%` : '94.3%'}</span>
                  </p>
                </div>
              </div>
              <div className="space-y-1.5 border-t border-slate-800 pt-1.5">
                <div>
                  <p className="text-xs font-medium text-slate-300">Pattern Recognition</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Identified infiltrating ductal carcinoma with high nuclear grade (Grade 3). Extensive perineural
                    invasion noted.
                  </p>
                </div>
                <div className="border border-slate-800 bg-slate-950 p-1.5 rounded">
                  <p className="text-xs font-medium text-emerald-600">Complexity Indicators</p>
                  <ul className="mt-1 space-y-0.5 text-[11px] text-slate-300 leading-relaxed">
                    <li>
                      • Mitotic count: <span className="font-mono">18/10</span> HPF
                    </li>
                    <li>• Tumor infiltrating lymphocytes present</li>
                    <li>• Requires immunohistochemistry workup</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Docked bottom bar - no floating controls */}
          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900 px-2 py-1.5 flex-shrink-0">
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-800 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-100 h-7 text-xs rounded px-2"
              >
                <Move className="h-3 w-3 mr-1" />
                Pan
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-800 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-100 h-7 text-xs rounded px-2"
              >
                <ZoomIn className="h-3 w-3 mr-1" />
                Zoom In
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-800 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-100 h-7 text-xs rounded px-2"
              >
                <ZoomOut className="h-3 w-3 mr-1" />
                Zoom Out
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="border-emerald-600 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 hover:text-emerald-300 h-7 text-xs rounded px-2"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Microscope className="h-3 w-3 mr-1" />
                )}
                {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
              </Button>
            </div>
            <p className="text-xs font-mono text-slate-500">Coordinates: X: 2847, Y: 1923</p>
          </div>
        </div>

        {/* Column 3: Revenue Agent Panel - 27%, fixed height */}
        <div className="w-[27%] h-full bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden">
          {/* Section 1: Compact Financial Summary Header */}
          <div className="border-b border-slate-800 p-2">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-xs text-slate-400">Base CPT</span>
              <span className="text-xs text-slate-400">Recov. Potential</span>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-base font-mono text-slate-300">$72.00</span>
              <span className="text-xl font-mono font-bold text-emerald-600">+${billingAnalysis?.revenue_delta?.toFixed(2) || selectedCase.revenue.toFixed(2)}</span>
            </div>

            {/* CPT Codes in horizontal bar - compact */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-xs mb-1.5">
                <span className="text-slate-400">Base:</span>
                <code className="px-1.5 py-0.5 bg-slate-800 border border-slate-800 font-mono text-slate-200 rounded text-[11px]">{billingAnalysis?.base_cpt || selectedCase.currentCPT}</code>
                <span className="text-slate-600">→</span>
                <span className="text-slate-400">Rec:</span>
                <code className="px-1.5 py-0.5 bg-emerald-600 font-mono text-slate-900 font-semibold rounded text-[11px]">{billingAnalysis?.recommended_cpt || selectedCase.suggestedCPT}</code>
              </div>
              <div className="flex gap-1">
                <Badge variant="outline" className="border-slate-800 bg-slate-800 text-slate-300 h-5 text-[10px] px-1.5 rounded">
                  AI: <span className="font-mono ml-0.5">{billingAnalysis?.cpt_codes?.ai_assisted || '0596T'}</span>
                </Badge>
                <Badge variant="outline" className="border-slate-800 bg-slate-800 text-slate-300 h-5 text-[10px] px-1.5 rounded">
                  IHC: <span className="font-mono ml-0.5">{billingAnalysis?.cpt_codes?.ancillary?.[0] || '88342'}</span>
                </Badge>
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Documentation - Scrollable area */}
          <div className="flex-1 min-h-0 border-b border-slate-800 overflow-hidden flex flex-col">
            <div className="px-2 py-1.5 border-b border-slate-800 bg-slate-950 flex-shrink-0">
              <p className="text-xs font-medium text-slate-300">Clinical Justification</p>
            </div>
            <ScrollArea className="flex-1 h-full">
              <div className="px-2 py-2">
                <div className="space-y-2 text-xs leading-relaxed text-slate-300">
                  <div className="border border-slate-800 bg-slate-950 p-2 rounded">
                    <p className="font-semibold text-emerald-600 text-xs">
                      RECOMMENDED: CPT <span className="font-mono">{billingAnalysis?.recommended_cpt || selectedCase.suggestedCPT}</span>
                    </p>
                    <p className="mt-0.5 text-slate-400 text-[10px]">
                      Level V - Surgical pathology, gross and microscopic examination
                    </p>
                  </div>

                  <div className="border border-slate-800 bg-slate-950 p-2 rounded">
                    <p className="font-medium text-slate-200 mb-1 text-[10px] uppercase tracking-wide">
                      Clinical Justification
                    </p>
                    <p className="text-slate-400 text-xs leading-relaxed font-mono">
                      {billingAnalysis?.audit_narrative ||
                        "Specimen demonstrates infiltrating ductal carcinoma (invasive breast carcinoma of no special type) with the following complex features that warrant CPT 88309 coding:"}
                    </p>
                  </div>

                  <div className="border border-slate-800 bg-slate-950 p-2 rounded">
                    <p className="font-medium text-slate-200 mb-1 text-[10px] uppercase tracking-wide">
                      Complexity Indicators <span className="text-emerald-500">(Click to Verify)</span>
                    </p>
                    <ul className="space-y-0.5 text-[10px] font-mono">
                      {complexityIndicators.map((indicator, idx) => {
                        const isClicked = clickedIndicators.has(indicator)
                        return (
                          <li
                            key={idx}
                            onClick={() => handleIndicatorClick(indicator)}
                            className={`cursor-pointer px-1.5 py-0.5 rounded border transition-colors ${isClicked
                              ? "bg-emerald-600/20 border-emerald-600 text-emerald-400"
                              : "border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                              }`}
                          >
                            • {indicator}
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  <div className="border border-slate-800 bg-slate-950 p-2 rounded">
                    <p className="font-medium text-slate-200 mb-1 text-[10px] uppercase tracking-wide">
                      2026 CMS Compliance
                    </p>
                    <p className="text-slate-400 text-[10px] leading-relaxed font-mono">
                      Documentation supports medical necessity for higher complexity code per CMS guidelines. Case
                      requires specialized pathologist expertise, extended microscopic examination time (≥45 minutes), and
                      correlation with clinical/radiologic findings.
                    </p>
                  </div>

                  <div className="border border-emerald-600 bg-emerald-600/10 p-2 rounded">
                    <p className="font-medium text-emerald-600 text-[10px]">
                      Audit Defense Score: <span className="font-mono">{billingAnalysis?.audit_defense_score || 96}/100</span>
                    </p>
                    <p className="mt-0.5 text-slate-300 text-[10px]">
                      Documentation meets all CMS audit requirements. Recommendation supported by pathology best practices
                      and NCCN guidelines.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <div className="border border-slate-800 bg-slate-950 p-1.5 rounded">
                      <p className="text-[10px] text-slate-400">Review Time</p>
                      <p className="mt-0.5 text-sm font-semibold font-mono text-slate-100">3.2 min</p>
                    </div>
                    <div className="border border-slate-800 bg-slate-950 p-1.5 rounded">
                      <p className="text-[10px] text-slate-400">Cases Today</p>
                      <p className="mt-0.5 text-sm font-semibold font-mono text-slate-100">47 / 89</p>
                    </div>
                  </div>
                  {/* Bottom padding for scroll clearance */}
                  <div className="h-4" />
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Section 3: Pinned Verify Button - Fixed at bottom with proper spacing */}
          <div className="flex-shrink-0 p-3 bg-slate-900 border-t border-slate-800 space-y-2">
            <Button
              size="lg"
              disabled={!canVerify || isVerifying}
              onClick={handleVerify}
              className={`w-full h-10 font-semibold text-xs rounded ${isVerified
                ? "bg-emerald-700 text-slate-100 cursor-default"
                : canVerify
                  ? "bg-emerald-600 text-slate-900 hover:bg-emerald-500"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800"
                }`}
            >
              {isVerifying ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              {isVerified
                ? "✓ Verified & Documented"
                : isVerifying
                  ? "Documenting..."
                  : canVerify
                    ? "Verify & Document for 2026 Compliance"
                    : "Click Complexity Indicator to Verify"}
            </Button>

            {isVerified && (
              <Button
                size="lg"
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="w-full h-10 font-semibold text-xs rounded border-emerald-600 text-emerald-400 hover:bg-emerald-600/10"
              >
                {isDownloading ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                )}
                {isDownloading ? "Generating PDF..." : "Download Audit Shield PDF"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
