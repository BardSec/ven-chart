// POST /api/import — import application data from JSON

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, isAuthError } from '@/lib/permissions'
import { logActivity } from '@/lib/activity-log'
import { EXPORT_SCHEMA_VERSION } from '@/types'
import { ContractStatus } from '@prisma/client'

const VALID_STATUSES = ['ACTIVE', 'UNDER_REVIEW', 'PENDING_RENEWAL', 'NON_RENEWING', 'EXPIRED', 'ARCHIVED']

export async function POST(request: NextRequest) {
  const user = await requireRole('ADMIN')
  if (isAuthError(user)) return user

  const { searchParams } = request.nextUrl
  const dryRun = searchParams.get('dryRun') === 'true'

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const payload = body as Record<string, unknown>
  const errors: string[] = []
  const warnings: string[] = []

  // Schema version check
  if (payload.schemaVersion && payload.schemaVersion !== EXPORT_SCHEMA_VERSION) {
    warnings.push(
      `Schema version mismatch: file is v${payload.schemaVersion}, current is v${EXPORT_SCHEMA_VERSION}. Proceeding with best effort.`
    )
  }

  if (!Array.isArray(payload.vendors)) {
    errors.push('Missing or invalid "vendors" array')
  }
  if (!Array.isArray(payload.contracts)) {
    errors.push('Missing or invalid "contracts" array')
  }

  if (errors.length > 0) {
    return NextResponse.json({ success: false, isDryRun: dryRun, errors, warnings }, { status: 422 })
  }

  const vendors = payload.vendors as Record<string, unknown>[]
  const contracts = payload.contracts as Record<string, unknown>[]
  const attachments = Array.isArray(payload.attachments) ? (payload.attachments as Record<string, unknown>[]) : []

  // Validate vendors
  const validVendors: Record<string, unknown>[] = []
  vendors.forEach((v, i) => {
    if (!v.name || typeof v.name !== 'string') {
      errors.push(`Vendor[${i}]: "name" is required`)
    } else {
      validVendors.push(v)
    }
  })

  // Validate contracts
  const validContracts: Record<string, unknown>[] = []
  contracts.forEach((c, i) => {
    if (!c.productName || typeof c.productName !== 'string') {
      errors.push(`Contract[${i}]: "productName" is required`)
      return
    }
    if (!c.vendorId || typeof c.vendorId !== 'string') {
      errors.push(`Contract[${i}] "${c.productName}": "vendorId" is required`)
      return
    }
    if (c.status && !VALID_STATUSES.includes(c.status as string)) {
      warnings.push(`Contract[${i}] "${c.productName}": unknown status "${c.status}", will default to ACTIVE`)
    }
    validContracts.push(c)
  })

  if (errors.length > 0) {
    return NextResponse.json({ success: false, isDryRun: dryRun, errors, warnings }, { status: 422 })
  }

  // Dry run — return what would happen
  if (dryRun) {
    // Check for potential duplicates
    const existingVendorNames = await prisma.vendor.findMany({
      where: { name: { in: validVendors.map((v) => v.name as string) } },
      select: { name: true },
    })
    const existingNames = new Set(existingVendorNames.map((v) => v.name))
    const duplicateVendors = validVendors.filter((v) => existingNames.has(v.name as string))

    if (duplicateVendors.length > 0) {
      warnings.push(
        `${duplicateVendors.length} vendor(s) with matching names already exist: ${duplicateVendors
          .slice(0, 5)
          .map((v) => v.name)
          .join(', ')}${duplicateVendors.length > 5 ? '...' : ''}. They will be created as new records.`
      )
    }

    return NextResponse.json({
      success: true,
      isDryRun: true,
      counts: {
        vendorsImported: validVendors.length,
        contractsImported: validContracts.length,
        attachmentsImported: attachments.length,
        vendorsSkipped: vendors.length - validVendors.length,
        contractsSkipped: contracts.length - validContracts.length,
      },
      errors,
      warnings,
    })
  }

  // Actual import — use transaction
  const stats = {
    vendorsImported: 0,
    contractsImported: 0,
    attachmentsImported: 0,
    vendorsSkipped: vendors.length - validVendors.length,
    contractsSkipped: contracts.length - validContracts.length,
  }

  // Map old IDs to new IDs (in case IDs conflict)
  const vendorIdMap = new Map<string, string>()

  await prisma.$transaction(async (tx) => {
    // Import vendors
    for (const v of validVendors) {
      const created = await tx.vendor.create({
        data: {
          name: v.name as string,
          primaryContactName: (v.primaryContactName as string) ?? null,
          primaryContactEmail: (v.primaryContactEmail as string) ?? null,
          primaryContactPhone: (v.primaryContactPhone as string) ?? null,
          generalNotes: (v.generalNotes as string) ?? null,
          tags: Array.isArray(v.tags) ? (v.tags as string[]) : [],
          procurementNotes: (v.procurementNotes as string) ?? null,
          supportContactName: (v.supportContactName as string) ?? null,
          supportContactEmail: (v.supportContactEmail as string) ?? null,
          supportContactPhone: (v.supportContactPhone as string) ?? null,
          supportWebsite: (v.supportWebsite as string) ?? null,
          supportNotes: (v.supportNotes as string) ?? null,
          isArchived: (v.isArchived as boolean) ?? false,
        },
      })
      vendorIdMap.set(v.id as string, created.id)
      stats.vendorsImported++
    }

    // Import contracts (remapping vendorId)
    for (const c of validContracts) {
      const newVendorId = vendorIdMap.get(c.vendorId as string) ?? (c.vendorId as string)

      // Verify vendor exists
      const vendorExists = await tx.vendor.findUnique({ where: { id: newVendorId } })
      if (!vendorExists) {
        warnings.push(`Contract "${c.productName}": vendor ID ${newVendorId} not found, skipping`)
        stats.contractsSkipped++
        continue
      }

      const status = VALID_STATUSES.includes(c.status as string)
        ? (c.status as ContractStatus)
        : 'ACTIVE'

      await tx.contract.create({
        data: {
          vendorId: newVendorId,
          productName: c.productName as string,
          description: (c.description as string) ?? null,
          contractType: (c.contractType as string) ?? null,
          billingModel: (c.billingModel as string) ?? null,
          isPerpetual: (c.isPerpetual as boolean) ?? false,
          isAnnual: (c.isAnnual as boolean) ?? false,
          hasSupportAssurance: (c.hasSupportAssurance as boolean) ?? false,
          isSubscription: (c.isSubscription as boolean) ?? false,
          startDate: c.startDate ? new Date(c.startDate as string) : null,
          renewalDate: c.renewalDate ? new Date(c.renewalDate as string) : null,
          noticeDeadline: c.noticeDeadline ? new Date(c.noticeDeadline as string) : null,
          autoRenew: (c.autoRenew as boolean) ?? false,
          cost: c.cost != null ? Number(c.cost) : null,
          totalContractValue: c.totalContractValue != null ? Number(c.totalContractValue) : null,
          fundingSource: (c.fundingSource as string) ?? null,
          budgetCode: (c.budgetCode as string) ?? null,
          procurementMethod: (c.procurementMethod as string) ?? null,
          poNumber: (c.poNumber as string) ?? null,
          invoiceReference: (c.invoiceReference as string) ?? null,
          internalOwner: (c.internalOwner as string) ?? null,
          backupOwner: (c.backupOwner as string) ?? null,
          department: (c.department as string) ?? null,
          status,
          notes: (c.notes as string) ?? null,
          isArchived: (c.isArchived as boolean) ?? false,
          dataPrivacyAgreementOnFile: c.dataPrivacyAgreementOnFile != null ? Boolean(c.dataPrivacyAgreementOnFile) : null,
          studentDataInvolved: c.studentDataInvolved != null ? Boolean(c.studentDataInvolved) : null,
          securityReviewCompleted: c.securityReviewCompleted != null ? Boolean(c.securityReviewCompleted) : null,
          lastSecurityReviewDate: c.lastSecurityReviewDate ? new Date(c.lastSecurityReviewDate as string) : null,
          soc2Available: c.soc2Available != null ? Boolean(c.soc2Available) : null,
          ferpaCopaPrivacyNotes: (c.ferpaCopaPrivacyNotes as string) ?? null,
          breachNotificationTermsNoted:
            c.breachNotificationTermsNoted != null ? Boolean(c.breachNotificationTermsNoted) : null,
        },
      })
      stats.contractsImported++
    }

    // Import attachments (remapping vendor/contract IDs)
    for (const a of attachments) {
      try {
        const parentId = a.parentType === 'vendor'
          ? (vendorIdMap.get(a.parentId as string) ?? (a.parentId as string))
          : (a.parentId as string) // contract IDs from import — best effort

        await tx.attachment.create({
          data: {
            parentType: a.parentType as string,
            parentId,
            title: (a.title as string) || 'Imported Link',
            url: a.url as string,
            fileName: (a.fileName as string) ?? null,
            vendorId: a.parentType === 'vendor' ? parentId : null,
            contractId: a.parentType === 'contract' ? parentId : null,
          },
        })
        stats.attachmentsImported++
      } catch {
        warnings.push(`Attachment "${a.title}" could not be imported (parent may not exist)`)
      }
    }
  })

  await logActivity({
    entityType: 'import',
    action: 'imported',
    user,
    metadata: {
      counts: stats,
      importedAt: new Date().toISOString(),
    },
  })

  return NextResponse.json({
    success: true,
    isDryRun: false,
    counts: stats,
    errors,
    warnings,
  })
}
