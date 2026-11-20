# Servidor de impresión de FotoCabina: un PowerShell que se queda abierto y atiende órdenes (una línea JSON por orden).
# Se deja abierto porque cada arranque de PowerShell + WMI tarda varios segundos y el estado de la impresora se consulta seguido.
# Solo usa componentes que trae Windows (System.Drawing, WMI/CIM y el módulo PrintManagement): sin instalar nada.
#
# Entrada (una línea JSON):  { "id": 1, "accion": "listar" | "estado" | "imprimir", ... }
# Salida (una línea JSON):   { "id": 1, ... }   (siempre con el mismo id; si algo revienta, { "id", "ok": false, "codigo": "servidor", "detalle" })

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Drawing
try { Import-Module PrintManagement -ErrorAction Stop } catch { }

# Impresoras que no son de papel de verdad (PDF, fax, OneNote...): la cabina no las ofrece.
$script:PatronVirtuales = '(?i)(onenote|xps document|print to pdf|\bpdf\b|fax|anydesk|pdfsam|send to|root print|cutepdf|pdfcreator|snagit|bullzip|microsoft shared)'

# ---------- estado ----------

# Traduce lo que Windows sabe de la impresora a los estados de FotoCabina (lista, imprimiendo, sin-papel, sin-cinta,
# atascada, desconectada, tapa-abierta, error). Windows solo informa lo que el driver le cuenta por el spooler:
# muchas impresoras no avisan "sin papel" hasta que intentan imprimir (límite conocido, ver README de escritorio).
function Convertir-Estado($p) {
  $detalle = ''
  $estado = 'lista'
  if ($p.WorkOffline -eq $true) { $estado = 'desconectada'; $detalle = 'Windows la marca sin conexión.' }
  elseif ([int]$p.ExtendedPrinterStatus -eq 9) { $estado = 'desconectada'; $detalle = 'Windows no logra comunicarse con la impresora (apagada, sin red o sin cable).' }
  else {
    switch ([int]$p.DetectedErrorState) {
      4  { $estado = 'sin-papel'; $detalle = 'Windows informa que no hay papel.' }
      6  { $estado = 'sin-cinta'; $detalle = 'Windows informa que se acabó la cinta o el tóner.' }
      7  { $estado = 'tapa-abierta'; $detalle = 'Windows informa que hay una tapa abierta.' }
      8  { $estado = 'atascada'; $detalle = 'Windows informa un atasco de papel.' }
      9  { $estado = 'desconectada'; $detalle = 'Windows informa que la impresora está sin conexión.' }
      10 { $estado = 'error'; $detalle = 'Windows informa que la impresora pide servicio.' }
      11 { $estado = 'error'; $detalle = 'Windows informa que la bandeja de salida está llena.' }
    }
    if ($estado -eq 'lista') {
      switch ([int]$p.PrinterStatus) {
        7 { $estado = 'desconectada'; $detalle = 'Windows la marca sin conexión.' }
        6 { $estado = 'error'; $detalle = 'La impresora está detenida.' }
        4 { $estado = 'imprimiendo' }
        5 { $estado = 'imprimiendo' }
      }
    }
  }
  return [pscustomobject]@{ estado = $estado; detalle = $detalle }
}

function Medios-De($nombre) {
  $medios = New-Object System.Collections.ArrayList
  try {
    $ps = New-Object System.Drawing.Printing.PrinterSettings
    $ps.PrinterName = $nombre
    if ($ps.IsValid) {
      foreach ($s in $ps.PaperSizes) {
        [void]$medios.Add([pscustomobject]@{ nombre = $s.PaperName; anchoMm = [math]::Round($s.Width * 0.254, 1); altoMm = [math]::Round($s.Height * 0.254, 1) })
      }
    }
  } catch { }
  return , $medios.ToArray()
}

