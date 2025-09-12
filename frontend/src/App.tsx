import { useState } from 'react'
import BusinessQuestionnaire from './components/BusinessQuestionnaire'
import Report from './components/Report'
import type { BusinessData } from './components/BusinessQuestionnaire'
import type { BusinessProfile, GeneratedReport, RequirementsResponse } from './services/api'
import apiService from './services/api'
import './components/BusinessQuestionnaire.css'
import './components/Report.css'
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
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null)
  const [rawRequirements, setRawRequirements] = useState<RequirementsResponse['data'] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const convertBusinessDataToProfile = (data: BusinessData): BusinessProfile => {
    // Determine business type based on characteristics - simplified logic
    let businessType = 'restaurant'; // default
    
    if (data.additionalCharacteristics.includes('delivery_service') && 
        data.additionalCharacteristics.length === 1) {
      businessType = 'delivery_only';
    } else if (data.additionalCharacteristics.includes('catering')) {
      businessType = 'catering';
    } else if (data.additionalCharacteristics.includes('alcohol_service')) {
      businessType = 'bar_pub';
    } else if (data.seatingCapacity && Number(data.seatingCapacity) < 30) {
      businessType = 'cafe';
    }

    // Convert to the backend's expected structure
    return {
      businessType,
      floorArea: Number(data.businessSize),
      seatingCapacity: Number(data.seatingCapacity),
      services: {
        alcoholService: data.additionalCharacteristics.includes('alcohol_service'),
        deliveryService: data.additionalCharacteristics.includes('delivery_service'),
        liveMusic: data.additionalCharacteristics.includes('live_music'),
        outdoorSeating: data.additionalCharacteristics.includes('outdoor_seating')
      },
      kitchenFeatures: {
        gasUsage: data.additionalCharacteristics.includes('gas_usage'),
        meatHandling: data.additionalCharacteristics.includes('meat_sales')
      },
      operationalHours: {
        lateNightOperation: data.additionalCharacteristics.includes('late_hours')
      }
    };
  };

  const handleQuestionnaireSubmit = async (data: BusinessData) => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Business data submitted:', data)
      
      const businessProfile = convertBusinessDataToProfile(data);
      console.log('Converted business profile:', businessProfile);
      
      // Generate the report using the API
      const reportResponse = await apiService.generateReport(businessProfile);
      
      console.log('Report generated successfully:', reportResponse);
      
      setGeneratedReport(reportResponse.data.report);
      setRawRequirements(reportResponse.data.rawRequirements);
      
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת הדוח');
    } finally {
      setIsLoading(false);
    }
  }

  const handleStartOver = () => {
    setGeneratedReport(null)
    setRawRequirements(null)
    setError(null)
  }

  // Show report if generated
  if (generatedReport) {
    return (
      <div className="app">
        <Report 
          report={generatedReport}
          rawRequirements={rawRequirements}
          onStartOver={handleStartOver}
        />
      </div>
    )
  }

  // Show error if occurred
  if (error) {
    return (
      <div className="app">
        <div className="error-container">
          <h1>שגיאה ביצירת הדוח</h1>
          <p className="error-message">{error}</p>
          <div className="error-details">
            <p>ודא שהשרת מופעל ומחובר לאינטרנט.</p>
          </div>
          <button onClick={handleStartOver} className="start-over-button">
            נסה שוב
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
