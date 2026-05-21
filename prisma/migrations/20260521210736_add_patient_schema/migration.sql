-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mrn" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "preferredName" TEXT,
    "sex" TEXT NOT NULL,
    "dateOfBirth" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "pediatric" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "preferredLanguage" TEXT,
    "pronouns" TEXT,
    "addressStreet" TEXT,
    "addressCity" TEXT,
    "addressState" TEXT,
    "addressZip" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "maritalStatus" TEXT,
    "employer" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactRelationship" TEXT,
    "emergencyContactPhone" TEXT,
    "primaryDepartment" TEXT NOT NULL,
    "pcpName" TEXT,
    "pcpProviderId" TEXT,
    "primaryProviderName" TEXT,
    "primaryProviderId" TEXT,
    "lastSeenDate" TEXT,
    "registrationDate" TEXT,
    "modifiedByType" TEXT,
    "modifiedByAgentName" TEXT,
    "modifiedAt" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PatientInsurance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "payerName" TEXT NOT NULL,
    "payerShort" TEXT,
    "memberId" TEXT,
    "groupNumber" TEXT,
    "eligibilityStatus" TEXT NOT NULL DEFAULT 'Active',
    "lastVerifiedAt" TEXT,
    "verifiedByType" TEXT,
    "verifiedByAgentName" TEXT,
    "effectiveStart" TEXT,
    "effectiveEnd" TEXT,
    CONSTRAINT "PatientInsurance_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientAllergy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "substance" TEXT NOT NULL,
    "reaction" TEXT,
    "severity" TEXT,
    "yearIdentified" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "modifiedByType" TEXT,
    "modifiedByAgentName" TEXT,
    CONSTRAINT "PatientAllergy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientProblem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icd10" TEXT,
    "status" TEXT NOT NULL,
    "department" TEXT,
    "onsetYear" INTEGER,
    "modifiedByType" TEXT,
    "modifiedByAgentName" TEXT,
    CONSTRAINT "PatientProblem_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientMedication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dose" TEXT,
    "frequency" TEXT,
    "indication" TEXT,
    "prescribingProvider" TEXT,
    "startedYear" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "modifiedByType" TEXT,
    "modifiedByAgentName" TEXT,
    CONSTRAINT "PatientMedication_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientEncounter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "encounterDate" TEXT,
    "visitType" TEXT,
    "department" TEXT,
    "providerName" TEXT,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'complete',
    "modifiedByType" TEXT,
    "modifiedByAgentName" TEXT,
    CONSTRAINT "PatientEncounter_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientImagingStudy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "studyName" TEXT,
    "studyDate" TEXT,
    "finding" TEXT,
    "department" TEXT,
    "status" TEXT NOT NULL DEFAULT 'complete',
    "modifiedByType" TEXT,
    "modifiedByAgentName" TEXT,
    CONSTRAINT "PatientImagingStudy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientSeizureEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "eventDate" TEXT,
    "durationSeconds" INTEGER,
    "type" TEXT,
    "notes" TEXT,
    CONSTRAINT "PatientSeizureEvent_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientCareTeamMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "relationship" TEXT,
    CONSTRAINT "PatientCareTeamMember_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientAppointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "appointmentDate" TEXT,
    "appointmentTime" TEXT,
    "visitType" TEXT,
    "providerName" TEXT,
    "noShowRisk" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    CONSTRAINT "PatientAppointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientReconciliationPrompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "type" TEXT,
    "agentName" TEXT,
    "createdAt" TEXT,
    "message" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PatientReconciliationPrompt_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_mrn_key" ON "Patient"("mrn");

-- CreateIndex
CREATE INDEX "Patient_lastName_firstName_idx" ON "Patient"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "Patient_dateOfBirth_idx" ON "Patient"("dateOfBirth");

-- CreateIndex
CREATE INDEX "PatientInsurance_patientId_idx" ON "PatientInsurance"("patientId");

-- CreateIndex
CREATE INDEX "PatientAllergy_patientId_idx" ON "PatientAllergy"("patientId");

-- CreateIndex
CREATE INDEX "PatientProblem_patientId_idx" ON "PatientProblem"("patientId");

-- CreateIndex
CREATE INDEX "PatientProblem_patientId_department_idx" ON "PatientProblem"("patientId", "department");

-- CreateIndex
CREATE INDEX "PatientMedication_patientId_idx" ON "PatientMedication"("patientId");

-- CreateIndex
CREATE INDEX "PatientEncounter_patientId_idx" ON "PatientEncounter"("patientId");

-- CreateIndex
CREATE INDEX "PatientEncounter_patientId_department_idx" ON "PatientEncounter"("patientId", "department");

-- CreateIndex
CREATE INDEX "PatientImagingStudy_patientId_idx" ON "PatientImagingStudy"("patientId");

-- CreateIndex
CREATE INDEX "PatientSeizureEvent_patientId_idx" ON "PatientSeizureEvent"("patientId");

-- CreateIndex
CREATE INDEX "PatientCareTeamMember_patientId_idx" ON "PatientCareTeamMember"("patientId");

-- CreateIndex
CREATE INDEX "PatientAppointment_patientId_idx" ON "PatientAppointment"("patientId");

-- CreateIndex
CREATE INDEX "PatientReconciliationPrompt_patientId_idx" ON "PatientReconciliationPrompt"("patientId");
