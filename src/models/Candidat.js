import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const CandidateSchema = new Schema({
    personalInfo: {
        lastName: { 
            type: String, 
            required: true 
        },
        firstName: { 
            type: String, 
            required: true 
        },
        dateOfBirth: { 
            type: Date, 
            required: true 
        },
        placeOfBirth: { 
            type: String, 
            required: true 
        },
        maritalStatus: {
            type: String,
            enum: ['Single', 'Married', "Widowed or Divorced"],
            required: true
        },
        usualResidence: { 
            type: String, 
            required: true 
        },
        postalBox: { 
            type: String, 
            required: true 
        },
        phoneNumber: { 
            type: String, 
            required: true 
        },
        familyReferences: {
            fatherName: { 
                type: String, 
                required: true 
            },
            motherName: { 
                type: String, 
                required: true
            },
        },
        parentsAddress: { 
            type: String, 
            required: true 
        },
        countryOfOrigin: { 
            type: String, 
            required: true 
        },
        region: { 
            type: String, 
            required: true 
        },
        departmentOfOrigin: { 
            type: String, 
            required: true 
        },
    },
    educationAndDegrees: {
        secondaryOrTechnicalStudies: [{
            years: { type: String, required: true },
            classes: { type: String, required: true },
            institutions: { type: String, required: true },
        }],
        higherEducation: [{
            years: { type: String, required: true },
            disciplines: { type: String, required: true },
            facultiesOrSchools: { type: String, required: true },
        }],
        obtainedDegrees: [{ type: String, required: true }],
        trainingSessions: {
            participated: { type: Boolean, required: true },
            fields: { type: String, required: true },
        },
        spokenLanguages: {
            nationalLanguages: { type: String, required: true },
            foreignLanguagesRead: [{ type: String, required: true }],
            foreignLanguagesSpoken: [{ type: String, required: true }],
        },
    },
    professionalActivities: {
        pastProfessionalActivities: {
            hasWorkedBefore: { type: Boolean, required: true },
            professions: [{
                years: { type: String, required: true },
                industry: { type: String, required: true },
                jobNature: { type: String, required: true },
            }]
        },
        currentProfessionalActivities: {
            isWorking: { type: Boolean, required: true },
            field: { type: String, required: true },
            employerName: { type: String, required: true },
            sinceWhen: { type: Date, required: true },
        },
        communicationInstitution: {
            hasCollaborated: { type: Boolean, required: true },
            whichOnes: [{ type: String, required: true }]
        },
        postESSTICEmployment: {
            isInContact: { type: Boolean, required: true },
            whichOne: { type: String, required: true },
        },
    },
    otherPastOrCurrentActivities: {
        extraSalariedOrExtraProfessional: {
            hasOtherActivities: { type: Boolean, required: true },
            whichOnes: [{
                activityNature: { type: String, required: true },
                relatedOrganizations: { type: String, required: true },
                dates: {
                    startDate: { type: Date, required: true },
                    endDate: { type: Date, required: true },
                }
            }]
        }
    },
    additionalInformation: {
        stayedAbroad: {
            hasStayedAbroad: { type: Boolean, required: true },
            reason: { type: String, required: true },
            location: { type: String, required: true },
            dates: {
                startDate: { type: Date, required: true },
                endDate: { type: Date, required: true },
            },
            internationalMeetings: [{ type: String, required: true }]
        }
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});


const Candidate = model('CandidatModel', CandidateSchema);
export default Candidate;
