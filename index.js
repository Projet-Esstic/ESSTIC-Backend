/**
 * @fileoverview Fichier principal pour démarrer l'application Express.
 * 
 * @requires express
 * @requires dotenv/config
 * @requires ./src/middlewares/notFound.middlewares.mjs
 * @requires ./src/routes/Subject.routes.mjs
 * @requires express-async-errors
 * 
 * @description Ce fichier configure et démarre un serveur Express. 
 * Il importe les modules nécessaires, configure les routes et les middlewares, 
 * et démarre le serveur sur le port spécifié dans les variables d'environnement ou sur le port 3000 par défaut.
 * 
 * @module index
 */
import express from "express";
import dotenv from "dotenv";
// import { notFound } from "./src/middlewares/notFound.middlewares.mjs";
// import route from "./src/routes/Subject.routes.mjs";
import "express-async-errors";
import { connection } from "./src/database/connection.database.mjs";
import authRoutes from "./routes/authRoutes.js";
dotenv.config();

/**
 * Application Express.
 * @const {Object} app
 * @memberof module:index
 */
const app = express();

// -------------- routes -----------------------

/**
 * Routeur pour les sujets d'examen.
 * @name route
 * @function
 * @memberof module:index
 */
// app.use('/api/v1/exam/', route);
app.use("/api/auth", authRoutes);
//--------------- middlewares ----------------------
app.use(express.json());
app.use(express.urlencoded( {extended: true }));
/**
 * Middleware pour gérer les routes non trouvées.
 * @name notFound
 * @function
 * @memberof module:index
 */
// app.use(notFound);

/**
 * Port sur lequel le serveur écoute.
 * @const {number|string} port
 * @memberof module:index
 */
const port = process.env.PORT || 3000;


/**
 * Démarre le serveur et établit une connexion à la base de données MongoDB.
 * 
 * @async
 * @function start
 * @returns {Promise<void>} Une promesse qui se résout lorsque le serveur est démarré et connecté à la base de données.
 * @throws {Error} Lance une erreur si la connexion à la base de données échoue ou si le serveur ne peut pas démarrer.
 */

const start = async () => {
    try {
        console.log(process.env.MONGODB_URL)
        await connection(process.env.MONGODB_URL);

        app.listen(port, () => {
            console.log(`Server listening at http://localhost:${port}`);
        });
    } catch (error) {
        console.log(error);
    }
};

start();
