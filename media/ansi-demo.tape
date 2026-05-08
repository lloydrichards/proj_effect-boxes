# VHS tape file for ANSI color showcase
# Run with: vhs media/ansi-demo.tape

Set Shell "zsh"
Set FontSize 16
Set Width 1100
Set Height 720
Set WindowBar Colorful
Set Padding 20

# Run the ANSI demo
Type "bun run scratch -- --run 4"
Enter
Sleep 2s
Screenshot media/ansi-colors.png
Sleep 500ms
