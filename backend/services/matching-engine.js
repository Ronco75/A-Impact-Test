const fs = require('fs');
const path = require('path');

/**
 * Business Licensing Requirements Matching Engine
 * Handles the core logic for matching business profiles to regulatory requirements
 */

class MatchingEngine {
    constructor() {
        this.requirementsData = null;
        this.loadRequirements();
    }

    /**
     * Load licensing requirements data from JSON file
     */
    loadRequirements() {
        try {
            const dataPath = path.join(__dirname, '../data/licensing-requirements.json');
            const rawData = fs.readFileSync(dataPath, 'utf8');
            this.requirementsData = JSON.parse(rawData);
            console.log('Licensing requirements data loaded successfully');
        } catch (error) {
            console.error('Error loading requirements data:', error);
            throw new Error('Failed to load licensing requirements data');
        }
    }

    /**
     * Main method to find applicable requirements for a business profile
     * @param {Object} businessProfile - Business characteristics from questionnaire
     * @returns {Object} Filtered requirements with metadata
     */
    findApplicableRequirements(businessProfile) {
        try {
            // Validate input
            this.validateBusinessProfile(businessProfile);

            // Get all requirements
            const allRequirements = this.getAllRequirements();

            // Apply matching rules
            const applicableRequirements = this.applyMatchingRules(businessProfile, allRequirements);

            // Group requirements by authority
            const groupedRequirements = this.groupRequirementsByAuthority(applicableRequirements);

            // Calculate summary statistics
            const summary = this.calculateSummary(applicableRequirements);

            return {
                businessProfile: this.sanitizeBusinessProfile(businessProfile),
                requirements: groupedRequirements,
                summary: summary,
                processedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error finding applicable requirements:', error);
            throw error;
        }
    }

    /**
     * Validate business profile input
     * @param {Object} profile - Business profile to validate
     */
    validateBusinessProfile(profile) {
        const requiredFields = ['businessType', 'seatingCapacity', 'floorArea'];
        
        for (const field of requiredFields) {
            if (profile[field] === undefined || profile[field] === null) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Validate business type
        const validBusinessTypes = [
            'restaurant', 'cafe', 'fast_food', 'delivery_only', 
            'catering', 'food_truck', 'bar_pub', 'hotel_restaurant'
        ];
        if (!validBusinessTypes.includes(profile.businessType)) {
            throw new Error(`Invalid business type: ${profile.businessType}`);
        }

        // Validate numeric values
        if (typeof profile.seatingCapacity !== 'number' || profile.seatingCapacity < 0) {
            throw new Error('Seating capacity must be a non-negative number');
        }
        if (typeof profile.floorArea !== 'number' || profile.floorArea <= 0) {
            throw new Error('Floor area must be a positive number');
        }
    }

    /**
     * Get all requirements from all authorities
     * @returns {Array} All requirements with source authority
     */
    getAllRequirements() {
        const requirements = [];
        const regulatoryReqs = this.requirementsData.regulatoryRequirements;

        // Add general requirements
        regulatoryReqs.generalRequirements.forEach(req => {
            requirements.push({ ...req, category: 'general' });
        });

        // Add police requirements
        regulatoryReqs.policeRequirements.forEach(req => {
            requirements.push({ ...req, category: 'police' });
        });

        // Add health ministry requirements
        regulatoryReqs.healthMinistryRequirements.forEach(req => {
            requirements.push({ ...req, category: 'health' });
        });

        // Add fire authority requirements
        regulatoryReqs.fireAuthorityRequirements.forEach(req => {
            requirements.push({ ...req, category: 'fire' });
        });

        return requirements;
    }

    /**
     * Apply matching rules to filter requirements based on business profile
     * @param {Object} profile - Business profile
     * @param {Array} allRequirements - All available requirements
     * @returns {Array} Filtered applicable requirements
     */
    applyMatchingRules(profile, allRequirements) {
        const applicableRequirements = [];
        const rules = this.requirementsData.businessLicensingMapping.rules;

        // For each rule, check if it applies to this business profile
        for (const rule of rules) {
            if (this.matchesRuleCondition(profile, rule.condition)) {
                // Add all requirements specified by this rule
                for (const reqId of rule.applicableRequirements) {
                    const requirement = allRequirements.find(req => req.requirementId === reqId);
                    if (requirement && !applicableRequirements.find(r => r.requirementId === reqId)) {
                        applicableRequirements.push({
                            ...requirement,
                            matchedByRule: rule.ruleId
                        });
                    }
                }
            }
        }

        // Additional filtering based on individual requirement conditions
        return applicableRequirements.filter(req => {
            return this.matchesRequirementConditions(profile, req);
        });
    }

    /**
     * Check if business profile matches a rule condition
     * @param {Object} profile - Business profile
     * @param {Object} condition - Rule condition to check
     * @returns {boolean} True if profile matches condition
     */
    matchesRuleCondition(profile, condition) {
        // Check business type
        if (condition.businessType && profile.businessType !== condition.businessType) {
            return false;
        }

        // Check seating capacity
        if (condition.seatingCapacity) {
            if (condition.seatingCapacity.min !== undefined && 
                profile.seatingCapacity < condition.seatingCapacity.min) {
                return false;
            }
            if (condition.seatingCapacity.max !== undefined && 
                profile.seatingCapacity > condition.seatingCapacity.max) {
                return false;
            }
        }

        // Check floor area
        if (condition.floorArea) {
            if (condition.floorArea.min !== undefined && 
                profile.floorArea < condition.floorArea.min) {
                return false;
            }
            if (condition.floorArea.max !== undefined && 
                profile.floorArea > condition.floorArea.max) {
                return false;
            }
        }

        // Check required services
        if (condition.hasService && condition.hasService.length > 0) {
            for (const service of condition.hasService) {
                const hasService = (profile.services && profile.services[service]) ||
                                 (profile.kitchenFeatures && profile.kitchenFeatures[service]) ||
                                 (profile.operationalHours && profile.operationalHours[service]);
                if (!hasService) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Check if business profile matches individual requirement conditions
     * @param {Object} profile - Business profile
     * @param {Object} requirement - Requirement with conditions
     * @returns {boolean} True if requirement applies
     */
    matchesRequirementConditions(profile, requirement) {
        if (!requirement.conditions || Object.keys(requirement.conditions).length === 0) {
            return true; // No conditions means always applies
        }

        const conditions = requirement.conditions;

        // Check minimum seating capacity
        if (conditions.minSeatingCapacity !== undefined && 
            profile.seatingCapacity < conditions.minSeatingCapacity) {
            return false;
        }

        // Check maximum seating capacity
        if (conditions.maxSeatingCapacity !== undefined && 
            profile.seatingCapacity > conditions.maxSeatingCapacity) {
            return false;
        }

        // Check minimum floor area
        if (conditions.minFloorArea !== undefined && 
            profile.floorArea < conditions.minFloorArea) {
            return false;
        }

        // Check maximum floor area
        if (conditions.maxFloorArea !== undefined && 
            profile.floorArea > conditions.maxFloorArea) {
            return false;
        }

        // Check required services
        if (conditions.requiredServices && conditions.requiredServices.length > 0) {
            for (const service of conditions.requiredServices) {
                const hasService = (profile.services && profile.services[service]) ||
                                 (profile.kitchenFeatures && profile.kitchenFeatures[service]) ||
                                 (profile.operationalHours && profile.operationalHours[service]);
                if (!hasService) {
                    return false;
                }
            }
        }

        // Check business types
        if (conditions.applicableBusinessTypes && 
            !conditions.applicableBusinessTypes.includes(profile.businessType)) {
            return false;
        }

        return true;
    }

    /**
     * Group requirements by regulatory authority
     * @param {Array} requirements - Filtered requirements
     * @returns {Object} Requirements grouped by authority
     */
    groupRequirementsByAuthority(requirements) {
        const grouped = {
            general: [],
            police: [],
            health: [],
            fire: []
        };

        requirements.forEach(req => {
            const category = req.category || 'general';
            if (grouped[category]) {
                grouped[category].push({
                    requirementId: req.requirementId,
                    title: req.title,
                    description: req.description,
                    authority: req.authority,
                    mandatory: req.mandatory,
                    matchedByRule: req.matchedByRule,
                    conditions: req.conditions || {}
                });
            }
        });

        return grouped;
    }

    /**
     * Calculate summary statistics for the requirements
     * @param {Array} requirements - Applicable requirements
     * @returns {Object} Summary statistics
     */
    calculateSummary(requirements) {
        const mandatoryCount = requirements.filter(req => req.mandatory).length;
        const optionalCount = requirements.length - mandatoryCount;

        const authorityCounts = requirements.reduce((acc, req) => {
            const category = req.category || 'general';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {});

        return {
            totalRequirements: requirements.length,
            mandatoryRequirements: mandatoryCount,
            optionalRequirements: optionalCount,
            authorityCounts: authorityCounts,
            estimatedProcessingTime: this.estimateProcessingTime(requirements.length),
            complexityLevel: this.assessComplexityLevel(requirements.length, mandatoryCount)
        };
    }

    /**
     * Estimate processing time based on number of requirements
     * @param {number} requirementCount - Total number of requirements
     * @returns {string} Estimated time range
     */
    estimateProcessingTime(requirementCount) {
        if (requirementCount <= 3) return '1-2 weeks';
        if (requirementCount <= 6) return '2-4 weeks';
        if (requirementCount <= 10) return '4-8 weeks';
        return '8-12 weeks';
    }

    /**
     * Assess complexity level of licensing process
     * @param {number} totalCount - Total requirements
     * @param {number} mandatoryCount - Mandatory requirements
     * @returns {string} Complexity level
     */
    assessComplexityLevel(totalCount, mandatoryCount) {
        if (totalCount <= 4 && mandatoryCount <= 3) return 'Low';
        if (totalCount <= 8 && mandatoryCount <= 6) return 'Medium';
        return 'High';
    }

    /**
     * Sanitize business profile for response (remove sensitive data if any)
     * @param {Object} profile - Original business profile
     * @returns {Object} Sanitized profile
     */
    sanitizeBusinessProfile(profile) {
        return {
            businessType: profile.businessType,
            seatingCapacity: profile.seatingCapacity,
            floorArea: profile.floorArea,
            services: profile.services || {},
            kitchenFeatures: profile.kitchenFeatures || {},
            operationalHours: profile.operationalHours || {}
        };
    }

    /**
     * Get business type recommendations based on profile
     * @param {Object} profile - Business profile
     * @returns {Array} Array of recommendations
     */
    getBusinessRecommendations(profile) {
        const recommendations = [];

        // Size-based recommendations
        if (profile.seatingCapacity > 50 || profile.floorArea > 200) {
            recommendations.push({
                type: 'size_warning',
                message: 'בעסק בגודל זה נדרשים אישורים נוספים ותהליך מורכב יותר',
                priority: 'high'
            });
        }

        // Service-based recommendations
        if (profile.services?.alcoholService) {
            recommendations.push({
                type: 'alcohol_license',
                message: 'רישיון אלכוהול דורש תהליך נפרד ועלול להאריך את התהליך',
                priority: 'high'
            });
        }

        if (profile.kitchenFeatures?.gasUsage && profile.floorArea > 100) {
            recommendations.push({
                type: 'fire_safety',
                message: 'שימוש בגז בשטח גדול דורש מערכות כיבוי מתקדמות',
                priority: 'medium'
            });
        }

        return recommendations;
    }

    /**
     * Get detailed requirement information by ID
     * @param {string} requirementId - Requirement ID
     * @returns {Object} Detailed requirement information
     */
    getRequirementDetails(requirementId) {
        const allRequirements = this.getAllRequirements();
        const requirement = allRequirements.find(req => req.requirementId === requirementId);
        
        if (!requirement) {
            throw new Error(`Requirement not found: ${requirementId}`);
        }

        return {
            ...requirement,
            relatedRequirements: this.findRelatedRequirements(requirement),
            processingTips: this.getProcessingTips(requirement)
        };
    }

    /**
     * Find related requirements (same authority or similar conditions)
     * @param {Object} requirement - Base requirement
     * @returns {Array} Related requirements
     */
    findRelatedRequirements(requirement) {
        const allRequirements = this.getAllRequirements();
        return allRequirements
            .filter(req => req.requirementId !== requirement.requirementId && 
                          req.authority === requirement.authority)
            .slice(0, 3); // Limit to 3 related requirements
    }

    /**
     * Get processing tips for a specific requirement
     * @param {Object} requirement - Requirement object
     * @returns {Array} Array of processing tips
     */
    getProcessingTips(requirement) {
        const tips = [];
        
        if (requirement.authority === 'משטרת ישראל') {
            tips.push('יש להגיש בקשה לתחנת משטרה המקומית');
            tips.push('תהליך הבדיקה עשוי לקחת 2-4 שבועות');
        }
        
        if (requirement.authority === 'משרד הבריאות') {
            tips.push('נדרש ביקור של פקח משרד הבריאות במקום');
            tips.push('חשוב לוודא תקינות מערכות המים והתברואה');
        }

        if (requirement.authority === 'מכבי האש וההצלה הארצי') {
            tips.push('נדרש מדידה מקצועית של מערכות הבטיחות');
            tips.push('חשוב להכין תוכניות אדריכליות עדכניות');
        }

        return tips;
    }
}

module.exports = MatchingEngine;