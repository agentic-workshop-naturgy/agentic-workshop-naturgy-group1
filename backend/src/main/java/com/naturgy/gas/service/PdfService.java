package com.naturgy.gas.service;

import com.naturgy.gas.entity.GasReading;
import com.naturgy.gas.entity.Invoice;
import com.naturgy.gas.entity.InvoiceLine;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class PdfService {

    private static final float MARGIN = 50f;
    private static final float PAGE_WIDTH = PDRectangle.A4.getWidth();
    private static final float PAGE_HEIGHT = PDRectangle.A4.getHeight();
    private static final DecimalFormat EUR_FMT = new DecimalFormat("#,##0.00", new DecimalFormatSymbols(Locale.forLanguageTag("es")));
    private static final DecimalFormat KWH_FMT = new DecimalFormat("#,##0.000", new DecimalFormatSymbols(Locale.forLanguageTag("es")));
    
    // Colores RGB (0-1) — Naturgy corporate
    private static final float[] NARANJA   = {0.961f, 0.514f, 0.122f};   // #F5831F
    private static final float[] AZUL      = {0f, 0.231f, 0.361f};       // #003B5C
    private static final float[] AZUL_LITE = {0.106f, 0.369f, 0.529f};   // #1B5E87
    private static final float[] BLANCO    = {1f, 1f, 1f};
    private static final float[] GRIS_BG   = {0.957f, 0.965f, 0.973f};   // #F4F6F8
    private static final float[] GRIS_LINE = {0.878f, 0.894f, 0.910f};   // #E0E4E8
    private static final float[] GRIS_TXT  = {0.353f, 0.408f, 0.447f};   // #5A6872
    private static final float[] NEGRO     = {0.176f, 0.204f, 0.212f};   // #2D3436

    public byte[] generate(Invoice invoice, List<GasReading> readings) throws IOException {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            // Load logo PNG
            PDImageXObject logo = null;
            try {
                ClassPathResource logoRes = new ClassPathResource("logo-naturgy.png");
                try (InputStream is = logoRes.getInputStream()) {
                    logo = PDImageXObject.createFromByteArray(doc, is.readAllBytes(), "logo");
                }
            } catch (Exception ignored) {
                // logo not found — skip
            }

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {

                // ═══════════════════════════════════════
                //  HEADER — Orange bar + Logo
                // ═══════════════════════════════════════
                float headerH = 50f;
                float headerTop = PAGE_HEIGHT;

                // Orange full-width rectangle
                setFill(cs, NARANJA);
                cs.addRect(0, headerTop - headerH, PAGE_WIDTH, headerH);
                cs.fill();

                // Logo in top-left corner (on orange bar)
                if (logo != null) {
                    float logoH = 30f;
                    float logoW = logoH * ((float) logo.getWidth() / logo.getHeight());
                    cs.drawImage(logo, MARGIN, headerTop - headerH + 10, logoW, logoH);
                }

                // Tagline right-aligned (white on orange)
                setFill(cs, BLANCO);
                float tagWidth = PDType1Font.HELVETICA.getStringWidth("Factura de Gas Natural") / 1000f * 7.5f;
                writeLine(cs, PDType1Font.HELVETICA, 7.5f,
                        PAGE_WIDTH - MARGIN - tagWidth, headerTop - 20, "Factura de Gas Natural");
                writeLine(cs, PDType1Font.HELVETICA_BOLD, 6.75f,
                        PAGE_WIDTH - MARGIN - tagWidth, headerTop - 32, "www.naturgy.com");

                // Small blue bar below header
                setFill(cs, AZUL);
                cs.addRect(0, headerTop - headerH - 3, PAGE_WIDTH, 3);
                cs.fill();

                float y = headerTop - headerH - 24;

                // ═══════════════════════════════════════
                //  INVOICE TITLE
                // ═══════════════════════════════════════
                setFill(cs, AZUL);
                y = writeLine(cs, PDType1Font.HELVETICA_BOLD, 12, MARGIN, y,
                        "FACTURA DE GAS NATURAL");
                y -= 3;

                setFill(cs, GRIS_TXT);
                y = writeLine(cs, PDType1Font.HELVETICA, 6.75f, MARGIN, y,
                        "Naturgy Energy Group, S.A.  |  NIF: A-81948077");
                y -= 9;

                // Orange thin line
                setStroke(cs, NARANJA);
                cs.setLineWidth(1.2f);
                cs.moveTo(MARGIN, y);
                cs.lineTo(PAGE_WIDTH - MARGIN, y);
                cs.stroke();
                cs.setLineWidth(0.5f);
                y -= 12;

                // ═══════════════════════════════════════
                //  INVOICE DATA — two columns
                // ═══════════════════════════════════════
                float leftCol = MARGIN;
                float rightCol = PAGE_WIDTH / 2 + 20;

                setFill(cs, AZUL);
                y = writeLine(cs, PDType1Font.HELVETICA_BOLD, 8.25f, leftCol, y,
                        "N\u00ba Factura:");
                setFill(cs, NEGRO);
                writeLine(cs, PDType1Font.HELVETICA, 8.25f, leftCol + 65, y + 10.25f,
                        invoice.getNumeroFactura());

                setFill(cs, AZUL);
                y = writeLine(cs, PDType1Font.HELVETICA_BOLD, 8.25f, rightCol, y + 10.25f,
                        "Fecha emisi\u00f3n:");
                setFill(cs, NEGRO);
                writeLine(cs, PDType1Font.HELVETICA, 8.25f, rightCol + 72, y + 10.25f,
                        invoice.getFechaEmision().toString());
                y -= 4;

                setFill(cs, AZUL);
                y = writeLine(cs, PDType1Font.HELVETICA_BOLD, 7.5f, leftCol, y,
                        "CUPS:");
                setFill(cs, NEGRO);
                writeLine(cs, PDType1Font.HELVETICA, 7.5f, leftCol + 65, y + 9.5f,
                        invoice.getCups());

                setFill(cs, AZUL);
                y = writeLine(cs, PDType1Font.HELVETICA_BOLD, 7.5f, rightCol, y + 9.5f,
                        "Per\u00edodo:");
                setFill(cs, NEGRO);
                writeLine(cs, PDType1Font.HELVETICA, 7.5f, rightCol + 72, y + 9.5f,
                        invoice.getPeriodoInicio() + "  ->  " + invoice.getPeriodoFin());
                y -= 12;

                // Gray separator
                setStroke(cs, GRIS_LINE);
                cs.moveTo(MARGIN, y);
                cs.lineTo(PAGE_WIDTH - MARGIN, y);
                cs.stroke();
                y -= 14;

                // ═══════════════════════════════════════
                //  DETAIL TABLE
                // ═══════════════════════════════════════
                setFill(cs, AZUL);
                y = writeLine(cs, PDType1Font.HELVETICA_BOLD, 9, MARGIN, y,
                        "DETALLE DEL CONSUMO");
                y -= 8;

                float col1 = MARGIN;
                float col2 = MARGIN + 180;
                float col3 = MARGIN + 280;
                float col4 = MARGIN + 370;
                float tableRight = PAGE_WIDTH - MARGIN;

                // Table header row background
                setFill(cs, AZUL);
                cs.addRect(MARGIN, y - 3, tableRight - MARGIN, 15);
                cs.fill();

                setFill(cs, BLANCO);
                writeRow(cs, PDType1Font.HELVETICA_BOLD, 6.75f, y, col1 + 5, col2, col3, col4,
                        "Concepto", "Cantidad", "Precio unit.", "Importe (\u20ac)");
                y -= 15;

                // Table body
                setFill(cs, NEGRO);
                List<InvoiceLine> lines = invoice.getLines();
                if (lines != null) {
                    boolean alt = false;
                    for (InvoiceLine line : lines) {
                        if (alt) {
                            setFill(cs, GRIS_BG);
                            cs.addRect(MARGIN, y - 3, tableRight - MARGIN, 13);
                            cs.fill();
                        }
                        alt = !alt;

                        setFill(cs, NEGRO);
                        String cantidad = formatCantidad(line);
                        String precio   = formatPrecio(line);
                        String importe  = EUR_FMT.format(line.getImporte());

                        writeRow(cs, PDType1Font.HELVETICA, 6.75f, y, col1 + 5, col2, col3, col4,
                                line.getDescripcion(), cantidad, precio, importe);
                        y -= 13;
                    }
                }

                y -= 3;
                setStroke(cs, GRIS_LINE);
                cs.moveTo(MARGIN, y);
                cs.lineTo(tableRight, y);
                cs.stroke();
                y -= 16;

                // ═══════════════════════════════════════
                //  PIE CHART — Desglose por concepto
                // ═══════════════════════════════════════
                if (lines != null && !lines.isEmpty()) {
                    y = drawPieChart(cs, lines, invoice.getTotal(), y, readings);
                    y -= 16;
                }

                // ═══════════════════════════════════════
                //  TOTALS
                // ═══════════════════════════════════════
                setFill(cs, AZUL);
                y = writeLine(cs, PDType1Font.HELVETICA_BOLD, 9, MARGIN, y, "RESUMEN");
                y -= 8;

                float labelX = PAGE_WIDTH - MARGIN - 200;
                float valueX = PAGE_WIDTH - MARGIN - 50;

                setFill(cs, NEGRO);
                y = writeTwoCol(cs, PDType1Font.HELVETICA, 7.5f, y, labelX, valueX,
                        "Base imponible:", EUR_FMT.format(invoice.getBase()) + " \u20ac");
                y -= 2;
                y = writeTwoCol(cs, PDType1Font.HELVETICA, 7.5f, y, labelX, valueX,
                        "IVA:", EUR_FMT.format(invoice.getImpuestos()) + " \u20ac");
                y -= 6;

                // Orange line before total
                setStroke(cs, NARANJA);
                cs.setLineWidth(1.5f);
                cs.moveTo(labelX - 8, y);
                cs.lineTo(PAGE_WIDTH - MARGIN, y);
                cs.stroke();
                cs.setLineWidth(0.5f);
                y -= 5;

                // TOTAL box with orange background
                float totalBoxW = 200f;
                float totalBoxH = 24f;
                float totalBoxX = PAGE_WIDTH - MARGIN - totalBoxW;
                setFill(cs, NARANJA);
                cs.addRect(totalBoxX, y - totalBoxH + 6, totalBoxW, totalBoxH);
                cs.fill();

                setFill(cs, BLANCO);
                writeTwoCol(cs, PDType1Font.HELVETICA_BOLD, 10.5f, y - 8,
                        totalBoxX + 10, totalBoxX + totalBoxW - 65,
                        "TOTAL:", EUR_FMT.format(invoice.getTotal()) + " \u20ac");

                y -= (totalBoxH + 24);

                // ═══════════════════════════════════════
                //  FOOTER
                // ═══════════════════════════════════════
                float footerH = 32f;
                setFill(cs, AZUL);
                cs.addRect(0, 0, PAGE_WIDTH, footerH);
                cs.fill();

                setFill(cs, BLANCO);
                writeLine(cs, PDType1Font.HELVETICA, 6, MARGIN, 20,
                        "Naturgy Energy Group, S.A. | Atenci\u00f3n al Cliente: 900 100 100 | www.naturgy.com");
                writeLine(cs, PDType1Font.HELVETICA_OBLIQUE, 5.25f, MARGIN, 10,
                        "Factura electr\u00f3nica generada autom\u00e1ticamente. Este documento no requiere firma.");
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    // ---- Helper: set fill color ----
    private void setFill(PDPageContentStream cs, float[] rgb) throws IOException {
        cs.setNonStrokingColor(rgb[0], rgb[1], rgb[2]);
    }

    // ---- Helper: set stroke color ----
    private void setStroke(PDPageContentStream cs, float[] rgb) throws IOException {
        cs.setStrokingColor(rgb[0], rgb[1], rgb[2]);
    }

    // ═══════════════════════════════════════════════════
    //  PIE CHART  — Consumo / Término fijo / IVA
    // ═══════════════════════════════════════════════════

    /** Slice descriptor for the pie chart. */
    private record PieSlice(String label, BigDecimal amount, float[] color) {}

    /**
     * Draws a pie chart at the current y position.
     * Groups invoice lines into Consumo (TERMINO_VARIABLE + ALQUILER),
     * Término Fijo (TERMINO_FIJO) and IVA, then renders the chart with a legend.
     *
     * @return the new y position after the chart
     */
    private float drawPieChart(PDPageContentStream cs, List<InvoiceLine> lines,
                                BigDecimal total, float startY,
                                List<GasReading> readings) throws IOException {

        // Aggregate amounts by category
        BigDecimal consumo = BigDecimal.ZERO;
        BigDecimal fijo    = BigDecimal.ZERO;
        BigDecimal iva     = BigDecimal.ZERO;
        BigDecimal servigas = BigDecimal.ZERO;
        BigDecimal bonificacion = BigDecimal.ZERO;

        for (InvoiceLine line : lines) {
            switch (line.getTipoLinea()) {
                case TERMINO_VARIABLE, ALQUILER -> consumo = consumo.add(line.getImporte());
                case TERMINO_FIJO               -> fijo    = fijo.add(line.getImporte());
                case IVA                        -> iva     = iva.add(line.getImporte());
                case SERVIGAS                   -> servigas = servigas.add(line.getImporte());
                case BONIFICACION               -> bonificacion = bonificacion.add(line.getImporte());
            }
        }

        // Build slice list (skip zero amounts)
        List<PieSlice> slices = new ArrayList<>();
        float[][] colors = {
            NARANJA,                                    // Consumo  — orange
            AZUL,                                       // T. Fijo  — blue
            {0.400f, 0.733f, 0.416f},                   // IVA      — green #66BB6A
            {0.612f, 0.153f, 0.690f},                   // ServiGas — purple #9C27B0
            {0.129f, 0.588f, 0.953f}                    // Bonificación — light blue #2196F3
        };
        if (consumo.signum() > 0) slices.add(new PieSlice("Consumo", consumo, colors[0]));
        if (fijo.signum() > 0)    slices.add(new PieSlice("Término fijo", fijo, colors[1]));
        if (iva.signum() > 0)     slices.add(new PieSlice("IVA", iva, colors[2]));
        if (servigas.signum() > 0) slices.add(new PieSlice("ServiGas", servigas, colors[3]));
        if (bonificacion.signum() != 0) slices.add(new PieSlice("Bonificación", bonificacion.abs(), colors[4]));

        if (slices.isEmpty()) return startY;

        BigDecimal grandTotal = consumo.add(fijo).add(iva).add(servigas).add(bonificacion.abs());
        if (grandTotal.signum() <= 0) return startY;

        // Title
        setFill(cs, AZUL);
        float y = writeLine(cs, PDType1Font.HELVETICA_BOLD, 9, MARGIN, startY,
                "DESGLOSE POR CONCEPTO");
        y -= 6;

        // Geometry
        float chartR   = 50f;          // radius
        float chartCX  = MARGIN + chartR + 10;
        float chartCY  = y - chartR - 5;
        float legendX  = MARGIN + chartR * 2 + 50;
        float legendY  = y - 10;

        // Draw slices
        double angleStart = 90.0;      // start at 12 o'clock

        for (PieSlice slice : slices) {
            double pct   = slice.amount.doubleValue() / grandTotal.doubleValue();
            double sweep = pct * 360.0;

            setFill(cs, slice.color);
            drawPieSlice(cs, chartCX, chartCY, chartR, angleStart, sweep);
            cs.fill();

            angleStart -= sweep;        // clockwise
        }

        // Draw thin white border between slices (redraw wedge edges)
        setStroke(cs, BLANCO);
        cs.setLineWidth(1.5f);
        double edgeAngle = 90.0;
        for (PieSlice slice : slices) {
            double pct   = slice.amount.doubleValue() / grandTotal.doubleValue();
            double sweep = pct * 360.0;

            double rad = Math.toRadians(edgeAngle);
            float ex = chartCX + chartR * (float) Math.cos(rad);
            float ey = chartCY + chartR * (float) Math.sin(rad);
            cs.moveTo(chartCX, chartCY);
            cs.lineTo(ex, ey);
            cs.stroke();

            edgeAngle -= sweep;
        }
        cs.setLineWidth(0.5f);

        // Legend
        float boxSize = 8f;
        for (PieSlice slice : slices) {
            double pct = slice.amount.doubleValue() / grandTotal.doubleValue() * 100.0;
            String pctStr = BigDecimal.valueOf(pct).setScale(1, RoundingMode.HALF_UP).toPlainString();

            // Color swatch
            setFill(cs, slice.color);
            cs.addRect(legendX, legendY - 1, boxSize, boxSize);
            cs.fill();

            // Label + percentage + amount
            setFill(cs, NEGRO);
            String legendText = slice.label + "  " + pctStr + "%  (" + EUR_FMT.format(slice.amount) + " \u20ac)";
            writeLine(cs, PDType1Font.HELVETICA, 7f, legendX + boxSize + 5, legendY, legendText);

            legendY -= 16;
        }

        // ═══════════════════════════════════════
        //  BAR CHART — Last consumption readings
        // ═══════════════════════════════════════
        float barChartBottom = chartCY - chartR - 12;
        if (readings != null && readings.size() >= 2) {
            barChartBottom = drawBarChart(cs, readings, chartCY + chartR + 5, chartCY - chartR - 5);
        }

        return barChartBottom;
    }

    /**
     * Draws a bar chart showing the last 5 consumption deltas (m³) computed
     * from consecutive readings. Positioned to the right of the pie chart.
     *
     * @param chartTop   top y of the available chart area
     * @param chartBottom bottom y of the chart area
     * @return the new y position after the chart
     */
    private float drawBarChart(PDPageContentStream cs, List<GasReading> readings,
                                float chartTop, float chartBottom) throws IOException {
        // Compute consumption deltas from consecutive readings (newest first)
        // readings are ordered by fecha DESC; we need pairs: consumption[i] = reading[i].lecturaM3 - reading[i+1].lecturaM3
        List<GasReading> sorted = readings.stream()
                .sorted((a, b) -> a.getFecha().compareTo(b.getFecha()))  // ASC by date
                .toList();

        // Calculate deltas between consecutive readings
        record BarEntry(String label, BigDecimal value) {}
        List<BarEntry> entries = new ArrayList<>();
        for (int i = 1; i < sorted.size() && entries.size() < 5; i++) {
            BigDecimal delta = sorted.get(i).getLecturaM3().subtract(sorted.get(i - 1).getLecturaM3());
            if (delta.signum() >= 0) {
                String label = sorted.get(i).getFecha().toString().substring(5); // MM-DD
                entries.add(new BarEntry(label, delta));
            }
        }

        if (entries.isEmpty()) return chartBottom;

        // Position: to the right of the pie chart legend area
        float barAreaX = PAGE_WIDTH / 2 + 20;
        float barAreaRight = PAGE_WIDTH - MARGIN;
        float barAreaWidth = barAreaRight - barAreaX;

        // Title
        setFill(cs, AZUL);
        writeLine(cs, PDType1Font.HELVETICA_BOLD, 7.5f, barAreaX, chartTop,
                "ÚLTIMOS CONSUMOS (m³)");

        // Chart geometry
        float barChartTop = chartTop - 14;
        float barChartBottom = chartBottom + 14;
        float barChartHeight = barChartTop - barChartBottom;
        float barCount = entries.size();
        float barGap = 6f;
        float barWidth = (barAreaWidth - (barCount + 1) * barGap) / barCount;
        if (barWidth > 40f) barWidth = 40f;

        // Find max value for scaling
        BigDecimal maxVal = BigDecimal.ZERO;
        for (BarEntry e : entries) {
            if (e.value.compareTo(maxVal) > 0) maxVal = e.value;
        }
        if (maxVal.signum() <= 0) return chartBottom;

        // Y axis baseline
        float baselineY = barChartBottom;

        // Draw axis line
        setStroke(cs, GRIS_LINE);
        cs.setLineWidth(0.5f);
        cs.moveTo(barAreaX, baselineY);
        cs.lineTo(barAreaX + barAreaWidth, baselineY);
        cs.stroke();

        // Draw bars
        float[][] barColors = {
            NARANJA,
            AZUL,
            {0.400f, 0.733f, 0.416f},  // green
            AZUL_LITE,
            {0.800f, 0.400f, 0.200f}   // brown-ish
        };

        for (int i = 0; i < entries.size(); i++) {
            BarEntry e = entries.get(i);
            float pct = e.value.floatValue() / maxVal.floatValue();
            float barH = pct * (barChartHeight - 14);  // leave room for value label
            float barX = barAreaX + barGap + i * (barWidth + barGap);

            // Bar rectangle
            setFill(cs, barColors[i % barColors.length]);
            cs.addRect(barX, baselineY, barWidth, barH);
            cs.fill();

            // Value label on top of bar
            setFill(cs, NEGRO);
            String valStr = KWH_FMT.format(e.value);
            float valWidth = PDType1Font.HELVETICA.getStringWidth(valStr) / 1000f * 5.5f;
            float valX = barX + (barWidth - valWidth) / 2;
            writeLine(cs, PDType1Font.HELVETICA, 5.5f, valX, baselineY + barH + 2, valStr);

            // Date label below bar
            setFill(cs, GRIS_TXT);
            float lblWidth = PDType1Font.HELVETICA.getStringWidth(e.label) / 1000f * 5.5f;
            float lblX = barX + (barWidth - lblWidth) / 2;
            writeLine(cs, PDType1Font.HELVETICA, 5.5f, lblX, baselineY - 10, e.label);
        }

        return baselineY - 16;
    }

    /**
     * Draws a filled pie slice (wedge) using cubic Bézier approximation.
     * The slice starts at {@code startAngleDeg} and sweeps {@code sweepDeg}
     * degrees (positive = counter-clockwise). The path starts at the center,
     * goes to the arc start, follows the arc, and closes back to center.
     */
    private void drawPieSlice(PDPageContentStream cs, float cx, float cy,
                               float r, double startAngleDeg, double sweepDeg) throws IOException {
        if (Math.abs(sweepDeg) < 0.01) return;

        // Break into arcs of at most 90°
        int segments = (int) Math.ceil(Math.abs(sweepDeg) / 90.0);
        double segSweep = sweepDeg / segments;

        double angle = Math.toRadians(startAngleDeg);
        float startX = cx + r * (float) Math.cos(angle);
        float startY = cy + r * (float) Math.sin(angle);

        cs.moveTo(cx, cy);
        cs.lineTo(startX, startY);

        for (int i = 0; i < segments; i++) {
            double a1 = Math.toRadians(startAngleDeg - i * Math.abs(segSweep) * Math.signum(sweepDeg));
            double a2 = Math.toRadians(startAngleDeg - (i + 1) * Math.abs(segSweep) * Math.signum(sweepDeg));
            drawArcSegment(cs, cx, cy, r, a1, a2);
        }

        cs.lineTo(cx, cy);
        cs.closePath();
    }

    /**
     * Approximates a circular arc from angle a1 to a2 (radians) using a
     * single cubic Bézier curve. Works well for arcs up to 90°.
     */
    private void drawArcSegment(PDPageContentStream cs, float cx, float cy,
                                 float r, double a1, double a2) throws IOException {
        double halfArc = (a2 - a1) / 2.0;
        double alpha   = 4.0 / 3.0 * Math.tan(halfArc / 2.0);

        float cos1 = (float) Math.cos(a1), sin1 = (float) Math.sin(a1);
        float cos2 = (float) Math.cos(a2), sin2 = (float) Math.sin(a2);

        float cp1x = (float)(cx + r * (cos1 - alpha * sin1));
        float cp1y = (float)(cy + r * (sin1 + alpha * cos1));
        float cp2x = (float)(cx + r * (cos2 + alpha * sin2));
        float cp2y = (float)(cy + r * (sin2 - alpha * cos2));
        float endX = cx + r * cos2;
        float endY = cy + r * sin2;

        cs.curveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
    }

    private String formatCantidad(InvoiceLine line) {
        return switch (line.getTipoLinea()) {
            case TERMINO_VARIABLE -> KWH_FMT.format(line.getCantidad()) + " kWh";
            case IVA -> line.getCantidad().multiply(BigDecimal.valueOf(100)).setScale(0, java.math.RoundingMode.HALF_UP) + " %";
            case BONIFICACION -> line.getCantidad().multiply(BigDecimal.valueOf(100)).setScale(0, java.math.RoundingMode.HALF_UP) + " %";
            default -> KWH_FMT.format(line.getCantidad());
        };
    }

    private String formatPrecio(InvoiceLine line) {
        return switch (line.getTipoLinea()) {
            case TERMINO_VARIABLE -> line.getPrecioUnitario().toPlainString() + " €/kWh";
            case IVA -> EUR_FMT.format(line.getPrecioUnitario()) + " €";
            case BONIFICACION -> EUR_FMT.format(line.getPrecioUnitario()) + " €";
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
