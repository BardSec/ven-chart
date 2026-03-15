// GET /api/contracts — list contracts
// POST /api/contracts — create contract

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError, canCreateOrEdit } from '@/lib/permissions'
import { logActivity } from '@/lib/activity-log'
import { contractSchema } from '@/lib/validations'
import { ContractStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  const user = await requireAuth()
  if (isAuthError(user)) return user

  const { searchParams } = request.nextUrl
  const search = searchParams.get('search') ?? ''
  const vendorId = searchParams.get('vendorId')
  const department = searchParams.get('department')
  const internalOwner = searchParams.get('internalOwner')
  const contractType = searchParams.get('contractType')
  const autoRenew = searchParams.get('autoRenew')
  const studentDataInvolved = searchParams.get('studentDataInvolved')
  const isArchived = searchParams.get('isArchived') === 'true'
  const missingOwner = searchParams.get('missingOwner') === 'true'
  const missingRenewalDate = searchParams.get('missingRenewalDate') === 'true'
  const statusParam = searchParams.getAll('status')
  const renewalWindowDays = searchParams.get('renewalWindowDays')

  // Build status filter
  const statusFilter: ContractStatus[] =
    statusParam.length > 0
      ? statusParam.filter((s): s is ContractStatus =>
          ['ACTIVE', 'UNDER_REVIEW', 'PENDING_RENEWAL', 'NON_RENEWING', 'EXPIRED', 'ARCHIVED'].includes(s)
        )
      : []

  const now = new Date()

  const contracts = await prisma.contract.findMany({
    where: {
      isArchived,
      ...(vendorId && { vendorId }),
      ...(department && { department: { contains: department, mode: 'insensitive' } }),
      ...(internalOwner && { internalOwner: { contains: internalOwner, mode: 'insensitive' } }),
      ...(contractType && { contractType }),
      ...(autoRenew !== null && autoRenew !== undefined && { autoRenew: autoRenew === 'true' }),
      ...(studentDataInvolved !== null && studentDataInvolved !== undefined && {
        studentDataInvolved: studentDataInvolved === 'true',
      }),
      ...(statusFilter.length > 0 && { status: { in: statusFilter } }),
      ...(missingOwner && { internalOwner: null }),
      ...(missingRenewalDate && { renewalDate: null }),
      ...(renewalWindowDays && {
        renewalDate: {
          lte: new Date(now.getTime() + parseInt(renewalWindowDays) * 24 * 60 * 60 * 1000),
          gte: now,
        },
      }),
      ...(search && {
        OR: [
          { productName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { internalOwner: { contains: search, mode: 'insensitive' } },
          { department: { contains: search, mode: 'insensitive' } },
          { poNumber: { contains: search, mode: 'insensitive' } },
          { budgetCode: { contains: search, mode: 'insensitive' } },
          { vendor: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    },
    include: {
      vendor: {
        select: { id: true, name: true, tags: true },
      },
    },
    orderBy: [{ renewalDate: 'asc' }, { productName: 'asc' }],
  })

  return NextResponse.json({ data: contracts })
}

export async function POST(request: NextRequest) {
  const user = await requireAuth()
  if (isAuthError(user)) return user

  if (!canCreateOrEdit(user.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
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

  // Verify vendor exists
  const vendor = await prisma.vendor.findUnique({ where: { id: data.vendorId } })
  if (!vendor) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
  }

  const contract = await prisma.contract.create({
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
      status: (data.status as ContractStatus) ?? 'ACTIVE',
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

  await logActivity({
    entityType: 'contract',
    entityId: contract.id,
    entityName: contract.productName,
    action: 'created',
    user,
    afterState: { productName: contract.productName, vendorId: contract.vendorId, status: contract.status },
    vendorId: contract.vendorId,
    contractId: contract.id,
  })

  return NextResponse.json({ data: contract }, { status: 201 })
}
