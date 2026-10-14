package com.milatech.sale;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.milatech.common.Money;

/** US-12 : recu de vente au format ticket (80 mm de large), a imprimer ou a partager sur WhatsApp. */
final class ReceiptPdf {

	private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
	private static final Font TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13);
	private static final Font BOLD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f);
	private static final Font TEXT = FontFactory.getFont(FontFactory.HELVETICA, 8);
	private static final Font SMALL = FontFactory.getFont(FontFactory.HELVETICA, 7);

	private ReceiptPdf() {
	}

	static byte[] render(Sale sale) {
		var out = new ByteArrayOutputStream();
		// Ticket de caisse : 80 mm de large (226 points), hauteur selon le nombre de lignes
		var page = new Rectangle(226, 205 + 26f * sale.getLines().size() + (sale.getCustomer() == null ? 0 : 12));
		var document = new Document(page, 12, 12, 14, 14);
		PdfWriter.getInstance(document, out);
		document.open();

		centered(document, "MilaTech", TITLE);
		centered(document, "Vente · Réparation · Formation", SMALL);
		centered(document, " ", SMALL);
		centered(document, "Reçu " + sale.getReference(), BOLD);
		centered(document, sale.getCreatedAt().atZone(Sale.ZONE).format(DATE), TEXT);
		if (sale.getCustomer() != null) centered(document, "Client : " + sale.getCustomer().getFullName(), TEXT);
		centered(document, "Vendeur : " + sale.getSeller().getFullName(), TEXT);

		var table = new PdfPTable(new float[] { 5, 3 });
		table.setWidthPercentage(100);
		table.setSpacingBefore(8);
		for (SaleLine line : sale.getLines()) {
			cell(table, line.getQuantity() + " × " + line.getProductName() + "\n" + Money.fcfa(line.getUnitPrice()) + " l'unité",
					TEXT, Element.ALIGN_LEFT);
			cell(table, Money.fcfa(line.getLineTotal()), TEXT, Element.ALIGN_RIGHT);
		}
		PdfPCell label = new PdfPCell(new Paragraph("TOTAL", BOLD));
		PdfPCell total = new PdfPCell(new Paragraph(Money.fcfa(sale.getTotal()), BOLD));
		total.setHorizontalAlignment(Element.ALIGN_RIGHT);
		for (PdfPCell c : new PdfPCell[] { label, total }) {
			c.setBorder(Rectangle.TOP);
			c.setPaddingTop(5);
			table.addCell(c);
		}
		document.add(table);

		String payment = sale.getPaymentMethod() == Sale.PaymentMethod.ESPECES ? "Espèces" : "Mobile Money";
		centered(document, " ", SMALL);
		centered(document, "Payé en " + payment, TEXT);
		centered(document, "Merci pour votre achat !", BOLD);
		document.close();
		return out.toByteArray();
	}

	private static void centered(Document document, String text, Font font) {
		var paragraph = new Paragraph(text, font);
		paragraph.setAlignment(Element.ALIGN_CENTER);
		document.add(paragraph);
	}

	private static void cell(PdfPTable table, String text, Font font, int align) {
		var cell = new PdfPCell(new Paragraph(text, font));
		cell.setBorder(Rectangle.NO_BORDER);
		cell.setHorizontalAlignment(align);
		cell.setPaddingBottom(4);
		table.addCell(cell);
	}
}
