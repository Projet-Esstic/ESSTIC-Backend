/**
 * @description Ce fichier établit une connexion à la base de données MongoDB en utilisant Mongoose.
 */

import mongoose, { connect } from "mongoose";

/**
 * Établit une connexion à la base de données MongoDB.
 * 
 * @async
 * @function connection
 * @param {string} url - L'URL de connexion à la base de données MongoDB.
 * @returns {Promise<void>} Une promesse qui se résout lorsque la connexion est établie.
 */
export const connection = async (url) => {
    await connect(url);
};
