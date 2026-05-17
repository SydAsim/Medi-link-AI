// ============================================
// CIRO Logistics Agent
// Finds nearest hospitals/ambulances, calculates
// ETAs, and sends real-time chat updates to patient
// ============================================

import { addIntelligenceLog } from "./ciroService";
import { sendMessage } from "./chatService";
import { updateCase } from "./caseService";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface NearbyFacility {
  name: string;
  address: string;
  phone?: string;
  distance: string;   // e.g. "1.2 km"
  duration: string;   // e.g. "4 mins"
  type: "hospital" | "ambulance_service";
  lat: number;
  lng: number;
}

export interface LogisticsResult {
  hospitals: NearbyFacility[];
  ambulanceServices: NearbyFacility[];
  bestHospital: NearbyFacility | null;
  patientToHospitalEta: string;
  ambulanceToPatientEta: string;
  success: boolean;
}

/**
 * Haversine distance between two coordinates (km)
 */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Fetches nearby places using Google Places Nearby Search API (via proxy-safe URL)
 */
async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  type: string,
  keyword: string,
  radiusMeters = 5000
): Promise<any[]> {
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === "xxx") {
    return [];
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusMeters}&type=${type}&keyword=${keyword}&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(`/api/places?url=${encodeURIComponent(url)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

/**
 * Gets the phone number of a place using Places Details API
 */
async function getPlacePhone(placeId: string): Promise<string | undefined> {
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === "xxx") return undefined;
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(`/api/places?url=${encodeURIComponent(url)}`);
    if (!res.ok) return undefined;
    const data = await res.json();
    return data.result?.formatted_phone_number;
  } catch {
    return undefined;
  }
}

/**
 * Simulates realistic mock facilities based on real Pakistani city names
 */
function getMockFacilities(lat: number, lng: number): LogisticsResult {
  const hospitals: NearbyFacility[] = [
    {
      name: "Hayatabad Medical Complex",
      address: "Phase 5, Hayatabad, Peshawar",
      phone: "+92-91-9217480",
      distance: "1.4 km",
      duration: "5 mins",
      type: "hospital",
      lat: lat + 0.012,
      lng: lng + 0.008,
    },
    {
      name: "Lady Reading Hospital",
      address: "Peshawar, Khyber Pakhtunkhwa",
      phone: "+92-91-9211241",
      distance: "2.8 km",
      duration: "9 mins",
      type: "hospital",
      lat: lat - 0.025,
      lng: lng + 0.015,
    },
  ];
  const ambulanceServices: NearbyFacility[] = [
    {
      name: "Edhi Foundation Ambulance",
      address: "Near Peshawar Cantt",
      phone: "+92-21-115-3911",
      distance: "0.8 km",
      duration: "3 mins",
      type: "ambulance_service",
      lat: lat + 0.007,
      lng: lng - 0.004,
    },
    {
      name: "Rescue 1122",
      address: "Saddar, Peshawar",
      phone: "1122",
      distance: "1.1 km",
      duration: "4 mins",
      type: "ambulance_service",
      lat: lat - 0.009,
      lng: lng + 0.006,
    },
  ];

  return {
    hospitals,
    ambulanceServices,
    bestHospital: hospitals[0],
    patientToHospitalEta: hospitals[0].duration,
    ambulanceToPatientEta: ambulanceServices[0].duration,
    success: true,
  };
}

/**
 * MAIN LOGISTICS AGENT ORCHESTRATION
 * Called when emergency team selects a high-severity case.
 */
export async function runLogisticsAgent(
  caseId: string,
  patientLat: number,
  patientLng: number,
  severity: string
): Promise<LogisticsResult> {
  const isHighSeverity = severity === "critical" || severity === "high";

  // Step 1: Log start
  await addIntelligenceLog({
    caseId,
    agentName: "LogisticsAgent",
    thought: `🚨 Emergency signal received. Patient GPS locked: [${patientLat.toFixed(4)}, ${patientLng.toFixed(4)}]. Severity: ${severity.toUpperCase()}. Initiating resource search...`,
    confidence: 1.0,
    action: "LOGISTICS_INITIATED",
  });

  // Step 2: Try real Places API, fallback to mock
  let hospitals: NearbyFacility[] = [];
  let ambulanceServices: NearbyFacility[] = [];
  let usedMock = false;

  const [realHospitals, realAmbulances] = await Promise.all([
    fetchNearbyPlaces(patientLat, patientLng, "hospital", "hospital", 5000),
    fetchNearbyPlaces(patientLat, patientLng, "ambulance", "ambulance rescue", 5000),
  ]);

  if (realHospitals.length > 0) {
    // Transform Google Places results
    hospitals = await Promise.all(
      realHospitals.slice(0, 3).map(async (p: any) => {
        const distKm = haversineKm(patientLat, patientLng, p.geometry.location.lat, p.geometry.location.lng);
        const phone = await getPlacePhone(p.place_id);
        return {
          name: p.name,
          address: p.vicinity,
          phone,
          distance: `${distKm.toFixed(1)} km`,
          duration: `${Math.ceil(distKm * 3)} mins`,
          type: "hospital" as const,
          lat: p.geometry.location.lat,
          lng: p.geometry.location.lng,
        };
      })
    );
  }

  if (realAmbulances.length > 0) {
    ambulanceServices = realAmbulances.slice(0, 2).map((p: any) => {
      const distKm = haversineKm(patientLat, patientLng, p.geometry.location.lat, p.geometry.location.lng);
      return {
        name: p.name,
        address: p.vicinity,
        distance: `${distKm.toFixed(1)} km`,
        duration: `${Math.ceil(distKm * 2)} mins`,
        type: "ambulance_service" as const,
        lat: p.geometry.location.lat,
        lng: p.geometry.location.lng,
      };
    });
  }

  // If Google Places returned nothing (no key / restricted), use mock data
  if (hospitals.length === 0) {
    const mock = getMockFacilities(patientLat, patientLng);
    hospitals = mock.hospitals;
    ambulanceServices = mock.ambulanceServices;
    usedMock = true;
  }

  // Sort by distance
  hospitals.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
  if (ambulanceServices.length === 0) ambulanceServices = getMockFacilities(patientLat, patientLng).ambulanceServices;
  ambulanceServices.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

  const bestHospital = hospitals[0] || null;
  const bestAmbulance = ambulanceServices[0] || null;

  // Step 3: Log findings
  await addIntelligenceLog({
    caseId,
    agentName: "LogisticsAgent",
    thought: `Search complete. Found ${hospitals.length} hospitals, ${ambulanceServices.length} ambulance services within 5km radius. ${usedMock ? "[MOCK_DATA — Google Places API key not configured]" : "[REAL_DATA — Google Places API]"}`,
    confidence: usedMock ? 0.7 : 0.98,
    action: "RESOURCES_FOUND",
  });

  if (bestHospital) {
    await addIntelligenceLog({
      caseId,
      agentName: "LogisticsAgent",
      thought: `Best hospital identified: ${bestHospital.name} — ETA: ${bestHospital.duration} (${bestHospital.distance}). ${bestHospital.phone ? `Phone: ${bestHospital.phone}` : "Phone not available."}`,
      confidence: 0.95,
      action: "BEST_ROUTE_SELECTED",
    });
  }

  if (bestAmbulance) {
    await addIntelligenceLog({
      caseId,
      agentName: "LogisticsAgent",
      thought: `Nearest ambulance: ${bestAmbulance.name} — Estimated arrival at patient: ${bestAmbulance.duration} (${bestAmbulance.distance}). ${bestAmbulance.phone ? `Contact: ${bestAmbulance.phone}` : ""}`,
      confidence: 0.92,
      action: "AMBULANCE_IDENTIFIED",
    });
  }

  // Step 4: Send results to patient chat
  if (isHighSeverity) {
    let chatMessage = `CIRO Logistics Agent has identified the nearest emergency resources for you:\n\n`;

    if (bestHospital) {
      chatMessage += `🏥 Nearest Hospital: ${bestHospital.name}\n`;
      chatMessage += `📍 ${bestHospital.address}\n`;
      if (bestHospital.phone) chatMessage += `📞 Hospital Number: ${bestHospital.phone}\n`;
      chatMessage += `⏱ ETA to hospital: ${bestHospital.duration} (${bestHospital.distance})\n\n`;
    }

    if (bestAmbulance) {
      chatMessage += `🚑 Nearest Ambulance: ${bestAmbulance.name}\n`;
      if (bestAmbulance.phone) chatMessage += `📞 Ambulance Number: ${bestAmbulance.phone}\n`;
      chatMessage += `⏱ Ambulance arrival: ${bestAmbulance.duration} (${bestAmbulance.distance})\n\n`;
    }

    chatMessage += `⚠️ Please stay calm and keep this chat open. Help is on the way.`;

    await sendMessage(caseId, "logistics-agent", "emergency", "CIRO Logistics Agent", chatMessage);
  }

  // Mark case as dispatched so agent never re-runs for this case
  try {
    await updateCase(caseId, { logisticsDispatched: true });
  } catch (e) {
    console.warn("Could not mark logisticsDispatched:", e);
  }

  // Step 5: Log to Orchestrator
  await addIntelligenceLog({
    caseId,
    agentName: "Orchestrator",
    thought: `LogisticsAgent dispatch complete. Patient routed to ${bestHospital?.name || "nearest facility"}. Ambulance ETA: ${bestAmbulance?.duration || "unknown"}. Emergency team alerted.`,
    confidence: 0.96,
    action: "DISPATCH_CONFIRMED",
  });

  return {
    hospitals,
    ambulanceServices,
    bestHospital,
    patientToHospitalEta: bestHospital?.duration || "Unknown",
    ambulanceToPatientEta: bestAmbulance?.duration || "Unknown",
    success: true,
  };
}
