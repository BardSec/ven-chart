// ven-chart shared types

import type { Role, ContractStatus } from '@prisma/client'

export type { Role, ContractStatus }

// =============================================================================
// Vendor Types
// =============================================================================

export interface Vendor {
  id: string
  name: string
  primaryContactName: string | null
  primaryContactEmail: string | null
  primaryContactPhone: string | null
  generalNotes: string | null
  tags: string[]
  procurementNotes: string | null
  supportContactName: string | null
  supportContactEmail: string | null
  supportContactPhone: string | null
  supportWebsite: string | null
  supportNotes: string | null
  isArchived: boolean
  createdAt: string
  updatedAt: string
  // Computed / joined
  _count?: { contracts: number }
  contracts?: Contract[]
}

export interface VendorWithStats extends Vendor {
  activeContractCount: number
  nearestRenewal: string | null
  nearestRenewalDays: number | null
}

// =============================================================================
// Contract Types
// =============================================================================

export interface Contract {
  id: string
  vendorId: string
  productName: string
  description: string | null
  contractType: string | null
  billingModel: string | null
  isPerpetual: boolean
  isAnnual: boolean
  hasSupportAssurance: boolean
  isSubscription: boolean
  startDate: string | null
  renewalDate: string | null
  noticeDeadline: string | null
  autoRenew: boolean
  cost: number | null
  totalContractValue: number | null
  licenseCount: number | null
  perLicenseCost: number | null
  fundingSource: string | null
  budgetCode: string | null
  procurementMethod: string | null
  poNumber: string | null
  invoiceReference: string | null
  softwareManager: string | null
  internalOwner: string | null
  backupOwner: string | null
  department: string | null
  status: ContractStatus
  notes: string | null
  isArchived: boolean
  // Compliance
  dataPrivacyAgreementOnFile: boolean | null
  studentDataInvolved: boolean | null
  securityReviewCompleted: boolean | null
  lastSecurityReviewDate: string | null
  soc2Available: boolean | null
  ferpaCopaPrivacyNotes: string | null
  breachNotificationTermsNoted: boolean | null
  createdAt: string
  updatedAt: string
  // Joined
  vendor?: Vendor
}

// =============================================================================
// Renewal / Urgency Types
// =============================================================================

export type UrgencyLevel = 'overdue' | 'critical' | 'warning' | 'ok' | 'unknown'

export interface RenewalItem {
  contract: Contract
  vendor: Vendor
  daysUntilRenewal: number | null
  daysUntilNotice: number | null
  urgency: UrgencyLevel
}

// =============================================================================
// Attachment Types
// =============================================================================

export interface Attachment {
  id: string
  parentType: 'vendor' | 'contract'
  parentId: string
  title: string
  url: string
  fileName: string | null
  fileSize: number | null
  mimeType: string | null
  createdAt: string
}

// =============================================================================
// Activity Log Types
// =============================================================================

export interface ActivityLogEntry {
  id: string
  entityType: string
  entityId: string | null
  entityName: string | null
  userId: string | null
  userEmail: string | null
  userName: string | null
  action: string
  beforeState: Record<string, unknown> | null
  afterState: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  timestamp: string
}

// =============================================================================
// User Types
// =============================================================================

export interface AppUser {
  id: string
  email: string
  name: string | null
  image: string | null
  role: Role
  department: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// =============================================================================
// Dashboard Types
// =============================================================================

export interface DashboardStats {
  renewalsDue30: number
  renewalsDue90: number
  overdueRenewals: number
  missingOwner: number
  missingRenewalDate: number
  missingNoticeDeadline: number
  autoRenewWithoutNotice: number
  recentlyUpdated: Array<{
    type: 'vendor' | 'contract'
    id: string
    name: string
    updatedAt: string
  }>
  totalVendors: number
  totalActiveContracts: number
  totalAnnualValue: number
}

// =============================================================================
// Import/Export Types
// =============================================================================

export const EXPORT_SCHEMA_VERSION = '1.0'

export interface ExportPayload {
  schemaVersion: string
  exportedAt: string
  exportedBy: string | null
  counts: {
    vendors: number
    contracts: number
    attachments: number
  }
  vendors: Vendor[]
  contracts: Contract[]
  attachments: Attachment[]
}

export interface ImportResult {
  success: boolean
  isDryRun: boolean
  counts: {
    vendorsImported: number
    contractsImported: number
    attachmentsImported: number
    vendorsSkipped: number
    contractsSkipped: number
  }
  errors: string[]
  warnings: string[]
}

// =============================================================================
// Filter / Query Types
// =============================================================================

export interface VendorFilters {
  search?: string
  tags?: string[]
  isArchived?: boolean
}

export interface ContractFilters {
  search?: string
  vendorId?: string
  status?: ContractStatus[]
  department?: string
  internalOwner?: string
  contractType?: string
  autoRenew?: boolean
  studentDataInvolved?: boolean
  renewalWindowDays?: number
  missingOwner?: boolean
  missingRenewalDate?: boolean
  isArchived?: boolean
}

// =============================================================================
// API Response Wrappers
// =============================================================================

export interface ApiResponse<T> {
  data: T
  error?: never
}

export interface ApiError {
  error: string
  details?: unknown
  data?: never
}

export type ApiResult<T> = ApiResponse<T> | ApiError

// Contract type / billing option labels
export const CONTRACT_TYPES = [
  { value: 'software_license', label: 'Software License' },
  { value: 'saas_subscription', label: 'SaaS Subscription' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'hardware_maintenance', label: 'Hardware / Maintenance' },
  { value: 'support_only', label: 'Support Only' },
  { value: 'other', label: 'Other' },
] as const

export const BILLING_MODELS = [
  { value: 'annual', label: 'Annual' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'multi_year', label: 'Multi-Year' },
  { value: 'one_time', label: 'One-Time' },
] as const

export const PROCUREMENT_METHODS = [
  { value: 'bid', label: 'Competitive Bid' },
  { value: 'sole_source', label: 'Sole Source' },
  { value: 'cooperative_contract', label: 'Cooperative Contract' },
  { value: 'piggyback', label: 'Piggyback' },
  { value: 'direct_purchase', label: 'Direct Purchase' },
  { value: 'state_contract', label: 'State Contract' },
] as const

export const FUNDING_SOURCES = [
  'General Fund',
  'Title I',
  'Title II',
  'Title III',
  'Title IV',
  'IDEA',
  'ESSER',
  'E-Rate',
  'Grant',
  'Capital',
  'Other',
] as const

export const DEPARTMENTS = [
  'Technology - Operations',
  'Technology - Instructional',
  'Curriculum & Instruction',
  'Human Resources',
  'Finance',
  'Facilities & Safety',
  'Library/Media',
  'Special Education',
  'Transportation',
  'Food Service',
  'Athletics',
  'Administration',
  'Other',
] as const

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  ACTIVE: 'Active',
  UNDER_REVIEW: 'Under Review',
  PENDING_RENEWAL: 'Pending Renewal',
  NON_RENEWING: 'Non-Renewing',
  EXPIRED: 'Expired',
  ARCHIVED: 'Archived',
}
