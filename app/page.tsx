"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertCircle, CheckCircle2, Clock, Microscope, ZoomIn, ZoomOut,
  Download, Loader2, Plus, TrendingUp, Shield, DollarSign,
  FileText, BarChart3, RefreshCw, Upload, X, User, FileSpreadsheet,
  Search, MoreVertical, Pencil, Trash2, ImageIcon, Filter
} from "lucide-react"
import {
  getCases, analyzeSlide, documentVerification, downloadAuditPDF,
  getRevenueSummary, logRegionClick, createCase, deleteCase, updateCase, uploadSlideImage,
  type Case, type BillingAnalysis, type AnnotatedRegion, type RevenueSummary
} from "@/lib/api"

// Status configuration
const statusConfig: Record<string, { label: string; icon: typeof AlertCircle; color: string }> = {
  PENDING: {
    label: "Pending",
    icon: Clock,
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  ANALYZED: {
    label: "Analyzed",
    icon: Microscope,
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  VERIFIED: {
    label: "Verified",
    icon: CheckCircle2,
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  EXPORTED: {
    label: "Exported",
    icon: FileText,
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
}

// Loading skeleton for case list
function CaseSkeleton() {
  return (
    <div className="p-3 rounded-lg border border-transparent">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24 bg-gray-800" />
          <Skeleton className="h-3 w-32 bg-gray-800" />
        </div>
        <Skeleton className="h-5 w-16 bg-gray-800" />
      </div>
      <Skeleton className="h-3 w-40 bg-gray-800 mt-2" />
    </div>
  )
}

export default function PathoAIDashboard() {
  // State
  const [cases, setCases] = useState<Case[]>([])
  const [filteredCases, setFilteredCases] = useState<Case[]>([])
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [billingAnalysis, setBillingAnalysis] = useState<BillingAnalysis | null>(null)
  const [revenueSummary, setRevenueSummary] = useState<RevenueSummary | null>(null)
  const [clickedRegions, setClickedRegions] = useState<Set<number>>(new Set())
  const [selectedRegion, setSelectedRegion] = useState<AnnotatedRegion | null>(null)
  const [activeTab, setActiveTab] = useState("cases")

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // Loading states
  const [isLoadingCases, setIsLoadingCases] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isLoadingBilling, setIsLoadingBilling] = useState(false)
  const [isCreatingCase, setIsCreatingCase] = useState(false)
  const [isDeletingCase, setIsDeletingCase] = useState(false)
  const [isUpdatingCase, setIsUpdatingCase] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Zoom state for viewer
  const [zoom, setZoom] = useState(100)

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Add Case Modal State
  const [showAddCaseModal, setShowAddCaseModal] = useState(false)
  const [newCase, setNewCase] = useState({
    patientId: '',
    patientName: '',
    diagnosis: '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)

  // Edit Case Modal State
  const [showEditCaseModal, setShowEditCaseModal] = useState(false)
  const [editingCase, setEditingCase] = useState<Case | null>(null)
  const [editForm, setEditForm] = useState({
    patientId: '',
    patientName: '',
    diagnosis: '',
  })

  // Delete Confirmation Modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [caseToDelete, setCaseToDelete] = useState<Case | null>(null)

  // Filter cases based on search and status
  useEffect(() => {
    let filtered = cases

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c =>
        c.patient_name.toLowerCase().includes(query) ||
        c.slide_id.toLowerCase().includes(query) ||
        c.patient_id.toLowerCase().includes(query) ||
        c.diagnosis.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(c => c.status === statusFilter)
    }

    setFilteredCases(filtered)
  }, [cases, searchQuery, statusFilter])

  // Load billing data for already-analyzed cases
  const loadCaseBillingData = useCallback(async (caseItem: Case) => {
    if (caseItem.status === 'PENDING') {
      setBillingAnalysis(null)
      return
    }

    setIsLoadingBilling(true)
    try {
      const response = await fetch(`http://localhost:8000/api/cases/${encodeURIComponent(caseItem.slide_id)}`)
      if (!response.ok) throw new Error('Failed to fetch case details')
      const caseDetail = await response.json()

      if (caseDetail.suggested_cpt_code || caseDetail.justification_text) {
        const reconstructedAnalysis: BillingAnalysis = {
          slide_id: caseDetail.slide_id,
          base_cpt: caseDetail.base_cpt_code || '88305',
          recommended_cpt: caseDetail.suggested_cpt_code || '88305',
          revenue_delta: caseDetail.recovery_value || 0,
          base_reimbursement: caseDetail.base_reimbursement || 72.00,
          optimized_reimbursement: caseDetail.optimized_reimbursement || 72.00,
          cpt_codes: {
            base: caseDetail.base_cpt_code || '88305',
            recommended: caseDetail.suggested_cpt_code || '88305',
            ai_assisted: caseDetail.ai_assisted_code || '0596T',
            ancillary: caseDetail.ancillary_codes || []
          },
          audit_narrative: caseDetail.justification_text || 'Analysis data available.',
          complexity_indicators: caseDetail.complexity_indicators || [],
          confidence_score: caseDetail.confidence_score || 0.95,
          audit_defense_score: caseDetail.audit_defense_score || 94,
          model_used: 'gemini-1.5-flash',
          annotated_regions: caseDetail.annotated_regions || []
        }
        setBillingAnalysis(reconstructedAnalysis)
      } else {
        setBillingAnalysis(null)
      }
    } catch (error) {
      console.error("Failed to load billing data:", error)
      setBillingAnalysis(null)
    } finally {
      setIsLoadingBilling(false)
    }
  }, [])

  // Load cases on mount
  useEffect(() => {
    loadCases()
    loadRevenueSummary()
  }, [])

  // Load billing data when a case is selected
  useEffect(() => {
    if (selectedCase) {
      loadCaseBillingData(selectedCase)
    }
  }, [selectedCase, loadCaseBillingData])

  const loadCases = async () => {
    setIsLoadingCases(true)
    try {
      const data = await getCases()
      setCases(data)
      if (data.length > 0 && !selectedCase) {
        setSelectedCase(data[0])
      }
    } catch (error) {
      console.error("Failed to load cases:", error)
    } finally {
      setIsLoadingCases(false)
    }
  }

  const loadRevenueSummary = async () => {
    try {
      const data = await getRevenueSummary()
      setRevenueSummary(data)
    } catch (error) {
      console.error("Failed to load revenue summary:", error)
    }
  }

  const handleAnalyze = useCallback(async () => {
    if (!selectedCase) return

    setIsAnalyzing(true)
    setBillingAnalysis(null)
    setClickedRegions(new Set())
    setSelectedRegion(null)

    try {
      const result = await analyzeSlide(selectedCase.slide_id)
      setBillingAnalysis(result)

      setCases(prev => prev.map(c =>
        c.slide_id === selectedCase.slide_id
          ? { ...c, status: 'ANALYZED' as const, suggested_cpt: result.recommended_cpt, recovery_value: result.revenue_delta }
          : c
      ))
      setSelectedCase(prev => prev ? { ...prev, status: 'ANALYZED' } : null)
    } catch (error) {
      console.error("Analysis failed:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [selectedCase])

  const handleRegionClick = useCallback(async (region: AnnotatedRegion) => {
    if (!selectedCase || !billingAnalysis) return

    setSelectedRegion(region)
    setClickedRegions(prev => new Set([...prev, region.id]))

    try {
      await logRegionClick(selectedCase.slide_id, region.label)
    } catch (error) {
      console.error("Failed to log region click:", error)
    }
  }, [selectedCase, billingAnalysis])

  const handleVerify = useCallback(async () => {
    if (!selectedCase || !billingAnalysis) return

    setIsVerifying(true)
    try {
      await documentVerification({
        slide_id: selectedCase.slide_id,
        pathologist_name: "Dr. [Current User]",
        verified_cpt_codes: [billingAnalysis.recommended_cpt, billingAnalysis.cpt_codes.ai_assisted],
        complexity_indicators_clicked: billingAnalysis.complexity_indicators.filter((_, i) =>
          clickedRegions.has(i + 1)
        ),
        billing_data: billingAnalysis,
      })

      setCases(prev => prev.map(c =>
        c.slide_id === selectedCase.slide_id
          ? { ...c, status: 'VERIFIED' as const }
          : c
      ))
      setSelectedCase(prev => prev ? { ...prev, status: 'VERIFIED' } : null)
      loadRevenueSummary()
    } catch (error) {
      console.error("Verification failed:", error)
    } finally {
      setIsVerifying(false)
    }
  }, [selectedCase, billingAnalysis, clickedRegions])

  const handleDownloadPDF = useCallback(() => {
    if (!selectedCase) return

    setIsDownloading(true)
    downloadAuditPDF(selectedCase.slide_id)

    setCases(prev => prev.map(c =>
      c.slide_id === selectedCase.slide_id
        ? { ...c, status: 'EXPORTED' as const }
        : c
    ))
    setSelectedCase(prev => prev ? { ...prev, status: 'EXPORTED' } : null)
    setTimeout(() => setIsDownloading(false), 500)
  }, [selectedCase])

  // Handle file selection for image upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setFilePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  // Handle Add New Case
  const handleAddCase = async () => {
    if (!newCase.patientId || !newCase.patientName) {
      alert("Please fill in Patient ID and Patient Name")
      return
    }

    setIsCreatingCase(true)
    try {
      const result = await createCase({
        patient_id: newCase.patientId,
        patient_name: newCase.patientName,
        diagnosis: newCase.diagnosis || 'Pending Diagnosis',
      })

      // Upload image if selected
      if (selectedFile && result.slide_id) {
        setIsUploadingImage(true)
        try {
          await uploadSlideImage(result.slide_id, selectedFile)
        } catch (error) {
          console.error("Image upload failed:", error)
        } finally {
          setIsUploadingImage(false)
        }
      }

      await loadCases()
      setShowAddCaseModal(false)
      setNewCase({ patientId: '', patientName: '', diagnosis: '' })
      setSelectedFile(null)
      setFilePreview(null)

      const newCases = await getCases()
      const createdCase = newCases.find(c => c.slide_id === result.slide_id)
      if (createdCase) setSelectedCase(createdCase)
    } catch (error) {
      console.error("Failed to create case:", error)
      alert("Failed to create case. Please try again.")
    } finally {
      setIsCreatingCase(false)
    }
  }

  // Handle Edit Case
  const openEditModal = (caseItem: Case) => {
    setEditingCase(caseItem)
    setEditForm({
      patientId: caseItem.patient_id,
      patientName: caseItem.patient_name,
      diagnosis: caseItem.diagnosis,
    })
    setShowEditCaseModal(true)
  }

  const handleUpdateCase = async () => {
    if (!editingCase) return

    setIsUpdatingCase(true)
    try {
      await updateCase(editingCase.slide_id, {
        patient_id: editForm.patientId,
        patient_name: editForm.patientName,
        diagnosis: editForm.diagnosis,
      })

      setCases(prev => prev.map(c =>
        c.slide_id === editingCase.slide_id
          ? { ...c, patient_id: editForm.patientId, patient_name: editForm.patientName, diagnosis: editForm.diagnosis }
          : c
      ))

      if (selectedCase?.slide_id === editingCase.slide_id) {
        setSelectedCase(prev => prev ? {
          ...prev,
          patient_id: editForm.patientId,
          patient_name: editForm.patientName,
          diagnosis: editForm.diagnosis
        } : null)
      }

      setShowEditCaseModal(false)
      setEditingCase(null)
    } catch (error) {
      console.error("Failed to update case:", error)
      alert("Failed to update case. Please try again.")
    } finally {
      setIsUpdatingCase(false)
    }
  }

  // Handle Delete Case
  const openDeleteConfirm = (caseItem: Case) => {
    setCaseToDelete(caseItem)
    setShowDeleteConfirm(true)
  }

  const handleDeleteCase = async () => {
    if (!caseToDelete) return

    setIsDeletingCase(true)
    try {
      await deleteCase(caseToDelete.slide_id)
      setCases(prev => prev.filter(c => c.slide_id !== caseToDelete.slide_id))

      if (selectedCase?.slide_id === caseToDelete.slide_id) {
        const remaining = cases.filter(c => c.slide_id !== caseToDelete.slide_id)
        setSelectedCase(remaining[0] || null)
        setBillingAnalysis(null)
      }

      setShowDeleteConfirm(false)
      setCaseToDelete(null)
      loadRevenueSummary()
    } catch (error) {
      console.error("Failed to delete case:", error)
      alert("Failed to delete case. Please try again.")
    } finally {
      setIsDeletingCase(false)
    }
  }

  const canVerify = billingAnalysis && clickedRegions.size >= 1
  const isVerified = selectedCase?.status === 'VERIFIED' || selectedCase?.status === 'EXPORTED'

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-100 overflow-hidden">
      {/* Add Case Modal */}
      <Dialog open={showAddCaseModal} onOpenChange={setShowAddCaseModal}>
        <DialogContent className="bg-[#0d0d0d] border-gray-800 text-gray-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                <Plus className="w-5 h-5 text-emerald-400" />
              </div>
              Add New Case
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new pathology case for AI-assisted billing analysis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="patientId" className="text-sm font-medium text-gray-300">
                Patient ID <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="patientId"
                  placeholder="e.g., PT-12345"
                  value={newCase.patientId}
                  onChange={(e) => setNewCase(prev => ({ ...prev, patientId: e.target.value }))}
                  className="pl-10 bg-gray-900/50 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="patientName" className="text-sm font-medium text-gray-300">
                Patient Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="patientName"
                placeholder="e.g., John Smith"
                value={newCase.patientName}
                onChange={(e) => setNewCase(prev => ({ ...prev, patientName: e.target.value }))}
                className="bg-gray-900/50 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diagnosis" className="text-sm font-medium text-gray-300">
                Initial Diagnosis
              </Label>
              <Input
                id="diagnosis"
                placeholder="e.g., Suspicious lesion - biopsy required"
                value={newCase.diagnosis}
                onChange={(e) => setNewCase(prev => ({ ...prev, diagnosis: e.target.value }))}
                className="bg-gray-900/50 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-emerald-500"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">Slide Image (Optional)</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${filePreview
                  ? 'border-emerald-600 bg-emerald-900/10'
                  : 'border-gray-700 hover:border-gray-600 hover:bg-gray-900/30'
                  }`}
              >
                {filePreview ? (
                  <div className="relative">
                    <img src={filePreview} alt="Preview" className="max-h-32 mx-auto rounded" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFile(null)
                        setFilePreview(null)
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full hover:bg-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <p className="text-xs text-gray-400 mt-2">{selectedFile?.name}</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                    <p className="text-sm text-gray-400">Click to upload slide image</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowAddCaseModal(false)
              setSelectedFile(null)
              setFilePreview(null)
            }} className="border-gray-700 text-gray-300 hover:bg-gray-800">
              Cancel
            </Button>
            <Button
              onClick={handleAddCase}
              disabled={isCreatingCase || isUploadingImage || !newCase.patientId || !newCase.patientName}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
            >
              {isCreatingCase || isUploadingImage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploadingImage ? 'Uploading...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Case
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Case Modal */}
      <Dialog open={showEditCaseModal} onOpenChange={setShowEditCaseModal}>
        <DialogContent className="bg-[#0d0d0d] border-gray-800 text-gray-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                <Pencil className="w-5 h-5 text-blue-400" />
              </div>
              Edit Case
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Update case information for {editingCase?.slide_id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">Patient ID</Label>
              <Input
                value={editForm.patientId}
                onChange={(e) => setEditForm(prev => ({ ...prev, patientId: e.target.value }))}
                className="bg-gray-900/50 border-gray-700 text-gray-100 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">Patient Name</Label>
              <Input
                value={editForm.patientName}
                onChange={(e) => setEditForm(prev => ({ ...prev, patientName: e.target.value }))}
                className="bg-gray-900/50 border-gray-700 text-gray-100 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">Diagnosis</Label>
              <Input
                value={editForm.diagnosis}
                onChange={(e) => setEditForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                className="bg-gray-900/50 border-gray-700 text-gray-100 focus:border-blue-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditCaseModal(false)} className="border-gray-700 text-gray-300 hover:bg-gray-800">
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCase}
              disabled={isUpdatingCase}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
            >
              {isUpdatingCase ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-[#0d0d0d] border-gray-800 text-gray-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-red-400">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              Delete Case
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete <strong className="text-white">{caseToDelete?.patient_name}</strong>?
              <br />
              <span className="text-red-400">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="border-gray-700 text-gray-300 hover:bg-gray-800">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCase}
              disabled={isDeletingCase}
              className="bg-red-600 hover:bg-red-500"
            >
              {isDeletingCase ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Case
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Left Sidebar - Case List */}
      <div className="w-72 border-r border-gray-800 flex flex-col bg-[#0d0d0d] shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Microscope className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-sm">PathoAI</h1>
              <p className="text-[10px] text-gray-500">Revenue Recovery Engine</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2 h-8 bg-gray-900/50">
              <TabsTrigger value="cases" className="text-xs data-[state=active]:bg-gray-800">
                Cases
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs data-[state=active]:bg-gray-800">
                Analytics
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Search and Filter */}
        {activeTab === "cases" && (
          <div className="p-2 border-b border-gray-800 space-y-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <Input
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-gray-900/50 border-gray-700 text-gray-100 placeholder:text-gray-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex gap-1 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter(null)}
                className={`h-6 px-2 text-[10px] ${!statusFilter ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                All ({cases.length})
              </Button>
              {Object.entries(statusConfig).map(([key, config]) => {
                const count = cases.filter(c => c.status === key).length
                if (count === 0) return null
                return (
                  <Button
                    key={key}
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilter(statusFilter === key ? null : key)}
                    className={`h-6 px-2 text-[10px] ${statusFilter === key ? config.color : 'text-gray-400 hover:text-white'}`}
                  >
                    {config.label} ({count})
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {/* Tabs Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "cases" ? (
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {isLoadingCases ? (
                  <>
                    <CaseSkeleton />
                    <CaseSkeleton />
                    <CaseSkeleton />
                    <CaseSkeleton />
                  </>
                ) : filteredCases.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No cases found</p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-xs text-emerald-400 hover:underline mt-1"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  filteredCases.map((caseItem) => {
                    const status = statusConfig[caseItem.status] || statusConfig.PENDING
                    const StatusIcon = status.icon
                    const isSelected = selectedCase?.slide_id === caseItem.slide_id

                    return (
                      <div
                        key={caseItem.id}
                        className={`group relative rounded-lg transition-all ${isSelected
                          ? "bg-gray-800 border border-gray-700"
                          : "hover:bg-gray-800/50 border border-transparent"
                          }`}
                      >
                        <button
                          onClick={() => {
                            setSelectedCase(caseItem)
                            setClickedRegions(new Set())
                            setSelectedRegion(null)
                          }}
                          className="w-full p-3 text-left"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{caseItem.patient_name}</p>
                              <p className="text-xs text-gray-500 font-mono">{caseItem.slide_id}</p>
                            </div>
                            <Badge variant="outline" className={`${status.color} text-[10px] px-1.5 py-0.5 shrink-0`}>
                              <StatusIcon className="w-2.5 h-2.5 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 truncate">{caseItem.diagnosis}</p>
                          {caseItem.recovery_value > 0 && (
                            <p className="text-xs text-emerald-400 font-mono mt-1">
                              +${caseItem.recovery_value.toFixed(2)} potential
                            </p>
                          )}
                        </button>

                        {/* Context Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-700 transition-opacity">
                              <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#0d0d0d] border-gray-800 text-gray-100">
                            <DropdownMenuItem onClick={() => openEditModal(caseItem)} className="cursor-pointer hover:bg-gray-800">
                              <Pencil className="w-3.5 h-3.5 mr-2" />
                              Edit Case
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-800" />
                            <DropdownMenuItem onClick={() => openDeleteConfirm(caseItem)} className="cursor-pointer text-red-400 hover:bg-red-900/20 hover:text-red-300">
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              Delete Case
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {/* Revenue Summary Cards */}
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-900/30 to-emerald-800/10 border border-emerald-800/30">
                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xs font-medium">Total Recovered</span>
                    </div>
                    <p className="text-2xl font-bold font-mono text-emerald-300">
                      ${revenueSummary?.total_revenue_recovered?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Annual projection: ${revenueSummary?.annual_projection?.toFixed(2) || '0.00'}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-800">
                    <div className="flex items-center gap-2 text-blue-400 mb-1">
                      <Shield className="w-4 h-4" />
                      <span className="text-xs font-medium">Audit Readiness</span>
                    </div>
                    <p className="text-xl font-bold font-mono">
                      {revenueSummary?.average_audit_score?.toFixed(0) || '0'}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {revenueSummary?.cases_audit_ready || 0} cases audit-ready
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-800">
                    <div className="flex items-center gap-2 text-purple-400 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-medium">Efficiency Gain</span>
                    </div>
                    <p className="text-xl font-bold font-mono">
                      {revenueSummary?.efficiency_gain_hours?.toFixed(1) || '0'} hrs
                    </p>
                    <p className="text-xs text-gray-500">
                      {revenueSummary?.total_cases_processed || 0} cases processed
                    </p>
                  </div>
                </div>

                {revenueSummary?.cpt_breakdown && Object.keys(revenueSummary.cpt_breakdown).length > 0 && (
                  <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-800">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-xs font-medium">CPT Upgrades</span>
                    </div>
                    <div className="space-y-1">
                      {Object.entries(revenueSummary.cpt_breakdown).map(([key, count]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="font-mono text-gray-400">{key}</span>
                          <span className="font-mono text-emerald-400">{count} cases</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Add Case Button */}
        <div className="p-3 border-t border-gray-800 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs border-dashed border-gray-700 hover:border-emerald-600 hover:bg-emerald-900/20 hover:text-emerald-400 transition-all"
            onClick={() => setShowAddCaseModal(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add New Case
          </Button>
        </div>
      </div>

      {/* Center - Interactive Slide Viewer */}
      <div className="flex-1 flex flex-col bg-[#0a0a0a] min-w-0">
        {/* Viewer Header */}
        <div className="h-12 border-b border-gray-800 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            {selectedCase && (
              <>
                <h2 className="font-medium text-sm">{selectedCase.slide_id}</h2>
                <Badge variant="outline" className="text-xs bg-gray-900/50">
                  {selectedCase.diagnosis}
                </Badge>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.max(50, zoom - 25))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs font-mono w-12 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.min(200, zoom + 25))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={loadCases}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Slide Viewer with Clickable Regions */}
        <div className="flex-1 relative overflow-hidden bg-black">
          {selectedCase ? (
            <div className="absolute inset-0 flex items-center justify-center" style={{ transform: `scale(${zoom / 100})` }}>
              <div className="relative">
                {/* Check if we have a valid image to display */}
                {selectedCase.image_url ? (
                  <>
                    <img
                      src={
                        selectedCase.image_url.startsWith('/uploads')
                          ? `http://localhost:8000${selectedCase.image_url}`
                          : selectedCase.image_url.startsWith('http')
                            ? selectedCase.image_url
                            : `/${selectedCase.image_url.replace(/^\//, '')}`
                      }
                      alt="Pathology slide"
                      className="max-w-full max-h-full object-contain rounded-lg"
                      style={{ maxHeight: '70vh' }}
                      onError={(e) => {
                        // If image fails to load, show placeholder
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                    {/* Fallback placeholder if image fails to load */}
                    <div className="hidden flex-col items-center justify-center p-12 rounded-xl border-2 border-dashed border-gray-700 bg-gray-900/50">
                      <ImageIcon className="w-16 h-16 text-gray-600 mb-4" />
                      <p className="text-gray-400 font-medium mb-2">Image Failed to Load</p>
                      <p className="text-gray-500 text-sm text-center max-w-xs">
                        The slide image could not be loaded. Please try uploading again.
                      </p>
                    </div>

                    {/* Annotated regions - only show when image is displayed */}
                    {billingAnalysis?.annotated_regions?.map((region) => (
                      <button
                        key={region.id}
                        onClick={() => handleRegionClick(region)}
                        className={`absolute border-2 rounded transition-all cursor-pointer ${clickedRegions.has(region.id)
                          ? 'border-emerald-500 bg-emerald-500/20 shadow-lg shadow-emerald-500/30'
                          : selectedRegion?.id === region.id
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-amber-500/50 bg-amber-500/10 hover:border-amber-400 hover:bg-amber-500/20'
                          }`}
                        style={{
                          left: region.x,
                          top: region.y,
                          width: region.width,
                          height: region.height,
                        }}
                        title={region.label}
                      >
                        <span className="sr-only">{region.label}</span>
                      </button>
                    ))}
                  </>
                ) : (
                  /* No image uploaded - show placeholder */
                  <div className="flex flex-col items-center justify-center p-12 rounded-xl border-2 border-dashed border-gray-700 bg-gray-900/50">
                    <ImageIcon className="w-16 h-16 text-gray-600 mb-4" />
                    <p className="text-gray-400 font-medium mb-2">No Slide Image Uploaded</p>
                    <p className="text-gray-500 text-sm text-center max-w-xs">
                      Upload a slide image to enable AI-powered analysis and billing optimization.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 border-gray-600 text-gray-300 hover:bg-gray-800"
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/*'
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file && selectedCase) {
                            try {
                              const result = await uploadSlideImage(selectedCase.slide_id, file)
                              setCases(prev => prev.map(c =>
                                c.slide_id === selectedCase.slide_id
                                  ? { ...c, image_url: result.image_url }
                                  : c
                              ))
                              setSelectedCase(prev => prev ? { ...prev, image_url: result.image_url } : null)
                            } catch (error) {
                              console.error('Failed to upload image:', error)
                              alert('Failed to upload image. Please try again.')
                            }
                          }
                        }
                        input.click()
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Slide Image
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600">
              <div className="text-center">
                <Microscope className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a case to view</p>
              </div>
            </div>
          )}

          {selectedCase && !billingAnalysis && !isAnalyzing && selectedCase.status === 'PENDING' && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <Button
                onClick={handleAnalyze}
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-900/30"
              >
                <Microscope className="w-4 h-4 mr-2" />
                Analyze with AI
              </Button>
            </div>
          )}

          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Analyzing with Gemini...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Revenue Agent */}
      <div className="w-80 border-l border-gray-800 flex flex-col bg-[#0d0d0d] shrink-0 h-screen">
        <div className="p-4 border-b border-gray-800 flex-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Patient ID</p>
              <p className="font-mono text-sm">{selectedCase?.patient_id || '—'}</p>
            </div>
            {selectedCase && (
              <Badge
                variant="outline"
                className={statusConfig[selectedCase.status]?.color || statusConfig.PENDING.color}
              >
                {statusConfig[selectedCase.status]?.label || 'Pending'}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 space-y-4">
            {isLoadingBilling ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full bg-gray-800" />
                <Skeleton className="h-16 w-full bg-gray-800" />
                <Skeleton className="h-32 w-full bg-gray-800" />
              </div>
            ) : billingAnalysis ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-3">BILLING COMPARISON</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-800">
                      <p className="text-xs text-gray-500 mb-1">Status Quo</p>
                      <p className="text-lg font-mono font-semibold text-gray-400">
                        ${billingAnalysis.base_reimbursement?.toFixed(2) || '72.00'}
                      </p>
                      <p className="text-xs font-mono text-gray-600 mt-1">
                        CPT {billingAnalysis.cpt_codes.base}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-900/30 to-emerald-800/10 border border-emerald-800/30">
                      <p className="text-xs text-emerald-400 mb-1">PathoAI Optimized</p>
                      <p className="text-lg font-mono font-semibold text-emerald-300">
                        ${billingAnalysis.optimized_reimbursement?.toFixed(2) || '90.40'}
                      </p>
                      <p className="text-xs font-mono text-emerald-600 mt-1">
                        CPT {billingAnalysis.cpt_codes.recommended}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 p-2 rounded bg-emerald-900/20 border border-emerald-800/30 text-center">
                    <span className="text-xs text-gray-400">Revenue Delta: </span>
                    <span className="font-mono font-bold text-emerald-400">
                      +${billingAnalysis.revenue_delta.toFixed(2)}
                    </span>
                  </div>
                </div>

                {selectedRegion && (
                  <div className="p-3 rounded-lg bg-blue-900/10 border border-blue-800/30">
                    <h3 className="text-xs font-medium text-blue-400 mb-2">SELECTED FINDING</h3>
                    <p className="text-sm font-medium">{selectedRegion.label}</p>
                    <p className="text-xs text-gray-400 mt-1">{selectedRegion.description}</p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <Badge className="bg-emerald-900/50 text-emerald-400 border-emerald-700">
                        {selectedRegion.cpt_impact}
                      </Badge>
                      {clickedRegions.has(selectedRegion.id) && (
                        <Badge className="bg-blue-900/50 text-blue-400 border-blue-700">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-2">AUDIT NARRATIVE</h3>
                  <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-800 font-mono text-xs text-gray-300 leading-relaxed max-h-32 overflow-y-auto">
                    {billingAnalysis.audit_narrative}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-2">
                    COMPLEXITY INDICATORS ({clickedRegions.size}/{billingAnalysis.annotated_regions?.length || 0} verified)
                  </h3>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto">
                    {billingAnalysis.complexity_indicators.map((indicator, i) => (
                      <div
                        key={i}
                        className={`text-xs p-2 rounded border transition-all ${clickedRegions.has(i + 1)
                          ? 'bg-emerald-900/20 border-emerald-800/50 text-emerald-300'
                          : 'bg-gray-900/50 border-gray-800 text-gray-400'
                          }`}
                      >
                        <span className="mr-2">{clickedRegions.has(i + 1) ? '✓' : '•'}</span>
                        {indicator}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Audit Defense Score</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {billingAnalysis.audit_defense_score}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">AI Confidence</span>
                    <span className="font-mono font-bold text-blue-400">
                      {(billingAnalysis.confidence_score * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ) : selectedCase ? (
              <div className="text-center py-8 text-gray-500">
                <Microscope className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Run AI analysis to see billing recommendations</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 flex-none bg-[#0d0d0d]">
          <Button
            size="lg"
            onClick={isVerified ? handleDownloadPDF : handleVerify}
            disabled={(!canVerify && !isVerified) || isVerifying || isDownloading}
            className={`w-full font-semibold transition-all ${isVerified
              ? 'bg-purple-600 hover:bg-purple-500'
              : canVerify
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                : 'bg-gray-800'
              }`}
          >
            {isVerifying ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Documenting...</>
            ) : isDownloading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating PDF...</>
            ) : isVerified ? (
              <><Download className="mr-2 h-4 w-4" />Download Audit PDF</>
            ) : canVerify ? (
              <><Shield className="mr-2 h-4 w-4" />Verify & Document</>
            ) : (
              <><AlertCircle className="mr-2 h-4 w-4" />Click Region to Verify</>
            )}
          </Button>
          <p className="text-[10px] text-center text-gray-600 mt-2">
            {isVerified ? "Case verified and ready for export" : "Click annotated regions on the slide to verify findings"}
          </p>
        </div>
      </div>
    </div>
  )
}
