# VHS tape file for Effect Boxes demo
# Run with: vhs media/layout-demo.tape
# Requires: brew install vhs (which installs ttyd and ffmpeg)

Output media/layout-demo.gif

Set Shell "zsh"
Set FontSize 16
Set Width 1400
Set Height 800
Set TypingSpeed 60ms
Set WindowBar Colorful
Set Padding 20


# Run the demo
Sleep 1s
Type "bun run scratch --run 10"
Sleep 300ms
Enter

Set TypingSpeed 5ms

# resize left and right, then next section

Sleep 2s
Right 20
Sleep 2s
Left 40
Sleep 2s
Right 20
Sleep 5s
Space

Sleep 2s
Right 20
Sleep 2s
Left 40
Sleep 2s
Right 20
Sleep 5s
Space

Sleep 2s
Right 20
Sleep 2s
Left 40
Sleep 2s
Right 20
Sleep 5s
Space

Sleep 2s
Right 20
Sleep 2s
Left 40
Sleep 2s
Right 20
Sleep 5s
Space

Sleep 2s
Right 20
Sleep 2s
Left 40
Sleep 2s
Right 20
Sleep 5s
Space

Sleep 2s
Right 20
Sleep 2s
Left 40
Sleep 2s
Right 20
Sleep 5s
Space


# Brief pause to show completion
Sleep 800ms
