import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const getStudentRegistrationEmail = (studentName, level, department) => {
    return {
        subject: 'CONGRATULATIONS! You\'ve Been Accepted to ESSTIC!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #3498db; border-radius: 10px; padding: 20px; background-color: #f8f9fa;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #3498db; margin-bottom: 5px;">CONGRATULATIONS!</h1>
                    <h2 style="color: #2c3e50;">Welcome to ESSTIC, ${studentName}!</h2>
                    <p style="font-size: 18px; color: #7f8c8d;">Your journey to excellence begins now.</p>
                </div>
                
                <p style="font-size: 16px;">Dear <strong>${studentName}</strong>,</p>
                
                <p style="font-size: 16px;">We are <em>thrilled</em> to inform you that you have <strong>successfully passed</strong> the entrance examination and have been accepted to ESSTIC! 🎉</p>
                
                <p style="font-size: 16px;">Your outstanding performance has earned you a place in our prestigious institution. We are confident that your talents and dedication will flourish here.</p>
                
                <div style="background-color: #e8f4fc; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #2980b9; margin-top: 0;">Your Registration Details:</h3>
                    <ul style="font-size: 16px;">
                        <li><strong>Level:</strong> ${level}</li>
                        <li><strong>Department:</strong> ${department}</li>
                    </ul>
                </div>
                
                <p style="font-size: 16px;">You can now access your student portal using your credentials to complete your enrollment process, view your class schedule, and explore campus resources.</p>
                
                <p style="font-size: 16px;">Important next steps:</p>
                <ol style="font-size: 16px;">
                    <li>Complete your online profile by <strong>March 25, 2025</strong></li>
                    <li>Attend the orientation program on <strong>April 2, 2025</strong></li>
                    <li>Prepare for an exciting academic journey!</li>
                </ol>
                
                <p style="font-size: 16px;">If you have any questions or need assistance, please contact our support team at <a href="mailto:support@esstic.edu" style="color: #3498db;">support@esstic.edu</a>.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea;">
                    <p style="font-size: 16px;">We look forward to seeing you on campus!</p>
                    <p style="font-size: 16px;">Best regards,<br><strong>ESSTIC Administration</strong></p>
                </div>
                
                <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #95a5a6;">
                    <p>This is an automated email. Please do not reply directly to this message.</p>
                    <p>© 2025 ESSTIC. All rights reserved.</p>
                </div>
            </div>
        `
    };
};

export const sendStudentRegistrationEmail = async (userEmail, studentName, level, department) => {
    try {
        const { subject, html } = getStudentRegistrationEmail(studentName, level, department);
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}; 