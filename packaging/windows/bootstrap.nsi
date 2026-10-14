; A visible Windows launcher, not another installer. It starts/reuses the local
; server, then asks Windows ShellExecute to open the browser. No VBScript.
Unicode true
!include "MUI2.nsh"
!include "FileFunc.nsh"
ManifestSupportedOS Win10
Name "Forge Coding Academy"
Caption "Forge Coding Academy"
OutFile "${OUTPUT}"
Icon "${PAYLOAD}/forge.ico"
RequestExecutionLevel user
SetCompressor /SOLID lzma
VIProductVersion "1.0.2.0"
VIAddVersionKey "ProductName" "Forge Coding Academy"
VIAddVersionKey "FileDescription" "Forge Coding Academy launcher"
VIAddVersionKey "FileVersion" "1.0.2"
VIAddVersionKey "LegalCopyright" "Forge Coding Academy contributors"
AutoCloseWindow true
ShowInstDetails show
BrandingText "Forge runs locally on your PC."
!define MUI_INSTFILESPAGE_FINISHHEADER_TEXT "Forge is ready"
!define MUI_INSTFILESPAGE_FINISHHEADER_SUBTEXT "Opening your browser."
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
Section
  SetOutPath "$EXEDIR"
  ${GetParameters} $R0
  StrCmp $R0 "--stop" stop start
  start:
    DetailPrint "Starting Forge. Please wait..."
    IfFileExists "$EXEDIR\node.exe" 0 missing
    IfFileExists "$EXEDIR\launcher.cjs" 0 missing
    nsExec::ExecToStack /TIMEOUT=30000 '"$EXEDIR\node.exe" "$EXEDIR\launcher.cjs" --ensure-started'
    Pop $0
    Pop $1
    StrCmp $0 0 open_browser
      MessageBox MB_ICONSTOP "Forge could not start.$\r$\n$\r$\n$1$\r$\n$\r$\nStartup log: $LOCALAPPDATA\ForgeAcademy\launcher.log"
      SetErrorLevel 1
      Quit
  open_browser:
    DetailPrint "Forge is ready at http://127.0.0.1:33791"
    ClearErrors
    ExecShell "open" "http://127.0.0.1:33791"
    IfErrors browser_failed done
  browser_failed:
    MessageBox MB_ICONEXCLAMATION "Forge is running, but Windows could not open the browser. Open this address manually:$\r$\n$\r$\nhttp://127.0.0.1:33791"
    Goto done
  stop:
    DetailPrint "Stopping Forge safely..."
    nsExec::ExecToStack /TIMEOUT=30000 '"$EXEDIR\node.exe" "$EXEDIR\launcher.cjs" --stop --quiet'
    Pop $0
    Pop $1
    StrCmp $0 0 done
      MessageBox MB_ICONSTOP "Forge could not stop.$\r$\n$\r$\n$1$\r$\n$\r$\nSee $LOCALAPPDATA\ForgeAcademy\launcher.log."
      SetErrorLevel 1
      Quit
  missing:
    MessageBox MB_ICONSTOP "Some Forge application files are missing. Reinstall Forge using the latest installer."
    SetErrorLevel 1
    Quit
  done:
SectionEnd
