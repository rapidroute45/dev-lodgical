import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isWalmartDepartureSynced,
  walmartDepartureForRoute,
  walmartHoursForCategory,
} from "./walmartRouteHours.js";

describe("walmartRouteHours", () => {
  it("computes small-route departure from arrival", () => {
    const departure = walmartDepartureForRoute(
      { routeCategory: "SMALL", arrivalTime: "09:00" },
      { storeName: "Walmart 2501" }
    );
    assert.equal(departure, "14:30");
  });

  it("detects manual departure override", () => {
    const ctx = { storeName: "Walmart 2501" };
    const row = {
      routeCategory: "SMALL",
      arrivalTime: "09:00",
      departureTime: "15:00",
    };
    assert.equal(isWalmartDepartureSynced(row, ctx), false);
    assert.equal(walmartHoursForCategory("SMALL", ctx), 5.5);
  });

  it("detects synced walmart departure", () => {
    const ctx = { storeName: "Walmart 2501" };
    const row = {
      routeCategory: "SMALL",
      arrivalTime: "09:00",
      departureTime: "14:30",
    };
    assert.equal(isWalmartDepartureSynced(row, ctx), true);
  });
});
