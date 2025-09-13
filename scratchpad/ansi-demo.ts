import * as Ansi from "../src/Ansi";
import * as Box from "../src/Box";

console.log("=== ANSI Extensions Demo ===\n");

// Create a colorful header using bright colors
const header = Box.hcat([
  Box.text("ANSI").pipe(Box.annotate(Ansi.redBright)),
  Box.text(" Extensions ").pipe(Box.annotate(Ansi.whiteBright)),
  Box.text("Demo").pipe(Box.annotate(Ansi.blueBright)),
], Box.top);

console.log(Box.render(header, { style: "pretty" }));

// Create a color palette demonstration
const palette256 = Box.hcat([
  Box.text("196").pipe(Box.annotate(Ansi.color256(196))),
  Box.text(" 202").pipe(Box.annotate(Ansi.color256(202))),
  Box.text(" 208").pipe(Box.annotate(Ansi.color256(208))),
  Box.text(" 214").pipe(Box.annotate(Ansi.color256(214))),
  Box.text(" 220").pipe(Box.annotate(Ansi.color256(220))),
], Box.top);

console.log("\n256-Color Palette:");
console.log(Box.render(palette256, { style: "pretty" }));

// RGB gradient demonstration
const rgbGradient = Box.hcat([
  Box.text(" █").pipe(Box.annotate(Ansi.rgb(255, 0, 0))),    // Red
  Box.text(" █").pipe(Box.annotate(Ansi.rgb(255, 127, 0))),  // Orange
  Box.text(" █").pipe(Box.annotate(Ansi.rgb(255, 255, 0))),  // Yellow
  Box.text(" █").pipe(Box.annotate(Ansi.rgb(127, 255, 0))),  // Lime
  Box.text(" █").pipe(Box.annotate(Ansi.rgb(0, 255, 0))),    // Green
  Box.text(" █").pipe(Box.annotate(Ansi.rgb(0, 255, 127))),  // Spring
  Box.text(" █").pipe(Box.annotate(Ansi.rgb(0, 255, 255))),  // Cyan
  Box.text(" █").pipe(Box.annotate(Ansi.rgb(0, 127, 255))),  // Azure
  Box.text(" █").pipe(Box.annotate(Ansi.rgb(0, 0, 255))),    // Blue
  Box.text(" █").pipe(Box.annotate(Ansi.rgb(127, 0, 255))),  // Violet
  Box.text(" █").pipe(Box.annotate(Ansi.rgb(255, 0, 255))),  // Magenta
  Box.text(" █").pipe(Box.annotate(Ansi.rgb(255, 0, 127))),  // Rose
], Box.top);

console.log("\nRGB Color Gradient:");
console.log(Box.render(rgbGradient, { style: "pretty" }));

// Text attributes demonstration
const attributes = Box.vcat([
  Box.text("Bold Text").pipe(Box.annotate(Ansi.bold)),
  Box.text("Italic Text").pipe(Box.annotate(Ansi.italic)),
  Box.text("Underlined Text").pipe(Box.annotate(Ansi.underlined)),
  Box.text("Dim Text").pipe(Box.annotate(Ansi.dim)),
  Box.text("Strikethrough Text").pipe(Box.annotate(Ansi.strikethrough)),
  Box.text("Overline Text").pipe(Box.annotate(Ansi.overline)),
  Box.text("Inverse Text").pipe(Box.annotate(Ansi.inverse)),
  Box.text("Blink Text").pipe(Box.annotate(Ansi.blink)),
], Box.left);

console.log("\nText Attributes:");
console.log(Box.render(attributes, { style: "pretty" }));

// Complex styling example
const brandBox = Box.text("Brand Colors").pipe(
  Box.annotate(Ansi.combine(
    Ansi.rgb(12, 34, 56),        // Custom brand blue
    Ansi.bgColor256(236),         // Dark gray background
    Ansi.bold,                    // Bold text
    Ansi.italic                   // Italic text
  ))
);

console.log("\nComplex Brand Styling:");
console.log(Box.render(brandBox, { style: "pretty" }));

// Layout with mixed styling
const successBox = Box.text("SUCCESS").pipe(Box.annotate(Ansi.combine(Ansi.greenBright, Ansi.bold)));
const warningBox = Box.text("WARNING").pipe(Box.annotate(Ansi.combine(Ansi.yellowBright, Ansi.bold)));
const errorBox = Box.text("ERROR").pipe(Box.annotate(Ansi.combine(Ansi.redBright, Ansi.bold)));
const dimBox = Box.text("Status indicators with bright colors and styling").pipe(Box.annotate(Ansi.dim));

const styledLayout = Box.vcat([
  Box.hcat([
    successBox as any,
    Box.text(" | "),
    warningBox as any,
    Box.text(" | "),
    errorBox as any,
  ], Box.top),
  dimBox,
], Box.left);

console.log("\nStatus Layout:");
console.log(Box.render(styledLayout, { style: "pretty" }));

console.log("\n=== Demo Complete ===");