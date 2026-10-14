Option Explicit
Dim shell, fso, folder, command
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
folder = fso.GetParentFolderName(WScript.ScriptFullName)
command = Chr(34) & folder & "\node.exe" & Chr(34) & " " & Chr(34) & folder & "\launcher.cjs" & Chr(34)
If WScript.Arguments.Count > 0 Then
  If WScript.Arguments(0) = "--stop" Then command = command & " --stop"
End If
shell.Run command, 0, False
