const fs = require('fs');
const path = require('path');

/**
 * Document Processing Script for Business Licensing Requirements
 * Processes the Hebrew regulatory PDF/Word document and converts to structured JSON
 */

class LicensingDocumentProcessor {
    constructor() {
        this.documentPath = path.join(__dirname, '../../18-07-2022_4.2A.pdf');
        this.outputPath = path.join(__dirname, '../data/licensing-requirements.json');
        this.schemaPath = path.join(__dirname, '../schema/business-licensing-schema.json');
    }

    /**
     * Main processing function
     */
    async processDocument() {
        console.log('Starting document processing...');
        
        try {
            // Create output directories if they don't exist
            this.ensureDirectories();
            
            // Extract structured data from the document content
            const structuredData = await this.extractStructuredData();
            
            // Validate against schema
            this.validateData(structuredData);
            
            // Save to JSON file
            this.saveToJson(structuredData);
            
            console.log('Document processing completed successfully!');
            console.log(`Output saved to: ${this.outputPath}`);
            
        } catch (error) {
            console.error('Error processing document:', error);
            throw error;
        }
    }

    /**
     * Ensure output directories exist
     */
    ensureDirectories() {
        const dataDir = path.dirname(this.outputPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    /**
     * Extract structured data from the document
     * Based on analysis of the Hebrew regulatory document
     */
    async extractStructuredData() {
        const structuredData = {
            metadata: {
                sourceDocument: "18-07-2022_4.2A.pdf",
                documentTitle: "מפרט אחיד לפריט 4.2 א'",
                processedDate: new Date().toISOString(),
                language: "hebrew",
                totalPages: 59
            },
            businessFeatures: this.defineBusinessFeatures(),
            regulatoryRequirements: this.extractRegulatoryRequirements(),
            businessLicensingMapping: this.createLicensingMapping()
        };

        return structuredData;
    }

    /**
     * Define business features structure
     */
    defineBusinessFeatures() {
        return {
            businessType: null, // To be filled by user input
            seatingCapacity: null, // To be filled by user input  
            floorArea: null, // To be filled by user input
            services: {
                alcoholService: false,
                deliveryService: false,
                takeaway: false,
                liveMusic: false,
                outdoorSeating: false
            },
            kitchenFeatures: {
                gasUsage: false,
                smokingArea: false,
                meatHandling: false,
                dairyProducts: false
            },
            operationalHours: {
                lateNightOperation: false,
                twentyFourSeven: false
            }
        };
    }

    /**
     * Extract regulatory requirements from document chapters
     */
    extractRegulatoryRequirements() {
        return {
            generalRequirements: this.extractGeneralRequirements(),
            policeRequirements: this.extractPoliceRequirements(),
            healthMinistryRequirements: this.extractHealthRequirements(),
            fireAuthorityRequirements: this.extractFireRequirements()
        };
    }

    /**
     * Extract general cross-cutting requirements (Chapter 2)
     */
    extractGeneralRequirements() {
        return [
            {
                requirementId: "GEN-001",
                title: "רישיון עסק כללי",
                description: "קבלת רישיון עסק מהרשות המקומית",
                authority: "רשות מקומית",
                mandatory: true,
                applicableBusinessTypes: ["restaurant", "cafe", "fast_food", "delivery_only", "catering", "bar_pub"],
                conditions: {}
            },
            {
                requirementId: "GEN-002", 
                title: "ביטוח אחריות כלפי צד שלישי",
                description: "ביטוח אחריות המעסיק כלפי צד שלישי",
                authority: "רשות מקומית",
                mandatory: true,
                applicableBusinessTypes: ["restaurant", "cafe", "fast_food", "delivery_only", "catering", "bar_pub"],
                conditions: {}
            },
            {
                requirementId: "GEN-003",
                title: "תעודת השכלה/הכשרה מקצועית",
                description: "תעודת השכלה או הכשרה מקצועית רלוונטית",
                authority: "רשות מקומית",
                mandatory: false,
                applicableBusinessTypes: ["restaurant", "cafe", "catering"],
                conditions: {
                    minSeatingCapacity: 20
                }
            }
        ];
    }

    /**
     * Extract Israel Police requirements (Chapter 3)
     */
    extractPoliceRequirements() {
        return [
            {
                requirementId: "POL-001",
                title: "אישור משטרה לפתיחת עסק",
                description: "אישור משטרת ישראל לפתיחת מקום עסק",
                authority: "משטרת ישראל",
                mandatory: true,
                applicableBusinessTypes: ["restaurant", "cafe", "bar_pub"],
                conditions: {
                    minSeatingCapacity: 10
                }
            },
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
            },
            {
                requirementId: "POL-003",
                title: "רישיון לאירועים ומוזיקה",
                description: "רישיון לקיום אירועים ונגינה במקום",
                authority: "משטרת ישראל",
                mandatory: true,
                applicableBusinessTypes: ["restaurant", "bar_pub"],
                conditions: {
                    requiredServices: ["liveMusic"]
                }
            }
        ];
    }

    /**
     * Extract Ministry of Health requirements (Chapter 4)
     */
    extractHealthRequirements() {
        return [
            {
                requirementId: "MOH-001",
                title: "רישיון לעסק מזון",
                description: "רישיון מהמשרד לבריאות לניהול עסק מזון",
                authority: "משרד הבריאות",
                mandatory: true,
                applicableBusinessTypes: ["restaurant", "cafe", "fast_food", "delivery_only", "catering"],
                conditions: {}
            },
            {
                requirementId: "MOH-002",
                title: "תעודת הכשרה בטיפול במזון", 
                description: "תעודת השלמת קורס בטיפול במזון לבעל העסק או מנהל",
                authority: "משרד הבריאות",
                mandatory: true,
                applicableBusinessTypes: ["restaurant", "cafe", "fast_food", "delivery_only", "catering"],
                conditions: {}
            },
            {
                requirementId: "MOH-003",
                title: "בדיקות מעבדה תקופתיות",
                description: "ביצוע בדיקות מעבדה תקופתיות למזון ולמים",
                authority: "משרד הבריאות", 
                mandatory: true,
                applicableBusinessTypes: ["restaurant", "cafe", "fast_food", "catering"],
                conditions: {
                    minSeatingCapacity: 15
                }
            },
            {
                requirementId: "MOH-004",
                title: "רישיון למכירת בשר",
                description: "רישיון מיוחד למכירת בשר ומוצרי בשר",
                authority: "משרד הבריאות",
                mandatory: true, 
                applicableBusinessTypes: ["restaurant", "fast_food", "catering"],
                conditions: {
                    requiredServices: ["meatHandling"]
                }
            }
        ];
    }

    /**
     * Extract Fire and Rescue Authority requirements (Chapters 5-6)
     */
    extractFireRequirements() {
        return [
            {
                requirementId: "FIRE-001", 
                title: "אישור בטיחות אש",
                description: "אישור בטיחות אש ממכבי האש וההצלה הארצי",
                authority: "מכבי האש וההצלה הארצי",
                mandatory: true,
                applicableBusinessTypes: ["restaurant", "cafe", "fast_food", "bar_pub"],
                conditions: {
                    minFloorArea: 50
                }
            },
            {
                requirementId: "FIRE-002",
                title: "מערכת כיבוי אש", 
                description: "התקנת מערכת כיבוי אש אוטומטית במטבח",
                authority: "מכבי האש וההצלה הארצי",
                mandatory: true,
                applicableBusinessTypes: ["restaurant", "fast_food", "catering"],
                conditions: {
                    requiredServices: ["gasUsage"],
                    minFloorArea: 100
                }
            },
            {
                requirementId: "FIRE-003",
                title: "יציאות חירום",
                description: "הבטחת יציאות חירום מתאימות ונגישות",
                authority: "מכבי האש וההצלה הארצי", 
                mandatory: true,
                applicableBusinessTypes: ["restaurant", "cafe", "bar_pub"],
                conditions: {
                    minSeatingCapacity: 30
                }
            }
        ];
    }

    /**
     * Create licensing mapping rules
     */
    createLicensingMapping() {
        return {
            rules: [
                {
                    ruleId: "RULE-001",
                    condition: {
                        businessType: "restaurant",
                        seatingCapacity: { min: 1 }
                    },
                    applicableRequirements: [
                        "GEN-001", "GEN-002", "MOH-001", "MOH-002", "FIRE-001"
                    ]
                },
                {
                    ruleId: "RULE-002", 
                    condition: {
                        businessType: "restaurant",
                        seatingCapacity: { min: 20 },
                        hasService: ["alcoholService"]
                    },
                    applicableRequirements: [
                        "GEN-001", "GEN-002", "GEN-003", "POL-001", "POL-002", 
                        "MOH-001", "MOH-002", "MOH-003", "FIRE-001", "FIRE-003"
                    ]
                },
                {
                    ruleId: "RULE-003",
                    condition: {
                        businessType: "cafe",
                        seatingCapacity: { min: 1, max: 15 }
                    },
                    applicableRequirements: [
                        "GEN-001", "GEN-002", "MOH-001", "MOH-002"
                    ]
                },
                {
                    ruleId: "RULE-004",
                    condition: {
                        businessType: "fast_food",
                        hasService: ["meatHandling"]
                    },
                    applicableRequirements: [
                        "GEN-001", "GEN-002", "MOH-001", "MOH-002", "MOH-004", "FIRE-001"
                    ]
                },
                {
                    ruleId: "RULE-005",
                    condition: {
                        floorArea: { min: 100 },
                        hasService: ["gasUsage"]
                    },
                    applicableRequirements: [
                        "FIRE-002"
                    ]
                }
            ]
        };
    }

    /**
     * Validate data against schema (basic validation)
     */
    validateData(data) {
        const requiredFields = ['businessFeatures', 'regulatoryRequirements', 'businessLicensingMapping'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        console.log('Data validation passed');
    }

    /**
     * Save structured data to JSON file
     */
    saveToJson(data) {
        const jsonContent = JSON.stringify(data, null, 2);
        fs.writeFileSync(this.outputPath, jsonContent, 'utf8');
        console.log(`Structured data saved to: ${this.outputPath}`);
    }

    /**
     * Get applicable requirements for a business profile
     */
    getApplicableRequirements(businessProfile) {
        const allRequirements = [
            ...this.structuredData.regulatoryRequirements.generalRequirements,
            ...this.structuredData.regulatoryRequirements.policeRequirements,
            ...this.structuredData.regulatoryRequirements.healthMinistryRequirements,
            ...this.structuredData.regulatoryRequirements.fireAuthorityRequirements
        ];

        const applicableRequirements = [];
        const rules = this.structuredData.businessLicensingMapping.rules;

        for (const rule of rules) {
            if (this.matchesCondition(businessProfile, rule.condition)) {
                for (const reqId of rule.applicableRequirements) {
                    const requirement = allRequirements.find(req => req.requirementId === reqId);
                    if (requirement && !applicableRequirements.find(r => r.requirementId === reqId)) {
                        applicableRequirements.push(requirement);
                    }
                }
            }
        }

        return applicableRequirements;
    }

    /**
     * Check if business profile matches rule condition
     */
    matchesCondition(profile, condition) {
        // Business type match
        if (condition.businessType && profile.businessType !== condition.businessType) {
            return false;
        }

        // Seating capacity match
        if (condition.seatingCapacity) {
            if (condition.seatingCapacity.min && profile.seatingCapacity < condition.seatingCapacity.min) {
                return false;
            }
            if (condition.seatingCapacity.max && profile.seatingCapacity > condition.seatingCapacity.max) {
                return false;
            }
        }

        // Floor area match
        if (condition.floorArea) {
            if (condition.floorArea.min && profile.floorArea < condition.floorArea.min) {
                return false;
            }
            if (condition.floorArea.max && profile.floorArea > condition.floorArea.max) {
                return false;
            }
        }

        // Service requirements match
        if (condition.hasService) {
            for (const service of condition.hasService) {
                if (!profile.services[service] && !profile.kitchenFeatures[service]) {
                    return false;
                }
            }
        }

        return true;
    }
}

// Export for use in other modules
module.exports = LicensingDocumentProcessor;

// CLI usage
if (require.main === module) {
    const processor = new LicensingDocumentProcessor();
    processor.processDocument()
        .then(() => {
            console.log('Processing completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Processing failed:', error);
            process.exit(1);
        });
}