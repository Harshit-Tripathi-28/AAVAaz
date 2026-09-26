export interface AuthenticatedUserContext {
  id: string;
  institutionId: string;
  email: string;
  status: string;
  departmentId?: string | null;
  roles: string[];
  permissions: string[];
}

export interface TenantContext {
  id: string;
  code: string;
  name: string;
  status: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserContext;
      tenant?: TenantContext;
      requestId?: string;
    }
  }
}
