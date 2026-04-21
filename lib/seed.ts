import type { AppState } from "./types";
import { uid, nowISO } from "./utils";

function ts() {
  const now = nowISO();
  return { createdAt: now, updatedAt: now };
}

export function buildSeed(): AppState {
  const mdaHealth = { id: uid(), name: "Ministry of Health", code: "MOH", description: "Oversees public health services.", ...ts() };
  const mdaEdu = { id: uid(), name: "Ministry of Education", code: "MOE", description: "Basic, secondary, and tertiary education.", ...ts() };
  const mdaWorks = { id: uid(), name: "Ministry of Works", code: "MOW", description: "Roads, bridges and public infrastructure.", ...ts() };
  const mdaAgric = { id: uid(), name: "Ministry of Agriculture", code: "MOA", description: "Food security and agricultural programmes.", ...ts() };

  const depPHC = { id: uid(), mdaId: mdaHealth.id, name: "Primary Healthcare Board", code: "PHC", head: "Dr. A. Bello", ...ts() };
  const depHospitals = { id: uid(), mdaId: mdaHealth.id, name: "Hospitals Management", code: "HMB", head: "Dr. F. Okoro", ...ts() };
  const depBasicEd = { id: uid(), mdaId: mdaEdu.id, name: "Basic Education Board", code: "UBEB", head: "Mrs. L. Musa", ...ts() };
  const depRoads = { id: uid(), mdaId: mdaWorks.id, name: "Road Maintenance Agency", code: "RMA", head: "Engr. K. Adamu", ...ts() };

  const rcFinancial = { id: uid(), name: "Financial", description: "Budget and expenditure reports.", ...ts() };
  const rcOperational = { id: uid(), name: "Operational", description: "Service delivery metrics.", ...ts() };
  const rcImpact = { id: uid(), name: "Impact", description: "Outcome-level reporting.", ...ts() };

  const rcatQuarterlyBudget = { id: uid(), classId: rcFinancial.id, name: "Quarterly Budget Performance", ...ts() };
  const rcatAnnualFinancial = { id: uid(), classId: rcFinancial.id, name: "Annual Financial Return", ...ts() };
  const rcatServiceDelivery = { id: uid(), classId: rcOperational.id, name: "Service Delivery", ...ts() };
  const rcatImpactAssessment = { id: uid(), classId: rcImpact.id, name: "Impact Assessment", ...ts() };

  const rtBudgetPerf = { id: uid(), categoryId: rcatQuarterlyBudget.id, name: "Budget Performance (Quarterly)", ...ts() };
  const rtPHCMonthly = { id: uid(), categoryId: rcatServiceDelivery.id, name: "PHC Monthly Service", ...ts() };
  const rtSchoolEnrolment = { id: uid(), categoryId: rcatServiceDelivery.id, name: "School Enrolment", ...ts() };
  const rtRoadProgress = { id: uid(), categoryId: rcatServiceDelivery.id, name: "Road Project Progress", ...ts() };

  const lgas = [
    { id: uid(), name: "Bida", state: "Niger", code: "NG-BI", ...ts() },
    { id: uid(), name: "Minna", state: "Niger", code: "NG-MN", ...ts() },
    { id: uid(), name: "Suleja", state: "Niger", code: "NG-SJ", ...ts() },
    { id: uid(), name: "Kontagora", state: "Niger", code: "NG-KT", ...ts() },
    { id: uid(), name: "Agaie", state: "Niger", code: "NG-AG", ...ts() },
  ];

  const units = [
    { id: uid(), name: "Naira", symbol: "₦", description: "Nigerian Naira", ...ts() },
    { id: uid(), name: "Persons", symbol: "pax", ...ts() },
    { id: uid(), name: "Kilometers", symbol: "km", ...ts() },
    { id: uid(), name: "Percentage", symbol: "%", ...ts() },
    { id: uid(), name: "Count", symbol: "#", ...ts() },
  ];

  const year = new Date().getFullYear();
  const periods = [
    { id: uid(), name: `Q1 ${year}`, startDate: `${year}-01-01`, endDate: `${year}-03-31`, status: "closed" as const, ...ts() },
    { id: uid(), name: `Q2 ${year}`, startDate: `${year}-04-01`, endDate: `${year}-06-30`, status: "closed" as const, ...ts() },
    { id: uid(), name: `Q3 ${year}`, startDate: `${year}-07-01`, endDate: `${year}-09-30`, status: "open" as const, ...ts() },
    { id: uid(), name: `Q4 ${year}`, startDate: `${year}-10-01`, endDate: `${year}-12-31`, status: "upcoming" as const, ...ts() },
  ];

  const fundingSources = [
    { id: uid(), name: "Federal Allocation", kind: "government" as const, ...ts() },
    { id: uid(), name: "State Internal Revenue", kind: "internal" as const, ...ts() },
    { id: uid(), name: "World Bank Grant", kind: "donor" as const, ...ts() },
    { id: uid(), name: "UNICEF Partnership", kind: "donor" as const, ...ts() },
  ];

  const adminUser = { id: uid(), name: "Amina Yusuf", email: "amina@me.gov.ng", role: "admin" as const, active: true, title: "System Administrator", ...ts() };
  const officer1 = { id: uid(), name: "Chinedu Okafor", email: "chinedu@me.gov.ng", role: "reporting_officer" as const, mdaId: mdaHealth.id, active: true, title: "M&E Officer", ...ts() };
  const officer2 = { id: uid(), name: "Hauwa Ibrahim", email: "hauwa@me.gov.ng", role: "reporting_officer" as const, mdaId: mdaEdu.id, active: true, title: "Planning Officer", ...ts() };
  const officer3 = { id: uid(), name: "Emeka Obi", email: "emeka@me.gov.ng", role: "reporting_officer" as const, mdaId: mdaWorks.id, active: true, title: "Project Officer", ...ts() };

  const phcTemplate = {
    id: uid(),
    name: "PHC Monthly Service",
    description: "Captures primary healthcare service delivery for a month.",
    reportTypeId: rtPHCMonthly.id,
    fields: [
      { id: uid(), label: "Facility Name", key: "facility_name", type: "text" as const, required: true, placeholder: "e.g. Bida General Hospital" },
      { id: uid(), label: "LGA", key: "lga", type: "select" as const, required: true, options: lgas.map((l) => l.name) },
      { id: uid(), label: "Outpatients attended", key: "outpatients", type: "number" as const, required: true, min: 0 },
      { id: uid(), label: "Immunizations", key: "immunizations", type: "number" as const, min: 0 },
      { id: uid(), label: "Antenatal visits", key: "anc", type: "number" as const, min: 0 },
      { id: uid(), label: "Observations", key: "notes", type: "textarea" as const, placeholder: "Summary of activities and issues" },
    ],
    ...ts(),
  };

  const budgetTemplate = {
    id: uid(),
    name: "Budget Performance (Quarterly)",
    description: "Capital expenditure performance for the quarter.",
    reportTypeId: rtBudgetPerf.id,
    fields: [
      { id: uid(), label: "Budgeted (₦)", key: "budget", type: "currency" as const, required: true, min: 0 },
      { id: uid(), label: "Released (₦)", key: "released", type: "currency" as const, min: 0 },
      { id: uid(), label: "Utilized (₦)", key: "utilized", type: "currency" as const, min: 0 },
      { id: uid(), label: "Variance reason", key: "variance", type: "textarea" as const },
      { id: uid(), label: "Date of review", key: "review_date", type: "date" as const },
    ],
    ...ts(),
  };

  const projHealth = {
    id: uid(),
    name: "PHC Revitalization Programme",
    code: "HLTH-2024-01",
    mdaId: mdaHealth.id,
    description: "Upgrade of 20 primary healthcare centres in Niger State.",
    status: "ongoing" as const,
    startDate: `${year}-01-15`,
    endDate: `${year}-12-30`,
    budget: 450000000,
    lgaIds: [lgas[0].id, lgas[1].id, lgas[2].id],
    ...ts(),
  };
  const projEdu = {
    id: uid(),
    name: "School Feeding Expansion",
    code: "EDU-2024-07",
    mdaId: mdaEdu.id,
    description: "Expansion of the school feeding programme to additional schools.",
    status: "ongoing" as const,
    startDate: `${year}-02-01`,
    endDate: `${year}-11-30`,
    budget: 220000000,
    lgaIds: [lgas[0].id, lgas[3].id],
    ...ts(),
  };
  const projWorks = {
    id: uid(),
    name: "Minna-Bida Road Rehabilitation",
    code: "WRK-2024-02",
    mdaId: mdaWorks.id,
    description: "Rehabilitation of 85km federal road corridor.",
    status: "ongoing" as const,
    startDate: `${year}-03-01`,
    endDate: `${year + 1}-03-30`,
    budget: 1850000000,
    lgaIds: [lgas[1].id, lgas[0].id],
    ...ts(),
  };

  const fundings = [
    { id: uid(), projectId: projHealth.id, sourceId: fundingSources[0].id, amount: 300000000, currency: "NGN", ...ts() },
    { id: uid(), projectId: projHealth.id, sourceId: fundingSources[2].id, amount: 150000000, currency: "NGN", ...ts() },
    { id: uid(), projectId: projEdu.id, sourceId: fundingSources[1].id, amount: 120000000, currency: "NGN", ...ts() },
    { id: uid(), projectId: projEdu.id, sourceId: fundingSources[3].id, amount: 100000000, currency: "NGN", ...ts() },
    { id: uid(), projectId: projWorks.id, sourceId: fundingSources[0].id, amount: 1850000000, currency: "NGN", ...ts() },
  ];

  const targets = [
    { id: uid(), name: "PHC centres revitalised", projectId: projHealth.id, mdaId: mdaHealth.id, unitId: units[4].id, periodId: periods[2].id, baseline: 0, target: 20, ...ts() },
    { id: uid(), name: "Children immunised", mdaId: mdaHealth.id, unitId: units[1].id, periodId: periods[2].id, baseline: 12000, target: 50000, ...ts() },
    { id: uid(), name: "Schools covered by feeding programme", projectId: projEdu.id, mdaId: mdaEdu.id, unitId: units[4].id, periodId: periods[2].id, baseline: 180, target: 320, ...ts() },
    { id: uid(), name: "Road rehabilitated", projectId: projWorks.id, mdaId: mdaWorks.id, unitId: units[2].id, periodId: periods[2].id, baseline: 12, target: 85, ...ts() },
  ];

  const progress = [
    { id: uid(), targetId: targets[0].id, periodId: periods[0].id, value: 5, note: "5 centres completed in Q1", ...ts() },
    { id: uid(), targetId: targets[0].id, periodId: periods[1].id, value: 11, note: "6 additional centres completed", ...ts() },
    { id: uid(), targetId: targets[1].id, periodId: periods[0].id, value: 15000, ...ts() },
    { id: uid(), targetId: targets[1].id, periodId: periods[1].id, value: 28000, ...ts() },
    { id: uid(), targetId: targets[2].id, periodId: periods[0].id, value: 210, ...ts() },
    { id: uid(), targetId: targets[2].id, periodId: periods[1].id, value: 265, ...ts() },
    { id: uid(), targetId: targets[3].id, periodId: periods[0].id, value: 18, ...ts() },
    { id: uid(), targetId: targets[3].id, periodId: periods[1].id, value: 34, ...ts() },
  ];

  const reports = [
    {
      id: uid(),
      title: "Bida PHC – July Service Report",
      mdaId: mdaHealth.id,
      typeId: rtPHCMonthly.id,
      periodId: periods[2].id,
      status: "submitted" as const,
      submittedBy: officer1.id,
      submittedAt: nowISO(),
      templateId: phcTemplate.id,
      values: { facility_name: "Bida General Hospital", lga: "Bida", outpatients: 3480, immunizations: 820, anc: 410, notes: "Stable operations, minor stock-outs." },
      ...ts(),
    },
    {
      id: uid(),
      title: "MOE – Q2 Budget Performance",
      mdaId: mdaEdu.id,
      typeId: rtBudgetPerf.id,
      periodId: periods[1].id,
      status: "approved" as const,
      submittedBy: officer2.id,
      submittedAt: nowISO(),
      templateId: budgetTemplate.id,
      values: { budget: 220000000, released: 180000000, utilized: 162000000, variance: "Procurement delays in June.", review_date: `${year}-07-10` },
      ...ts(),
    },
    {
      id: uid(),
      title: "Works – Road Progress (draft)",
      mdaId: mdaWorks.id,
      typeId: rtRoadProgress.id,
      periodId: periods[2].id,
      status: "draft" as const,
      submittedBy: officer3.id,
      values: {},
      ...ts(),
    },
  ];

  const assignments = [
    { id: uid(), userId: officer1.id, mdaId: mdaHealth.id, reportTypeIds: [rtPHCMonthly.id, rtBudgetPerf.id], ...ts() },
    { id: uid(), userId: officer2.id, mdaId: mdaEdu.id, reportTypeIds: [rtSchoolEnrolment.id, rtBudgetPerf.id], ...ts() },
    { id: uid(), userId: officer3.id, mdaId: mdaWorks.id, reportTypeIds: [rtRoadProgress.id], ...ts() },
  ];

  return {
    mdas: [mdaHealth, mdaEdu, mdaWorks, mdaAgric],
    departments: [depPHC, depHospitals, depBasicEd, depRoads],
    reportClasses: [rcFinancial, rcOperational, rcImpact],
    reportCategories: [rcatQuarterlyBudget, rcatAnnualFinancial, rcatServiceDelivery, rcatImpactAssessment],
    reportTypes: [rtBudgetPerf, rtPHCMonthly, rtSchoolEnrolment, rtRoadProgress],
    lgas,
    units,
    reportingPeriods: periods,
    fundingSources,
    reports,
    projects: [projHealth, projEdu, projWorks],
    projectFundings: fundings,
    targets,
    targetProgress: progress,
    templates: [phcTemplate, budgetTemplate],
    users: [adminUser, officer1, officer2, officer3],
    assignments,
    activePeriodId: periods[2].id,
    activeUserId: adminUser.id,
  };
}
