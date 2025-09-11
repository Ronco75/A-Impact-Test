# Business Licensing API Documentation

## Overview

The Business Licensing API provides endpoints for matching Israeli business profiles to their applicable regulatory requirements. It processes business characteristics (size, type, services) and returns tailored licensing requirements from multiple authorities.

## Base URL
```
http://localhost:3001
```

## Rate Limiting
- **Limit**: 100 requests per 15-minute window per IP
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: When the window resets

---

## Endpoints

### 1. Health Check
**GET** `/health`

Check API server health status.

#### Response
```json
{
  "status": "healthy",
  "timestamp": "2025-09-11T14:43:21.152Z",
  "version": "1.0.0",
  "service": "Business Licensing API"
}
```

---

### 2. API Information
**GET** `/api/info`

Get API metadata and available endpoints.

#### Response
```json
{
  "name": "Business Licensing Requirements API",
  "version": "1.0.0",
  "description": "API for Israeli business licensing requirements matching",
  "endpoints": {
    "POST /api/requirements/match": "Get applicable requirements for business profile",
    "GET /api/requirements/:requirementId": "Get detailed requirement information",
    "GET /api/business-types": "Get available business types",
    "GET /health": "Health check"
  }
}
```

---

### 3. Get Business Types
**GET** `/api/business-types`

Get available business types with descriptions and typical characteristics.

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "restaurant",
      "name": "מסעדה",
      "description": "מסעדה עם שירות מלא",
      "typicalSeating": "20-100",
      "typicalArea": "80-300"
    },
    {
      "id": "cafe",
      "name": "בית קפה", 
      "description": "בית קפה עם מזון קל",
      "typicalSeating": "10-40",
      "typicalArea": "30-100"
    }
    // ... more business types
  ],
  "timestamp": "2025-09-11T14:43:31.218Z"
}
```

---

### 4. Match Requirements (Main Endpoint)
**POST** `/api/requirements/match`

Get applicable licensing requirements for a specific business profile.

#### Request Body
```json
{
  "businessType": "restaurant",
  "seatingCapacity": 45,
  "floorArea": 120,
  "services": {
    "alcoholService": true,
    "deliveryService": false,
    "takeaway": true,
    "liveMusic": true,
    "outdoorSeating": false
  },
  "kitchenFeatures": {
    "gasUsage": true,
    "smokingArea": false,
    "meatHandling": true,
    "dairyProducts": true
  },
  "operationalHours": {
    "lateNightOperation": true,
    "twentyFourSeven": false
  }
}
```

#### Validation Rules
- **businessType**: Required. One of: `restaurant`, `cafe`, `fast_food`, `delivery_only`, `catering`, `food_truck`, `bar_pub`, `hotel_restaurant`
- **seatingCapacity**: Required. Integer, 0-1000
- **floorArea**: Required. Positive number, max 5000 square meters
- **services**: Optional object with boolean values
- **kitchenFeatures**: Optional object with boolean values
- **operationalHours**: Optional object with boolean values

#### Response
```json
{
  "success": true,
  "data": {
    "businessProfile": {
      "businessType": "restaurant",
      "seatingCapacity": 45,
      "floorArea": 120,
      "services": { "alcoholService": true, "takeaway": true, "liveMusic": true },
      "kitchenFeatures": { "gasUsage": true, "meatHandling": true, "dairyProducts": true },
      "operationalHours": { "lateNightOperation": true }
    },
    "requirements": {
      "general": [
        {
          "requirementId": "GEN-001",
          "title": "רישיון עסק כללי",
          "description": "קבלת רישיון עסק מהרשות המקומית",
          "authority": "רשות מקומית",
          "mandatory": true,
          "matchedByRule": "RULE-002"
        }
        // ... more requirements
      ],
      "police": [
        {
          "requirementId": "POL-002",
          "title": "רישיון למכירת משקאות אלכוהוליים",
          "description": "רישיון למכירת משקאות אלכוהוליים למגוון סוגים",
          "authority": "משטרת ישראל",
          "mandatory": true,
          "matchedByRule": "RULE-002"
        }
        // ... more police requirements
      ],
      "health": [
        // Ministry of Health requirements
      ],
      "fire": [
        // Fire Authority requirements
      ]
    },
    "summary": {
      "totalRequirements": 11,
      "mandatoryRequirements": 10,
      "optionalRequirements": 1,
      "authorityCounts": {
        "general": 3,
        "police": 2,
        "health": 3,
        "fire": 3
      },
      "estimatedProcessingTime": "8-12 weeks",
      "complexityLevel": "High"
    },
    "recommendations": [
      {
        "type": "alcohol_license",
        "message": "רישיון אלכוהול דורש תהליך נפרד ועלול להאריך את התהליך",
        "priority": "high"
      }
    ]
  },
  "timestamp": "2025-09-11T14:43:31.456Z"
}
```

#### Error Response (400 - Validation Error)
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "businessType",
      "message": "Business type is required",
      "value": null
    }
  ],
  "timestamp": "2025-09-11T14:43:31.456Z"
}
```

