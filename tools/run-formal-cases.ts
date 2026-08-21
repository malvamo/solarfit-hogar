import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildFormalCaseEvidence,
  canonicalJson,
  renderCaseSummaryCsv,
  renderEvidenceMarkdown,
  renderMonthlySeriesCsv,
  sha256Canonical,
  sha256Text,
  validateFormalCaseFixture,
  validateSolarYieldDataset,
  type FormalCaseEvidence,
} from "../src/domain/solar/formal-case-evidence";

const RUNNER_VERSION = "1.0.0";
const DEFAULT_BASE_URL = "https://solarfit-hogar.vercel.app";
const MAXIMUM_ATTEMPTS = 3;
const INITIAL_BACKOFF_MS = 750;
const REQUEST_TIMEOUT_MS = 30_000;
const INTER_REQUEST_DELAY_MS = 800;

interface CliOptions {
  baseUrl: string;
  fixtureDirectory: string;
  outputDirectory: string;
  generatedAt: string;
}

function usage() {
  return [
    "Uso: pnpm cases:run -- [opciones]",
    "",
    "Opciones:",
    "  --base-url <url>       Base de los endpoints (producción por defecto).",
    "  --fixtures <ruta>      Carpeta de fixtures JSON.",
    "  --output <ruta>        Carpeta de salida de evidencia.",
    "  --timestamp <ISO>      Marca temporal común para la ejecución.",
    "  --help                 Muestra esta ayuda.",
  ].join("\n");
}

function optionValue(args: string[], index: number, option: string) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${option} requiere un valor.`);
  }
  return value;
}

function parseOptions(args: string[]): CliOptions {
  const options: CliOptions = {
    baseUrl: process.env.SOLARFIT_CASES_BASE_URL?.trim() || DEFAULT_BASE_URL,
    fixtureDirectory:
      process.env.SOLARFIT_CASES_FIXTURES?.trim() || path.join("cases", "fixtures", "v1"),
    outputDirectory:
      process.env.SOLARFIT_CASES_OUTPUT?.trim() || path.join("cases", "evidence", "latest"),
    generatedAt: process.env.SOLARFIT_EVIDENCE_TIMESTAMP?.trim() || new Date().toISOString(),
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--") continue;
    if (argument === "--help") {
      console.log(usage());
      process.exit(0);
    }
    if (argument === "--base-url") {
      options.baseUrl = optionValue(args, index, argument);
      index += 1;
    } else if (argument === "--fixtures") {
      options.fixtureDirectory = optionValue(args, index, argument);
      index += 1;
    } else if (argument === "--output") {
      options.outputDirectory = optionValue(args, index, argument);
      index += 1;
    } else if (argument === "--timestamp") {
      options.generatedAt = optionValue(args, index, argument);
      index += 1;
    } else if (argument !== "--help") {
      throw new Error(`Opción desconocida: ${argument}`);
    }
  }

  const parsedBaseUrl = new URL(options.baseUrl);
  if (!/^https?:$/.test(parsedBaseUrl.protocol)) {
    throw new Error("--base-url debe usar http o https.");
  }
  if (Number.isNaN(Date.parse(options.generatedAt))) {
    throw new Error("--timestamp debe ser una fecha ISO válida.");
  }
  options.baseUrl = options.baseUrl.replace(/\/$/, "");
  return options;
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

async function postJsonWithRetry(endpoint: string, body: unknown) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAXIMUM_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": `SolarFitFormalCases/${RUNNER_VERSION}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (response.ok) return payload;
      const message =
        payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
          ? payload.error
          : `HTTP ${response.status}`;
      lastError = new Error(`${endpoint} respondió ${response.status}: ${message}`);
      if (!isRetryableStatus(response.status) || attempt === MAXIMUM_ATTEMPTS) break;
    } catch (error) {
      lastError = error;
      if (attempt === MAXIMUM_ATTEMPTS) break;
    }

    const backoffMs = INITIAL_BACKOFF_MS * 2 ** (attempt - 1);
    console.warn(`  reintento ${attempt + 1}/${MAXIMUM_ATTEMPTS} en ${backoffMs} ms`);
    await delay(backoffMs);
  }

  throw lastError instanceof Error ? lastError : new Error(`Falló la consulta a ${endpoint}.`);
}

async function loadFixtures(directory: string) {
  const filenames = (await readdir(directory))
    .filter((filename) => filename.endsWith(".json"))
    .toSorted();
  const fixtures = [];

  for (const filename of filenames) {
    const raw = await readFile(path.join(directory, filename), "utf8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(`${filename} no contiene JSON válido.`, { cause: error });
    }
    fixtures.push(validateFormalCaseFixture(parsed));
  }

  if (fixtures.length !== 5) {
    throw new Error(`Se esperaban exactamente 5 fixtures y se encontraron ${fixtures.length}.`);
  }
  const ids = new Set(fixtures.map((fixture) => fixture.caseId));
  if (ids.size !== fixtures.length) throw new Error("Los caseId de los fixtures deben ser únicos.");
  return fixtures.toSorted((a, b) => a.caseId.localeCompare(b.caseId));
}

