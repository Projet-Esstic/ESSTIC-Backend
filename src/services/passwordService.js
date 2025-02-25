import bcrypt from "bcryptjs";
import crypto from "crypto";

const generatePassword = async () => {
    const randomPassword = crypto.randomBytes(6).toString("hex");  // Generate random password
    const hashedPassword = await bcrypt.hash(randomPassword, 10);  // Hash it
    return { randomPassword, hashedPassword };
};

export default generatePassword;
