import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BusinessQuestionnaire from './BusinessQuestionnaire'
import type { BusinessData } from './BusinessQuestionnaire'
import type { BusinessProfile } from '../services/api'
import apiService from '../services/api'

const QuestionnairePage = () => {
  const navigate = useNavigate()
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
      
      // Navigate to report page with the data
      navigate('/report', {
        state: {
          report: reportResponse.data.report
        }
      });
      
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת הדוח');
    } finally {
      setIsLoading(false);
    }
  }

  const handleStartOver = () => {
    setError(null)
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

export default QuestionnairePage