; Script InnoSetup 6 — Gestor NFSe
; Compile com InnoSetup 6.4+ (https://jrsoftware.org/isdl.php)

#define MyAppName "Gestor NFSe"
#define MyAppVersion "0.5.0"
#define MyAppPublisher "Gestor NFSe"
#define MyAppURL "http://127.0.0.1:8001"
#define MyAppExeName "start.bat"
#define NodeVersion "v22.14.0"

[Setup]
AppId={{B8A3C4D5-E6F7-8901-2345-6789ABCDEF01}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
UninstallDisplayIcon={app}\backend\public\favicon.ico
Compression=lzma2
SolidCompression=yes
OutputDir=.\output
OutputBaseFilename=Setup-GestorNFSe-{#MyAppVersion}
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
DisableProgramGroupPage=yes

[Languages]
Name: "portuguese"; MessagesFile: "compiler:Languages\Portuguese.isl"

[Files]
; ── Código fonte do backend ──
Source: "..\backend\src\*"; DestDir: "{app}\backend\src"; Flags: recursesubdirs ignoreversion
Source: "..\backend\src\db\migrations\*"; DestDir: "{app}\backend\dist\db\migrations"; Flags: recursesubdirs ignoreversion
Source: "..\backend\package.json"; DestDir: "{app}\backend"; Flags: ignoreversion
Source: "..\backend\package-lock.json"; DestDir: "{app}\backend"; Flags: ignoreversion
Source: "..\backend\tsconfig.json"; DestDir: "{app}\backend"; Flags: ignoreversion
Source: "..\backend\vitest.config.ts"; DestDir: "{app}\backend"; Flags: ignoreversion
Source: "..\backend\drizzle.config.ts"; DestDir: "{app}\backend"; Flags: ignoreversion
Source: "..\backend\.env"; DestDir: "{app}\backend"; Flags: ignoreversion
Source: "..\backend\render.yaml"; DestDir: "{app}\backend"; Flags: ignoreversion
Source: "..\backend\.gitignore"; DestDir: "{app}\backend"; Flags: ignoreversion skipifsourcedoesntexist
Source: "..\backend\config.toml"; DestDir: "{app}\backend"; Flags: ignoreversion skipifsourcedoesntexist

; ── Código fonte do frontend ──
Source: "..\frontend\src\*"; DestDir: "{app}\frontend\src"; Flags: recursesubdirs ignoreversion
Source: "..\frontend\package.json"; DestDir: "{app}\frontend"; Flags: ignoreversion
Source: "..\frontend\package-lock.json"; DestDir: "{app}\frontend"; Flags: ignoreversion
Source: "..\frontend\tsconfig.json"; DestDir: "{app}\frontend"; Flags: ignoreversion
Source: "..\frontend\vite.config.ts"; DestDir: "{app}\frontend"; Flags: ignoreversion
Source: "..\frontend\index.html"; DestDir: "{app}\frontend"; Flags: ignoreversion
Source: "..\frontend\.gitignore"; DestDir: "{app}\frontend"; Flags: ignoreversion skipifsourcedoesntexist

; ── danfse-pdf-generator (código embutido em src/lib/) ──

; ── Scripts do instalador ──
Source: "post-install.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\start.bat"; DestDir: "{app}"; Flags: ignoreversion

; ── Node.js portátil (extraído via tar.exe no post-install.bat) ──
Source: "node-{#NodeVersion}-win-x64.zip"; DestDir: "{app}\tools"; DestName: "node.zip"; Flags: ignoreversion

[Icons]
Name: "{commondesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}\backend"
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}\backend"
Name: "{group}\Desinstalar {#MyAppName}"; Filename: "{uninstallexe}"

[Run]
Filename: "{app}\post-install.bat"; \
  StatusMsg: "Instalando dependencias e compilando... (pode levar alguns minutos)"; \
  Flags: waituntilterminated shellexec

[UninstallRun]
Filename: "{cmd}"; \
  Parameters: "/c rmdir /s /q ""{app}\backend\node_modules"" & rmdir /s /q ""{app}\frontend\node_modules"" & rmdir /s /q ""{app}\tools"""; \
  RunOnceId: "CleanNodeModules"; Flags: runhidden

[UninstallDelete]
Type: filesandordirs; Name: "{app}\backend\dist"
Type: filesandordirs; Name: "{app}\backend\public"
Type: filesandordirs; Name: "{app}\backend\data"
