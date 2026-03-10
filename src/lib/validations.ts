// Zod validation schemas

import { z } from 'zod'

// =============================================================================
// Vendor schema
// =============================================================================

export const vendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required').max(200),
  primaryContactName: z.string().max(200).nullable().optional(),
  primaryContactEmail: z.string().email('Invalid email').max(254).nullable().optional().or(z.literal('')),
  primaryContactPhone: z.string().max(30).nullable().optional(),
  generalNotes: z.string().max(10000).nullable().optional(),
  tags: z.array(z.string().max(100)).max(20).optional().default([]),
  procurementNotes: z.string().max(10000).nullable().optional(),
  supportContactName: z.string().max(200).nullable().optional(),
  supportContactEmail: z.string().email('Invalid email').max(254).nullable().optional().or(z.literal('')),
  supportContactPhone: z.string().max(30).nullable().optional(),
  supportWebsite: z.string().url('Invalid URL').max(500).nullable().optional().or(z.literal('')),
  supportNotes: z.string().max(10000).nullable().optional(),
  isArchived: z.boolean().optional().default(false),
})

export type VendorFormData = z.infer<typeof vendorSchema>

// =============================================================================
// Contract schema
// =============================================================================

export const contractSchema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  productName: z.string().min(1, 'Product/service name is required').max(300),
  description: z.string().max(10000).nullable().optional(),
  contractType: z.string().max(100).nullable().optional(),
  billingModel: z.string().max(100).nullable().optional(),
  isPerpetual: z.boolean().optional().default(false),
  isAnnual: z.boolean().optional().default(false),
  hasSupportAssurance: z.boolean().optional().default(false),
  isSubscription: z.boolean().optional().default(false),
  startDate: z.string().nullable().optional(),
  renewalDate: z.string().nullable().optional(),
  noticeDeadline: z.string().nullable().optional(),
  autoRenew: z.boolean().optional().default(false),
  cost: z.number().min(0).max(999999999).nullable().optional(),
  totalContractValue: z.number().min(0).max(999999999).nullable().optional(),
  fundingSource: z.string().max(200).nullable().optional(),
  budgetCode: z.string().max(100).nullable().optional(),
  procurementMethod: z.string().max(100).nullable().optional(),
  poNumber: z.string().max(100).nullable().optional(),
  invoiceReference: z.string().max(200).nullable().optional(),
  internalOwner: z.string().max(200).nullable().optional(),
  backupOwner: z.string().max(200).nullable().optional(),
  department: z.string().max(200).nullable().optional(),
  status: z.enum(['ACTIVE', 'UNDER_REVIEW', 'PENDING_RENEWAL', 'NON_RENEWING', 'EXPIRED', 'ARCHIVED']).optional().default('ACTIVE'),
  notes: z.string().max(10000).nullable().optional(),
  isArchived: z.boolean().optional().default(false),
  // Compliance fields
  dataPrivacyAgreementOnFile: z.boolean().nullable().optional(),
  studentDataInvolved: z.boolean().nullable().optional(),
  securityReviewCompleted: z.boolean().nullable().optional(),
  lastSecurityReviewDate: z.string().nullable().optional(),
  soc2Available: z.boolean().nullable().optional(),
  ferpaCopaPrivacyNotes: z.string().max(5000).nullable().optional(),
  breachNotificationTermsNoted: z.boolean().nullable().optional(),
})

export type ContractFormData = z.infer<typeof contractSchema>

// =============================================================================
// Attachment schema
// =============================================================================

export const attachmentSchema = z.object({
  parentType: z.enum(['vendor', 'contract']),
  parentId: z.string().min(1),
  title: z.string().min(1, 'Title is required').max(300),
  url: z.string().url('Must be a valid URL').max(2000),
  fileName: z.string().max(500).nullable().optional(),
})

export type AttachmentFormData = z.infer<typeof attachmentSchema>

// =============================================================================
// User schema
// =============================================================================

export const userUpdateSchema = z.object({
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER', 'DEPARTMENT_OWNER']),
  department: z.string().max(200).nullable().optional(),
  isActive: z.boolean().optional(),
})

export type UserUpdateData = z.infer<typeof userUpdateSchema>

// =============================================================================
// Import schema
// =============================================================================

export const importOptionsSchema = z.object({
  dryRun: z.boolean().optional().default(false),
  overwriteExisting: z.boolean().optional().default(false),
})

export type ImportOptions = z.infer<typeof importOptionsSchema>
