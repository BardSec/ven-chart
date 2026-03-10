// Seed data for ven-chart
// Run with: npm run db:seed

import { PrismaClient, ContractStatus, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Seed demo vendors
  const vendors = await Promise.all([
    prisma.vendor.upsert({
      where: { id: 'vendor-1' },
      update: {},
      create: {
        id: 'vendor-1',
        name: 'Frontline Education',
        primaryContactName: 'Sarah Mitchell',
        primaryContactEmail: 'smitchell@frontlineeducation.com',
        primaryContactPhone: '800-555-0101',
        generalNotes: 'Primary HR and payroll platform. Long-standing relationship with district.',
        tags: ['HR', 'Payroll', 'Recruiting', 'Professional Development'],
        procurementNotes: 'Under state cooperative contract. Renewal requires 90-day written notice.',
        supportContactName: 'Frontline Support',
        supportContactEmail: 'support@frontlineeducation.com',
        supportContactPhone: '800-555-0102',
        supportWebsite: 'https://support.frontlineeducation.com',
        supportNotes: 'Submit tickets via portal. Critical issues use phone line.',
      },
    }),

    prisma.vendor.upsert({
      where: { id: 'vendor-2' },
      update: {},
      create: {
        id: 'vendor-2',
        name: 'PowerSchool Group',
        primaryContactName: 'James Thornton',
        primaryContactEmail: 'jthornton@powerschool.com',
        primaryContactPhone: '800-555-0201',
        generalNotes: 'Student Information System. Critical district infrastructure.',
        tags: ['SIS', 'Student Data', 'Grades', 'Attendance', 'Scheduling'],
        procurementNotes: 'Direct contract. State contract pricing available but not currently used.',
        supportContactName: 'PowerSchool Support',
        supportContactEmail: 'support@powerschool.com',
        supportContactPhone: '800-555-0202',
        supportWebsite: 'https://support.powerschool.com',
        supportNotes: 'Priority support tier included in current contract.',
      },
    }),

    prisma.vendor.upsert({
      where: { id: 'vendor-3' },
      update: {},
      create: {
        id: 'vendor-3',
        name: 'Clever Inc.',
        primaryContactName: 'Amanda Rivera',
        primaryContactEmail: 'arivera@clever.com',
        primaryContactPhone: '800-555-0301',
        generalNotes: 'Single sign-on platform for student applications. Core to classroom workflow.',
        tags: ['SSO', 'EdTech', 'Student Data', 'Rostering'],
        procurementNotes: 'Annual subscription. Free tier previously used; now on paid district plan.',
        supportContactName: 'Clever Support',
        supportContactEmail: 'support@clever.com',
        supportWebsite: 'https://support.clever.com',
        supportNotes: 'Documentation and self-service portal preferred.',
      },
    }),

    prisma.vendor.upsert({
      where: { id: 'vendor-4' },
      update: {},
      create: {
        id: 'vendor-4',
        name: 'Curriculum Associates',
        primaryContactName: 'David Park',
        primaryContactEmail: 'dpark@cainc.com',
        primaryContactPhone: '800-555-0401',
        generalNotes: 'i-Ready reading and math diagnostics and instruction. Used K-8.',
        tags: ['Curriculum', 'Assessment', 'Student Data', 'Reading', 'Math'],
        procurementNotes: 'Annual per-pupil subscription. Pricing tied to enrollment. Review enrollment annually before renewal.',
        supportContactName: 'i-Ready Support',
        supportContactEmail: 'support@cainc.com',
        supportContactPhone: '800-555-0402',
        supportWebsite: 'https://iready.com/support',
      },
    }),

    prisma.vendor.upsert({
      where: { id: 'vendor-5' },
      update: {},
      create: {
        id: 'vendor-5',
        name: 'Destiny Solutions (Follett)',
        primaryContactName: 'Patricia Nguyen',
        primaryContactEmail: 'pnguyen@follett.com',
        primaryContactPhone: '800-555-0501',
        generalNotes: 'Library management system used across all buildings.',
        tags: ['Library', 'Media Center'],
        procurementNotes: 'Multi-site license. Check with library director before any changes.',
        supportContactName: 'Follett Support',
        supportContactEmail: 'support@follett.com',
        supportContactPhone: '800-555-0502',
        supportWebsite: 'https://www.follett.com/support',
      },
    }),

    prisma.vendor.upsert({
      where: { id: 'vendor-6' },
      update: {},
      create: {
        id: 'vendor-6',
        name: 'Zoom Video Communications',
        primaryContactName: 'Enterprise Sales',
        primaryContactEmail: 'enterprise@zoom.us',
        primaryContactPhone: '888-555-0601',
        generalNotes: 'Video conferencing. Used for staff meetings, professional development, and parent communication.',
        tags: ['Communications', 'Video Conferencing'],
        procurementNotes: 'Education pricing. Annual billing. Review usage annually.',
        supportContactName: 'Zoom Support',
        supportContactEmail: 'support@zoom.us',
        supportWebsite: 'https://support.zoom.us',
      },
    }),

    prisma.vendor.upsert({
      where: { id: 'vendor-7' },
      update: {},
      create: {
        id: 'vendor-7',
        name: 'Raptor Technologies',
        primaryContactName: 'Kevin Walsh',
        primaryContactEmail: 'kwalsh@raptortech.com',
        primaryContactPhone: '800-555-0701',
        generalNotes: 'Visitor management and volunteer management system.',
        tags: ['Safety', 'Visitor Management', 'Security'],
        procurementNotes: 'Annual subscription. Per-building pricing. Coordinate with facilities and safety director.',
        supportContactName: 'Raptor Support',
        supportContactEmail: 'support@raptortech.com',
        supportContactPhone: '800-555-0702',
        supportWebsite: 'https://support.raptortech.com',
      },
    }),
  ])

  console.log(`Created ${vendors.length} vendors`)

  // Seed contracts
  const now = new Date()
  const daysFromNow = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000)

  const contracts = await Promise.all([
    // Frontline Education contracts
    prisma.contract.upsert({
      where: { id: 'contract-1' },
      update: {},
      create: {
        id: 'contract-1',
        vendorId: 'vendor-1',
        productName: 'Frontline HR & Payroll',
        description: 'Full HR management, payroll processing, and benefits administration platform.',
        contractType: 'saas_subscription',
        billingModel: 'annual',
        isAnnual: true,
        isSubscription: true,
        startDate: new Date('2024-07-01'),
        renewalDate: daysFromNow(22), // Due soon
        noticeDeadline: daysFromNow(-8), // Notice deadline ALREADY PASSED
        autoRenew: false,
        cost: 48500,
        totalContractValue: 48500,
        fundingSource: 'General Fund',
        budgetCode: 'HR-001',
        procurementMethod: 'state_contract',
        poNumber: 'PO-2024-0892',
        internalOwner: 'Jennifer Costa',
        backupOwner: 'Mike Brennan',
        department: 'Human Resources',
        status: ContractStatus.PENDING_RENEWAL,
        notes: 'URGENT: Notice deadline has passed. Contact vendor to discuss options. Auto-renew was intentionally off.',
        studentDataInvolved: false,
        dataPrivacyAgreementOnFile: true,
        securityReviewCompleted: true,
        lastSecurityReviewDate: new Date('2024-01-15'),
        soc2Available: true,
      },
    }),

    prisma.contract.upsert({
      where: { id: 'contract-2' },
      update: {},
      create: {
        id: 'contract-2',
        vendorId: 'vendor-1',
        productName: 'Frontline Professional Growth',
        description: 'Professional development tracking, observations, and evaluation platform.',
        contractType: 'saas_subscription',
        billingModel: 'annual',
        isAnnual: true,
        isSubscription: true,
        startDate: new Date('2024-08-01'),
        renewalDate: daysFromNow(85),
        noticeDeadline: daysFromNow(55),
        autoRenew: true,
        cost: 12200,
        fundingSource: 'General Fund',
        budgetCode: 'HR-002',
        procurementMethod: 'state_contract',
        poNumber: 'PO-2024-0893',
        internalOwner: 'Jennifer Costa',
        department: 'Human Resources',
        status: ContractStatus.ACTIVE,
        studentDataInvolved: false,
        dataPrivacyAgreementOnFile: true,
        securityReviewCompleted: true,
        soc2Available: true,
      },
    }),

    // PowerSchool
    prisma.contract.upsert({
      where: { id: 'contract-3' },
      update: {},
      create: {
        id: 'contract-3',
        vendorId: 'vendor-2',
        productName: 'PowerSchool SIS',
        description: 'Student Information System — core enrollment, attendance, grades, scheduling.',
        contractType: 'saas_subscription',
        billingModel: 'annual',
        isAnnual: true,
        isSubscription: true,
        startDate: new Date('2024-07-01'),
        renewalDate: daysFromNow(120),
        noticeDeadline: daysFromNow(90),
        autoRenew: false,
        cost: 72000,
        totalContractValue: 72000,
        fundingSource: 'General Fund',
        budgetCode: 'TECH-001',
        procurementMethod: 'direct_purchase',
        poNumber: 'PO-2024-0712',
        internalOwner: 'Tom Aldrich',
        backupOwner: 'Lisa Reyes',
        department: 'Technology',
        status: ContractStatus.ACTIVE,
        notes: 'Critical system. Renewal decision needs superintendent approval. Begin review at 120 days.',
        studentDataInvolved: true,
        dataPrivacyAgreementOnFile: true,
        securityReviewCompleted: true,
        lastSecurityReviewDate: new Date('2024-03-01'),
        soc2Available: true,
        breachNotificationTermsNoted: true,
      },
    }),

    // Clever
    prisma.contract.upsert({
      where: { id: 'contract-4' },
      update: {},
      create: {
        id: 'contract-4',
        vendorId: 'vendor-3',
        productName: 'Clever District Plan',
        description: 'Single sign-on and rostering for all student-facing applications.',
        contractType: 'saas_subscription',
        billingModel: 'annual',
        isAnnual: true,
        isSubscription: true,
        startDate: new Date('2024-09-01'),
        renewalDate: daysFromNow(175),
        noticeDeadline: daysFromNow(145),
        autoRenew: true,
        cost: 8400,
        fundingSource: 'General Fund',
        budgetCode: 'TECH-002',
        procurementMethod: 'direct_purchase',
        poNumber: 'PO-2024-0445',
        internalOwner: 'Tom Aldrich',
        department: 'Technology',
        status: ContractStatus.ACTIVE,
        studentDataInvolved: true,
        dataPrivacyAgreementOnFile: true,
        securityReviewCompleted: true,
        soc2Available: false,
        breachNotificationTermsNoted: true,
      },
    }),

    // Curriculum Associates i-Ready
    prisma.contract.upsert({
      where: { id: 'contract-5' },
      update: {},
      create: {
        id: 'contract-5',
        vendorId: 'vendor-4',
        productName: 'i-Ready Reading & Math',
        description: 'Adaptive diagnostic and instructional program for grades K-8.',
        contractType: 'saas_subscription',
        billingModel: 'annual',
        isAnnual: true,
        isSubscription: true,
        startDate: new Date('2024-08-01'),
        renewalDate: daysFromNow(45),
        noticeDeadline: daysFromNow(15),
        autoRenew: false,
        cost: 31500,
        totalContractValue: 31500,
        fundingSource: 'Title I',
        budgetCode: 'TITLE1-003',
        procurementMethod: 'cooperative_contract',
        poNumber: 'PO-2024-0651',
        internalOwner: 'Rachel Burns',
        backupOwner: 'Tom Aldrich',
        department: 'Curriculum & Instruction',
        status: ContractStatus.PENDING_RENEWAL,
        notes: 'Verify enrollment count before renewal. Last year we overpaid by ~200 seats.',
        studentDataInvolved: true,
        dataPrivacyAgreementOnFile: true,
        securityReviewCompleted: false, // Missing security review
        soc2Available: true,
        breachNotificationTermsNoted: false,
      },
    }),

    // Destiny/Follett
    prisma.contract.upsert({
      where: { id: 'contract-6' },
      update: {},
      create: {
        id: 'contract-6',
        vendorId: 'vendor-5',
        productName: 'Destiny Library Manager',
        description: 'Library catalog, circulation, and resource management for all 7 buildings.',
        contractType: 'software_license',
        billingModel: 'annual',
        isAnnual: true,
        hasSupportAssurance: true,
        startDate: new Date('2024-07-01'),
        renewalDate: daysFromNow(200),
        autoRenew: true,
        cost: 4800,
        fundingSource: 'General Fund',
        budgetCode: 'LIB-001',
        procurementMethod: 'direct_purchase',
        poNumber: 'PO-2024-0303',
        internalOwner: 'Patricia Webb',
        department: 'Library/Media',
        status: ContractStatus.ACTIVE,
        studentDataInvolved: true,
        dataPrivacyAgreementOnFile: true,
        securityReviewCompleted: true,
      },
    }),

    // Zoom
    prisma.contract.upsert({
      where: { id: 'contract-7' },
      update: {},
      create: {
        id: 'contract-7',
        vendorId: 'vendor-6',
        productName: 'Zoom for Education',
        description: 'Video conferencing licenses for all staff. 450-seat district license.',
        contractType: 'saas_subscription',
        billingModel: 'annual',
        isAnnual: true,
        isSubscription: true,
        startDate: new Date('2024-06-01'),
        renewalDate: daysFromNow(8), // Very soon
        noticeDeadline: daysFromNow(1), // Notice due essentially NOW
        autoRenew: true,
        cost: 6750,
        fundingSource: 'General Fund',
        budgetCode: 'TECH-010',
        procurementMethod: 'direct_purchase',
        poNumber: 'PO-2024-0100',
        internalOwner: 'Tom Aldrich',
        department: 'Technology',
        status: ContractStatus.ACTIVE,
        notes: 'Auto-renew is ON but should verify seat count. Usage has been lower than licensed.',
        studentDataInvolved: false,
        dataPrivacyAgreementOnFile: true,
        securityReviewCompleted: true,
        soc2Available: true,
      },
    }),

    // Raptor
    prisma.contract.upsert({
      where: { id: 'contract-8' },
      update: {},
      create: {
        id: 'contract-8',
        vendorId: 'vendor-7',
        productName: 'Raptor Visitor Management',
        description: 'Visitor check-in and sex offender screening for all district buildings.',
        contractType: 'saas_subscription',
        billingModel: 'annual',
        isAnnual: true,
        isSubscription: true,
        startDate: new Date('2024-07-01'),
        renewalDate: daysFromNow(145),
        noticeDeadline: daysFromNow(115),
        autoRenew: false,
        cost: 5600,
        fundingSource: 'General Fund',
        budgetCode: 'FAC-005',
        procurementMethod: 'sole_source',
        poNumber: 'PO-2024-0890',
        internalOwner: null, // Missing owner — surfaced in dashboard
        department: 'Facilities & Safety',
        status: ContractStatus.ACTIVE,
        notes: 'Safety director position is currently vacant. Assign owner when filled.',
        studentDataInvolved: false,
        dataPrivacyAgreementOnFile: false, // Missing DPA
        securityReviewCompleted: false,
      },
    }),

    // Old expired contract for data richness
    prisma.contract.upsert({
      where: { id: 'contract-9' },
      update: {},
      create: {
        id: 'contract-9',
        vendorId: 'vendor-4',
        productName: 'i-Ready Spanish Language Support',
        description: 'Add-on Spanish language i-Ready licenses (pilot program).',
        contractType: 'saas_subscription',
        billingModel: 'annual',
        isAnnual: true,
        isSubscription: true,
        startDate: new Date('2023-08-01'),
        renewalDate: new Date('2024-07-31'),
        status: ContractStatus.EXPIRED,
        isArchived: true,
        cost: 4200,
        fundingSource: 'Title III',
        budgetCode: 'TITLE3-001',
        procurementMethod: 'cooperative_contract',
        internalOwner: 'Rachel Burns',
        department: 'Curriculum & Instruction',
        notes: 'Pilot ended. Did not renew. Replace with districtwide bilingual program review.',
        studentDataInvolved: true,
        dataPrivacyAgreementOnFile: true,
      },
    }),
  ])

  console.log(`Created ${contracts.length} contracts`)

  // Seed some attachments
  await prisma.attachment.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'att-1',
        parentType: 'contract',
        parentId: 'contract-3',
        contractId: 'contract-3',
        title: 'PowerSchool Master Agreement 2024',
        url: 'https://district-docs.example.com/contracts/powerschool-2024.pdf',
        fileName: 'powerschool-master-agreement-2024.pdf',
      },
      {
        id: 'att-2',
        parentType: 'contract',
        parentId: 'contract-3',
        contractId: 'contract-3',
        title: 'PowerSchool Data Processing Agreement',
        url: 'https://district-docs.example.com/contracts/powerschool-dpa-2024.pdf',
        fileName: 'powerschool-dpa-2024.pdf',
      },
      {
        id: 'att-3',
        parentType: 'vendor',
        parentId: 'vendor-2',
        vendorId: 'vendor-2',
        title: 'PowerSchool SOC 2 Report',
        url: 'https://trust.powerschool.com/soc2-2024',
      },
      {
        id: 'att-4',
        parentType: 'contract',
        parentId: 'contract-5',
        contractId: 'contract-5',
        title: 'i-Ready Contract and Quote 2024-25',
        url: 'https://district-docs.example.com/contracts/iready-2024-25.pdf',
        fileName: 'iready-quote-2024-25.pdf',
      },
    ],
  })

  console.log('Created sample attachments')

  // Seed activity log entries
  await prisma.activityLog.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'log-1',
        entityType: 'contract',
        entityId: 'contract-5',
        entityName: 'i-Ready Reading & Math',
        userEmail: 'tadmin@district.edu',
        userName: 'Tom Aldrich',
        action: 'status_changed',
        afterState: { status: 'PENDING_RENEWAL' },
        metadata: { note: 'Moved to pending renewal — notice deadline approaching' },
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'log-2',
        entityType: 'contract',
        entityId: 'contract-1',
        entityName: 'Frontline HR & Payroll',
        userEmail: 'jcosta@district.edu',
        userName: 'Jennifer Costa',
        action: 'updated',
        beforeState: { notes: '' },
        afterState: { notes: 'URGENT: Notice deadline has passed. Contact vendor to discuss options.' },
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'log-3',
        entityType: 'vendor',
        entityId: 'vendor-1',
        entityName: 'Frontline Education',
        userEmail: 'tadmin@district.edu',
        userName: 'Tom Aldrich',
        action: 'created',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    ],
  })

  console.log('Created sample activity logs')
  console.log('✅ Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
