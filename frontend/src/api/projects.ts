import client from './client'
import type { Project, ProjectDetail, DashboardStats, MiniStats, DPRRecord, SubmissionDetail, ContractRow, TableColumn, GlobalDPR, GlobalEstimate, AdminUser, AdminSubmission } from '../types'

export async function getProjects(): Promise<Project[]> {
  const { data } = await client.get('/projects')
  return data
}

export async function getProjectDetail(projectName: string): Promise<ProjectDetail> {
  const { data } = await client.get(`/projects/${encodeURIComponent(projectName)}`)
  return data
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await client.get('/dashboard/stats')
  return data
}

export async function getDashboardMiniStats(): Promise<MiniStats> {
  const { data } = await client.get('/dashboard/mini-stats')
  return data
}

export async function getProjectDPR(projectName: string): Promise<DPRRecord | null> {
  const { data } = await client.get(`/projects/${encodeURIComponent(projectName)}/dpr`)
  return data
}

export async function upsertProjectDPR(projectName: string, fields: Partial<DPRRecord>): Promise<void> {
  await client.post(`/projects/${encodeURIComponent(projectName)}/dpr`, fields)
}

export async function createEstimate(projectName: string, payload: { estimate_number: string; year_of_estimate: string }): Promise<{ master_id: number }> {
  const { data } = await client.post(`/projects/${encodeURIComponent(projectName)}/estimates`, payload)
  return data
}

export async function getContracts(project: string, estNo: string, estYr: string): Promise<ContractRow[]> {
  const { data } = await client.get('/contracts', {
    params: { project, est_no: estNo, est_yr: estYr },
  })
  return data
}

export async function createContract(payload: { project_name: string; estimate_number: string; year_of_estimate: string }): Promise<{ master_id: number }> {
  const { data } = await client.post('/contracts', payload)
  return data
}

export async function getSubmission(subId: number): Promise<SubmissionDetail> {
  const { data } = await client.get(`/submissions/${subId}`)
  return data
}

export async function updateSubmissionStatus(subId: number, status: string): Promise<void> {
  await client.patch(`/submissions/${subId}/status`, { status })
}

export async function getTableColumns(tableName: string): Promise<TableColumn[]> {
  const { data } = await client.get(`/tables/${encodeURIComponent(tableName)}/columns`)
  return data
}

export async function saveTableSection(
  subId: number,
  tableName: string,
  data: Record<string, unknown>,
): Promise<void> {
  await client.post(`/submissions/${subId}/tables/${encodeURIComponent(tableName)}`, { data })
}

export async function uploadFile(file: File): Promise<{ path: string; original: string }> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await client.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  return data
}

export async function updateSubmissionAttachment(
  subId: number,
  attachmentType: 'estimate' | 'sar',
  path: string,
): Promise<void> {
  await client.patch(`/submissions/${subId}/attachments`, { attachment_type: attachmentType, path })
}

export async function getGlobalDPRs(): Promise<GlobalDPR[]> {
  const { data } = await client.get('/global/dprs')
  return data
}

export async function getGlobalEstimates(): Promise<GlobalEstimate[]> {
  const { data } = await client.get('/global/estimates')
  return data
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const { data } = await client.get('/admin/users')
  return data
}

export async function createAdminUser(payload: {
  username: string; password: string; role: string; allowed_modules: string
}): Promise<{ id: number }> {
  const { data } = await client.post('/admin/users', payload)
  return data
}

export async function updateAdminUser(
  id: number,
  payload: { role?: string; is_active?: boolean; allowed_modules?: string },
): Promise<void> {
  await client.patch(`/admin/users/${id}`, payload)
}

export async function getAdminSubmissions(): Promise<AdminSubmission[]> {
  const { data } = await client.get('/admin/submissions')
  return data
}
