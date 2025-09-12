import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import Report from './Report'
import type { GeneratedReport } from '../services/api'

interface ReportPageState {
  report: GeneratedReport
}

const ReportPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  
  const state = location.state as ReportPageState | null

  useEffect(() => {
    // If no report data, redirect to home
    if (!state?.report) {
      navigate('/', { replace: true })
    }
  }, [state, navigate])

  const handleStartOver = () => {
    navigate('/', { replace: true })
  }

  if (!state?.report) {
    return null // Will redirect to home
  }

  return (
    <div className="app">
      <Report 
        report={state.report}
        onStartOver={handleStartOver}
      />
    </div>
  )
}

export default ReportPage