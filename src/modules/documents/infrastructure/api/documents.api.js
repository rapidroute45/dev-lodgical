import { api } from "@/shared/utils/api.js";

export async function fetchDriverDocumentsList() {
  const res = await api.get("/driver-documents/drivers");
  return res.data.data ?? [];
}

export async function fetchDriverDocumentsDetail(driverId) {
  const res = await api.get(`/driver-documents/drivers/${driverId}`);
  return res.data.data;
}

export async function verifyDriverDocument(driverId, requirementId) {
  const res = await api.post(
    `/driver-documents/drivers/${driverId}/${requirementId}/verify`
  );
  return res.data;
}

export async function rejectDriverDocument(driverId, requirementId, reason) {
  const res = await api.post(
    `/driver-documents/drivers/${driverId}/${requirementId}/reject`,
    { reason }
  );
  return res.data;
}

export async function fetchDocumentRequirements() {
  const res = await api.get("/driver-documents/requirements");
  return res.data.data ?? [];
}

export async function createDocumentRequirement(body) {
  const res = await api.post("/driver-documents/requirements", body);
  return res.data;
}

export async function updateDocumentRequirement(requirementId, body) {
  const res = await api.put(`/driver-documents/requirements/${requirementId}`, body);
  return res.data;
}

export async function deleteDocumentRequirement(requirementId) {
  const res = await api.delete(`/driver-documents/requirements/${requirementId}`);
  return res.data;
}
