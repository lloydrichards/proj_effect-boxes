# VHS tape file for Effect Boxes demo
# Run with: vhs media/demo.tape
# Requires: brew install vhs (which installs ttyd and ffmpeg)

Output media/demo.gif

Set Shell "zsh"
Set FontSize 16
Set Width 1000
Set Height 350
Set TypingSpeed 60ms
Set WindowBar Colorful
Set Padding 20

# --- Setup: cd into scratchpad app ---
Hide
Type "cd apps/scratchpad" Enter
Sleep 300ms
Type "clear" Enter
Sleep 300ms
Show

# Run the demo
Sleep 1s
Type "bun dev -- --run 1"
Sleep 300ms
Enter

# Wait for the demo to complete (~5 seconds for 100 iterations at 50ms)
Sleep 16s

# Brief pause to show completion
Sleep 800ms
