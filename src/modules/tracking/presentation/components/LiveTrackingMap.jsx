import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchOsrmDrivingPath } from "@/modules/tracking/utils/drivingRoutePath.js";
import { DEFAULT_MAP_CENTER } from "@/modules/tracking/utils/cityMapCenter.js";
import {
  prepareDrawableTrailSegments,
  trailSegmentLeafletOptions,
} from "@/modules/tracking/utils/trailDisplay.js";

const PICKUP_ICON = L.divIcon({
  className: "live-tracking-stop-icon",
  html: '<div class="live-tracking-pickup-dot">P</div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const START_ICON = L.divIcon({
  className: "live-tracking-stop-icon",
  html: '<div class="live-tracking-route-start-dot">S</div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const DRIVER_ICON = L.divIcon({
  className: "live-tracking-driver-icon",
  html: '<div class="route-driver-live-marker"><span class="route-driver-live-marker__pulse"></span><span class="route-driver-live-marker__core"></span></div>',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});


function dropoffIcon(sequence) {
  return L.divIcon({
    className: "live-tracking-stop-icon",
    html: `<div class="live-tracking-stop-number">${sequence}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function fitMapToPoints(map, points, scopeCenter) {
  if (!map) return;
  if (points.length === 0) {
    if (scopeCenter?.lat != null && scopeCenter?.lng != null) {
      map.setView([scopeCenter.lat, scopeCenter.lng], scopeCenter.zoom ?? 11);
    }
    return;
  }
  if (points.length === 1) {
    map.setView(points[0], 14);
    return;
  }
  map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 15 });
}

/**
 * Leaflet map for live driver positions and optional trail/stops.
 */
export function LiveTrackingMap({
  drivers = [],
  trail = [],
  routeStart = null,
  stops = [],
  pickup = null,
  selectedRouteId = null,
  onSelectRoute,
  scopeCenter = null,
  className = "",
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({
    drivers: L.layerGroup(),
    trail: L.layerGroup(),
    planned: L.layerGroup(),
    stops: L.layerGroup(),
  });
console.warn("layersRef",layersRef)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(
      [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng],
      DEFAULT_MAP_CENTER.zoom
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);

    layersRef.current.drivers.addTo(map);
    layersRef.current.trail.addTo(map);
    layersRef.current.planned.addTo(map);
    layersRef.current.stops.addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    layersRef.current.drivers.clearLayers();
    const points = [];

    for (const driver of drivers) {
      const lat = driver.driverLocation?.lat ?? driver.lat;
      const lng = driver.driverLocation?.lng ?? driver.lng;
      if (lat == null || lng == null) continue;

      const point = [lat, lng];
      points.push(point);

      const marker = L.marker(point, {
        icon: DRIVER_ICON,
        title: driver.routeName ?? driver.driverName ?? "Driver",
      });

      const progress = driver.progress;
      const progressLabel = progress
        ? `${progress.completedDropoffs + progress.returnedDropoffs}/${progress.totalDropoffs} stops`
        : "";

      marker.bindPopup(
        `<strong>${driver.driverName ?? "Driver"}</strong><br/>${driver.routeName ?? "Route"}<br/>${progressLabel}`
      );

      marker.on("click", () => {
        onSelectRoute?.(driver.id ?? driver.routeId);
      });

      if ((driver.id ?? driver.routeId) === selectedRouteId) {
        marker.openPopup();
      }

      layersRef.current.drivers.addLayer(marker);
    }

    if (trail.length > 0) {
      const drawableSegments = prepareDrawableTrailSegments(trail, {
        source: "LiveTrackingMap",
        routeId: selectedRouteId ?? null,
        isLive: true,
      });
      layersRef.current.trail.clearLayers();
      for (const segment of drawableSegments) {
        if (segment.points.length < 2) continue;
        const trailPoints = segment.points.map((p) => [p.lat, p.lng]);
        points.push(...trailPoints);
        const polyline = L.polyline(trailPoints, trailSegmentLeafletOptions(segment.kind ?? segment.snapped));
        layersRef.current.trail.addLayer(polyline);
      }
    } else {
      layersRef.current.trail.clearLayers();
    }

    layersRef.current.stops.clearLayers();

    const startLat = routeStart?.lat;
    const startLng = routeStart?.lng;
    if (startLat != null && startLng != null) {
      const startPoint = [startLat, startLng];
      points.push(startPoint);
      const startMarker = L.marker(startPoint, {
        icon: START_ICON,
        title: "Route start",
      });
      startMarker.bindPopup("<strong>Route start</strong><br/>Where GPS sharing began");
      layersRef.current.stops.addLayer(startMarker);
    }

    const pickupLat = pickup?.lat ?? pickup?.destinationLat;
    const pickupLng = pickup?.lng ?? pickup?.destinationLng;
    if (pickupLat != null && pickupLng != null) {
      const point = [pickupLat, pickupLng];
      points.push(point);
      const marker = L.marker(point, { icon: PICKUP_ICON });
      marker.bindPopup(
        `<strong>Pickup: ${pickup.name ?? "Store"}</strong><br/>${pickup.address ?? ""}`
      );
      layersRef.current.stops.addLayer(marker);
    }

    for (const stop of stops) {
      const lat = stop.destinationLat ?? stop.lat;
      const lng = stop.destinationLng ?? stop.lng;
      if (lat == null || lng == null) continue;
      const point = [lat, lng];
      points.push(point);
      const marker = L.marker(point, {
        icon: dropoffIcon(stop.sequence ?? ""),
        title: stop.name ?? `Stop ${stop.sequence ?? ""}`,
      });
      marker.bindPopup(
        `<strong>#${stop.sequence ?? ""} ${stop.name ?? "Stop"}</strong><br/>${stop.address ?? ""}<br/>Status: ${stop.status ?? "pending"}`
      );
      layersRef.current.stops.addLayer(marker);
    }

    fitMapToPoints(map, points, scopeCenter);
  }, [drivers, trail, routeStart, stops, pickup, selectedRouteId, onSelectRoute, scopeCenter]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !scopeCenter) return;

    const hasLivePoints = drivers.some((driver) => {
      const lat = driver.driverLocation?.lat ?? driver.lat;
      const lng = driver.driverLocation?.lng ?? driver.lng;
      return lat != null && lng != null;
    });
    const hasTrail = trail.length > 0;
    const hasStops =
      (pickup?.lat ?? pickup?.destinationLat) != null ||
      stops.some((stop) => (stop.destinationLat ?? stop.lat) != null);

    if (!hasLivePoints && !hasTrail && !hasStops) {
      map.setView([scopeCenter.lat, scopeCenter.lng], scopeCenter.zoom ?? 11);
    }
  }, [scopeCenter, drivers, trail, stops, pickup]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;

    const pickupLat = pickup?.lat ?? pickup?.destinationLat;
    const pickupLng = pickup?.lng ?? pickup?.destinationLng;
    const waypoints = [];

    if (pickupLat != null && pickupLng != null) {
      waypoints.push({ lat: pickupLat, lng: pickupLng });
    }

    const sortedStops = [...stops].sort(
      (a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)
    );
    for (const stop of sortedStops) {
      const lat = stop.destinationLat ?? stop.lat;
      const lng = stop.destinationLng ?? stop.lng;
      if (lat != null && lng != null) {
        waypoints.push({ lat, lng });
      }
    }

    if (waypoints.length < 2) {
      layersRef.current.planned.clearLayers();
      return undefined;
    }

    let cancelled = false;
    void fetchOsrmDrivingPath(waypoints).then((path) => {
      if (cancelled) return;
      layersRef.current.planned.clearLayers();
      const line = path.map((p) => [p.lat, p.lng]);
      if (line.length >= 2) {
        layersRef.current.planned.addLayer(
          L.polyline(line, {
            color: "#94a3b8",
            weight: 4,
            opacity: 0.85,
          })
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pickup, stops]);

  return (
    <div
      ref={containerRef}
      className={`live-tracking-map ${className}`.trim()}
      aria-label="Live driver map"
    />
  );
}
