package com.milatech.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

/** Contenu des emails de MilaTech (texte et HTML), confies ensuite au Mailer. */
@Service
public class EmailService {

	/** Comptes de demonstration : adresses fictives, aucun email n'y est jamais envoye. */
	public static final String DEMO_DOMAIN = "@demo.milatech.cm";
	private static final Logger log = LoggerFactory.getLogger(EmailService.class);

	private final Mailer mailer;

	public EmailService(Mailer mailer) {
		this.mailer = mailer;
	}

	public void sendPasswordReset(String email, String firstName, String link, long validMinutes) {
		String greeting = "Bonjour " + firstName + ",";
		String intro = "Vous avez demandé à changer le mot de passe de votre compte MilaTech.";
		String button = "Choisir un nouveau mot de passe";
		String footnote = "Ce lien est valable " + validMinutes
				+ " minutes et ne sert qu'une fois. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe ne change pas.";
		String text = "%s\n\n%s\n%s : %s\n\n%s".formatted(greeting, intro, button, link, footnote);
		String html = """
				<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#0f172a">
				  <h2 style="color:#0e7490">MilaTech</h2>
				  <p>%s</p>
				  <p>%s</p>
				  <p style="margin:28px 0">
				    <a href="%s" style="background:#0e7490;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">%s</a>
				  </p>
				  <p style="font-size:13px;color:#64748b">%s</p>
				</div>
				""".formatted(HtmlUtils.htmlEscape(greeting), intro, HtmlUtils.htmlEscape(link), button, footnote);
		send(email, "Réinitialiser votre mot de passe MilaTech", html, text);
	}

	private void send(String to, String subject, String html, String text) {
		if (to.endsWith(DEMO_DOMAIN)) {
			log.info("Email « {} » non envoyé : {} est une adresse de démonstration", subject, to);
			return;
		}
		mailer.send(to, subject, html, text);
	}
}
