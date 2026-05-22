export interface PatientDocument {
  id: string
  idempotency_key: string | null
  patient_mrn: string
  patient_name: string
  department: string
  file_name: string
  file_size: number
  mime_type: string
  storage_path: string
  bucket: string
  uploaded_by: string
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export const DEPARTMENT_LABELS: Record<string, string> = {
  neurology: 'Neurology',
  cardiology: 'Cardiology',
  imaging: 'Imaging',
  labs: 'Labs',
  medications: 'Medications',
  immunizations: 'Immunizations',
  'primary-care': 'Primary Care',
  general: 'General',
}

export const DEPARTMENT_OPTIONS = Object.entries(DEPARTMENT_LABELS).map(
  ([value, label]) => ({ value, label }),
)
