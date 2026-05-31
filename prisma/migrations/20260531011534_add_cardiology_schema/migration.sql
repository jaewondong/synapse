-- CreateTable
CREATE TABLE "PatientLabResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "refRange" TEXT,
    "flag" TEXT,
    "resultedAt" TEXT,
    "modifiedByType" TEXT,
    "modifiedByAgentName" TEXT,
    CONSTRAINT "PatientLabResult_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientCardiacStudy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "studyType" TEXT NOT NULL,
    "performedAt" TEXT,
    "summary" TEXT,
    "lvef" INTEGER,
    "modifiedByType" TEXT,
    "modifiedByAgentName" TEXT,
    CONSTRAINT "PatientCardiacStudy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "implantedAt" TEXT,
    "lastInterrogationAt" TEXT,
    "batteryStatus" TEXT,
    "afBurdenPct" REAL,
    "therapiesDelivered" INTEGER,
    "physician" TEXT,
    "modifiedByType" TEXT,
    "modifiedByAgentName" TEXT,
    CONSTRAINT "PatientDevice_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientRiskScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "value" INTEGER NOT NULL,
    "severity" TEXT NOT NULL,
    "computedAt" TEXT,
    "inputs" TEXT,
    "agentName" TEXT,
    "modelVersion" TEXT,
    CONSTRAINT "PatientRiskScore_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientVitalSign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "takenAt" TEXT,
    "systolic" INTEGER,
    "diastolic" INTEGER,
    "hr" INTEGER,
    "source" TEXT,
    CONSTRAINT "PatientVitalSign_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientAgentObservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "agentName" TEXT,
    "confidence" TEXT,
    "computedAt" TEXT,
    "whyRationale" TEXT,
    "whyInputs" TEXT,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PatientAgentObservation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PatientLabResult_patientId_idx" ON "PatientLabResult"("patientId");

-- CreateIndex
CREATE INDEX "PatientCardiacStudy_patientId_idx" ON "PatientCardiacStudy"("patientId");

-- CreateIndex
CREATE INDEX "PatientDevice_patientId_idx" ON "PatientDevice"("patientId");

-- CreateIndex
CREATE INDEX "PatientRiskScore_patientId_idx" ON "PatientRiskScore"("patientId");

-- CreateIndex
CREATE INDEX "PatientVitalSign_patientId_idx" ON "PatientVitalSign"("patientId");

-- CreateIndex
CREATE INDEX "PatientAgentObservation_patientId_idx" ON "PatientAgentObservation"("patientId");
