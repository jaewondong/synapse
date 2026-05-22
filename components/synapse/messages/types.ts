export interface MessageThread {
  id: string
  patient_mrn: string
  patient_name: string
  patient_initials: string
  patient_age: number | null
  patient_sex: string | null
  patient_allergy_count: number
  channel: 'email' | 'sms'
  subject: string | null
  status: string
  sensitive_flag: boolean
  last_message_at: string | null
  last_message_preview: string | null
  last_message_direction: 'inbound' | 'outbound' | null
  created_at: string
}

export interface Message {
  id: string
  thread_id: string
  direction: 'inbound' | 'outbound'
  channel: 'email' | 'sms'
  body: string
  sender_name: string | null
  sender_user_id: string | null
  sender_agent_name: string | null
  delivery_status: 'mock' | 'sending' | 'sent' | 'failed' | 'received'
  modified_by_type: 'human' | 'agent'
  modified_by_agent_name: string | null
  sent_at: string | null
  created_at: string
}
