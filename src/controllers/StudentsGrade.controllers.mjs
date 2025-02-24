import studentsGrade from '../models/StudentsGrades.models.mjs';

/**
 * @description Récupère toutes les notes des étudiants.
 * @param {Object} req - Requête HTTP.
 * @param {Object} res - Réponse HTTP.
 */
export const getAllStudentsGrades = async (req, res) => {
    try {
        const grades = await studentsGrade.find({});
        res.status(200).json(grades);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @description Récupère les notes d'un étudiant par son ID.
 * @param {Object} req - Requête HTTP.
 * @param {Object} res - Réponse HTTP.
 */
export const getStudentGradeById = async (req, res) => {
    try {
        const { id } = req.params;
        const grade = await studentsGrade.findById(id);
        if (!grade) {
            return res.status(404).json({ message: "Note non trouvée" });
        }
        res.status(200).json(grade.mark);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @description Crée une nouvelle note pour un étudiant.
 * @param {Object} req - Requête HTTP.
 * @param {Object} res - Réponse HTTP.
 */
export const createStudentGrade = async (req, res) => {
    const { studentName, studentRegion, studentGender, mark } = req.body;

    if (!mark) {
        return res.status(400).json({ message: "Les informations de la note sont requises" });
    }

    const newGrade = new studentsGrade({
        studentName,
        studentRegion,
        studentGender,
        mark: {
            subjectName: mark.subjectName,
            totalMark: mark.totalMark,
            mark: mark.mark,
            coefficient: mark.coefficient
        }
    });
    
    try {
        const savedGrade = await newGrade.save();
        res.status(201).json(savedGrade);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


/**
 * Ajoute une note à un étudiant.
 *
 * @async
 * @function addMark
 * @param {Object} req - L'objet de requête HTTP.
 * @param {Object} req.params - Les paramètres de la requête.
 * @param {string} req.params.id - L'identifiant de l'étudiant.
 * @param {Object} req.body - Le corps de la requête.
 * @param {Object} req.body.newMark - Les informations de la nouvelle note.
 * @param {string} req.body.newMark.subjectName - Le nom de la matière.
 * @param {number} req.body.newMark.totalMark - La note totale possible.
 * @param {number} req.body.newMark.mark - La note obtenue.
 * @param {number} req.body.newMark.coefficient - Le coefficient de la matière.
 * @param {Object} res - L'objet de réponse HTTP.
 * @returns {Promise<void>} - Une promesse qui résout avec la réponse HTTP.
 * @throws {Error} - Lance une erreur si la mise à jour échoue.
 */
export const addMark = async (req, res) => {
    const { id } = req.params;
    const { newMark } = req.body;


    if (!newMark || !newMark.subjectName || !newMark.totalMark || !newMark.mark || !newMark.coefficient) {
        return res.status(400).json({ message: "Les informations de la note sont requises" });
    }
    
    try {
        const studentUpgrade = await studentsGrade.findByIdAndUpdate(
            id,
            {
                $push: {
                    "mark": {
                        subjectName: newMark.subjectName,
                        totalMark: newMark.totalMark,
                        mark: newMark.mark,
                        coefficient: newMark.coefficient
                    }
                }
            },
            {
                new: true
            }
        );

        if (!studentUpgrade) {
            return res.status(404).json({ message: "étudiant non trouvée" });
        }

        res.status(200).json(studentUpgrade);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @description Met à jour les notes d'un étudiant par son ID.
 * @param {Object} req - Requête HTTP.
 * @param {Object} res - Réponse HTTP.
 */
export const updateStudentGrade = async (req, res) => {
    const { id } = req.params;
    const { studentName, studentRegion, studentGender, mark } = req.body;

    if (!mark) {
        return res.status(400).json({ message: "Les informations de la note sont requises" });
    }

    try {
        const updatedGrade = await studentsGrade.findByIdAndUpdate(
            id,
            {
                studentName,
                studentRegion,
                studentGender,
                mark: {
                    subjectName: mark.subjectName,
                    totalMark: mark.totalMark,
                    mark: mark.mark,
                    coefficient: mark.coefficient
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedGrade) {
            return res.status(404).json({ message: "Note non trouvée" });
        }

        res.status(200).json(updatedGrade);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @description Supprime les notes d'un étudiant par son ID.
 * @param {Object} req - Requête HTTP.
 * @param {Object} res - Réponse HTTP.
 */
export const deleteStudentGrade = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedGrade = await studentsGrade.findByIdAndDelete(id);
        if (!deletedGrade) {
            return res.status(404).json({ message: "Note non trouvée" });
        }
        res.status(200).json({ message: "Note supprimée avec succès" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};