async function writeEvidenceFiles(
  evidence: readonly FormalCaseEvidence[],
  outputDirectory: string,
  runStartedAt: string,
  runCompletedAt: string,
  baseUrl: string,
) {
  const casesDirectory = path.join(outputDirectory, "cases");
  await mkdir(casesDirectory, { recursive: true });

  const caseEntries = [];
  for (const item of evidence) {
    const relativePath = `cases/${item.caseId}.json`;
    const contents = `${canonicalJson(item, true)}\n`;
    await writeFile(path.join(outputDirectory, ...relativePath.split("/")), contents, "utf8");
    caseEntries.push({
      caseId: item.caseId,
      path: relativePath,
      evidenceSha256: item.integrity.sha256,
      fileSha256: sha256Text(contents),
    });
  }

  const summaryCsv = renderCaseSummaryCsv(evidence);
  const monthlyCsv = renderMonthlySeriesCsv(evidence);
  const markdown = renderEvidenceMarkdown(evidence);
  const artifactFiles = {
    summaryCsv: { path: "resumen_casos.csv", sha256: sha256Text(summaryCsv) },
    monthlyCsv: { path: "series_mensuales.csv", sha256: sha256Text(monthlyCsv) },
    markdown: { path: "evidencia_5_casos.md", sha256: sha256Text(markdown) },
  };

  await writeFile(path.join(outputDirectory, artifactFiles.summaryCsv.path), summaryCsv, "utf8");
  await writeFile(path.join(outputDirectory, artifactFiles.monthlyCsv.path), monthlyCsv, "utf8");
  await writeFile(path.join(outputDirectory, artifactFiles.markdown.path), markdown, "utf8");

  const manifestCore = {
    schemaVersion: "1.0.0",
    classification: "simulated_formal",
    runnerVersion: RUNNER_VERSION,
    runStartedAt,
    runCompletedAt,
    baseUrl,
    requestMode: "sequential",
    caseCount: evidence.length,
    cases: caseEntries.toSorted((a, b) => a.caseId.localeCompare(b.caseId)),
    artifacts: artifactFiles,
  };
  const manifest = {
    ...manifestCore,
    integrity: {
      algorithm: "SHA-256",
      canonicalization: "recursive-key-sort-json-v1",
      sha256: sha256Canonical(manifestCore),
    },
  };
  await writeFile(
    path.join(outputDirectory, "manifest.json"),
    `${canonicalJson(manifest, true)}\n`,
    "utf8",
  );
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const runStartedAt = options.generatedAt;
  const fixtures = await loadFixtures(options.fixtureDirectory);
  const retryPolicy = {
    maximumAttempts: MAXIMUM_ATTEMPTS,
    initialBackoffMs: INITIAL_BACKOFF_MS,
    requestTimeoutMs: REQUEST_TIMEOUT_MS,
  };
  const evidence: FormalCaseEvidence[] = [];

  console.log(`SolarFit casos formales ${RUNNER_VERSION}`);
  console.log(`Base: ${options.baseUrl}`);
  console.log(`Fixtures: ${options.fixtureDirectory}`);
  console.log("Clasificación: simulated_formal (no son observaciones domiciliarias reales)");

  for (const [index, fixture] of fixtures.entries()) {
    const requestBody = {
      latitude: fixture.input.latitude as number,
      longitude: fixture.input.longitude as number,
      tiltDeg: fixture.input.tiltDeg,
      azimuthDeg: fixture.input.azimuthDeg,
      systemLossPct: fixture.input.pvgisSystemLossPct,
    };
    console.log(`[${index + 1}/5] ${fixture.caseId}: PVGIS`);
    const pvgisPayload = await postJsonWithRetry(`${options.baseUrl}/api/pvgis`, requestBody);
    const pvgis = validateSolarYieldDataset(pvgisPayload, "PVGIS");
    await delay(INTER_REQUEST_DELAY_MS);

    console.log(`[${index + 1}/5] ${fixture.caseId}: PVWatts`);
    const pvwattsPayload = await postJsonWithRetry(`${options.baseUrl}/api/pvwatts`, requestBody);
    const pvwatts = validateSolarYieldDataset(pvwattsPayload, "PVWATTS");

    evidence.push(buildFormalCaseEvidence({
      fixture,
      pvgis,
      pvwatts,
      generatedAt: options.generatedAt,
      baseUrl: options.baseUrl,
      runnerVersion: RUNNER_VERSION,
      retryPolicy,
    }));

    if (index < fixtures.length - 1) await delay(INTER_REQUEST_DELAY_MS);
  }

  const runCompletedAt = new Date().toISOString();
  await writeEvidenceFiles(
    evidence,
    options.outputDirectory,
    runStartedAt,
    runCompletedAt,
    options.baseUrl,
  );
  console.log(`Evidencia generada: ${path.resolve(options.outputDirectory)}`);
  console.log(`Casos procesados: ${evidence.length}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
