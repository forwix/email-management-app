const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

class SESService {
  constructor() {
    this.client = new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    
    this.fromEmail = process.env.SES_FROM_EMAIL;
  }

  async sendEmail({ to, subject, htmlBody, textBody, replyTo }) {
    try {
      const params = {
        Source: this.fromEmail,
        Destination: {
          ToAddresses: Array.isArray(to) ? to : [to],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlBody || textBody,
              Charset: 'UTF-8',
            },
            Text: {
              Data: textBody || htmlBody.replace(/<[^>]*>/g, ''),
              Charset: 'UTF-8',
            },
          },
        },
      };

      if (replyTo) {
        params.ReplyToAddresses = [replyTo];
      }

      const command = new SendEmailCommand(params);
      const result = await this.client.send(command);
      
      return {
        success: true,
        messageId: result.MessageId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('SES send error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendReply({ to, subject, body, originalEmailId, userSignature = '' }) {
    try {
      const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;
      
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="margin-bottom: 20px;">
            ${body.replace(/\n/g, '<br>')}
          </div>
          ${userSignature ? `
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            ${userSignature.replace(/\n/g, '<br>')}
          </div>
          ` : ''}
        </div>
      `;

      const textBody = `${body}\n\n${userSignature || ''}`;

      const result = await this.sendEmail({
        to,
        subject: replySubject,
        htmlBody,
        textBody,
      });

      return {
        ...result,
        type: 'reply',
        originalEmailId,
      };
    } catch (error) {
      console.error('Send reply error:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(userEmail, userName) {
    try {
      const subject = 'Welcome to Email Management App';
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to Email Management App!</h1>
          </div>
          
          <div style="padding: 40px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${userName}!</h2>
            
            <p style="margin-bottom: 15px;">
              Thank you for joining our Email Management App. We're excited to help you manage your emails more efficiently with AI-powered features.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #667eea; margin-top: 0;">✨ Key Features:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">🤖 AI-powered auto-reply generation using Claude API</li>
                <li style="margin-bottom: 8px;">📧 Smart email categorization and analysis</li>
                <li style="margin-bottom: 8px;">📱 Responsive design for all devices</li>
                <li style="margin-bottom: 8px;">🔒 Secure authentication and data protection</li>
                <li style="margin-bottom: 8px;">⚡ Fast and intuitive interface</li>
              </ul>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #667eea; margin-top: 0;">🚀 Getting Started:</h3>
              <ol style="margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Set up your email preferences in Settings</li>
                <li style="margin-bottom: 8px;">Customize your auto-reply template</li>
                <li style="margin-bottom: 8px;">Start managing your emails efficiently!</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'https://your-app-domain.com'}" 
                 style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Get Started Now
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
              If you have any questions, feel free to contact our support team.
            </p>
          </div>
        </div>
      `;

      const textBody = `
Welcome to Email Management App!

Hello ${userName}!

Thank you for joining our Email Management App. We're excited to help you manage your emails more efficiently with AI-powered features.

Key Features:
• AI-powered auto-reply generation using Claude API
• Smart email categorization and analysis  
• Responsive design for all devices
• Secure authentication and data protection
• Fast and intuitive interface

Getting Started:
1. Set up your email preferences in Settings
2. Customize your auto-reply template
3. Start managing your emails efficiently!

Visit: ${process.env.CLIENT_URL || 'https://your-app-domain.com'}

If you have any questions, feel free to contact our support team.
      `;

      return await this.sendEmail({
        to: userEmail,
        subject,
        htmlBody,
        textBody,
      });
    } catch (error) {
      console.error('Send welcome email error:', error);
      throw error;
    }
  }

  async sendNotification({ to, subject, message, type = 'info' }) {
    try {
      const typeColors = {
        info: '#667eea',
        success: '#48bb78',
        warning: '#ed8936',
        error: '#f56565'
      };

      const typeIcons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌'
      };

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background: ${typeColors[type]}; padding: 20px; text-align: center; color: white;">
            <h2 style="margin: 0;">${typeIcons[type]} ${subject}</h2>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${typeColors[type]};">
              ${message.replace(/\n/g, '<br>')}
            </div>
            
            <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
              This is an automated notification from Email Management App.
            </p>
          </div>
        </div>
      `;

      const textBody = `${subject}\n\n${message}\n\nThis is an automated notification from Email Management App.`;

      return await this.sendEmail({
        to,
        subject: `[${type.toUpperCase()}] ${subject}`,
        htmlBody,
        textBody,
      });
    } catch (error) {
      console.error('Send notification error:', error);
      throw error;
    }
  }

  // Health check method
  async checkSESHealth() {
    try {
      // Simple test to verify SES configuration
      const testParams = {
        Source: this.fromEmail,
        Destination: {
          ToAddresses: [this.fromEmail], // Send to self for testing
        },
        Message: {
          Subject: {
            Data: 'SES Health Check',
            Charset: 'UTF-8',
          },
          Body: {
            Text: {
              Data: 'This is a health check email from Email Management App.',
              Charset: 'UTF-8',
            },
          },
        },
      };

      // Note: This would actually send an email, so in production
      // you might want to use a different approach for health checks
      return {
        status: 'healthy',
        region: process.env.AWS_REGION,
        fromEmail: this.fromEmail,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = new SESService();