package com.naturgy.gas.seed;

import com.naturgy.gas.entity.*;
import com.naturgy.gas.repository.*;
import com.naturgy.gas.repository.ClienteRepository;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.FileReader;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Idempotent seed loader. Loads CSVs from _data/db/samples/ in dependency order.
 * If a CSV is missing the app still boots (a note is logged).
 * Malformed CSVs cause a clear exception without leaving the DB in an inconsistent state.
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private static final String SAMPLES_RELATIVE = "_data/db/samples/";

    private final ClienteRepository clienteRepository;
    private final SupplyPointRepository supplyPointRepository;
    private final GasTariffRepository gasTariffRepository;
    private final GasConversionFactorRepository gasConversionFactorRepository;
    private final TaxConfigRepository taxConfigRepository;
    private final GasReadingRepository gasReadingRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        log.info("=== DataSeeder: starting idempotent CSV seed ===");
        String samplesDir = resolveSamplesDir();
        seedUsuarios();
        seedClientes();
        seedSupplyPoints(samplesDir);
        seedGasTariffs(samplesDir);
        seedGasConversionFactors(samplesDir);
        seedTaxes(samplesDir);
        seedGasReadings(samplesDir);
        log.info("=== DataSeeder: seed complete ===");
    }

    /**
     * Resolves the _data/db/samples/ directory by walking up from the current working directory
     * until the directory is found. This handles the case where Maven runs tests from the
     * backend/ subdirectory while the data lives at the repo root.
     */
    private String resolveSamplesDir() {
        Path cwd = Paths.get("").toAbsolutePath();
        Path candidate = cwd;
        for (int i = 0; i < 5; i++) {
            Path dataDir = candidate.resolve(SAMPLES_RELATIVE);
            if (Files.isDirectory(dataDir)) {
                log.info("DataSeeder: resolved samples dir -> {}", dataDir);
                return dataDir.toString() + "/";
            }
            if (candidate.getParent() == null) break;
            candidate = candidate.getParent();
        }
        log.warn("DataSeeder: could not resolve samples dir from cwd={}, falling back to relative path", cwd);
        return SAMPLES_RELATIVE;
    }

    @Transactional
    public void seedUsuarios() {
        if (usuarioRepository.count() > 0) return;
        // Admin user
        Usuario admin = new Usuario();
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setNombre("Administrador");
        admin.setRol(Usuario.Rol.ADMIN);
        usuarioRepository.save(admin);
        // Viewer user
        Usuario viewer = new Usuario();
        viewer.setUsername("viewer");
        viewer.setPassword(passwordEncoder.encode("viewer123"));
        viewer.setNombre("Consultor");
        viewer.setRol(Usuario.Rol.VIEWER);
        usuarioRepository.save(viewer);
        log.info("usuarios: 2 seed users created (admin/viewer)");
    }

    @Transactional
    public void seedClientes() {
        if (clienteRepository.count() > 0) return;
        // Jugadores del FC Barcelona (plantilla 2025-26)
        Object[][] data = {
            {"X1234567A", "Marc-André", "ter Stegen",    "terstegen@fcbarcelona.com",  "600000001", java.time.LocalDate.of(1992, 4, 30)},
            {"X2345678B", "Alejandro",  "Balde Rodríguez","balde@fcbarcelona.com",     "600000002", java.time.LocalDate.of(2003, 10, 18)},
            {"X3456789C", "Ronald",     "Araújo da Silva","araujo@fcbarcelona.com",    "600000003", java.time.LocalDate.of(1999, 3, 7)},
            {"54321098D", "Pau",        "Cubarsí Casas",  "cubarsi@fcbarcelona.com",   "600000004", java.time.LocalDate.of(2007, 1, 22)},
            {"X4567890E", "Jules",      "Koundé",         "kounde@fcbarcelona.com",    "600000005", java.time.LocalDate.of(1998, 11, 12)},
            {"67890123F", "Pedro",      "González López", "pedri@fcbarcelona.com",     "600000006", java.time.LocalDate.of(2002, 11, 25)},
            {"78901234G", "Francisco",  "Páez Jiménez",   "gavi@fcbarcelona.com",      "600000007", java.time.LocalDate.of(2004, 2, 5)},
            {"X5678901H", "Frenkie",    "de Jong",        "dejong@fcbarcelona.com",    "600000008", java.time.LocalDate.of(1997, 5, 12)},
            {"89012345I", "Lamine",     "Yamal Nasraoui", "yamal@fcbarcelona.com",     "600000009", java.time.LocalDate.of(2007, 7, 16)},
            {"X6789012J", "Robert",     "Lewandowski",    "lewandowski@fcbarcelona.com","600000010", java.time.LocalDate.of(1988, 8, 21)},
            {"X7890123K", "Raphael",    "Dias Belloli",   "raphinha@fcbarcelona.com",  "600000011", java.time.LocalDate.of(1996, 12, 14)},
        };
        for (Object[] row : data) {
            Cliente c = new Cliente();
            c.setNif((String) row[0]);
            c.setNombre((String) row[1]);
            c.setApellidos((String) row[2]);
            c.setEmail((String) row[3]);
            c.setTelefono((String) row[4]);
            c.setFechaNacimiento((java.time.LocalDate) row[5]);
            clienteRepository.save(c);
        }
        log.info("clientes: {} seed rows loaded", clienteRepository.count());
    }

    @Transactional
    public void seedSupplyPoints(String samplesDir) {
        String file = samplesDir + "supply-points.csv";
        if (!fileExists(file)) return;
        List<String[]> rows = readCsv(file);
        int loaded = 0;
        for (String[] row : rows) {
            String cups = cell(row, 0, file);
            if (supplyPointRepository.existsById(cups)) continue;
            SupplyPoint sp = new SupplyPoint();
            sp.setCups(cups);
            sp.setZona(cell(row, 1, file));
            sp.setTarifa(cell(row, 2, file));
            sp.setEstado(parseEnum(SupplyPoint.EstadoSupply.class, cell(row, 3, file), file));
            if (row.length > 4)  sp.setCalle(cell(row, 4, file));
            if (row.length > 5)  sp.setNumero(cell(row, 5, file));
            if (row.length > 6)  sp.setPiso(cell(row, 6, file));
            if (row.length > 7)  sp.setCodigoPostal(cell(row, 7, file));
            if (row.length > 8)  sp.setMunicipio(cell(row, 8, file));
            if (row.length > 9)  sp.setProvincia(cell(row, 9, file));
            if (row.length > 10) {
                String nif = cell(row, 10, file);
                clienteRepository.findByNif(nif).ifPresent(sp::setCliente);
            }
            if (row.length > 11) sp.setDireccion(cell(row, 11, file));
            supplyPointRepository.save(sp);
            loaded++;
        }
        log.info("supply-points: {} new rows loaded (total {})", loaded, supplyPointRepository.count());
    }

    @Transactional
    public void seedGasTariffs(String samplesDir) {
        String file = samplesDir + "gas-tariffs.csv";
        if (!fileExists(file)) return;
        List<String[]> rows = readCsv(file);
        int loaded = 0;
        for (String[] row : rows) {
            String tarifa = cell(row, 0, file);
            if (gasTariffRepository.existsById(tarifa)) continue;
            GasTariff gt = new GasTariff();
            gt.setTarifa(tarifa);
            gt.setFijoMesEur(parseDecimal(cell(row, 1, file), "fijo_mes_eur", file));
            gt.setVariableEurKwh(parseDecimal(cell(row, 2, file), "variable_eur_kwh", file));
            gt.setVigenciaDesde(parseDate(cell(row, 3, file), "vigencia_desde", file));
            gasTariffRepository.save(gt);
            loaded++;
        }
        log.info("gas-tariffs: {} new rows loaded (total {})", loaded, gasTariffRepository.count());
    }

    @Transactional
    public void seedGasConversionFactors(String samplesDir) {
        String file = samplesDir + "gas-conversion-factors.csv";
        if (!fileExists(file)) return;
        List<String[]> rows = readCsv(file);
        int loaded = 0;
        for (String[] row : rows) {
            String zona = cell(row, 0, file);
            String mes = cell(row, 1, file);
            if (gasConversionFactorRepository.existsByZonaAndMes(zona, mes)) continue;
            GasConversionFactor gcf = new GasConversionFactor();
            gcf.setZona(zona);
            gcf.setMes(mes);
            gcf.setCoefConv(parseDecimal(cell(row, 2, file), "coef_conv", file));
            gcf.setPcsKwhM3(parseDecimal(cell(row, 3, file), "pcs_kwh_m3", file));
            gasConversionFactorRepository.save(gcf);
            loaded++;
        }
        log.info("gas-conversion-factors: {} new rows loaded (total {})", loaded, gasConversionFactorRepository.count());
    }

    @Transactional
    public void seedTaxes(String samplesDir) {
        String file = samplesDir + "taxes.csv";
        if (!fileExists(file)) return;
        List<String[]> rows = readCsv(file);
        int loaded = 0;
        for (String[] row : rows) {
            String taxCode = cell(row, 0, file);
            if (taxConfigRepository.existsById(taxCode)) continue;
            TaxConfig tc = new TaxConfig();
            tc.setTaxCode(taxCode);
            tc.setTaxRate(parseDecimal(cell(row, 1, file), "taxRate", file));
            tc.setVigenciaDesde(parseDate(cell(row, 2, file), "vigencia_desde", file));
            taxConfigRepository.save(tc);
            loaded++;
        }
        log.info("taxes: {} new rows loaded (total {})", loaded, taxConfigRepository.count());
    }

    @Transactional
    public void seedGasReadings(String samplesDir) {
        String file = samplesDir + "gas-readings.csv";
        if (!fileExists(file)) return;
        List<String[]> rows = readCsv(file);
        int loaded = 0;
        for (String[] row : rows) {
            String cups = cell(row, 0, file);
            LocalDate fecha = parseDate(cell(row, 1, file), "fecha", file);
            if (gasReadingRepository.existsByCupsAndFecha(cups, fecha)) continue;
            GasReading gr = new GasReading();
            gr.setCups(cups);
            gr.setFecha(fecha);
            gr.setLecturaM3(parseDecimal(cell(row, 2, file), "lectura_m3", file));
            gr.setTipo(parseEnum(GasReading.TipoLectura.class, cell(row, 3, file), file));
            gasReadingRepository.save(gr);
            loaded++;
        }
        log.info("gas-readings: {} new rows loaded (total {})", loaded, gasReadingRepository.count());
    }

    // ---- helpers ----

    private boolean fileExists(String path) {
        Path p = Paths.get(path);
        if (!Files.exists(p)) {
            log.warn("CSV not found: {} — skipping (app still boots)", path);
            return false;
        }
        return true;
    }

    private List<String[]> readCsv(String path) {
        List<String[]> rows = new ArrayList<>();
        try (CSVReader reader = new CSVReader(new FileReader(path))) {
            String[] header = reader.readNext(); // skip header
            if (header == null) {
                throw new IllegalStateException("CSV is empty: " + path);
            }
            String[] row;
            while ((row = reader.readNext()) != null) {
                rows.add(row);
            }
        } catch (IOException | CsvValidationException e) {
            throw new IllegalStateException("Failed to read CSV: " + path, e);
        }
        return rows;
    }

    private String cell(String[] row, int idx, String file) {
        if (idx >= row.length) {
            throw new IllegalStateException(
                String.format("CSV %s: expected column at index %d but row has only %d columns", file, idx, row.length));
        }
        String val = row[idx].trim();
        if (val.isEmpty()) {
            throw new IllegalStateException(
                String.format("CSV %s: column %d is blank in row: %s", file, idx, String.join(",", row)));
        }
        return val;
    }

    private BigDecimal parseDecimal(String value, String field, String file) {
        try {
            return new BigDecimal(value);
        } catch (NumberFormatException e) {
            throw new IllegalStateException(
                String.format("CSV %s: invalid decimal for field '%s': '%s'", file, field, value));
        }
    }

    private LocalDate parseDate(String value, String field, String file) {
        try {
            return LocalDate.parse(value);
        } catch (Exception e) {
            throw new IllegalStateException(
                String.format("CSV %s: invalid date (expected YYYY-MM-DD) for field '%s': '%s'", file, field, value));
        }
    }

    private <E extends Enum<E>> E parseEnum(Class<E> type, String value, String file) {
        try {
            return Enum.valueOf(type, value);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException(
                String.format("CSV %s: invalid enum value '%s' for type %s", file, value, type.getSimpleName()));
        }
    }
}
