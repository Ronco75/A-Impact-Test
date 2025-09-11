# Business Licensing API - Backend System

This Node.js API server provides endpoints for matching Israeli business profiles to their applicable regulatory requirements. It processes business characteristics and returns tailored licensing requirements from multiple authorities.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Start in development mode (auto-restart)
npm run dev

# Test all endpoints
npm run test-api

# See usage examples  
npm run examples
```

The API will be available at `http://localhost:3001`

## 📋 Core Features

✅ **Smart Requirements Matching** - Filters regulatory requirements based on business size, type, and features  
✅ **Multi-Authority Support** - Handles requirements from Municipal, Police, Health Ministry, and Fire Authority  
✅ **Comprehensive Validation** - Input validation with detailed error messages  
✅ **Rate Limiting** - Built-in rate limiting (100 requests per 15 minutes)  
✅ **Detailed Documentation** - Complete API documentation and examples  
✅ **Hebrew Language Support** - Preserves authentic Hebrew regulatory text  

## 🔧 Main API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/requirements/match` | POST | **Main endpoint** - Get applicable requirements for business profile |
| `/api/requirements/:id` | GET | Get detailed requirement information |
| `/api/business-types` | GET | Get available business types with descriptions |
| `/health` | GET | Health check endpoint |

## 📊 Example Request/Response

**Request:**
```json
POST /api/requirements/match
{
  "businessType": "restaurant",
  "seatingCapacity": 30,
  "floorArea": 100,
  "services": { "takeaway": true },
  "kitchenFeatures": { "gasUsage": true, "meatHandling": true }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "requirements": {
      "general": [{"requirementId": "GEN-001", "title": "רישיון עסק כללי", ...}],
      "health": [{"requirementId": "MOH-001", "title": "רישיון לעסק מזון", ...}],
      "fire": [{"requirementId": "FIRE-001", "title": "אישור בטיחות אש", ...}]
    },
    "summary": {
      "totalRequirements": 6,
      "mandatoryRequirements": 6,
      "estimatedProcessingTime": "2-4 weeks",
      "complexityLevel": "Medium"
    }
  }
}
```

---

# Document Processing System

This system also processes Hebrew regulatory documents for business licensing requirements and converts them to structured JSON data for automated requirement matching.

## Overview

