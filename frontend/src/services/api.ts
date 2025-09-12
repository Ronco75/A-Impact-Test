// API service for business licensing requirements
const API_BASE_URL = 'http://localhost:3001';

export interface BusinessProfile {
  businessType: string;
  floorArea: number;
  seatingCapacity: number;
  services: {
    alcoholService: boolean;
    deliveryService: boolean;
    liveMusic: boolean;
    outdoorSeating: boolean;
  };
  kitchenFeatures: {
    gasUsage: boolean;
    meatHandling: boolean;
  };
  operationalHours: {
    lateNightOperation: boolean;
  };
}

export interface RequirementSummary {
  totalRequirements: number;
  mandatoryRequirements: number;
  conditionalRequirements: number;
  authoritiesCovered: string[];
}

export interface Requirement {
  requirementId: string;
  title: string;
  description: string;
  authority: string;
  category: string;
  mandatory: boolean;
  conditions: string[];
  applicabilityReason: string;
}

export interface RequirementsResponse {
  success: boolean;
  data: {
    businessMatch: boolean;
    summary: RequirementSummary;
    applicableRequirements: Requirement[];
    recommendations: string[];
  };
  timestamp: string;
}

export interface ReportSection {
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
}

export interface GeneratedReport {
  title: string;
  summary: string;
  sections: ReportSection[];
  recommendations: string[];
  totalEstimatedCost: string;
  estimatedTimeframe: string;
  metadata: {
    generatedAt: string;
    businessProfile: BusinessProfile;
    requirementsSummary: RequirementSummary;
    generatedBy: string;
  };
}

export interface ReportResponse {
  success: boolean;
  data: {
    report: GeneratedReport;
    rawRequirements: RequirementsResponse['data'];
  };
  timestamp: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async generateReport(businessProfile: BusinessProfile): Promise<ReportResponse> {
    const response = await fetch(`${this.baseUrl}/api/generate-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(businessProfile),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate report');
    }

    return response.json();
  }

  async getRequirements(businessProfile: BusinessProfile): Promise<RequirementsResponse> {
    const response = await fetch(`${this.baseUrl}/api/requirements/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(businessProfile),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch requirements');
    }

    return response.json();
  }

  async getBusinessTypes() {
    const response = await fetch(`${this.baseUrl}/api/business-types`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch business types');
    }

    return response.json();
  }
}

export const apiService = new ApiService();
export default apiService;