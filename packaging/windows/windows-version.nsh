; Read the native kernel version rather than the compiler's GetWinVer helper.
; Windows 10 and Windows 11 both report major version 10. RtlGetVersion does
; not depend on the executable's supportedOS compatibility declaration.
!ifndef FORGE_WINDOWS_VERSION_INCLUDED
!define FORGE_WINDOWS_VERSION_INCLUDED
Function CheckWindowsVersion
  Push $0
  Push $1
  Push $2
  Push $3
  ; RTL_OSVERSIONINFOW: five DWORDs (20 bytes) + WCHAR[128] (256 bytes).
  System::Alloc 276
  Pop $0
  StrCmp $0 0 forge_version_unknown
  System::Call '*$0(i 276)'
  System::Call 'ntdll::RtlGetVersion(p r0) i.r1'
  StrCmp $1 0 forge_version_read
    System::Free $0
    Goto forge_version_unknown
  forge_version_read:
    System::Call '*$0(i, i.r1, i.r2, i.r3)'
    System::Free $0
    ; Equal or newer than major 10 is supported; older versions are rejected.
    IntCmp $1 10 forge_version_supported forge_version_old forge_version_supported
  forge_version_old:
    MessageBox MB_ICONSTOP "Forge requires Windows 10 or later. Windows reported version $1.$2 (build $3)."
    Abort
  forge_version_unknown:
    MessageBox MB_ICONSTOP "Forge could not read the Windows system version. No application files were installed. Please report this message rather than changing compatibility or security settings."
    Abort
  forge_version_supported:
    Pop $3
    Pop $2
    Pop $1
    Pop $0
FunctionEnd
!endif
