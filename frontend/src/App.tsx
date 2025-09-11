import { useState } from 'react'
import BusinessQuestionnaire from './components/BusinessQuestionnaire'
import type { BusinessData } from './components/BusinessQuestionnaire'
import './components/BusinessQuestionnaire.css'
import './App.css'

const CHARACTERISTICS_HEBREW_MAP: Record<string, string> = {
  'gas_usage': 'שימוש בגז',
  'meat_sales': 'מכירת בשר',
  'alcohol_service': 'הגשת אלכוהול',
  'delivery_service': 'שירות משלוח',
  'outdoor_seating': 'ישיבה בחוץ',
  'live_music': 'מוסיקה חיה/בידור',
  'catering': 'שירותי קייטרינג',
  'late_hours': 'פעילות לאחר 23:00',
  'food_truck': 'מזון נייד',
  'kosher': 'אישור כשרות'
};

function App() {
  const [submittedData, setSubmittedData] = useState<BusinessData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleQuestionnaireSubmit = async (data: BusinessData) => {
    setIsLoading(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('Business data submitted:', data)
    setSubmittedData(data)
    setIsLoading(false)
  }

  const handleStartOver = () => {
    setSubmittedData(null)
  }

  if (submittedData) {
    return (
      <div className="app">
        <div className="results-container">
          <h1>שאלון הושלם</h1>
          <p>המידע על העסק שלך נאסף בהצלחה.</p>
          
          <div className="submitted-data">
            <h2>מידע שנשלח:</h2>
            <ul>
              <li><strong>גודל העסק:</strong> {submittedData.businessSize} מטרים רבועים</li>
              <li><strong>תפוסה:</strong> {submittedData.seatingCapacity} מקומות</li>
              <li><strong>מאפיינים נוספים:</strong> {
                submittedData.additionalCharacteristics.length > 0 
                  ? submittedData.additionalCharacteristics.map(char => CHARACTERISTICS_HEBREW_MAP[char] || char).join(', ')
                  : 'לא נבחרו'
              }</li>
            </ul>
          </div>
          
          <p className="next-steps">
            האינטגרציה עם בינה מלאכותית ויצירת הדוח יימשלמו בשלב הבא.
          </p>
          
          <button onClick={handleStartOver} className="start-over-button">
            התחל מחדש
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <BusinessQuestionnaire 
        onSubmit={handleQuestionnaireSubmit}
        isLoading={isLoading}
      />
    </div>
  )
}

export default App
