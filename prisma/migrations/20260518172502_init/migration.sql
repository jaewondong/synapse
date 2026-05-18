-- CreateTable
CREATE TABLE "AgentActionRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentName" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "reasoningSummary" TEXT NOT NULL,
    "sources" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "patientMrn" TEXT NOT NULL,
    "actionTimestamp" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actionId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "reason" TEXT,
    "decidedBy" TEXT NOT NULL,
    "decidedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Decision_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "AgentActionRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
