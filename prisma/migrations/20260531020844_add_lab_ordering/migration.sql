-- CreateTable
CREATE TABLE "LabCatalogItem" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "aliases" TEXT,
    "category" TEXT NOT NULL,
    "specimen" TEXT,
    "cpt" TEXT,
    "setting" TEXT NOT NULL DEFAULT 'both',
    "fastingRequired" BOOLEAN NOT NULL DEFAULT false,
    "sendOut" BOOLEAN NOT NULL DEFAULT false,
    "defaultPriority" TEXT NOT NULL DEFAULT 'routine',
    "isPanel" BOOLEAN NOT NULL DEFAULT false,
    "panelComponents" TEXT
);

-- CreateTable
CREATE TABLE "LabOrderSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "setting" TEXT NOT NULL DEFAULT 'both',
    "memberCodes" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PerformingLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "capabilities" TEXT
);

-- CreateTable
CREATE TABLE "QuestPsc" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "hours" TEXT,
    "lat" REAL,
    "lng" REAL,
    "performingLocationId" TEXT NOT NULL,
    CONSTRAINT "QuestPsc_performingLocationId_fkey" FOREIGN KEY ("performingLocationId") REFERENCES "PerformingLocation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LabOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "catalogCode" TEXT NOT NULL,
    "setting" TEXT NOT NULL DEFAULT 'out',
    "priority" TEXT NOT NULL DEFAULT 'routine',
    "frequency" TEXT NOT NULL DEFAULT 'once',
    "futureDate" TEXT,
    "indicationIcd" TEXT,
    "indicationText" TEXT,
    "performingLocationId" TEXT,
    "pscId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pended',
    "pendedBy" TEXT,
    "pendedByType" TEXT,
    "pendedByAgentName" TEXT,
    "pendedByRationale" TEXT,
    "releasedBy" TEXT,
    "orderedAt" TEXT NOT NULL,
    "releasedAt" TEXT,
    "cancelledAt" TEXT,
    "modifiedByType" TEXT,
    "modifiedByAgentName" TEXT,
    "notes" TEXT,
    CONSTRAINT "LabOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LabOrder_catalogCode_fkey" FOREIGN KEY ("catalogCode") REFERENCES "LabCatalogItem" ("code") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LabOrder_performingLocationId_fkey" FOREIGN KEY ("performingLocationId") REFERENCES "PerformingLocation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LabCatalogItem_category_idx" ON "LabCatalogItem"("category");

-- CreateIndex
CREATE INDEX "LabCatalogItem_name_idx" ON "LabCatalogItem"("name");

-- CreateIndex
CREATE INDEX "QuestPsc_zip_idx" ON "QuestPsc"("zip");

-- CreateIndex
CREATE INDEX "LabOrder_patientId_idx" ON "LabOrder"("patientId");

-- CreateIndex
CREATE INDEX "LabOrder_patientId_status_idx" ON "LabOrder"("patientId", "status");

-- CreateIndex
CREATE INDEX "LabOrder_catalogCode_idx" ON "LabOrder"("catalogCode");
