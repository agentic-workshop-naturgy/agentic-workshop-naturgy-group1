package com.naturgy.gas.service;

import com.naturgy.gas.entity.Invoice;
import com.naturgy.gas.entity.InvoiceLine;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.List;
import java.util.Locale;

@Service
public class PdfService {

    private static final float MARGIN = 50f;
    private static final float PAGE_WIDTH = PDRectangle.A4.getWidth();
    private static final float PAGE_HEIGHT = PDRectangle.A4.getHeight();
    private static final DecimalFormat EUR_FMT = new DecimalFormat("#,##0.00", new DecimalFormatSymbols(Locale.forLanguageTag("es")));
    private static final DecimalFormat KWH_FMT = new DecimalFormat("#,##0.000", new DecimalFormatSymbols(Locale.forLanguageTag("es")));

    public byte[] generate(Invoice invoice) throws IOException {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                float y = PAGE_HEIGHT - MARGIN;

                // ---- Header ----
                y = writeLine(cs, PDType1Font.HELVETICA_BOLD, 16, MARGIN, y, "FACTURA DE GAS NATURAL");
                y -= 6;
                y = writeLine(cs, PDType1Font.HELVETICA, 9, MARGIN, y,
                        "Naturgy Energy Group, S.A.  |  NIF: A-81948077  |  www.naturgy.com");
                y -= 14;

                // Horizontal rule
                drawLine(cs, MARGIN, y, PAGE_WIDTH - MARGIN, y);
                y -= 10;

                // ---- Invoice data block ----
                y = writeLine(cs, PDType1Font.HELVETICA_BOLD, 11, MARGIN, y,
                        "Nº Factura: " + invoice.getNumeroFactura());
                y -= 4;
                y = writeLine(cs, PDType1Font.HELVETICA, 10, MARGIN, y,
                        "CUPS: " + invoice.getCups());
                y -= 4;
                y = writeLine(cs, PDType1Font.HELVETICA, 10, MARGIN, y,
                        "Período: " + invoice.getPeriodoInicio() + "  ->  " + invoice.getPeriodoFin());
                y -= 4;
                y = writeLine(cs, PDType1Font.HELVETICA, 10, MARGIN, y,
                        "Fecha de emisión: " + invoice.getFechaEmision());
                y -= 14;

                drawLine(cs, MARGIN, y, PAGE_WIDTH - MARGIN, y);
                y -= 12;

                // ---- Consumption section ----
                y = writeLine(cs, PDType1Font.HELVETICA_BOLD, 11, MARGIN, y, "DETALLE DEL CONSUMO");
                y -= 8;

                // Table header
                float col1 = MARGIN;
                float col2 = MARGIN + 200;
                float col3 = MARGIN + 310;
                float col4 = MARGIN + 390;

                y = writeRow(cs, PDType1Font.HELVETICA_BOLD, 9, y, col1, col2, col3, col4,
                        "Concepto", "Cantidad", "Precio unit.", "Importe (€)");
                y -= 3;
                drawLine(cs, MARGIN, y, PAGE_WIDTH - MARGIN, y);
                y -= 8;

                List<InvoiceLine> lines = invoice.getLines();
                if (lines != null) {
                    for (InvoiceLine line : lines) {
                        String cantidad = formatCantidad(line);
                        String precio  = formatPrecio(line);
                        String importe = EUR_FMT.format(line.getImporte());
                        y = writeRow(cs, PDType1Font.HELVETICA, 9, y, col1, col2, col3, col4,
                                line.getDescripcion(), cantidad, precio, importe);
                        y -= 4;
                    }
                }

                y -= 6;
                drawLine(cs, MARGIN, y, PAGE_WIDTH - MARGIN, y);
                y -= 14;

                // ---- Totals ----
                y = writeLine(cs, PDType1Font.HELVETICA_BOLD, 11, MARGIN, y, "RESUMEN");
                y -= 8;

                float labelX = PAGE_WIDTH - MARGIN - 220;
                float valueX = PAGE_WIDTH - MARGIN - 60;
                y = writeTwoCol(cs, PDType1Font.HELVETICA, 10, y, labelX, valueX,
                        "Base imponible:", EUR_FMT.format(invoice.getBase()) + " €");
                y -= 4;
                y = writeTwoCol(cs, PDType1Font.HELVETICA, 10, y, labelX, valueX,
                        "IVA:", EUR_FMT.format(invoice.getImpuestos()) + " €");
                y -= 6;
                drawLine(cs, labelX - 10, y, PAGE_WIDTH - MARGIN, y);
                y -= 8;
                y = writeTwoCol(cs, PDType1Font.HELVETICA_BOLD, 12, y, labelX, valueX,
                        "TOTAL:", EUR_FMT.format(invoice.getTotal()) + " €");
                y -= 20;

                drawLine(cs, MARGIN, y, PAGE_WIDTH - MARGIN, y);
                y -= 10;

                // ---- Footer ----
                writeLine(cs, PDType1Font.HELVETICA_OBLIQUE, 8, MARGIN, y,
                        "Este documento es una factura electrónica generada automáticamente.");
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    private String formatCantidad(InvoiceLine line) {
        return switch (line.getTipoLinea()) {
            case TERMINO_VARIABLE -> KWH_FMT.format(line.getCantidad()) + " kWh";
            case IVA -> line.getCantidad().multiply(BigDecimal.valueOf(100)).setScale(0, java.math.RoundingMode.HALF_UP) + " %";
            default -> KWH_FMT.format(line.getCantidad());
        };
    }

    private String formatPrecio(InvoiceLine line) {
        return switch (line.getTipoLinea()) {
            case TERMINO_VARIABLE -> line.getPrecioUnitario().toPlainString() + " €/kWh";
            case IVA -> EUR_FMT.format(line.getPrecioUnitario()) + " €";
            default -> EUR_FMT.format(line.getPrecioUnitario()) + " €";
        };
    }

    private float writeLine(PDPageContentStream cs, PDType1Font font, float size,
                             float x, float y, String text) throws IOException {
        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
        return y - size - 2;
    }

    private float writeRow(PDPageContentStream cs, PDType1Font font, float size,
                            float y, float c1, float c2, float c3, float c4,
                            String v1, String v2, String v3, String v4) throws IOException {
        float lineHeight = size + 4;
        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(c1, y);
        cs.showText(v1);
        cs.endText();

        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(c2, y);
        cs.showText(v2);
        cs.endText();

        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(c3, y);
        cs.showText(v3);
        cs.endText();

        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(c4, y);
        cs.showText(v4);
        cs.endText();

        return y - lineHeight;
    }

    private float writeTwoCol(PDPageContentStream cs, PDType1Font font, float size,
                               float y, float labelX, float valueX,
                               String label, String value) throws IOException {
        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(labelX, y);
        cs.showText(label);
        cs.endText();

        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(valueX, y);
        cs.showText(value);
        cs.endText();

        return y - size - 4;
    }

    private void drawLine(PDPageContentStream cs, float x1, float y, float x2, float y2) throws IOException {
        cs.moveTo(x1, y);
        cs.lineTo(x2, y2);
        cs.stroke();
    }
}
