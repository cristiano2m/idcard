#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Instalador automatico del Sistema Web de Credenciales PVC (IDCard).
.DESCRIPTION
    Instala Node.js, configura el entorno, inicializa la base de datos,
    registra el servidor como servicio de Windows (NSSM) y abre el firewall.
    Debe ejecutarse como Administrador.
.EXAMPLE
    .\install.ps1
#>

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir  = Join-Path $ProjectRoot "backend"

# ---------------------------------------------------------------------------
# Helpers de salida
# ---------------------------------------------------------------------------
function Write-Step  { param($msg) Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "    OK: $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "    AVISO: $msg" -ForegroundColor Yellow }
function Write-Fail  { param($msg) Write-Host "`n    ERROR: $msg" -ForegroundColor Red; exit 1 }

Clear-Host
Write-Host "================================================" -ForegroundColor White
Write-Host "  IDCard - Instalador automatico               " -ForegroundColor White
Write-Host "  Sistema Web de Credenciales PVC              " -ForegroundColor White
Write-Host "================================================" -ForegroundColor White
Write-Host ""

# ---------------------------------------------------------------------------
# Paso 1: Node.js
# ---------------------------------------------------------------------------
Write-Step "Verificando Node.js..."

$nodeOk = $false
try {
    $nodeVer = & node --version 2>$null
    $major   = [int]($nodeVer -replace 'v(\d+)\..*', '$1')
    if ($major -ge 18) {
        $nodeOk = $true
        Write-Ok "Node.js $nodeVer ya instalado"
    } else {
        Write-Warn "Node.js $nodeVer instalado pero es muy antiguo (se necesita >= 18). Se reinstalara."
    }
} catch { }

if (-not $nodeOk) {
    Write-Step "Instalando Node.js LTS..."

    $wingetCmd = Get-Command winget -ErrorAction SilentlyContinue
    if ($wingetCmd) {
        Write-Host "    Usando winget (puede tardar 1-2 min)..." -ForegroundColor Gray
        winget install OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements
    } else {
        Write-Host "    winget no disponible, descargando desde nodejs.org..." -ForegroundColor Gray
        try {
            $releases = Invoke-RestMethod "https://nodejs.org/dist/index.json" -UseBasicParsing
            $lts      = $releases | Where-Object { $_.lts -ne $false } | Select-Object -First 1
            $msiUrl   = "https://nodejs.org/dist/$($lts.version)/node-$($lts.version)-x64.msi"
            $tmpMsi   = Join-Path $env:TEMP "nodejs-lts.msi"
            Write-Host "    Descargando $msiUrl ..." -ForegroundColor Gray
            Invoke-WebRequest -Uri $msiUrl -OutFile $tmpMsi -UseBasicParsing
            Write-Host "    Instalando..." -ForegroundColor Gray
            Start-Process msiexec.exe -ArgumentList "/i `"$tmpMsi`" /quiet /norestart ADDLOCAL=ALL" -Wait -NoNewWindow
            Remove-Item $tmpMsi -Force
        } catch {
            Write-Fail "No se pudo descargar Node.js. Instalalo manualmente desde https://nodejs.org y vuelve a ejecutar este script."
        }
    }

    # Refrescar PATH sin reiniciar la sesion
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("Path","User")

    try {
        $nodeVer = & node --version 2>$null
        Write-Ok "Node.js $nodeVer instalado correctamente"
    } catch {
        Write-Fail "Node.js no quedo en el PATH. Reinicia PowerShell como Administrador y vuelve a ejecutar."
    }
}

# ---------------------------------------------------------------------------
# Paso 2: npm install
# ---------------------------------------------------------------------------
Write-Step "Instalando dependencias Node (puede tardar 1-2 min)..."
Push-Location $BackendDir
try {
    $output = & npm install 2>&1
    if ($LASTEXITCODE -ne 0) {
        $output | ForEach-Object { Write-Host "    $_" }
        Write-Fail "npm install fallo. Revisa la salida de arriba."
    }
    Write-Ok "Dependencias instaladas"
} finally { Pop-Location }

# ---------------------------------------------------------------------------
# Paso 3: Configurar .env
# ---------------------------------------------------------------------------
Write-Step "Configurando entorno (.env)..."

$envFile    = Join-Path $BackendDir ".env"
$port       = "3000"
$photosPath = "C:\IDCard\fotos"

if (Test-Path $envFile) {
    Write-Warn ".env ya existe, no se sobreescribe."
    # Leer PORT del .env existente para usarlo en firewall y resumen
    $envContent = Get-Content $envFile
    $portLine   = $envContent | Where-Object { $_ -match '^PORT=' }
    if ($portLine) { $port = ($portLine -split '=',2)[1].Trim() }
    $photosLine = $envContent | Where-Object { $_ -match '^PHOTOS_ABSOLUTE_BASE_PATH=' }
    if ($photosLine) { $photosPath = ($photosLine -split '=',2)[1].Trim() }
} else {
    # Generar JWT_SECRET aleatorio
    $bytes = New-Object byte[] 48
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $jwtSecret = [Convert]::ToBase64String($bytes)

    Write-Host ""
    Write-Host "    Ruta donde el software de impresion buscara las fotos." -ForegroundColor White
    Write-Host "    Ejemplo: C:\IDCard\fotos  o  \\servidor\compartido\fotos" -ForegroundColor Gray
    Write-Host "    (Enter para usar C:\IDCard\fotos)" -ForegroundColor Gray
    $input = Read-Host "    PHOTOS_ABSOLUTE_BASE_PATH"
    if ($input) { $photosPath = $input }

    Write-Host ""
    Write-Host "    Puerto HTTP del servidor (Enter para usar 3000)" -ForegroundColor White
    $input = Read-Host "    PORT"
    if ($input) { $port = $input }

    @"
JWT_SECRET=$jwtSecret
NODE_ENV=production
PORT=$port
DB_DRIVER=mdb-hybrid
PHOTOS_ABSOLUTE_BASE_PATH=$photosPath
"@ | Out-File -FilePath $envFile -Encoding utf8 -NoNewline

    Write-Ok ".env creado con JWT_SECRET generado aleatoriamente"
}

# Crear carpeta de fotos si es ruta local (no UNC)
if ($photosPath -and $photosPath -notmatch '^\\\\') {
    New-Item -ItemType Directory -Force -Path $photosPath | Out-Null
    Write-Ok "Carpeta de fotos: $photosPath"
}

# Crear carpeta de logs (la necesita NSSM)
New-Item -ItemType Directory -Force -Path (Join-Path $ProjectRoot "logs") | Out-Null

# ---------------------------------------------------------------------------
# Paso 4: Migraciones y seed
# ---------------------------------------------------------------------------
Write-Step "Inicializando base de datos SQLite..."
Push-Location $BackendDir
try {
    $out = & npm run migrate 2>&1
    if ($LASTEXITCODE -ne 0) {
        $out | ForEach-Object { Write-Host "    $_" }
        Write-Fail "Las migraciones fallaron."
    }
    Write-Ok "Tablas SQLite creadas / actualizadas"

    $out = & npm run seed 2>&1
    # El seed puede "fallar" con codigo 0 si el admin ya existe — solo advertir
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Seed retorno codigo $LASTEXITCODE (puede que el usuario admin ya existia)"
    } else {
        Write-Ok "Usuario admin listo (admin / Admin1234!)"
    }
} finally { Pop-Location }

# ---------------------------------------------------------------------------
# Paso 5: NSSM + servicio de Windows
# ---------------------------------------------------------------------------
Write-Step "Instalando servicio de Windows con NSSM..."

$nssmExe = "C:\Windows\System32\nssm.exe"

if (-not (Test-Path $nssmExe)) {
    Write-Host "    Descargando NSSM..." -ForegroundColor Gray
    $nssmZip = Join-Path $env:TEMP "nssm.zip"
    $nssmTmp = Join-Path $env:TEMP "nssm_extract"
    try {
        Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile $nssmZip -UseBasicParsing
        Expand-Archive -Path $nssmZip -DestinationPath $nssmTmp -Force
        Copy-Item "$nssmTmp\nssm-2.24\win64\nssm.exe" $nssmExe -Force
        Write-Ok "NSSM copiado a $nssmExe"
    } catch {
        Write-Fail "No se pudo descargar NSSM. Descargalo manualmente desde https://nssm.cc y copia nssm.exe a C:\Windows\System32\"
    } finally {
        Remove-Item $nssmZip, $nssmTmp -Recurse -Force -ErrorAction SilentlyContinue
    }
} else {
    Write-Ok "NSSM ya presente"
}

$serviceName  = "IDCardBackend"
$nodeExe      = (Get-Command node -ErrorAction Stop).Source
$serverScript = Join-Path $BackendDir "server.js"
$logStdout    = Join-Path $ProjectRoot "logs\service-stdout.log"
$logStderr    = Join-Path $ProjectRoot "logs\service-stderr.log"

# Eliminar servicio anterior si existe
$svcQuery = & sc.exe query $serviceName 2>$null
if ($svcQuery -match "SERVICE_NAME") {
    Write-Host "    Servicio existente detectado, reinstalando..." -ForegroundColor Gray
    & nssm stop    $serviceName 2>$null | Out-Null
    Start-Sleep -Seconds 2
    & nssm remove  $serviceName confirm | Out-Null
    Start-Sleep -Seconds 1
}

& nssm install  $serviceName $nodeExe $serverScript            | Out-Null
& nssm set      $serviceName AppDirectory          $BackendDir | Out-Null
& nssm set      $serviceName AppEnvironmentExtra   "NODE_ENV=production" | Out-Null
& nssm set      $serviceName DisplayName           "IDCard - Sistema de Credenciales PVC" | Out-Null
& nssm set      $serviceName Description           "Servidor web para registro de credenciales PVC" | Out-Null
& nssm set      $serviceName Start                 SERVICE_AUTO_START | Out-Null
& nssm set      $serviceName AppStdout             $logStdout  | Out-Null
& nssm set      $serviceName AppStderr             $logStderr  | Out-Null
& nssm set      $serviceName AppRotateFiles        1           | Out-Null
& nssm set      $serviceName AppRotateOnline       1           | Out-Null
& nssm set      $serviceName AppRotateSeconds      86400       | Out-Null

Write-Host "    Iniciando servicio..." -ForegroundColor Gray
& nssm start $serviceName | Out-Null
Start-Sleep -Seconds 4

$status = & nssm status $serviceName 2>$null
if ($status -eq "SERVICE_RUNNING") {
    Write-Ok "Servicio '$serviceName' corriendo"
} else {
    Write-Warn "Servicio instalado pero estado actual: $status"
    Write-Warn "Revisa los logs en: $logStderr"
}

# ---------------------------------------------------------------------------
# Paso 6: Regla de firewall
# ---------------------------------------------------------------------------
Write-Step "Configurando Firewall de Windows (puerto $port)..."

$ruleName = "IDCard Puerto $port"
$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Warn "Regla de firewall ya existia, no se modifica"
} else {
    New-NetFirewallRule -DisplayName $ruleName `
        -Direction Inbound -Action Allow -Protocol TCP -LocalPort $port | Out-Null
    Write-Ok "Puerto $port abierto en firewall"
}

# ---------------------------------------------------------------------------
# Resumen final
# ---------------------------------------------------------------------------
$localIp = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.PrefixOrigin -ne 'WellKnown' } |
    Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  Instalacion completada!                      " -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Acceso local:     http://localhost:$port/pages/login.html" -ForegroundColor White
if ($localIp) {
Write-Host "  Acceso en red:    http://${localIp}:$port/pages/login.html" -ForegroundColor White
}
Write-Host ""
Write-Host "  Usuario inicial:  admin" -ForegroundColor White
Write-Host "  Contrasena:       Admin1234!" -ForegroundColor Yellow
Write-Host "  (Cambia la contrasena despues del primer inicio de sesion)" -ForegroundColor Gray
Write-Host ""
Write-Host "  Carpeta de fotos: $photosPath" -ForegroundColor White
Write-Host "  Logs del servicio: $ProjectRoot\logs\" -ForegroundColor White
Write-Host ""
Write-Host "  Comandos utiles (como Administrador):" -ForegroundColor White
Write-Host "    nssm stop    IDCardBackend     # Detener" -ForegroundColor Gray
Write-Host "    nssm start   IDCardBackend     # Iniciar" -ForegroundColor Gray
Write-Host "    nssm restart IDCardBackend     # Reiniciar (tras cambios en .env)" -ForegroundColor Gray
Write-Host "    nssm remove  IDCardBackend confirm  # Desinstalar" -ForegroundColor Gray
Write-Host ""
