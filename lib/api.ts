/**
 * PathoAI API Client v2.0
 * Frontend integration with FastAPI backend for billing analysis, 
 * interactive viewer, and revenue analytics.
 */

// SHARK DEBUG: Force Production URL for local testing
export const API_BASE_URL = 'https://patho-production.up.railway.app';
// const isProd = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
// const API_BASE_URL = isProd
//     ? 'https://patho-production.up.railway.app'
//     : 'http://localhost:8000';

console.log("SHARK DEBUG: Currently using API:", API_BASE_URL);

// ===== Types =====

export interface Case {
    id: number;
    patient_id: string;
    patient_name: string;
    slide_id: string;
    diagnosis: string;
    status: 'PENDING' | 'ANALYZED' | 'VERIFIED' | 'EXPORTED';
    image_url: string;
    base_cpt: string;
    suggested_cpt: string | null;
    recovery_value: number;
    confidence_score: number;
    created_at: string;
}

export interface CaseDetail extends Case {
    finding_type: string;
    complexity_indicators: string[];
    ai_assisted_code: string;
    ancillary_codes: string[];
    base_reimbursement: number;
    optimized_reimbursement: number;
    justification_text: string;
    audit_defense_score: number;
    annotated_regions: AnnotatedRegion[];
    verified_by: string | null;
    verified_at: string | null;
    audit_log: AuditLogEntry[];
}

export interface AnnotatedRegion {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    description: string;
    cpt_impact: string;
    billable: boolean;
}

export interface AuditLogEntry {
    action: string;
    timestamp: string;
    user?: string;
    details: string;
}

export interface BillingAnalysis {
    slide_id: string;
    base_cpt: string;
    recommended_cpt: string;
    revenue_delta: number;
    base_reimbursement: number;
    optimized_reimbursement: number;
    cpt_codes: {
        base: string;
        recommended: string;
        ai_assisted: string;
        ancillary: string[];
    };
    audit_narrative: string;
    complexity_indicators: string[];
    confidence_score: number;
    audit_defense_score: number;
    model_used: string;
    annotated_regions: AnnotatedRegion[];
}

export interface RevenueSummary {
    total_cases_processed: number;
    total_revenue_recovered: number;
    average_recovery_per_case: number;
    average_audit_score: number;
    cases_audit_ready: number;
    efficiency_gain_hours: number;
    cpt_breakdown: Record<string, number>;
    annual_projection: number;
    efficiency_message: string;
}

export interface CreateCaseRequest {
    patient_id: string;
    patient_name?: string;
    diagnosis?: string;
    slide_id?: string;
}

// ===== Case Management =====

/**
 * Fetch all cases from the database.
 */
export async function getCases(status?: string): Promise<Case[]> {
    const url = status
        ? `${API_BASE_URL}/api/cases?status=${status}`
        : `${API_BASE_URL}/api/cases`;

    const response = await fetch(url);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch cases');
    }
    return response.json();
}

/**
 * Fetch a single case with full details.
 */
export async function getCaseDetail(slideId: string): Promise<CaseDetail> {
    const response = await fetch(`${API_BASE_URL}/api/cases/${encodeURIComponent(slideId)}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch case');
    }
    return response.json();
}

/**
 * Create a new case.
 */
export async function createCase(request: CreateCaseRequest): Promise<{ case_id: number; slide_id: string }> {
    const response = await fetch(`${API_BASE_URL}/api/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create case');
    }
    return response.json();
}

/**
 * Delete a case by slide ID.
 */
export async function deleteCase(slideId: string): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE_URL}/api/cases/${encodeURIComponent(slideId)}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete case');
    }
    return response.json();
}

/**
 * Update case information.
 */
export async function updateCase(slideId: string, data: {
    patient_name?: string;
    diagnosis?: string;
    patient_id?: string;
}): Promise<{ status: string; slide_id: string }> {
    const response = await fetch(`${API_BASE_URL}/api/cases/${encodeURIComponent(slideId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update case');
    }
    return response.json();
}

/**
 * Upload a slide image for a case.
 */
export async function uploadSlideImage(slideId: string, file: File): Promise<{ status: string; image_url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/cases/${encodeURIComponent(slideId)}/upload-image`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to upload image');
    }
    return response.json();
}

// ===== AI Analysis =====

/**
 * Analyze a slide using Gemini for billing recommendations.
 */
export async function analyzeSlide(slideId: string): Promise<BillingAnalysis> {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slide_id: slideId }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Analysis failed');
    }

    return response.json();
}

// ===== Interactive Viewer =====

/**
 * Log a region click event for audit trail.
 */
export async function logRegionClick(slideId: string, regionLabel: string): Promise<{ region: AnnotatedRegion | null }> {
    const response = await fetch(`${API_BASE_URL}/api/region-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            slide_id: slideId,
            region_label: regionLabel,
            user: 'pathologist'
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to log region click');
    }

    return response.json();
}

// ===== Verification =====

export interface DocumentRequest {
    slide_id: string;
    pathologist_name: string;
    verified_cpt_codes: string[];
    complexity_indicators_clicked: string[];
    billing_data?: BillingAnalysis;
}

/**
 * Document pathologist verification for a slide.
 */
export async function documentVerification(request: DocumentRequest): Promise<{ status: string; case_id: number }> {
    const response = await fetch(`${API_BASE_URL}/api/document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Documentation failed');
    }

    return response.json();
}

// ===== Revenue Analytics =====

/**
 * Get revenue summary for the Money View dashboard.
 * Renamed to performance-metrics to avoid ad-blockers.
 */
export async function getRevenueSummary(): Promise<RevenueSummary> {
    const response = await fetch(`${API_BASE_URL}/api/performance-metrics`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch revenue summary');
    }

    return response.json();
}

// ===== PDF Export =====

/**
 * Download the Audit Shield PDF for a slide.
 * Uses direct link method to maintain "User Activation" chain for 2026 browsers.
 * This bypasses fetch+blob which breaks activation and causes download blocks.
 */
export function downloadAuditPDF(slideId: string): void {
    console.log('[API] Triggering Direct Download for:', slideId);

    const pdfUrl = `${API_BASE_URL}/api/export-pdf?slide_id=${encodeURIComponent(slideId)}`;

    // Create a hidden anchor tag and click it immediately.
    // This maintains the "User Activation" chain and triggers the browser's 
    // native download manager without manually handling blobs.
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `audit_shield_${slideId}.pdf`;
    link.target = '_self'; // Prevents opening a useless blank tab

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('[API] Direct download link triggered.');
}
