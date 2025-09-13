# Israeli Business Licensing Requirements System

A comprehensive system that helps business owners in Israel understand the regulatory requirements relevant to their business. The system receives business information and returns a customized report with applicable regulatory requirements.

# **IMPORTANT: API Key Required**
**To run this application, you will need an OpenRouter API key for AI report generation. The API key should be included in the zip file provided. Place it in the `.env` file as shown in the installation instructions.**

## Project Description and Goals

This system processes Hebrew regulatory documents for restaurants and food service establishments, providing:
- Digital questionnaire for business characteristics collection
- Intelligent matching engine that maps business profiles to licensing requirements
- AI-powered report generation using OpenRouter/LLM integration
- Comprehensive regulatory compliance guidance from multiple Israeli authorities

The system focuses on regulatory requirements from:
- Municipal Authority (רשות מקומית) - General business licenses, insurance, professional certifications
- Israel Police (משטרת ישראל) - Alcohol licenses, entertainment permits
- Ministry of Health (משרד הבריאות) - Food business licenses, handling certifications
- Fire Authority (מכבי האש) - Fire safety approvals, suppression systems

## Installation and Setup

### Prerequisites
- Node.js >= 16.0.0
- npm >= 8.0.0

### Installation Steps

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd a-impact-test
npm install
```

2. **Install backend dependencies:**
```bash
cd backend
npm install
```

3. **Install frontend dependencies:**
```bash
cd ../frontend
npm install
```

4. **Environment Configuration:**
Create `.env` file in the root & backend directory:
```bash
# Add your OpenRouter API key (provided in zip file)
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

### Running the Application

**Development Mode (Recommended):**
```bash
npm run dev                    # Run both backend and frontend concurrently
```

**Individual Services:**
```bash
npm run dev:backend            # Backend only (port 3001)
npm run dev:frontend           # Frontend only (port 5173)
```

**Backend Commands:**
```bash
cd backend
npm run dev                    # Development server with auto-reload
npm start                      # Production server
npm run build                  # TypeScript compilation
npm test                       # Run requirements matching tests
npm run test-api               # Test all API endpoints
npm run process-document       # Process licensing document to JSON
```

**Frontend Commands:**
```bash
cd frontend
npm run dev                    # Vite development server
npm run build                  # Production build
npm run lint                   # ESLint code checking
npm run preview                # Preview production build
```

## Dependencies and Versions

### Root Dependencies
- npm-run-all: ^4.1.5

### Backend Dependencies
- **Core Framework:** Express ^4.18.2, Node.js >=16.0.0
- **Security:** helmet ^7.0.0, cors ^2.8.5, compression ^1.7.4
- **Validation:** joi ^17.9.2
- **HTTP Client:** axios ^1.11.0
- **Environment:** dotenv ^17.2.2
- **Logging:** morgan ^1.10.0
- **Development:** nodemon ^3.1.10, TypeScript ^5.9.2, ts-node ^10.9.2

### Frontend Dependencies
- **Core Framework:** React ^19.1.1, React DOM ^19.1.1
- **Routing:** react-router-dom ^7.9.0
- **Build Tool:** Vite ^7.1.2
- **TypeScript:** ~5.8.3
- **Linting:** ESLint ^9.33.0, TypeScript ESLint ^8.39.1

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   OpenRouter    │
│   (React/Vite)  │───▶│  (Node.js/API)  │───▶│   AI Service    │
│   Port 5173     │    │   Port 3001     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         │              │  Licensing Data │
         └──────────────▶│     (JSON)      │
                        └─────────────────┘
