export interface InboxMessage {
  id: string
  sender: string
  subject: string
  preview: string
  timestamp: string
  unread: boolean
  type: 'portal' | 'staff' | 'referral'
}

export interface InboxResult {
  id: string
  testName: string
  patientName: string
  patientMrn: string
  orderedBy: string
  timestamp: string
  unread: boolean
  urgency: 'routine' | 'urgent'
}

export interface InboxTask {
  id: string
  title: string
  assignedBy: string
  patientName?: string
  patientMrn?: string
  dueDate?: string
  timestamp: string
  unread: boolean
}

export interface InboxSignature {
  id: string
  documentType: string
  patientName: string
  patientMrn: string
  createdBy: string
  timestamp: string
  unread: boolean
}

export const mockMessages: InboxMessage[] = [
  {
    id: 'msg-1',
    sender: 'Maria Chen (Patient)',
    subject: 'Brivaracetam titration schedule — follow-up question',
    preview: 'Hi Dr. Chen, after our visit today I wanted to confirm whether the new titration schedule supersedes the one from last month…',
    timestamp: '2026-05-18T08:05:00Z',
    unread: true,
    type: 'portal',
  },
  {
    id: 'msg-2',
    sender: 'James Okonkwo (Patient)',
    subject: 'Tysabri infusion — reschedule request',
    preview: 'Hello, I need to move my May 22nd infusion. Would May 29th work? I have a family commitment that conflicts…',
    timestamp: '2026-05-18T05:30:00Z',
    unread: true,
    type: 'portal',
  },
  {
    id: 'msg-3',
    sender: 'Sofia Hernandez (Patient)',
    subject: 'Clobazam coverage question',
    preview: 'I was wondering if my Anthem plan covers Clobazam, and what the copay would be at CVS on Mission St…',
    timestamp: '2026-05-17T14:20:00Z',
    unread: true,
    type: 'portal',
  },
  {
    id: 'msg-4',
    sender: 'Dr. Sunita Patel, CPMC (Referring MD)',
    subject: 'Referral: David Park — movement disorder consult',
    preview: 'Dear Dr. Chen, I am referring my patient David Park, 58M, for evaluation of a progressive tremor…',
    timestamp: '2026-05-15T10:00:00Z',
    unread: false,
    type: 'referral',
  },
  {
    id: 'msg-5',
    sender: 'Lakeside Neurology Front Desk (Staff)',
    subject: 'Marcus Bell — DBS programming reschedule confirmation needed',
    preview: 'Hi, wanted to confirm that the 10:15 slot is still held for Marcus Bell. He called this morning and asked us to check…',
    timestamp: '2026-05-18T07:00:00Z',
    unread: true,
    type: 'staff',
  },
  {
    id: 'msg-6',
    sender: 'Aditi Rao (Patient)',
    subject: 'Question about rituximab — number of infusions',
    preview: 'I got a letter from Anthem saying only 2 infusions were approved. My prior doctor gave me 4. Should I be worried?',
    timestamp: '2026-05-17T19:45:00Z',
    unread: true,
    type: 'portal',
  },
]

export const mockResults: InboxResult[] = [
  {
    id: 'res-1',
    testName: 'MRI Brain with and without contrast',
    patientName: 'Marcus Bell',
    patientMrn: '8823741',
    orderedBy: 'Dr. Chen',
    timestamp: '2026-05-17T08:30:00Z',
    unread: true,
    urgency: 'routine',
  },
  {
    id: 'res-2',
    testName: 'Routine EEG (1-hour)',
    patientName: 'Aditi Rao',
    patientMrn: '7712938',
    orderedBy: 'Dr. Chen',
    timestamp: '2026-05-17T11:00:00Z',
    unread: true,
    urgency: 'routine',
  },
  {
    id: 'res-3',
    testName: 'CMP + CBC + lipid panel',
    patientName: 'Yuki Tanaka',
    patientMrn: '9912034',
    orderedBy: 'Dr. Chen',
    timestamp: '2026-05-17T14:15:00Z',
    unread: true,
    urgency: 'routine',
  },
  {
    id: 'res-4',
    testName: 'Levetiracetam drug level',
    patientName: 'James Okonkwo',
    patientMrn: '3309812',
    orderedBy: 'Dr. Chen',
    timestamp: '2026-05-17T16:45:00Z',
    unread: true,
    urgency: 'urgent',
  },
  {
    id: 'res-5',
    testName: 'Polysomnography (overnight sleep study)',
    patientName: 'David Park',
    patientMrn: '5501234',
    orderedBy: 'Dr. Chen',
    timestamp: '2026-05-16T09:00:00Z',
    unread: false,
    urgency: 'routine',
  },
  {
    id: 'res-6',
    testName: 'Neuro-ophthalmology consult note',
    patientName: 'Fatima Al-Rashid',
    patientMrn: '2287643',
    orderedBy: 'Dr. Martinez, Neuro-Ophth',
    timestamp: '2026-05-15T14:00:00Z',
    unread: false,
    urgency: 'routine',
  },
]

export const mockTasks: InboxTask[] = [
  {
    id: 'task-1',
    title: 'Sign off on Lakeside Clinic referral letter for Aditi Rao',
    assignedBy: 'Front desk',
    patientName: 'Aditi Rao',
    patientMrn: '7712938',
    dueDate: '2026-05-19',
    timestamp: '2026-05-18T07:00:00Z',
    unread: true,
  },
  {
    id: 'task-2',
    title: 'Review Tysabri JCV antibody titer result — discuss at visit',
    assignedBy: 'Prior Auth Agent',
    patientName: 'James Okonkwo',
    patientMrn: '3309812',
    dueDate: '2026-05-18',
    timestamp: '2026-05-17T22:00:00Z',
    unread: true,
  },
  {
    id: 'task-3',
    title: 'Call Marcus Bell re DBS programming session outcomes',
    assignedBy: 'Chart Prep Agent',
    patientName: 'Marcus Bell',
    patientMrn: '8823741',
    timestamp: '2026-05-17T18:00:00Z',
    unread: true,
  },
  {
    id: 'task-4',
    title: 'Verify Sofia Hernandez prior step therapy for Ocrelizumab appeal',
    assignedBy: 'Prior Auth Agent',
    patientName: 'Sofia Hernandez',
    patientMrn: '6634521',
    dueDate: '2026-06-17',
    timestamp: '2026-05-17T20:00:00Z',
    unread: true,
  },
  {
    id: 'task-5',
    title: 'Complete annual performance review for care coordinator staff',
    assignedBy: 'Admin',
    dueDate: '2026-05-31',
    timestamp: '2026-05-10T09:00:00Z',
    unread: false,
  },
]

export const mockSignatures: InboxSignature[] = [
  {
    id: 'sig-1',
    documentType: 'Post-op DBS f/u encounter note',
    patientName: 'David Park',
    patientMrn: '5501234',
    createdBy: 'Dr. Chen (dictated)',
    timestamp: '2026-05-17T17:30:00Z',
    unread: true,
  },
]

export const mockInboxCounts = {
  agentReview: 23,
  messages: mockMessages.filter((m) => m.unread).length,
  results: mockResults.filter((r) => r.unread).length,
  tasks: mockTasks.filter((t) => t.unread).length,
  signatures: mockSignatures.filter((s) => s.unread).length,
}
