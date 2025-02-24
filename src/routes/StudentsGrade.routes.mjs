import { Router } from 'express';
import {
    getAllStudentsGrades,
    getStudentGradeById,
    createStudentGrade,
    updateStudentGrade,
    deleteStudentGrade,
    addMark
} from '../controllers/StudentsGrade.controllers.mjs';

/**
 * Router instance for handling student grade related routes.
 * 
 * @type {Router}
 */
const router = Router();

/**
 * Récupère toutes les notes des étudiants.
 * 
 * @name GET/grades
 * @function
 * @memberof module:routes/StudentsGrade
 * @inner
 * @param {Request} req - L'objet de requête HTTP.
 * @param {Response} res - L'objet de réponse HTTP.
 */
router.get('/grades', getAllStudentsGrades);

/**
 * Récupère la note d'un étudiant par son identifiant.
 * 
 * @name GET/grades/:id
 * @function
 * @memberof module:routes/StudentsGrade
 * @inner
 * @param {Request} req - L'objet de requête HTTP.
 * @param {Response} res - L'objet de réponse HTTP.
 */
router.get('/grades/:id', getStudentGradeById);

router.put('/grades/add/:d', addMark);

/**
 * Crée une nouvelle note en semble d' un étudiant.
 * 
 * @name POST/grades
 * @function
 * @memberof module:routes/StudentsGrade
 * @inner
 * @param {Request} req - L'objet de requête HTTP.
 * @param {Response} res - L'objet de réponse HTTP.
 */
router.post('/grades/create', createStudentGrade);

/**
 * Met à jour la note d'un étudiant par son identifiant.
 * 
 * @name PUT/grades/:id
 * @function
 * @memberof module:routes/StudentsGrade
 * @inner
 * @param {Request} req - L'objet de requête HTTP.
 * @param {Response} res - L'objet de réponse HTTP.
 * 
 * @todo add a rate limiter here to prevent from multiple request by an attacker
 */
router.put('/grades/update/:id', updateStudentGrade);

/**
 * Supprime la note d'un étudiant par son identifiant.
 * 
 * @name DELETE/grades/:id
 * @function
 * @memberof module:routes/StudentsGrade
 * @inner
 * @param {Request} req - L'objet de requête HTTP.
 * @param {Response} res - L'objet de réponse HTTP.
 */
router.delete('/grades/delete/:id', deleteStudentGrade);

export default router;