function Accion-Listar() {
  $lista = New-Object System.Collections.ArrayList
  foreach ($p in (Get-CimInstance Win32_Printer)) {
    $virtual = [bool]($p.Name -match $script:PatronVirtuales -or $p.DriverName -match $script:PatronVirtuales)
    $e = Convertir-Estado $p
    [void]$lista.Add([pscustomobject]@{
      nombre = $p.Name; driver = $p.DriverName; puerto = $p.PortName; predeterminada = [bool]$p.Default
      virtual = $virtual; estado = $e.estado; detalle = $e.detalle
      medios = $(if ($virtual) { , @() } else { Medios-De $p.Name })
    })
  }
  return [pscustomobject]@{ ok = $true; impresoras = $lista.ToArray() }
}

function Accion-Estado($nombre) {
  $nombreSeguro = $nombre.Replace('\', '\\').Replace("'", "\'")   # WQL escapa la comilla simple con \'
  $p = Get-CimInstance Win32_Printer -Filter "Name='$nombreSeguro'" -ErrorAction SilentlyContinue
  if (-not $p) {
    return [pscustomobject]@{ ok = $true; existe = $false; estado = 'desconectada'; detalle = 'Windows no tiene instalada esta impresora.'; trabajosEnCola = 0; trabajosConError = 0 }
  }
  $e = Convertir-Estado $p
  $enCola = 0; $conError = 0
  try {
    foreach ($t in @(Get-PrintJob -PrinterName $nombre -ErrorAction Stop)) {
      $enCola++
      if ([string]$t.JobStatus -match '(?i)error|offline|paperout|userintervention|blocked') { $conError++ }
    }
  } catch { }
  return [pscustomobject]@{ ok = $true; existe = $true; estado = $e.estado; detalle = $e.detalle; trabajosEnCola = $enCola; trabajosConError = $conError }
}

# ---------- imprimir ----------

function Resultado-Impresion($ok, $estado, $codigo, $detalle, $papel) {
  return [pscustomobject]@{ ok = $ok; estado = $estado; codigo = $codigo; detalle = $detalle; papel = $papel }
}

# Cancela un trabajo del spooler. Remove-PrintJob suele negarse ("acceso denegado") con trabajos ya en curso; SetJob de
# winspool (el mismo que usa la cola de impresión de Windows) sí deja cancelar los trabajos propios.
Add-Type -TypeDefinition @"
using System; using System.Runtime.InteropServices;
public static class CancelarSpool {
  [DllImport("winspool.drv", EntryPoint="OpenPrinterW", SetLastError=true, CharSet=CharSet.Unicode)] static extern bool OpenPrinter(string nombre, out IntPtr h, IntPtr def);
  [DllImport("winspool.drv", SetLastError=true)] static extern bool ClosePrinter(IntPtr h);
  [DllImport("winspool.drv", EntryPoint="SetJobW", SetLastError=true)] static extern bool SetJob(IntPtr h, uint id, uint nivel, IntPtr info, uint comando);
  public static int Cancelar(string impresora, uint id) {
    IntPtr h; if (!OpenPrinter(impresora, out h, IntPtr.Zero)) return Marshal.GetLastWin32Error();
    bool ok = SetJob(h, id, 0, IntPtr.Zero, 5); int e = ok ? 0 : Marshal.GetLastWin32Error(); ClosePrinter(h); return e;
  }
}
"@

# Devuelve $true solo si el trabajo ya no está en el spooler (se confirma con Get-PrintJob); si sigue ahí, $false.
function Quitar-Trabajo($impresora, $trabajo) {
  $r = [CancelarSpool]::Cancelar($impresora, [uint32]$trabajo.Id)
  if ($r -ne 0) { try { Remove-PrintJob -PrinterName $impresora -ID $trabajo.Id -ErrorAction Stop } catch { } }
  for ($i = 0; $i -lt 6; $i++) {
    Start-Sleep -Milliseconds 500
    $sigue = $null
    try { $sigue = Get-PrintJob -PrinterName $impresora -ID $trabajo.Id -ErrorAction Stop } catch { $sigue = $null }
    # Un trabajo marcado "Deleting" ya se está retirando: cuenta como quitado.
    if (-not $sigue -or [string]$sigue.JobStatus -match '(?i)deleting') { return $true }
  }
  return $false
}

# Tras un fallo de la impresora: si el trabajo salió del spooler, el código es reintentable; si no, 'trabajo-pegado'
# (definitivo: la cola no reintenta, porque saldría solo al volver la impresora y duplicaría la hoja).
function Resultado-Fallo-Spooler($impresora, $trabajo, $codigo, $detalle, $papel) {
  if (Quitar-Trabajo $impresora $trabajo) { return Resultado-Impresion $false 'error' $codigo $detalle $papel }
  return Resultado-Impresion $false 'error' 'trabajo-pegado' ($detalle + ' No se pudo sacar el trabajo del spooler de Windows: revisa la cola de impresión antes de reintentar (podría salir una hoja doble).') $papel
}

# Imprime una imagen en silencio (sin diálogo) por el driver normal de Windows y espera a que el spooler la tome.
#   ok=true  estado='completado' (el spooler terminó con el trabajo) o 'en-spooler' (sigue imprimiéndose, ya es del spooler).
#   ok=false codigo='impresora-...' (la impresora no pudo; el trabajo se saca del spooler para no imprimir doble) o 'envio'.
function Accion-Imprimir($o) {
  $Impresora = [string]$o.impresora; $Archivo = [string]$o.archivo; $Documento = [string]$o.documento
  $Copias = [math]::Max(1, [int]$o.copias); $AnchoMm = [double]$o.anchoMm; $AltoMm = [double]$o.altoMm
  $EsperaSeg = $(if ($o.esperaSeg) { [int]$o.esperaSeg } else { 120 })

  try { $img = [System.Drawing.Image]::FromFile($Archivo) }
  catch { return Resultado-Impresion $false 'error' 'sin-contenido' 'No se pudo leer la imagen que había que imprimir.' $null }

  $doc = New-Object System.Drawing.Printing.PrintDocument
  $doc.PrinterSettings.PrinterName = $Impresora
  if (-not $doc.PrinterSettings.IsValid) { $img.Dispose(); return Resultado-Impresion $false 'error' 'impresora-desconectada' 'Windows no encuentra esta impresora.' $null }
  # Si Windows ya sabe que la impresora no está en condiciones, no se envía nada (así no queda un trabajo pegado en el spooler
  # que saldría solo cuando la impresora vuelva y duplicaría la hoja).
  $nombreSeguro = $Impresora.Replace('\', '\\').Replace("'", "\'")   # WQL escapa la comilla simple con \'
  $actual = Get-CimInstance Win32_Printer -Filter "Name='$nombreSeguro'" -ErrorAction SilentlyContinue
  if ($actual) {
    $ahora = Convertir-Estado $actual
    if (@('desconectada', 'sin-papel', 'sin-cinta', 'atascada', 'tapa-abierta', 'error') -contains $ahora.estado) {
      $img.Dispose(); return Resultado-Impresion $false 'error' ('impresora-' + $ahora.estado) $ahora.detalle $null
    }
  }
  $doc.DocumentName = $Documento
  $doc.PrinterSettings.Copies = [int16]$Copias
  $doc.PrintController = New-Object System.Drawing.Printing.StandardPrintController   # sin ventana de progreso
  $doc.OriginAtMargins = $false
  $doc.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0, 0, 0, 0)

  # Papel: el del driver que mejor coincide con la hoja (centésimas de pulgada), sin las variantes "Split/2UP/Combo".
  $objW = [int][math]::Round($AnchoMm / 25.4 * 100); $objH = [int][math]::Round($AltoMm / 25.4 * 100)
  # Si la hoja lleva dos tiras ("partir"), se busca el papel "Split" del driver (la HiTi corta la hoja al medio); si la impresora
  # no lo tiene (p. ej. la SELPHY) se imprime como hoja normal, sin corte.
  $mejor = $null; $mejorD = [double]::MaxValue; $partirOk = $false
  foreach ($vuelta in @($(if ([bool]$o.partir) { 'split' }), 'normal')) {
    if (-not $vuelta) { continue }
    $mejor = $null; $mejorD = [double]::MaxValue
    foreach ($s in $doc.PrinterSettings.PaperSizes) {
      $variante = ($s.PaperName -match '(?i)split|2up|3up|combo|up\)')
      if ($vuelta -eq 'split') { if ($s.PaperName -notmatch '(?i)split') { continue } } elseif ($variante) { continue }
      $d1 = [math]::Abs($s.Width - $objW) / $objW + [math]::Abs($s.Height - $objH) / $objH
      $d2 = [math]::Abs($s.Width - $objH) / $objH + [math]::Abs($s.Height - $objW) / $objW
      $d = [math]::Min($d1, $d2)
      if ($d -lt $mejorD) { $mejorD = $d; $mejor = $s }
    }
    if ($mejor -and $mejorD -le 0.12) { $partirOk = ($vuelta -eq 'split'); break }
  }
  if ($mejor -and $mejorD -le 0.12) { $papel = $mejor } else { $papel = New-Object System.Drawing.Printing.PaperSize('FotoCabina', $objW, $objH) }
  $doc.DefaultPageSettings.PaperSize = $papel
  $nombrePapel = '{0} ({1}x{2})' -f $papel.PaperName, $papel.Width, $papel.Height

  # La imagen se gira para que coincida con la orientación del papel (nunca se recorta).
  $papelVertical = ($papel.Height -ge $papel.Width)
  if (($img.Height -ge $img.Width) -ne $papelVertical) { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }

  # Ajuste fino por impresora (mm): algunas impresoras corren la imagen aunque el driver diga que no tiene márgenes.
  $script:ajusteX = $(if ($o.ajusteXMm) { [single]([double]$o.ajusteXMm / 25.4 * 100) } else { [single]0 })
  $script:ajusteY = $(if ($o.ajusteYMm) { [single]([double]$o.ajusteYMm / 25.4 * 100) } else { [single]0 })
  $script:imagen = $img; $script:papelW = $papel.Width; $script:papelH = $papel.Height
  $doc.add_PrintPage({
    param($remitente, $e)
    $g = $e.Graphics
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    # El origen del dibujo es el borde imprimible; se retrocede lo que el driver reserva para cubrir el papel completo.
    $ox = -[single]$e.PageSettings.HardMarginX + $script:ajusteX; $oy = -[single]$e.PageSettings.HardMarginY + $script:ajusteY
    $w = [single]$script:papelW; $h = [single]$script:papelH
    $ri = $script:imagen.Width / $script:imagen.Height; $rp = $w / $h
    if ([math]::Abs($ri / $rp - 1) -le 0.04) {
      $g.DrawImage($script:imagen, $ox, $oy, $w, $h)          # misma proporción: llena la hoja
    } else {
      $g.FillRectangle([System.Drawing.Brushes]::White, $ox, $oy, $w, $h)
      if ($ri -gt $rp) { $dw = $w; $dh = $w / $ri } else { $dh = $h; $dw = $h * $ri }
      $g.DrawImage($script:imagen, $ox + ($w - $dw) / 2, $oy + ($h - $dh) / 2, $dw, $dh)   # distinta: cabe entera, centrada
    }
    $e.HasMorePages = $false
  })

  # Solo para pruebas sin gastar papel: con "salidaArchivo" el trabajo se guarda en un archivo (con la impresora "Microsoft XPS
  # Document Writer" queda un .xps que se puede abrir) en vez de salir por la impresora.
  $aArchivo = [bool]$o.salidaArchivo
  if ($aArchivo) { $doc.PrinterSettings.PrintToFile = $true; $doc.PrinterSettings.PrintFileName = [string]$o.salidaArchivo }

  try { $doc.Print() }
  catch { $img.Dispose(); return Resultado-Impresion $false 'error' 'envio' ('Windows no pudo enviar el trabajo a la impresora: ' + $_.Exception.Message) $nombrePapel }
  $img.Dispose()
  if ($aArchivo) { return Resultado-Impresion $true 'completado' $null 'Guardado en archivo (modo de prueba).' $nombrePapel }

  # Esperar a que el spooler termine.
  # Si la impresora se detiene (sin papel, sin cinta, atasco...) el driver de HiTi retiene el trabajo y muestra su propio aviso
  # con "Volver a imprimir esta página" / "Cancelar la impresión". El trabajo NO se cancela ni se reintenta desde aquí (si el
  # operador apretaba "Volver a imprimir" saldría doble): se espera a que el operador decida en ese aviso.
  #   · "Volver a imprimir": el trabajo vuelve a un estado sano, imprime y sale del spooler -> 'completado' (una sola hoja).
  #   · "Cancelar": el trabajo queda "Deleting" o desaparece sin haber vuelto a un estado sano -> 'impresora-cancelada'
  #     (definitivo: no sale nada y la cola no reintenta sola).
  #   · Nadie decide en $EsperaOperadorSeg: 'trabajo-pegado' (definitivo; el trabajo sigue en la cola de Windows).
  $EsperaOperadorSeg = 900
  $limite = (Get-Date).AddSeconds($EsperaSeg)
  $visto = $false; $sinTrabajo = 0
  $enError = $false; $recuperado = $false; $detalleError = ''
  while ((Get-Date) -lt $limite) {
    Start-Sleep -Milliseconds $(if ($enError) { 300 } else { 700 })
    $trabajo = $null
    try { $trabajo = @(Get-PrintJob -PrinterName $Impresora -ErrorAction Stop | Where-Object { $_.DocumentName -eq $Documento }) | Select-Object -First 1 } catch { }
    if (-not $trabajo) {
      if ($enError) {
        if ($recuperado) { return Resultado-Impresion $true 'completado' $null '' $nombrePapel }
        return Resultado-Impresion $false 'error' 'impresora-cancelada' 'El trabajo se canceló en el aviso de la impresora: no salió ninguna hoja.' $nombrePapel
      }
      $sinTrabajo++
      if ($visto -or $sinTrabajo -ge 4) { return Resultado-Impresion $true 'completado' $null '' $nombrePapel }
      continue
    }
    $visto = $true; $sinTrabajo = 0
    $js = [string]$trabajo.JobStatus
    if ($js -match '(?i)deleting|deleted') {
      return Resultado-Impresion $false 'error' 'impresora-cancelada' 'El trabajo se canceló en el aviso de la impresora: no salió ninguna hoja.' $nombrePapel
    }
    if ($js -match '(?i)paperout|offline|error|userintervention|blocked') {
      if (-not $enError) {
        $enError = $true; $recuperado = $false
        $detalleError = 'La impresora pidió ayuda (' + $js + '): falta papel o cinta, o hay un atasco.'
        $limite = (Get-Date).AddSeconds($EsperaOperadorSeg)   # el operador tiene unos minutos para reponer y decidir en el aviso del driver
      }
      continue
    }
    if ($enError) { $recuperado = $true }   # el trabajo volvió a un estado sano: el operador apretó "Volver a imprimir"
  }
  if ($enError -and -not $recuperado) {
    return Resultado-Impresion $false 'error' 'trabajo-pegado' ($detalleError + ' Nadie respondió en el aviso de la impresora; el trabajo sigue en la cola de Windows. Resuélvelo ahí (volver a imprimir o cancelar) antes de reintentar desde la cabina: podría salir una hoja doble.') $nombrePapel
  }
  return Resultado-Impresion $true 'en-spooler' $null 'El trabajo sigue en el spooler de Windows.' $nombrePapel
}

# ---------- bucle principal ----------

[Console]::Out.WriteLine('{"evento":"listo"}'); [Console]::Out.Flush()
while ($true) {
  $linea = [Console]::In.ReadLine()
  if ($null -eq $linea) { break }
  if ($linea.Trim() -eq '') { continue }
  $id = $null
  try {
    $orden = $linea | ConvertFrom-Json
    $id = $orden.id
    switch ([string]$orden.accion) {
      'listar'   { $res = Accion-Listar }
      'estado'   { $res = Accion-Estado ([string]$orden.impresora) }
      'imprimir' { $res = Accion-Imprimir $orden }
      'salir'    { break }
      default    { $res = [pscustomobject]@{ ok = $false; codigo = 'servidor'; detalle = 'Acción desconocida.' } }
    }
    if ([string]$orden.accion -eq 'salir') { break }
  } catch {
    $res = [pscustomobject]@{ ok = $false; codigo = 'servidor'; detalle = [string]$_.Exception.Message }
  }
  $res | Add-Member -NotePropertyName id -NotePropertyValue $id -Force
  [Console]::Out.WriteLine(($res | ConvertTo-Json -Depth 6 -Compress)); [Console]::Out.Flush()
}
