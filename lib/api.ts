/**
 * PathoAI API Client
 * Frontend integration with FastAPI backend for billing analysis and PDF generation.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface AnalyzeRequest {
    slide_id: string;
    image_path?: string;
    findings?: Record<string, unknown>;
}

export interface BillingAnalysis {
    slide_id: string;
    base_cpt: string;
    recommended_cpt: string;
    revenue_delta: number;
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
}

export interface DocumentRequest {
    slide_id: string;
    pathologist_name: string;
    verified_cpt_codes: string[];
    complexity_indicators_clicked: string[];
    billing_data?: BillingAnalysis;
}

export interface DocumentResponse {
    status: string;
    record: {
        slide_id: string;
        pathologist_name: string;
        verified_cpt_codes: string[];
        complexity_indicators: string[];
        timestamp: string;
    };
}

/**
 * Analyze a slide using Gemini 3 Pro for billing recommendations.
 */
export async function analyzeSlide(request: AnalyzeRequest): Promise<BillingAnalysis> {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Analysis failed');
    }

    return response.json();
}

/**
 * Document pathologist verification for a slide.
 */
export async function documentVerification(request: DocumentRequest): Promise<DocumentResponse> {
    const response = await fetch(`${API_BASE_URL}/api/document`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Documentation failed');
    }

    return response.json();
}

/**
 * Download the Audit Shield PDF for a slide.
 */
export async function downloadAuditPDF(slideId: string): Promise<void> {
    console.log('[API] Downloading PDF for slide:', slideId);

    const response = await fetch(`${API_BASE_URL}/api/export-pdf?slide_id=${encodeURIComponent(slideId)}`);

    console.log('[API] PDF response status:', response.status);
    console.log('[API] PDF response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
        let errorDetail = 'PDF generation failed';
        try {
            const error = await response.json();
            errorDetail = error.detail || errorDetail;
        } catch {
            // Response might not be JSON
        }
        throw new Error(errorDetail);
    }

    // Create blob and trigger download
    const blob = await response.blob();
    console.log('[API] PDF blob size:', blob.size, 'type:', blob.type);

    if (blob.size === 0) {
        throw new Error('PDF file is empty');
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_shield_${slideId}_${new Date().toISOString().slice(0, 10)}.pdf`;
    link.style.display = 'none';
    document.body.appendChild(link);

    // Trigger download
    link.click();

    // Cleanup after a short delay to ensure download starts
    setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
    }, 100);

    console.log('[API] PDF download triggered successfully');
}

/**
 * Get all documented cases from the local database.
 */
export async function getDocumentedCases(): Promise<DocumentResponse['record'][]> {
    const response = await fetch(`${API_BASE_URL}/api/cases`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch cases');
    }

    return response.json();
}
