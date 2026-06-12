-- CreateTable
CREATE TABLE "InsuranceDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientMrn" TEXT NOT NULL,
    "documentType" TEXT NOT NULL DEFAULT 'unknown',
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "rejectReason" TEXT,
    "pages" INTEGER NOT NULL DEFAULT 1,
    "bucket" TEXT NOT NULL,
    "frontStoragePath" TEXT NOT NULL,
    "frontMimeType" TEXT NOT NULL,
    "backStoragePath" TEXT,
    "backMimeType" TEXT,
    "fileSize" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL DEFAULT 'demo-user',
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "InsuranceExtraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "agentName" TEXT NOT NULL DEFAULT 'Insurance Agent',
    "modelVersion" TEXT NOT NULL,
    "extractedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InsuranceExtraction_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "InsuranceDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InsuranceCoverage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientMrn" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'primary',
    "payerName" TEXT NOT NULL,
    "planName" TEXT,
    "planType" TEXT,
    "memberId" TEXT,
    "groupNumber" TEXT,
    "subscriberName" TEXT,
    "subscriberDob" TEXT,
    "relationshipToSubscriber" TEXT,
    "effectiveDate" TEXT,
    "rxBin" TEXT,
    "rxPcn" TEXT,
    "rxGroup" TEXT,
    "copays" TEXT,
    "payerPhone" TEXT,
    "claimsAddress" TEXT,
    "verifiedAt" TEXT,
    "sourceDocumentId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "supersededById" TEXT,
    "modifiedByType" TEXT NOT NULL DEFAULT 'agent',
    "modifiedByAgentName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "InsuranceDocument_patientMrn_uploadedAt_idx" ON "InsuranceDocument"("patientMrn", "uploadedAt");

-- CreateIndex
CREATE INDEX "InsuranceExtraction_documentId_idx" ON "InsuranceExtraction"("documentId");

-- CreateIndex
CREATE INDEX "InsuranceCoverage_patientMrn_version_idx" ON "InsuranceCoverage"("patientMrn", "version");
