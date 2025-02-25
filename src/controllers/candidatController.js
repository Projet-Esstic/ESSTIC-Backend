const Candidate = require('../models/Candidate');

const mapRequestBodyToModel = (body) => {
    return {
        personalInfo: {
            lastName: body.lastName || body.nom, 
            firstName: body.firstName || body.pernom,
            dateOfBirth: body.dateOfBirth || body.dateDeNaissance,
            placeOfBirth: body.placeOfBirth || body.lieuDeNaissance,
            maritalStatus: body.maritalStatus || body.situationDeFamille,
            usualResidence: body.usualResidence || body.residenceHabituelle,
            postalBox: body.postalBox || body.boitePostale,
            phoneNumber: body.phoneNumber || body.numeroDeTelephone,
            familyReferences: {
                fatherName: body.fatherName || body.nom_pere,
                motherName: body.motherName || body.nom_mere,
            },
            parentsAddress: body.parentsAddress || body.addressParents,
            countryOfOrigin: body.countryOfOrigin || body.paysdOrigine,
            region: body.region || body.region,
            departmentOfOrigin: body.departmentOfOrigin || body.departementdOrigine,
        },
        educationAndDegrees: {
            secondaryEducation: body.secondaryEducation || body.etudesSecondairesOuTechniques,
            higherEducation: body.higherEducation || body.etudesSuperieures,
            diplomasObtained: body.diplomasObtained || body.diplomesObtenus,
            trainingSessions: {
                participated: body.participated || body.participe,
                fields: body.fields || body.domaines,
            },
            languagesSpoken: {
                nationalLanguages: body.nationalLanguages || body.languesNationale,
                foreignLanguagesRead: body.foreignLanguagesRead || body.languesEtrangeres_lisez_vous,
                foreignLanguagesSpoken: body.foreignLanguagesSpoken || body.languesEtrangeres_parlez_vous,
            },
        },
        professionalActivities: {
            pastProfessionalActivities: {
                hasWorkedBefore: body.hasWorkedBefore || body.avez_vous_deja_exerce,
                pastProfessions: body.pastProfessions || body.professions,
            },
            currentProfessionalActivities: {
                isCurrentlyWorking: body.isCurrentlyWorking || body.exercez_vous,
                workFields: body.workFields || body.domaines,
                currentEmployer: body.currentEmployer || body.nomEmployeur,
                sinceWhen: body.sinceWhen || body.depuisQuand,
            },
            mediaInstitutionCollaboration: {
                hasCollaborated: body.hasCollaborated || body.avez_vous_deja_collabore,
                collaborations: body.collaborations || body.lesquelle,
            },
            postGraduationEngagement: {
                isInContact: body.isInContact || body.etes_vous_en_rapport,
                contactDetails: body.contactDetails || body.lequel,
            },
        },
        otherPastOrCurrentActivities: {
            extraProfessionalActivities: {
                hasExtraActivities: body.hasExtraActivities || body.avez_vous,
                extraActivities: body.extraActivities || body.lesquelle,
            },
        },
        additionalInformation: {
            abroadStay: {
                hasStayedAbroad: body.hasStayedAbroad || body.avez_vous,
                reason: body.reason || body.reason,
                location: body.location || body.lieu,
                dates: {
                    startDate: body.startDate || body.commencement,
                    endDate: body.endDate || body.fini,
                },
                internationalMeetings: body.internationalMeetings || body.rencontresInternationales,
            },
        },
    };
};

// Create a new candidate
exports.createCandidate = async (req, res) => {
    try {
        const mappedData = mapRequestBodyToModel(req.body);
        const newCandidate = new Candidate(mappedData);
        const savedCandidate = await newCandidate.save();
        res.status(201).json(savedCandidate);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update a candidate by ID
exports.updateCandidate = async (req, res) => {
    try {
        const mappedData = mapRequestBodyToModel(req.body);
        const updatedCandidate = await Candidate.findByIdAndUpdate(req.params.id, mappedData, { new: true });
        if (!updatedCandidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        res.status(200).json(updatedCandidate);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all candidates
exports.getAllCandidates = async (req, res) => {
    try {
        const candidates = await Candidate.find();
        res.status(200).json(candidates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a candidate by ID
exports.getCandidateById = async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        res.status(200).json(candidate);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a candidate by ID
exports.deleteCandidate = async (req, res) => {
    try {
        const deletedCandidate = await Candidate.findByIdAndDelete(req.params.id);
        if (!deletedCandidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        res.status(200).json({ message: 'Candidate successfully deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