The system analyzes the regulatory document "18-07-2022_4.2A.pdf" (מפרט אחיד לפריט 4.2 א') and extracts licensing requirements for Israeli food service establishments, organizing them by regulatory authority and business characteristics.

## Directory Structure

```
backend/
├── README.md                                    # This file
├── data/
│   └── licensing-requirements.json             # Processed structured data
├── schema/
│   └── business-licensing-schema.json          # JSON schema definition
└── scripts/
    ├── process-licensing-document.js           # Main processing script
    └── test-requirements-matching.js           # Test script for validation
```

## Components

### 1. JSON Schema (`schema/business-licensing-schema.json`)

Defines the structure for:
- **Business Features**: Characteristics that determine licensing requirements
  - Business type (restaurant, cafe, fast_food, etc.)
  - Seating capacity and floor area
  - Services offered (alcohol, delivery, takeaway, etc.)
  - Kitchen features (gas usage, meat handling, etc.)
  - Operational hours

- **Regulatory Requirements**: Organized by authority
  - General requirements (municipal)
  - Israel Police requirements
  - Ministry of Health requirements  
  - Fire and Rescue Authority requirements

- **Business Licensing Mapping**: Rules connecting business features to applicable requirements

### 2. Document Processing Script (`scripts/process-licensing-document.js`)

**LicensingDocumentProcessor Class:**
- Processes the Hebrew regulatory PDF document
- Extracts structured requirements data organized by chapters:
  - Chapter 1: General definitions
  - Chapter 2: Cross-cutting conditions
  - Chapter 3: Israel Police requirements
  - Chapter 4: Ministry of Health requirements
  - Chapter 5-6: Fire and Rescue Authority requirements
- Creates mapping rules between business characteristics and regulatory requirements
- Exports structured JSON data

**Key Methods:**
- `processDocument()`: Main processing workflow
- `extractRegulatoryRequirements()`: Extracts requirements by authority
- `createLicensingMapping()`: Creates business-to-requirement mapping rules
- `getApplicableRequirements(businessProfile)`: Returns requirements for a specific business profile
- `matchesCondition(profile, condition)`: Logic for matching business features to requirement conditions

### 3. Test Script (`scripts/test-requirements-matching.js`)

**RequirementsMatchingTester Class:**
- Tests the requirement matching functionality with various business profiles
- Validates that different business types get appropriate requirements
- Demonstrates the system with realistic scenarios:
  - Small restaurant with basic services
  - Large restaurant with alcohol service
  - Small cafe
  - Fast food with meat handling

## Data Structure

### Business Features
```javascript
{
  businessType: "restaurant|cafe|fast_food|delivery_only|catering|bar_pub",
  seatingCapacity: 45,
  floorArea: 150,
  services: {
    alcoholService: true,
    deliveryService: false,
    takeaway: true,
    liveMusic: true,
    outdoorSeating: true
  },
  kitchenFeatures: {
    gasUsage: true,
    smokingArea: false,
    meatHandling: true,
    dairyProducts: true
  },
  operationalHours: {
    lateNightOperation: true,
    twentyFourSeven: false
  }
}
```

### Regulatory Requirements
```javascript
{
  requirementId: "POL-002",
  title: "רישיון למכירת משקאות אלכוהוליים",
  description: "רישיון למכירת משקאות אלכוהוליים למגוון סוגים",
  authority: "משטרת ישראל",
  mandatory: true,
  applicableBusinessTypes: ["restaurant", "bar_pub"],
  conditions: {
    requiredServices: ["alcoholService"]
  }
}
```

## Usage

### Process Document
```bash
node scripts/process-licensing-document.js
```

### Test Requirements Matching  
```bash
node scripts/test-requirements-matching.js
```

### Use as Module
```javascript
const LicensingDocumentProcessor = require('./scripts/process-licensing-document');

const processor = new LicensingDocumentProcessor();
await processor.processDocument();

// Get requirements for a specific business
const businessProfile = {
  businessType: "restaurant",
  seatingCapacity: 30,
  floorArea: 100,
  services: { alcoholService: true },
  // ... other features
};

const requirements = processor.getApplicableRequirements(businessProfile);
```

## Extracted Requirements Categories

### General Requirements (Municipal Authority)
- GEN-001: רישיון עסק כללי (General business license)
- GEN-002: ביטוח אחריות כלפי צד שלישי (Third party liability insurance)
- GEN-003: תעודת השכלה/הכשרה מקצועית (Professional education/training certificate)

### Police Requirements (משטרת ישראל)
- POL-001: אישור משטרה לפתיחת עסק (Police approval for business opening)
- POL-002: רישיון למכירת משקאות אלכוהוליים (Alcohol sales license)
- POL-003: רישיון לאירועים ומוזיקה (Events and music license)

### Health Ministry Requirements (משרד הבריאות)
- MOH-001: רישיון לעסק מזון (Food business license)
- MOH-002: תעודת הכשרה בטיפול במזון (Food handling training certificate)
- MOH-003: בדיקות מעבדה תקופתיות (Periodic laboratory testing)
- MOH-004: רישיון למכירת בשר (Meat sales license)

### Fire Authority Requirements (מכבי האש וההצלה הארצי)
- FIRE-001: אישור בטיחות אש (Fire safety approval)
- FIRE-002: מערכת כיבוי אש (Fire suppression system)
- FIRE-003: יציאות חירום (Emergency exits)

## Mapping Logic Examples

1. **Basic Restaurant (1-19 seats)**: Gets basic municipal, health, and fire requirements
2. **Large Restaurant with Alcohol (20+ seats)**: Adds police requirements, professional training, and enhanced safety measures
3. **Small Cafe**: Minimal requirements focused on food safety
4. **Fast Food with Meat**: Includes specialized meat handling requirements

## Technical Notes

- Source document: Hebrew regulatory PDF (59 pages)
- Processing approach: Manual extraction and categorization of requirements
- Focus on practical implementation rather than complete document processing
- Designed for extensibility and integration with AI-powered report generation
- All requirement text preserved in Hebrew for authenticity

## Integration Points

This processed data serves as the foundation for:
- Digital questionnaire systems
- AI-powered requirement matching
- Automated regulatory compliance reporting
- Business licensing guidance applications

The structured format enables easy integration with LLM APIs for generating personalized compliance reports in clear, business-friendly language.