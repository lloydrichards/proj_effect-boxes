# VHS tape file for ANSI color showcase
# Run with: vhs media/ansi-demo.tape

Set FontSize 16
Set Width 1100
Set Height 380
Set Theme "Catppuccin Frappe"
Set WindowBar Colorful
Set Padding 20

# Run the ANSI demo
Type "bun run scratchpad/ansi-demo.ts"
Enter
Sleep 2s
Screenshot media/ansi-colors.png
Sleep 500ms
