import { HashMap, Option } from "effect";
import { describe, expect, it } from "vitest";
import * as Box from "../src/Box";
import * as Reactive from "../src/Reactive";

describe("Reactive Annotations", () => {
  describe("ReactiveId", () => {
    it("creates reactive ID with string identifier", () => {
      const reactiveId = Reactive.make("test-id");
      expect(reactiveId).toEqual({
        _tag: "ReactiveId",
        id: "test-id",
      });
    });

    it("validates reactive ID type guard for valid ReactiveId", () => {
      const reactiveId = Reactive.make("valid-id");
      expect(Reactive.isReactive(reactiveId)).toBe(true);
    });

    it("validates reactive ID type guard for invalid objects", () => {
      expect(Reactive.isReactive(null)).toBe(false);
      expect(Reactive.isReactive({})).toBe(false);
      expect(Reactive.isReactive({ _tag: "ReactiveId" })).toBe(false);
      expect(Reactive.isReactive({ id: "test" })).toBe(false);
      expect(Reactive.isReactive({ _tag: "Wrong", id: "test" })).toBe(false);
    });

    it("creates reactive annotation with string ID", () => {
      const annotation = Reactive.reactive("button-1");
      expect(annotation.data).toBeDefined();
      expect(Reactive.isReactive(annotation.data)).toBe(true);
      expect(annotation.data.id).toBe("button-1");
    });
  });

  describe("reactiveBox", () => {
    it("annotates box with reactive ID (data-first)", () => {
      const box = Box.text("Hello");
      const reactiveBox = Reactive.makeReactive(box, "greeting");

      expect(reactiveBox.rows).toBe(1);
      expect(reactiveBox.cols).toBe(5);
      expect(reactiveBox.annotation).toBeDefined();
      expect(reactiveBox.annotation?.data.id).toBe("greeting");
    });

    it("annotates box with reactive ID (data-last)", () => {
      const box = Box.text("World");
      const reactiveBox = Reactive.makeReactive("greeting-2")(box);

      expect(reactiveBox.rows).toBe(1);
      expect(reactiveBox.cols).toBe(5);
      expect(reactiveBox.annotation).toBeDefined();
      expect(reactiveBox.annotation?.data.id).toBe("greeting-2");
    });

    it("preserves box dimensions and content", () => {
      const originalBox = Box.text("Multi\nLine");
      const reactiveBox = Reactive.makeReactive(originalBox, "multi-line");

      expect(reactiveBox.rows).toBe(originalBox.rows);
      expect(reactiveBox.cols).toBe(originalBox.cols);
      expect(Box.renderSync(reactiveBox, Box.pretty)).toBe(
        Box.renderSync(originalBox, Box.pretty)
      );
    });
  });

  describe("getPositions", () => {
    it("tracks single reactive box position", () => {
      const box = Reactive.makeReactive(Box.text("Hello"), "single");
      const positions = Reactive.getPositions(box);
      const rendered = Box.renderSync(box, Box.pretty);
      expect(rendered).toBe("Hello");
      expect(HashMap.has(positions, "single")).toBe(true);

      const position = Option.getOrUndefined(HashMap.get(positions, "single"));
      expect(position).toEqual({
        row: 0,
        col: 0,
        rows: 1,
        cols: 5,
      });
    });

    it("tracks multiple reactive boxes in hcat layout", () => {
      const box1 = Reactive.makeReactive(Box.text("Left"), "left-box");
      const box2 = Reactive.makeReactive(Box.text("Right"), "right-box");
      const combined = Box.hcat([box1, box2], Box.top);

      const positions = Reactive.getPositions(combined);
      const rendered = Box.renderSync(combined, Box.pretty);

      expect(rendered).toBe("LeftRight");
      expect(HashMap.size(positions)).toBe(2);

      const leftPos = Option.getOrUndefined(HashMap.get(positions, "left-box"));
      expect(leftPos).toEqual({
        row: 0,
        col: 0,
        rows: 1,
        cols: 4,
      });

      const rightPos = Option.getOrUndefined(
        HashMap.get(positions, "right-box")
      );
      expect(rightPos).toEqual({
        row: 0,
        col: 4,
        rows: 1,
        cols: 5,
      });
    });

    it("tracks multiple reactive boxes in vcat layout", () => {
      const box1 = Reactive.makeReactive(Box.text("Top"), "top-box");
      const box2 = Reactive.makeReactive(Box.text("Bottom"), "bottom-box");
      const combined = Box.vcat([box1, box2], Box.left);

      const positions = Reactive.getPositions(combined);
      const rendered = Box.renderSync(combined, Box.pretty);

      expect(rendered).toBe("Top\nBottom");
      expect(HashMap.size(positions)).toBe(2);

      const topPos = Option.getOrUndefined(HashMap.get(positions, "top-box"));
      expect(topPos).toEqual({
        row: 0,
        col: 0,
        rows: 1,
        cols: 3,
      });

      const bottomPos = Option.getOrUndefined(
        HashMap.get(positions, "bottom-box")
      );
      expect(bottomPos).toEqual({
        row: 1,
        col: 0,
        rows: 1,
        cols: 6,
      });
    });

    it("tracks nested reactive boxes correctly", () => {
      const innerBox = Reactive.makeReactive(Box.text("Inner"), "inner");
      const outerBox = Reactive.makeReactive(
        Box.alignHoriz(innerBox, Box.center1, 10),
        "outer"
      );

      const positions = Reactive.getPositions(outerBox);

      expect(HashMap.size(positions)).toBe(2);

      const outerPos = Option.getOrUndefined(HashMap.get(positions, "outer"));
      expect(outerPos).toEqual({
        row: 0,
        col: 0,
        rows: 1,
        cols: 10,
      });

      const innerPos = Option.getOrUndefined(HashMap.get(positions, "inner"));
      expect(innerPos?.row).toBe(0);
      expect(innerPos?.col).toBe(2); // (10 - 5) / 2 = 2.5, floor = 2 for center1
      expect(innerPos?.rows).toBe(1);
      expect(innerPos?.cols).toBe(5);
    });

    it("handles boxes without reactive annotations", () => {
      const normalBox = Box.text("Normal");
      const reactiveBox = Reactive.makeReactive(
        Box.text("Reactive"),
        "reactive-only"
      );
      const combined = Box.hcat([normalBox, reactiveBox], Box.top);

      const positions = Reactive.getPositions(combined);
      const rendered = Box.renderSync(combined, Box.pretty);

      expect(rendered).toBe("NormalReactive");
      expect(HashMap.size(positions)).toBe(1);
      expect(HashMap.has(positions, "reactive-only")).toBe(true);

      const reactivePos = Option.getOrUndefined(
        HashMap.get(positions, "reactive-only")
      );
      expect(reactivePos?.col).toBe(6); // After "Normal"
    });

    it("handles empty and zero-dimension boxes", () => {
      const emptyBox = Reactive.makeReactive(Box.nullBox, "empty");
      const positions = Reactive.getPositions(emptyBox);

      expect(HashMap.size(positions)).toBe(0); // Empty boxes (0 rows/cols) are not tracked
    });
  });

  describe("cursorToReactive", () => {
    it("generates correct cursor command for existing position", () => {
      const positions: Reactive.PositionMap = HashMap.make([
        "button-1",
        { row: 5, col: 10, rows: 2, cols: 8 },
      ]);

      const command = Reactive.cursorToReactive(positions, "button-1");

      expect(Option.isSome(command)).toBe(true);
      const cmdBox = Option.getOrThrow(command);
      expect(cmdBox.annotation?.data[0]?.code).toBe("\x1b[6;11H"); // 1-based coordinates
    });

    it("returns None for non-existent reactive ID", () => {
      const positions: Reactive.PositionMap = HashMap.make([
        "button-1",
        { row: 5, col: 10, rows: 2, cols: 8 },
      ]);

      const command = Reactive.cursorToReactive(positions, "non-existent");

      expect(Option.isNone(command)).toBe(true);
    });

    it("handles zero coordinates correctly", () => {
      const positions: Reactive.PositionMap = HashMap.make([
        "origin",
        { row: 0, col: 0, rows: 1, cols: 1 },
      ]);

      const command = Reactive.cursorToReactive(positions, "origin");

      expect(Option.isSome(command)).toBe(true);
      const cmdBox = Option.getOrThrow(command);
      expect(cmdBox.annotation?.data[0]?.code).toBe("\x1b[1;1H"); // Cursor positions are 1-based
    });

    it("works with empty position map", () => {
      const positions: Reactive.PositionMap = HashMap.empty();

      const command = Reactive.cursorToReactive(positions, "any-id");

      expect(Option.isNone(command)).toBe(true);
    });
  });

  describe("integration scenarios", () => {
    it("complete workflow: create, render, and navigate", () => {
      // Create a layout with multiple reactive boxes
      const header = Reactive.makeReactive(Box.text("Header"), "header");
      const button1 = Reactive.makeReactive(Box.text("[OK]"), "ok-button");
      const button2 = Reactive.makeReactive(
        Box.text("[Cancel]"),
        "cancel-button"
      );

      const buttons = Box.hcat([button1, Box.text(" "), button2], Box.top);
      const layout = Box.vcat([header, Box.emptyBox(1, 0), buttons], Box.left);

      // Render with positions
      const positions = Reactive.getPositions(layout);
      const rendered = Box.renderSync(layout, Box.pretty);

      // Verify layout
      expect(rendered).toBe("Header\n\n[OK] [Cancel]");

      // Verify all positions are tracked
      expect(HashMap.size(positions)).toBe(3);

      // Test navigation to each element
      const headerNav = Reactive.cursorToReactive(positions, "header");
      const okNav = Reactive.cursorToReactive(positions, "ok-button");
      const cancelNav = Reactive.cursorToReactive(positions, "cancel-button");

      expect(Option.isSome(headerNav)).toBe(true);
      expect(Option.isSome(okNav)).toBe(true);
      expect(Option.isSome(cancelNav)).toBe(true);

      // Verify correct positions
      const headerPos = Option.getOrUndefined(HashMap.get(positions, "header"));
      const okPos = Option.getOrUndefined(HashMap.get(positions, "ok-button"));
      const cancelPos = Option.getOrUndefined(
        HashMap.get(positions, "cancel-button")
      );

      expect(headerPos).toEqual({ row: 0, col: 0, rows: 1, cols: 6 });
      expect(okPos).toEqual({ row: 2, col: 0, rows: 1, cols: 4 });
      expect(cancelPos).toEqual({ row: 2, col: 5, rows: 1, cols: 8 }); // After [OK] + space
    });
  });
});
