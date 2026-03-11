import { isValidStatusTransition } from "../prospect-helpers";
import { STATUSES } from "@shared/schema";

describe("drag-and-drop status transitions", () => {
  describe("isValidStatusTransition", () => {
    test("allows moving to any different valid status", () => {
      expect(isValidStatusTransition("Bookmarked", "Applied")).toBe(true);
      expect(isValidStatusTransition("Applied", "Phone Screen")).toBe(true);
      expect(isValidStatusTransition("Bookmarked", "Offer")).toBe(true);
      expect(isValidStatusTransition("Bookmarked", "Rejected")).toBe(true);
      expect(isValidStatusTransition("Offer", "Bookmarked")).toBe(true);
      expect(isValidStatusTransition("Rejected", "Applied")).toBe(true);
    });

    test("rejects moving to the same status", () => {
      for (const status of STATUSES) {
        expect(isValidStatusTransition(status, status)).toBe(false);
      }
    });

    test("rejects moving to an unrecognized status name", () => {
      expect(isValidStatusTransition("Bookmarked", "Unknown")).toBe(false);
      expect(isValidStatusTransition("Applied", "")).toBe(false);
      expect(isValidStatusTransition("Applied", "APPLIED")).toBe(false);
      expect(isValidStatusTransition("Applied", "interview")).toBe(false);
    });

    test("accepts every defined status as a valid destination", () => {
      STATUSES.forEach((toStatus) => {
        const fromStatus = toStatus === "Bookmarked" ? "Applied" : "Bookmarked";
        expect(isValidStatusTransition(fromStatus, toStatus)).toBe(true);
      });
    });

    test("is case-sensitive for status names", () => {
      expect(isValidStatusTransition("bookmarked", "Applied")).toBe(false);
      expect(isValidStatusTransition("Bookmarked", "applied")).toBe(false);
      expect(isValidStatusTransition("BOOKMARKED", "APPLIED")).toBe(false);
    });

    test("rejects empty string inputs", () => {
      expect(isValidStatusTransition("", "Applied")).toBe(false);
      expect(isValidStatusTransition("Bookmarked", "")).toBe(false);
      expect(isValidStatusTransition("", "")).toBe(false);
    });
  });
});
