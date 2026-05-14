Set-Location -LiteralPath $PSScriptRoot
& "D:\New Folder\node.exe" "$PSScriptRoot\node_modules\next\dist\bin\next" dev -p 3001 *> "$PSScriptRoot\dev-host-3001.log"
