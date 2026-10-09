package com.caits;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

@SpringBootTest
public class MailTest {

    @Autowired
    private JavaMailSender mailSender;

    @Test
    public void testSendMail() {
        System.out.println("Starting MailTest...");
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom("caits@microproindia.com");
            msg.setTo("snakhate@microproindia.com");
            msg.setSubject("Test Email via Spring Boot");
            msg.setText("If you receive this, the SMTP is working.");
            mailSender.send(msg);
            System.out.println("Mail sent successfully!");
        } catch (Exception e) {
            System.err.println("SMTP Error in Test: " + e.getMessage());
            e.printStackTrace();
        }
        System.out.println("Finished MailTest.");
    }
}