```

### Component Breakdown

**Data Processing Pipeline:**
- Document Processing Script (`process-licensing-document.js`) - Converts Hebrew PDF/Word to structured JSON
- Licensing Requirements Data (`licensing-requirements.json`) - Structured regulatory requirements
- JSON Schema Definition (`business-licensing-schema.json`) - Data structure validation

**Backend Services:**
- Express Server (`server.js`) - Main API server with security middleware
- Matching Engine (`matching-engine.js`) - Core business logic for requirement matching
- OpenRouter Service (`openrouter-service.js`) - AI integration for report generation
- Validation Middleware (`validation.js`) - Request validation using Joi schemas

**Frontend Application:**
- React 19 with TypeScript
- Vite build system and development server
- Component-based architecture for questionnaire interface
- API integration for backend communication

## API Documentation

### Base URL
```
http://localhost:3001
```

### Core Endpoints

**Health Check:**
```
GET /health
```

**Match Requirements (Main Endpoint):**
```
POST /api/requirements/match
Content-Type: application/json

{
  "businessType": "restaurant",
  "seatingCapacity": 45,
  "floorArea": 120,
  "services": {
    "alcoholService": true,
    "takeaway": true,
    "liveMusic": true
  },
  "kitchenFeatures": {
    "gasUsage": true,
    "meatHandling": true,
    "dairyProducts": true
  },
  "operationalHours": {
    "lateNightOperation": true
  }
}
```

**Generate AI Report:**
```
POST /api/generate-report
Content-Type: application/json

{
  "businessProfile": {...},
  "requirements": {...}
}
```

**Get Business Types:**
```
GET /api/business-types
```

**Get Requirement Details:**
```
GET /api/requirements/{requirementId}
```

### Rate Limiting
- 100 requests per 15-minute window per IP
- Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

## Data Structure Schema

### Business Profile Schema
```json
{
  "businessType": "restaurant|cafe|fast_food|delivery_only|catering|food_truck|bar_pub|hotel_restaurant",
  "seatingCapacity": "integer (0-1000)",
  "floorArea": "number (positive, max 5000 sqm)",
  "services": {
    "alcoholService": "boolean",
    "deliveryService": "boolean",
    "takeaway": "boolean",
    "liveMusic": "boolean",
    "outdoorSeating": "boolean"
  },
  "kitchenFeatures": {
    "gasUsage": "boolean",
    "smokingArea": "boolean",
    "meatHandling": "boolean",
    "dairyProducts": "boolean"
  },
  "operationalHours": {
    "lateNightOperation": "boolean",
    "twentyFourSeven": "boolean"
  }
}
```

### Requirements Response Schema
```json
{
  "requirements": {
    "general": [...],    // Municipal requirements
    "police": [...],     // Police licensing requirements
    "health": [...],     // Health ministry requirements
    "fire": [...]        // Fire authority requirements
  },
  "summary": {
    "totalRequirements": "number",
    "mandatoryRequirements": "number",
    "authorityCounts": {...},
    "estimatedProcessingTime": "string",
    "complexityLevel": "string"
  }
}
```

## Matching Algorithm Logic

### Core Matching Process
1. **Profile Validation** - Validates business profile against JSON schema
2. **Requirement Filtering** - Filters all requirements based on business characteristics
3. **Rule Application** - Applies conditional logic for specific requirements
4. **Authority Grouping** - Organizes results by regulatory authority
5. **Summary Calculation** - Generates processing estimates and complexity analysis

### Matching Rules
- **Business Type Matching** - Direct mapping between business types and requirement categories
- **Capacity-Based Rules** - Seating capacity and floor area thresholds trigger specific requirements
- **Service-Based Rules** - Services like alcohol, delivery, live music activate additional requirements
- **Feature-Based Rules** - Kitchen features like gas usage, meat handling require specific permits
- **Operational Rules** - Late night operations trigger additional police and municipal requirements

### Rule Examples
- Alcohol service → Police alcohol license requirement
- Seating capacity >50 → Enhanced fire safety requirements
- Gas usage → Fire authority approval for gas installations
- Meat handling → Health ministry meat handling certification
- Live music → Police entertainment permit

The matching engine processes these rules sequentially and returns all applicable requirements with detailed explanations and processing recommendations.
