package com.sliit.smartcampus.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom("smartcampus73@gmail.com");
            helper.setTo(toEmail);
            helper.setSubject("SmartCampus — Your Verification Code");
            helper.setText(buildEmailHtml(otp), true);

            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    private String buildEmailHtml(String otp) {
        return """
            <div style="font-family:Segoe UI,sans-serif;max-width:480px;margin:auto;
                        background:#f9fafb;border-radius:16px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);
                          padding:32px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:24px;">SmartCampus</h1>
              </div>
              <div style="padding:32px;background:#fff;">
                <h2 style="color:#111827;margin:0 0 8px;">Verify your email</h2>
                <p style="color:#6b7280;margin:0 0 24px;">
                  Enter this code to complete your registration. Valid for 5 minutes.
                </p>
                <div style="background:#f3f4f6;border-radius:12px;padding:24px;
                            text-align:center;letter-spacing:12px;
                            font-size:36px;font-weight:800;color:#1d4ed8;">
                  %s
                </div>
                <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center;">
                  If you didn't request this, ignore this email.
                </p>
              </div>
            </div>
        """.formatted(otp);
    }
}