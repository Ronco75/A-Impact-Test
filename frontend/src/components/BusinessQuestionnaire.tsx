import { useState } from 'react';

export interface BusinessData {
  businessSize: number | '';
  seatingCapacity: number | '';
  additionalCharacteristics: string[];
  customCharacteristic?: string;
}

interface BusinessQuestionnaireProps {
  onSubmit: (data: BusinessData) => void;
  isLoading?: boolean;
}

const ADDITIONAL_CHARACTERISTICS = [
  { value: 'gas_usage', label: 'שימוש בגז' },
  { value: 'meat_sales', label: 'מכירת בשר' },
  { value: 'alcohol_service', label: 'הגשת אלכוהול' },
  { value: 'delivery_service', label: 'שירות משלוח' },
  { value: 'outdoor_seating', label: 'ישיבה בחוץ' },
  { value: 'live_music', label: 'מוסיקה חיה/בידור' },
  { value: 'catering', label: 'שירותי קייטרינג' },
  { value: 'late_hours', label: 'פעילות לאחר 23:00' },
  { value: 'food_truck', label: 'מזון נייד' },
  { value: 'kosher', label: 'אישור כשרות' }
];

export default function BusinessQuestionnaire({ onSubmit, isLoading = false }: BusinessQuestionnaireProps) {
  const [formData, setFormData] = useState<BusinessData>({
    businessSize: '',
    seatingCapacity: '',
    additionalCharacteristics: [],
    customCharacteristic: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BusinessData, string>>>({});

  const handleNumberInput = (field: 'businessSize' | 'seatingCapacity') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value === '' ? '' : Number(value)
    }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCharacteristicsChange = (characteristic: string) => {
    setFormData(prev => {
      const newCharacteristics = prev.additionalCharacteristics.includes(characteristic)
        ? prev.additionalCharacteristics.filter(c => c !== characteristic)
        : [...prev.additionalCharacteristics, characteristic];
      
      return {
        ...prev,
        additionalCharacteristics: newCharacteristics
      };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BusinessData, string>> = {};

    if (!formData.businessSize || formData.businessSize <= 0) {
      newErrors.businessSize = 'אנא הכנס גודל עסק תקין במטרים רבועים';
    }

    if (!formData.seatingCapacity || formData.seatingCapacity <= 0) {
      newErrors.seatingCapacity = 'אנא הכנס מספר מקומות ישיבה/תפוסה תקין';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };


  return (
    <div className="questionnaire-container">
      <div className="questionnaire-header">
        <h1>שאלון רישוי עסקים</h1>
        <p>אנא ספק מידע על העסק שלך כדי לקבל דוח מותאם אישית לדרישות הרישוי.</p>
      </div>

      <form onSubmit={handleSubmit} className="questionnaire-form">
        <div className="form-section">
          <h2>מידע בסיסי</h2>
          
          <div className="form-group">
            <label htmlFor="businessSize">
              גודל העסק (מטרים רבועים) <span className="required">*</span>
            </label>
            <input
              type="number"
              id="businessSize"
              min="1"
              step="0.1"
              value={formData.businessSize}
              onChange={handleNumberInput('businessSize')}
              className={errors.businessSize ? 'error' : ''}
              placeholder="הכנס גודל במטרים רבועים"
            />
            {errors.businessSize && <span className="error-message">{errors.businessSize}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="seatingCapacity">
              מספר מקומות ישיבה/תפוסה <span className="required">*</span>
            </label>
            <input
              type="number"
              id="seatingCapacity"
              min="1"
              value={formData.seatingCapacity}
              onChange={handleNumberInput('seatingCapacity')}
              className={errors.seatingCapacity ? 'error' : ''}
              placeholder="הכנס תפוסה מקסימלית"
            />
            {errors.seatingCapacity && <span className="error-message">{errors.seatingCapacity}</span>}
          </div>
        </div>

        <div className="form-section">
          <h2>מאפיינים נוספים</h2>
          <p className="section-description">
            בחר את כל המאפיינים הרלוונטיים לעסק שלך:
          </p>
          
          <div className="characteristics-grid">
            {ADDITIONAL_CHARACTERISTICS.map(characteristic => (
              <label key={characteristic.value} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.additionalCharacteristics.includes(characteristic.value)}
                  onChange={() => handleCharacteristicsChange(characteristic.value)}
                />
                <span className="checkbox-text">{characteristic.label}</span>
              </label>
            ))}
          </div>

        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={isLoading}
            className="submit-button"
          >
{isLoading ? 'מייצר דוח...' : 'יצירת דוח'}
          </button>
        </div>
      </form>
    </div>
  );
}