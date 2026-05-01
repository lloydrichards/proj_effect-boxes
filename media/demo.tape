# VHS tape file for Effect Boxes demo
# Run with: vhs media/demo.tape
# Requires: brew install vhs (which installs ttyd and ffmpeg)

Output media/demo.gif

Set FontSize 16
Set Width 750
Set Height 380
Set Theme "Catppuccin Frappe"
Set WindowBar Colorful
Set Padding 20

# Show the command being typed
Type "bun run scratchpad/demo.ts"
Sleep 300ms
Enter

# Wait for the demo to complete (~5 seconds for 100 iterations at 50ms)
Sleep 8s

# Brief pause to show completion
Sleep 800ms
