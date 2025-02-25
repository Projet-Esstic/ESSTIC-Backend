import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send an email to one or multiple recipients
 * @param {string | string[]} to - Single email or array of emails
 * @param {string} subject - Email subject
 * @param {string} text - Email body
 */
const sendEmail = async (to, subject, text) => {
    try {
        // Convert array to comma-separated string if necessary
        const recipients = Array.isArray(to) ? to.join(",") : to;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: recipients,  // Multiple recipients supported
            subject,
            text,
        });

        console.log(`Email sent successfully to: ${recipients}`);
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

export default sendEmail;
