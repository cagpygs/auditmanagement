export interface User {
  id: number
  username: string
  role: 'admin' | 'operator'
  allowed_modules: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoggedIn: boolean
}

export interface Project {
  project_name: string
  estimate_count: number
  contract_count: number
  completed_count: number
  last_updated: string | null
  has_dpr?: boolean
  est_completed?: number
  est_incomplete?: number
  type_of_project?: string
  dpr_location?: string
  sanctioned_amount?: string
  health_pct?: number
}

export interface EstimateGroup {
  estimate_number: string
  year_of_estimate: string
  status: string
  contract_count: number
  completed_count: number
  latest_date: string | null
}

export interface ContractRow {
  id: number
  estimate_number: string
  year_of_estimate: string
  status: string
  created_at: string
  created_by_user: string
  estimate_attachment?: string | null
  sar_attachment?: string | null
  cycle?: number
}

export interface ProjectDetail extends Project {
  has_dpr: boolean
  estimates: EstimateGroup[]
  contracts: ContractRow[]
}

export interface DashboardStats {
  total_projects: number
  total_estimates: number
  total_contracts: number
  total_dprs: number
}

export interface MiniStats {
  dpr: {
    total: number
    details: { project_name: string; updated_at: string }[]
  }
  estimates: {
    completed: number
    incomplete: number
    details: {
      project_name: string
      estimate_number: string
      year_of_estimate: string
      status: string
      latest_date: string | null
      contract_count: number
      completed_count: number
    }[]
  }
  contracts: {
    completed: number
    incomplete: number
    details: {
      id: number
      project_name: string
      estimate_number: string
      year_of_estimate: string
      status: string
      created_at: string
      username: string
    }[]
  }
  projects: {
    completed: number
    incomplete: number
    details: {
      project_name: string
      estimate_count: number
      completed_count: number
      contract_count: number
      has_dpr: boolean
    }[]
  }
}

export interface DPRRecord {
  id: number
  user_id: number
  project_name: string
  project_key: string
  updated_at: string
  created_at: string
  dpr_file_name?: string
  category_of_project?: string
  type_of_project?: string
  location_of_head_works?: string
  date_of_investement_clearance_by_goi?: string
  date_of_cwc_clearence?: string
  date_of_approval_of_efc?: string
  districts_covered?: string
  gross_command_area?: string
  cca?: string
  irrigation_potential_in_rabi?: string
  irrigation_potential_in_kharif?: string
  requirement_of_water_for_project?: string
  availability_of_water_against_the_requirement?: string
  pre_project_crop_pattern_in_rabi?: string
  pre_project_crop_pattern_in_kharif?: string
  post_project_crop_pattern_in_rabi?: string
  post_project_crop_pattern_in_kharif?: string
  upload_complete_dpr_file_name?: string
  investment_clearence_file_name?: string
  cwc_clearence_file_name?: string
  dpr_approval_by_efc_file_name?: string
  survey_reports_file_name?: string
  date_of_approval_revised_dpr_revision_1?: string
  amount_of_revised_dpr_revision_1?: string
  target_date_to_complete_project_revision_1?: string
  date_of_approval_revised_dpr_revision_2?: string
  amount_of_revised_dpr_revision_2?: string
  target_date_to_complete_project_revision_2?: string
  date_of_approval_revised_dpr_revision_3?: string
  amount_of_revised_dpr_revision_3?: string
  target_date_to_complete_project_revision_3?: string
  date_of_approval_revised_dpr_revision_4?: string
  amount_of_revised_dpr_revision_4?: string
  target_date_to_complete_project_revision_4?: string
  date_of_approval_revised_dpr_revision_5?: string
  amount_of_revised_dpr_revision_5?: string
  target_date_to_complete_project_revision_5?: string
  date_of_approval_revised_dpr_revision_6?: string
  amount_of_revised_dpr_revision_6?: string
  target_date_to_complete_project_revision_6?: string
}

export interface GlobalDPR {
  project_name: string
  category_of_project: string | null
  type_of_project: string | null
  location_of_head_works: string | null
  districts_covered: string | null
  updated_at: string | null
  created_at: string | null
}

export interface GlobalEstimate {
  project_name: string
  estimate_number: string
  year_of_estimate: string
  contract_count: number
  completed_count: number
  latest_date: string | null
}

export interface AdminUser {
  id: number
  username: string
  role: string
  is_active: boolean
  allowed_modules: string
  created_at: string | null
}

export interface AdminSubmission {
  id: number
  status: string
  module: string
  name_of_project: string
  estimate_number: string
  year_of_estimate: string
  created_at: string
  created_by_user: string
}

export interface TableColumn {
  column_name: string
  data_type: string
  is_nullable: string
}

export interface SubmissionDetail {
  id: number
  user_id: number
  cycle: number
  status: string
  module: string
  estimate_number: string
  year_of_estimate: string
  name_of_project: string
  created_at: string
  estimate_attachment?: string | null
  sar_attachment?: string | null
  created_by_user: string
  table_data: Record<string, Record<string, unknown>[]>
}
