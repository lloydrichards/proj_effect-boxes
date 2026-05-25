# VHS tape file for ANSI color showcase
# Run with: vhs media/ansi-demo.tape

Set Shell "zsh"
Set FontSize 16
Set Width 920
Set Height 720
Set WindowBar Colorful
Set Padding 20

# --- Setup: cd into scratchpad app ---
Hide
Type "cd apps/scratchpad" Enter
Sleep 300ms
Type "clear" Enter
Sleep 300ms
Show

# Run the ANSI demo
Type "bun dev -- --run 4"
Enter
Sleep 2s
Screenshot media/ansi-colors.png
Sleep 500ms
