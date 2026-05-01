import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import DPRViewPage from './pages/DPRViewPage'
import DPRFormPage from './pages/DPRFormPage'
import CreateEstimatePage from './pages/CreateEstimatePage'
import EstimateGroupPage from './pages/EstimateGroupPage'
import SubmissionDetailsPage from './pages/SubmissionDetailsPage'
import AnalysisPage from './pages/AnalysisPage'
import MSIPage from './pages/MSIPage'
import AboutPage from './pages/AboutPage'
import AllDPRsPage from './pages/AllDPRsPage'
import AllEstimatesPage from './pages/AllEstimatesPage'
import AdminPage from './pages/AdminPage'
import NewProjectPage from './pages/NewProjectPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/new" element={<NewProjectPage />} />
          <Route path="/projects/:projectName" element={<ProjectDetailPage />} />
          <Route path="/projects/:projectName/dpr" element={<DPRViewPage />} />
          <Route path="/projects/:projectName/dpr/edit" element={<DPRFormPage />} />
          <Route path="/projects/:projectName/estimates/new" element={<CreateEstimatePage />} />
          <Route path="/projects/:projectName/estimates/:estNo/:estYr" element={<EstimateGroupPage />} />
          <Route path="/submissions/:subId" element={<SubmissionDetailsPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/msi" element={<MSIPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/all-dprs" element={<AllDPRsPage />} />
          <Route path="/all-estimates" element={<AllEstimatesPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
