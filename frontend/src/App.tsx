import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import QuestionnairePage from './components/QuestionnairePage'
import ReportPage from './components/ReportPage'
import './components/BusinessQuestionnaire.css'
import './components/Report.css'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<QuestionnairePage />} />
        <Route path="/report" element={<ReportPage />} />
      </Routes>
    </Router>
  )
}

export default App
