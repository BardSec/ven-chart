// GET /api/contracts/[id]
// PUT /api/contracts/[id]
// DELETE /api/contracts/[id]

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError, canCreateOrEdit, canDelete, canEditRecord } from '@/lib/permissions'
import { logActivity, computeDiff, sanitizeForLog } from '@/lib/activity-log'
import { contractSchema } from '@/lib/validations'
import { ContractStatus } from '@prisma/client'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth()
  if (isAuthError(user)) return user

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: {
      vendor: true,
      attachments: { orderBy: { createdAt: 'desc' } },
      activityLogs: { orderBy: { timestamp: 'desc' }, take: 50 },
    },
  })

  if (!contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }

  return NextResponse.json({ data: contract })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth()
  if (isAuthError(user)) return user

  if (!canCreateOrEdit(user.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const existing = await prisma.contract.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }

  // DEPARTMENT_OWNER scoping
  if (!canEditRecord(user, { department: existing.department, internalOwner: existing.internalOwner })) {
    return NextResponse.json({ error: 'Insufficient permissions for this record' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = contractSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 422 })
  }

  const data = result.data
  const beforeState = sanitizeForLog({ ...existing } as unknown as Record<string, unknown>)

  const contract = await prisma.contract.update({
    where: { id: params.id },
    data: {
      vendorId: data.vendorId,
      productName: data.productName,
      description: data.description ?? null,
      contractType: data.contractType ?? null,
      billingModel: data.billingModel ?? null,
      isPerpetual: data.isPerpetual ?? false,
      isAnnual: data.isAnnual ?? false,
      hasSupportAssurance: data.hasSupportAssurance ?? false,
      isSubscription: data.isSubscription ?? false,
      startDate: data.startDate ? new Date(data.startDate) : null,
      renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
      noticeDeadline: data.noticeDeadline ? new Date(data.noticeDeadline) : null,
      autoRenew: data.autoRenew ?? false,
      cost: data.cost ?? null,
      totalContractValue: data.totalContractValue ?? null,
      licenseCount: data.licenseCount ?? null,
      perLicenseCost: data.perLicenseCost ?? null,
      fundingSource: data.fundingSource ?? null,
      budgetCode: data.budgetCode ?? null,
      procurementMethod: data.procurementMethod ?? null,
      poNumber: data.poNumber ?? null,
      invoiceReference: data.invoiceReference ?? null,
      softwareManager: data.softwareManager ?? null,
      internalOwner: data.internalOwner ?? null,
      backupOwner: data.backupOwner ?? null,
      department: data.department ?? null,
      status: (data.status as ContractStatus) ?? existing.status,
      notes: data.notes ?? null,
      dataPrivacyAgreementOnFile: data.dataPrivacyAgreementOnFile ?? null,
      studentDataInvolved: data.studentDataInvolved ?? null,
      securityReviewCompleted: data.securityReviewCompleted ?? null,
      lastSecurityReviewDate: data.lastSecurityReviewDate ? new Date(data.lastSecurityReviewDate) : null,
      soc2Available: data.soc2Available ?? null,
      ferpaCopaPrivacyNotes: data.ferpaCopaPrivacyNotes ?? null,
      breachNotificationTermsNoted: data.breachNotificationTermsNoted ?? null,
    },
    include: { vendor: { select: { id: true, name: true } } },
  })

  const afterState = sanitizeForLog({ ...contract } as unknown as Record<string, unknown>)
  const { changedFields } = computeDiff(beforeState, afterState)

  // Determine specific action for status changes
  const action = existing.status !== contract.status ? 'status_changed' : 'updated'

  if (changedFields.length > 0) {
    await logActivity({
      entityType: 'contract',
      entityId: contract.id,
      entityName: contract.productName,
      action,
      user,
      beforeState,
      afterState,
      metadata: { changedFields },
      vendorId: contract.vendorId,
      contractId: contract.id,
    })
  }

  return NextResponse.json({ data: contract })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth()
  if (isAuthError(user)) return user

  if (!canDelete(user.role)) {
    return NextResponse.json({ error: 'Insufficient permissions — only Admins can delete contracts' }, { status: 403 })
  }

  const contract = await prisma.contract.findUnique({ where: { id: params.id } })
  if (!contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }

  await logActivity({
    entityType: 'contract',
    entityId: contract.id,
    entityName: contract.productName,
    action: 'deleted',
    user,
    beforeState: { productName: contract.productName, vendorId: contract.vendorId },
    vendorId: contract.vendorId,
  })

  await prisma.contract.delete({ where: { id: params.id } })

  return NextResponse.json({ data: { id: params.id } })
}
