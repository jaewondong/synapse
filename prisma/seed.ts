import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { allAgentActions } from '../lib/mock/agent-actions'

const adapter = new PrismaBetterSqlite3({ url: 'file:./synapse.db' })
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.agentActionRecord.deleteMany()

  for (const action of allAgentActions) {
    await prisma.agentActionRecord.create({
      data: {
        id: action.id,
        agentName: action.agentName,
        confidence: action.confidence,
        summary: action.summary,
        detail: action.detail,
        reasoningSummary: action.reasoningSummary,
        sources: JSON.stringify(action.sources),
        patientName: action.patientName,
        patientMrn: action.patientMrn,
        actionTimestamp: new Date(action.timestamp),
        category: action.category,
        status: action.status,
      },
    })
  }

  console.log(`Seeded ${allAgentActions.length} agent actions`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
