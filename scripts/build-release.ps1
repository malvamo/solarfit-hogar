[CmdletBinding()]
param(
  [string]$OutputDirectory = "",
  [string]$AcademicDeliverablesDirectory = "",
  [switch]$SkipCheck
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
  $OutputDirectory = Join-Path $projectRoot "release-output"
}
$outputBase = [System.IO.Path]::GetFullPath($OutputDirectory)
$releaseName = "SolarFit_Hogar_Cierre_Tecnico"
$releaseRoot = [System.IO.Path]::GetFullPath((Join-Path $outputBase $releaseName))
$zipPath = [System.IO.Path]::GetFullPath((Join-Path $outputBase "$releaseName.zip"))
$zipHashPath = [System.IO.Path]::GetFullPath((Join-Path $outputBase "$releaseName.zip.sha256.txt"))

function Assert-ChildPath {
  param([string]$BasePath, [string]$TargetPath)
  $normalizedBase = [System.IO.Path]::GetFullPath($BasePath).TrimEnd('\', '/')
  $normalizedTarget = [System.IO.Path]::GetFullPath($TargetPath)
  $prefix = "$normalizedBase$([System.IO.Path]::DirectorySeparatorChar)"
  if (-not $normalizedTarget.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "La ruta de salida debe permanecer dentro de $normalizedBase."
  }
}

function Get-PortableRelativePath {
  param([string]$BasePath, [string]$TargetPath)
  $baseWithSeparator = [System.IO.Path]::GetFullPath($BasePath).TrimEnd('\', '/') + '\'
  $baseUri = [System.Uri]::new($baseWithSeparator)
  $targetUri = [System.Uri]::new([System.IO.Path]::GetFullPath($TargetPath))
  return [System.Uri]::UnescapeDataString($baseUri.MakeRelativeUri($targetUri).ToString())
}

function Get-Sha256Hex {
  param([string]$Path)
  $stream = [System.IO.File]::OpenRead([System.IO.Path]::GetFullPath($Path))
  $sha256 = [System.Security.Cryptography.SHA256]::Create()
  try {
    $hashBytes = $sha256.ComputeHash($stream)
    return (($hashBytes | ForEach-Object { $_.ToString("x2") }) -join "")
  } finally {
    $sha256.Dispose()
    $stream.Dispose()
  }
}

Assert-ChildPath -BasePath $outputBase -TargetPath $releaseRoot
Assert-ChildPath -BasePath $outputBase -TargetPath $zipPath
Assert-ChildPath -BasePath $outputBase -TargetPath $zipHashPath

New-Item -ItemType Directory -Path $outputBase -Force | Out-Null
if (Test-Path -LiteralPath $releaseRoot) {
  Remove-Item -LiteralPath $releaseRoot -Recurse -Force
}
foreach ($oldArtifact in @($zipPath, $zipHashPath)) {
  if (Test-Path -LiteralPath $oldArtifact) {
    Remove-Item -LiteralPath $oldArtifact -Force
  }
}

$applicationPath = Join-Path $releaseRoot "04_aplicacion"
$testEvidencePath = Join-Path $releaseRoot "05_evidencias\pruebas_software"
New-Item -ItemType Directory -Path $applicationPath -Force | Out-Null
New-Item -ItemType Directory -Path $testEvidencePath -Force | Out-Null

if (-not $SkipCheck) {
  Push-Location $projectRoot
  try {
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $checkLines = @(& pnpm check 2>&1 | ForEach-Object { $_.ToString() })
    $checkExitCode = $LASTEXITCODE
    $ErrorActionPreference = $previousErrorActionPreference
  } finally {
    $ErrorActionPreference = "Stop"
    Pop-Location
  }
  [System.IO.File]::WriteAllLines(
    (Join-Path $testEvidencePath "pnpm-check.txt"),
    $checkLines,
    [System.Text.UTF8Encoding]::new($false)
  )
  if ($checkExitCode -ne 0) {
    throw "pnpm check falló con código $checkExitCode. Revise la evidencia generada."
  }
}

$sourceDirectories = @("src", "public", "docs", "scripts")
foreach ($relativeDirectory in $sourceDirectories) {
  $source = Join-Path $projectRoot $relativeDirectory
  if (Test-Path -LiteralPath $source) {
    Copy-Item -LiteralPath $source -Destination (Join-Path $applicationPath $relativeDirectory) -Recurse
  }
}

$sourceFiles = @(
  ".env.example",
  ".gitignore",
  ".nvmrc",
  "eslint.config.mjs",
  "INSTALL_WINDOWS.md",
  "MANIFESTO_CIERRE.md",
  "next.config.ts",
  "package.json",
  "pnpm-lock.yaml",
  "postcss.config.mjs",
  "README.md",
  "RELEASE_NOTES.md",
  "tsconfig.json",
  "vitest.config.mts"
)
foreach ($relativeFile in $sourceFiles) {
  $source = Join-Path $projectRoot $relativeFile
  if (Test-Path -LiteralPath $source) {
    Copy-Item -LiteralPath $source -Destination (Join-Path $applicationPath $relativeFile)
  }
}

if ([string]::IsNullOrWhiteSpace($AcademicDeliverablesDirectory)) {
  $calculusProjectDirectory = Split-Path -Parent $projectRoot
  $projectsDirectory = Split-Path -Parent $calculusProjectDirectory
  $workspaceDirectory = Split-Path -Parent $projectsDirectory
  $AcademicDeliverablesDirectory = Join-Path $workspaceDirectory "Entregables\CalculoDiferencial"
}

$artifactMap = @(
  @{ Source = "Proyecto_Completo_SolarFit_Hogar.docx"; Destination = "01_informe" },
  @{ Source = "Hito_1_SolarFit_Hogar_Semana_5.docx"; Destination = "00_antecedentes" },
  @{ Source = "Propuesta_SolarFit_Hogar.docx"; Destination = "00_antecedentes" },
  @{ Source = "Poster_Academico_SolarFit_Hogar.pptx"; Destination = "02_poster" },
  @{ Source = "Guion_Pitch_3_Minutos_SolarFit_Hogar.md"; Destination = "03_pitch" },
  @{ Source = "Checklist_Para_Convertir_SolarFit_en_Entrega_Real.md"; Destination = "05_evidencias" },
  @{ Source = "plantilla-consumo-solarfit.csv"; Destination = "05_evidencias" }
)

foreach ($artifact in $artifactMap) {
  $source = Join-Path $AcademicDeliverablesDirectory $artifact.Source
  if (Test-Path -LiteralPath $source) {
    $destination = Join-Path $releaseRoot $artifact.Destination
    New-Item -ItemType Directory -Path $destination -Force | Out-Null
    Copy-Item -LiteralPath $source -Destination (Join-Path $destination $artifact.Source)
  }
}

$evidenceReadme = @"
# Evidencias que debe aportar el grupo

Esta carpeta no contiene datos inventados. Antes del Hito 3, organice aquí:

- `caso/`: facturas anonimizadas y medición del techo, o protocolo del caso simulado;
- `panel/`: ficha oficial del módulo;
- `fuente_solar/`: configuración, respuesta y fecha de PVGIS/PVWatts;
- `exportaciones/`: JSON y CSV del escenario definitivo;
- `validacion/`: cálculo manual, métricas y conclusiones;
- `ia_y_aportes/`: declaración revisada y contribuciones reales.

No incluya claves, direcciones exactas, números de cuenta ni artefactos internos de QA.
"@
[System.IO.File]::WriteAllText(
  (Join-Path $releaseRoot "05_evidencias\LEEME.md"),
  $evidenceReadme,
  [System.Text.UTF8Encoding]::new($false)
)

Copy-Item -LiteralPath (Join-Path $projectRoot "MANIFESTO_CIERRE.md") -Destination (Join-Path $releaseRoot "MANIFESTO_CIERRE.md")
Copy-Item -LiteralPath (Join-Path $projectRoot "RELEASE_NOTES.md") -Destination (Join-Path $releaseRoot "RELEASE_NOTES.md")

$forbiddenFiles = Get-ChildItem -LiteralPath $releaseRoot -Recurse -File | Where-Object {
  $_.Name -in @(".env.local", "AGENTS.md", "CLAUDE.md") -or
  $_.Name -like "*.inspect.ndjson" -or
  $_.Name -like "*.pem" -or
  $_.FullName -match "[\\/](node_modules|\.next|\.artifacts|coverage)[\\/]"
}
if ($forbiddenFiles) {
  throw "El paquete contiene archivos prohibidos: $($forbiddenFiles.FullName -join ', ')"
}

$textExtensions = @(".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".txt", ".ps1", ".env")
$secretMatches = Get-ChildItem -LiteralPath $releaseRoot -Recurse -File | Where-Object {
  $textExtensions -contains $_.Extension -or $_.Name -eq ".env.example"
} | Select-String -Pattern 'NLR_API_KEY\s*=\s*(?!\[|<|\$)[^\s"'']+' -ErrorAction SilentlyContinue
if ($secretMatches) {
  throw "Se detectó un posible valor de NLR_API_KEY en el paquete."
}

$hashFile = Join-Path $releaseRoot "SHA256SUMS.txt"
$hashLines = Get-ChildItem -LiteralPath $releaseRoot -Recurse -File |
  Where-Object { $_.FullName -ne $hashFile } |
  Sort-Object FullName |
  ForEach-Object {
    $relativePath = Get-PortableRelativePath -BasePath $releaseRoot -TargetPath $_.FullName
    $hash = Get-Sha256Hex -Path $_.FullName
    "$hash  $relativePath"
  }
[System.IO.File]::WriteAllLines($hashFile, $hashLines, [System.Text.UTF8Encoding]::new($false))

Compress-Archive -LiteralPath $releaseRoot -DestinationPath $zipPath -CompressionLevel Optimal
$zipHash = Get-Sha256Hex -Path $zipPath
[System.IO.File]::WriteAllText(
  $zipHashPath,
  "$zipHash  $([System.IO.Path]::GetFileName($zipPath))`n",
  [System.Text.UTF8Encoding]::new($false)
)

[pscustomobject]@{
  ReleaseDirectory = $releaseRoot
  Zip = $zipPath
  ZipSha256 = $zipHash
  Files = (Get-ChildItem -LiteralPath $releaseRoot -Recurse -File).Count
  Bytes = (Get-ChildItem -LiteralPath $releaseRoot -Recurse -File | Measure-Object Length -Sum).Sum
}
