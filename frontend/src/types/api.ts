export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
    [key: string]: unknown;
  };
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  errorCode: string;
  message: string;
  details?: unknown;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface HealthStatus {
  service: string;
  status: "healthy" | "degraded";
  environment: string;
  uptimeSeconds: number;
  memory: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
  };
  database: {
    status: "connected" | "disconnected" | "unknown";
    healthy: boolean;
  };
}

export interface Institution {
  id: string;
  name: string;
  code: string;
  domain?: string | null;
  type: string;
  status: "ACTIVE" | "SUSPENDED" | "ONBOARDING" | "DECOMMISSIONED";
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  institutionId: string;
  email: string;
  firstName: string;
  lastName: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  departmentId?: string | null;
  roles: string[];
  permissions: string[];
}
