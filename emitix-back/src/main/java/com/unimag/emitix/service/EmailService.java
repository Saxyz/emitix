package com.unimag.emitix.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.mail.enabled}")
    private boolean enabled;

    @Async
    public void sendOtpEmail(String to, String otp, int expiryMinutes) {
        if (!enabled) {
            log.info("[MAIL DISABLED] OTP para '{}': {} (válido {} min)", to, otp, expiryMinutes);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject("EMITIX — Código de recuperación de contraseña");
            helper.setText(buildOtpHtml(otp, expiryMinutes), true);
            mailSender.send(message);
            log.info("OTP email enviado a '{}'", to);
        } catch (Exception e) {
            log.error("Error enviando email OTP a '{}': {}", to, e.getMessage());
        }
    }

    @Async
    public void sendUserInviteEmail(String to, String fullName, String tempPassword, String companyName) {
        if (!enabled) {
            log.info("[MAIL DISABLED] Invitación para '{}' en '{}': password temporal '{}'",
                    to, companyName, tempPassword);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject("EMITIX — Invitación a " + companyName);
            helper.setText(buildInviteHtml(fullName, tempPassword, companyName), true);
            mailSender.send(message);
            log.info("Invite email enviado a '{}'", to);
        } catch (Exception e) {
            log.error("Error enviando invite email a '{}': {}", to, e.getMessage());
        }
    }

    private String buildOtpHtml(String otp, int expiryMinutes) {
        return """
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <h2 style="color:#1a1a2e">EMITIX</h2>
              <p>Tu código de verificación es:</p>
              <div style="background:#f0f0f5;padding:16px;text-align:center;border-radius:8px;margin:24px 0">
                <span style="font-size:32px;font-weight:bold;letter-spacing:8px;font-family:monospace">%s</span>
              </div>
              <p style="color:#666">Este código expira en %d minutos.</p>
              <p style="color:#999;font-size:12px">Si no solicitaste este código, ignora este mensaje.</p>
            </div>
            """.formatted(otp, expiryMinutes);
    }

    private String buildInviteHtml(String fullName, String tempPassword, String companyName) {
        return """
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <h2 style="color:#1a1a2e">EMITIX</h2>
              <p>Hola <strong>%s</strong>,</p>
              <p>Has sido invitado/a a <strong>%s</strong> en EMITIX.</p>
              <p>Tu contraseña temporal es:</p>
              <div style="background:#f0f0f5;padding:16px;text-align:center;border-radius:8px;margin:24px 0">
                <span style="font-size:20px;font-weight:bold;font-family:monospace">%s</span>
              </div>
              <p style="color:#666">Cambia tu contraseña después de iniciar sesión.</p>
            </div>
            """.formatted(fullName, companyName, tempPassword);
    }
}
