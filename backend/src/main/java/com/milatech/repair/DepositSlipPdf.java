package com.milatech.repair;

import java.io.ByteArrayOutputStream;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.milatech.common.Money;
import com.milatech.payment.Payment;

/**
 * US-15 : bon de depot (A5) remis au client : appareil, panne, accessoires laisses, acompte, date prevue.
 * Il protege la boutique et le client en cas de litige (« ce n'est pas mon telephone », « il marchait »).
 */
final class DepositSlipPdf {

	private static final ZoneId ZONE = ZoneId.of("Africa/Douala");
	private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm");
	private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
	private static final Font TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
	private static final Font HEADING = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
	private static final Font TEXT = FontFactory.getFont(FontFactory.HELVETICA, 9.5f);
	private static final Font SMALL = FontFactory.getFont(FontFactory.HELVETICA, 7.5f);

	private static final String[] DEVICE_TYPES = { "Téléphone", "Ordinateur", "Tablette", "Appareil Bluetooth", "Autre" };

	private DepositSlipPdf() {
	}

	static byte[] render(Repair repair) {
		var out = new ByteArrayOutputStream();
		var document = new Document(PageSize.A5, 32, 32, 30, 30);
		PdfWriter.getInstance(document, out);
		document.open();

		document.add(new Paragraph("MilaTech", TITLE));
		document.add(new Paragraph("Vente · Réparation · Formation", SMALL));
		var title = new Paragraph("BON DE DÉPÔT " + repair.getReference(), HEADING);
		title.setSpacingBefore(12);
		document.add(title);
		document.add(new Paragraph("Reçu le " + repair.getReceivedAt().atZone(ZONE).format(DATE_TIME) + " par "
				+ repair.getReceivedBy().getFullName()
				+ (repair.getReception() == Repair.Reception.DOMICILE ? " (récupéré à domicile)" : ""), TEXT));

		var table = new PdfPTable(new float[] { 2, 5 });
		table.setWidthPercentage(100);
		table.setSpacingBefore(10);
		row(table, "Client", repair.getCustomer().getFullName() + " · " + repair.getCustomer().getPhone());
		row(table, "Appareil", DEVICE_TYPES[repair.getDeviceType().ordinal()] + " · " + repair.getDevice());
		if (repair.getSerialNumber() != null) row(table, "N° série / IMEI", repair.getSerialNumber());
		row(table, "Accessoires laissés", repair.getAccessories() == null ? "Aucun" : repair.getAccessories());
		row(table, "Panne signalée", repair.getReportedIssue());
		if (repair.getEstimatedCost() != null) row(table, "Coût estimé", Money.fcfa(repair.getEstimatedCost()));
		if (repair.getPromisedOn() != null) row(table, "Date prévue", repair.getPromisedOn().format(DATE));
		// L'acompte est le premier paiement ; si le bon est reimprime plus tard, on indique aussi le total deja paye
		if (!repair.getPayments().isEmpty()) {
			Payment deposit = repair.getPayments().getFirst();
			String method = deposit.getMethod() == Payment.Method.ESPECES ? "espèces" : "Mobile Money";
			row(table, "Acompte versé", Money.fcfa(deposit.getAmount()) + " (" + method + ")");
			if (repair.getPayments().size() > 1) row(table, "Total déjà payé", Money.fcfa(repair.getPaid()));
		}
		document.add(table);

		var conditions = new Paragraph("""
				Conservez ce bon : il est demandé pour récupérer l'appareil. Le devis définitif est communiqué \
				après le diagnostic ; aucune réparation n'est faite sans votre accord. Les appareils non récupérés \
				90 jours après l'avis de fin de réparation peuvent être considérés comme abandonnés.""", SMALL);
		conditions.setSpacingBefore(14);
		document.add(conditions);

		var signatures = new PdfPTable(2);
		signatures.setWidthPercentage(100);
		signatures.setSpacingBefore(26);
		for (String who : new String[] { "Signature du client", "Pour MilaTech" }) {
			var cell = new PdfPCell(new Paragraph(who, SMALL));
			cell.setBorder(Rectangle.TOP);
			cell.setHorizontalAlignment(Element.ALIGN_CENTER);
			cell.setPaddingTop(4);
			signatures.addCell(cell);
		}
		document.add(signatures);
		document.close();
		return out.toByteArray();
	}

	private static void row(PdfPTable table, String label, String value) {
		var left = new PdfPCell(new Paragraph(label, HEADING));
		var right = new PdfPCell(new Paragraph(value, TEXT));
		for (PdfPCell cell : new PdfPCell[] { left, right }) {
			cell.setBorder(Rectangle.BOTTOM);
			cell.setBorderColor(new java.awt.Color(226, 232, 240));
			cell.setPadding(5);
			table.addCell(cell);
		}
	}
}
