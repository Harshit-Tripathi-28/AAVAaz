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

export interface InstitutionPublic {
  id: string;
  name: string;
  code: string;
  type: string;
  domain?: string | null;
}

export interface AuthenticatedUser {
  id: string;
  institutionId: string;
  email: string;
  firstName: string;
  lastName: string;
  departmentId?: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
}

export interface TenantInfo {
  id: string;
  name: string;
  code: string;
  type: string;
}

export interface AuthResponseData {
  accessToken: string;
  user: AuthenticatedUser;
  institution: TenantInfo;
  roles: string[];
  permissions: string[];
}

export interface AuthMeResponseData {
  user: {
    id: string;
    institutionId: string;
    email: string;
    status: string;
    departmentId?: string | null;
    roles: string[];
    permissions: string[];
  };
  tenant: {
    id: string;
    code: string;
    name: string;
    status: string;
  };
}