---

### 5. Get Requirement Details
**GET** `/api/requirements/{requirementId}`

Get detailed information about a specific requirement.

#### Parameters
- **requirementId**: String matching pattern `XXX-000` (e.g., `GEN-001`, `POL-002`)

#### Response
```json
{
  "success": true,
  "data": {
    "requirementId": "POL-002",
    "title": "רישיון למכירת משקאות אלכוהוליים",
    "description": "רישיון למכירת משקאות אלכוהוליים למגוון סוגים",
    "authority": "משטרת ישראל",
    "mandatory": true,
    "applicableBusinessTypes": ["restaurant", "bar_pub"],
    "conditions": {
      "requiredServices": ["alcoholService"]
    },
    "category": "police",
    "relatedRequirements": [
      {
        "requirementId": "POL-001",
        "title": "אישור משטרה לפתיחת עסק",
        "authority": "משטרת ישראל"
      }
    ],
    "processingTips": [
      "יש להגיש בקשה לתחנת משטרה המקומית",
      "תהליך הבדיקה עשוי לקחת 2-4 שבועות"
    ]
  },
  "timestamp": "2025-09-11T14:43:31.567Z"
}
```

#### Error Response (404 - Not Found)
```json
{
  "success": false,
  "error": "Requirement not found",
  "details": "Requirement not found: INVALID-999",
  "timestamp": "2025-09-11T14:43:31.567Z"
}
```

---

### 6. Get All Requirements
**GET** `/api/requirements`

Get a summary of all available requirements (for development/debugging).

#### Response
```json
{
  "success": true,
  "data": {
    "total": 16,
    "requirements": [
      {
        "requirementId": "GEN-001",
        "title": "רישיון עסק כללי",
        "authority": "רשות מקומית",
        "category": "general",
        "mandatory": true
      }
      // ... all requirements summary
    ]
  },
  "timestamp": "2025-09-11T14:43:31.678Z"
}
```

---

## Business Profile Schema

### Business Types
- `restaurant` - מסעדה עם שירות מלא
- `cafe` - בית קפה עם מזון קל  
- `fast_food` - מזון מהיר ושירות עצמי
- `delivery_only` - עסק משלוחים ללא ישיבה
- `catering` - שירותי קייטרינג ואירועים
- `food_truck` - משאית מזון
- `bar_pub` - בר או פאב עם אלכוהול
- `hotel_restaurant` - מסעדת מלון

### Services Options
- `alcoholService` - הגשת משקאות אלכוהוליים
- `deliveryService` - שירות משלוחים
- `takeaway` - שירות איסוף עצמי
- `liveMusic` - מוזיקה חיה ואירועים
- `outdoorSeating` - ישיבה חיצונית

### Kitchen Features Options
- `gasUsage` - שימוש בגז לבישול
- `smokingArea` - אזור מיועד לעישון
- `meatHandling` - טיפול במוצרי בשר
- `dairyProducts` - הגשת מוצרי חלב

### Operational Hours Options
- `lateNightOperation` - פעילות אחרי 23:00
- `twentyFourSeven` - פעילות 24/7

---

## Regulatory Authorities

### רשות מקומית (Municipal Authority)
- General business licenses
- Insurance requirements
- Professional certifications

### משטרת ישראל (Israel Police)  
- Business operation permits
- Alcohol sales licenses
- Entertainment and music licenses

### משרד הבריאות (Ministry of Health)
- Food business licenses
- Food handling certifications
- Laboratory testing requirements
- Meat handling permits

### מכבי האש וההצלה הארצי (National Fire and Rescue Authority)
- Fire safety approvals
- Fire suppression systems
- Emergency exit requirements

---

## Error Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| 400 | Bad Request | Invalid input data, validation errors |
| 404 | Not Found | Invalid requirement ID, unknown endpoint |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server processing error |

## Example Usage

### Simple Restaurant Query
```bash
curl -X POST http://localhost:3001/api/requirements/match \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "restaurant",
    "seatingCapacity": 30,
    "floorArea": 100,
    "services": {
      "takeaway": true
    },
    "kitchenFeatures": {
      "gasUsage": true,
      "meatHandling": true
    }
  }'
```

### Get Requirement Details
```bash
curl http://localhost:3001/api/requirements/GEN-001
```

---

## Development Commands

```bash
# Start server
npm start

# Start in development mode (auto-restart)
npm run dev

# Run API tests
node scripts/test-api-endpoints.js

# Process licensing document
npm run process-document

# Run requirements matching tests
npm test
```

---

## Architecture Notes

- **Matching Engine**: Core logic for filtering requirements based on business characteristics
- **Validation Middleware**: Input validation using Joi schemas
- **Rate Limiting**: Simple in-memory rate limiting (15-minute windows)
- **Error Handling**: Comprehensive error handling with detailed messages
- **Logging**: Request logging using Morgan
- **Security**: Helmet for security headers, CORS configuration

The API is designed to be stateless and can handle multiple concurrent requests efficiently.