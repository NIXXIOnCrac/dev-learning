Unicode true
!include "MUI2.nsh"
!include "x64.nsh"
!include "WinVer.nsh"
Icon "${PAYLOAD}/forge.ico"
UninstallIcon "${PAYLOAD}/forge.ico"
Name "Forge Coding Academy"
OutFile "${OUTPUT}"
InstallDir "$LOCALAPPDATA\Programs\ForgeAcademy"
RequestExecutionLevel user
SetCompressor /SOLID lzma
SetCompressorDictSize 32
VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName" "Forge Coding Academy"
VIAddVersionKey "FileDescription" "Forge Coding Academy — Windows installer"
VIAddVersionKey "FileVersion" "1.0.0"
VIAddVersionKey "LegalCopyright" "Forge Coding Academy contributors"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Learn by writing real code."
!define MUI_WELCOMEPAGE_TEXT "Install Forge Coding Academy on this PC.$\r$\n$\r$\n18 lessons in Python and JavaScript, real code execution, saved progress, and guided practice.$\r$\n$\r$\nNo administrator access or separate runtime installation required. Forge opens in your default browser and works locally.$\r$\n$\r$\nExisting preview progress is not imported."
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_TEXT "Open Forge Coding Academy"
!define MUI_FINISHPAGE_RUN_FUNCTION "LaunchForge"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
Function .onInit
  ${IfNot} ${RunningX64}
    MessageBox MB_ICONSTOP "This build requires 64-bit Windows 10 or Windows 11."
    Abort
  ${EndIf}
  ${IfNot} ${AtLeastWin10}
    MessageBox MB_ICONSTOP "Forge requires Windows 10 or Windows 11."
    Abort
  ${EndIf}
  SetShellVarContext current
FunctionEnd
Function LaunchForge
  ExecShell "open" "$SYSDIR\wscript.exe" '"$INSTDIR\launch.vbs"'
FunctionEnd
Section "Forge Coding Academy (required)" Main
  SectionIn RO
  IfFileExists "$INSTDIR\node.exe" 0 install
    nsExec::ExecToLog '"$INSTDIR\node.exe" "$INSTDIR\launcher.cjs" --stop --quiet'
    Pop $0
    ${If} $0 != 0
      MessageBox MB_ICONSTOP "Forge could not be stopped. Stop it and retry; installation was not changed."
      Abort
    ${EndIf}
  install:
  SetOutPath "$INSTDIR"
  File /r "${PAYLOAD}/*"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\Forge Coding Academy"
  CreateShortcut "$SMPROGRAMS\Forge Coding Academy\Forge Coding Academy.lnk" "$SYSDIR\wscript.exe" '"$INSTDIR\launch.vbs"' "$INSTDIR\forge.ico"
  CreateShortcut "$SMPROGRAMS\Forge Coding Academy\Stop Forge.lnk" "$SYSDIR\wscript.exe" '"$INSTDIR\launch.vbs" --stop' "$INSTDIR\forge.ico"
  CreateShortcut "$SMPROGRAMS\Forge Coding Academy\Read me.lnk" "$INSTDIR\INSTALLATION.txt"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ForgeAcademy" "DisplayName" "Forge Coding Academy"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ForgeAcademy" "DisplayVersion" "1.0.0"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ForgeAcademy" "UninstallString" '$\"$INSTDIR\Uninstall.exe$\"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ForgeAcademy" "DisplayIcon" "$INSTDIR\forge.ico"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ForgeAcademy" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ForgeAcademy" "NoRepair" 1
SectionEnd
Section "Desktop shortcut"
  CreateShortcut "$DESKTOP\Forge Coding Academy.lnk" "$SYSDIR\wscript.exe" '"$INSTDIR\launch.vbs"' "$INSTDIR\forge.ico"
SectionEnd
Section "Uninstall"
  SetShellVarContext current
  nsExec::ExecToLog '"$INSTDIR\node.exe" "$INSTDIR\launcher.cjs" --stop --quiet'
  Pop $0
  ${If} $0 != 0
    MessageBox MB_ICONSTOP "Forge could not be stopped. Stop it and retry; no application files were removed."
    Abort
  ${EndIf}
  Delete "$DESKTOP\Forge Coding Academy.lnk"
  RMDir /r "$SMPROGRAMS\Forge Coding Academy"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ForgeAcademy"
  RMDir /r "$INSTDIR"
  ; Intentionally preserve $LOCALAPPDATA\ForgeAcademy (learner data).
SectionEnd
