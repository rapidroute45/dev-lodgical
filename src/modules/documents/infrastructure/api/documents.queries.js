import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as documentsApi from "./documents.api.js";

export const documentsKeys = {
  all: ["driver-documents"],
  drivers: ["driver-documents", "drivers"],
  driver: (driverId) => ["driver-documents", "drivers", driverId],
  requirements: ["driver-documents", "requirements"],
};

function invalidateDocuments(qc) {
  void qc.invalidateQueries({ queryKey: documentsKeys.all });
}

export function useDriverDocumentsListQuery(enabled = true) {
  return useQuery({
    queryKey: documentsKeys.drivers,
    queryFn: documentsApi.fetchDriverDocumentsList,
    enabled,
  });
}

export function useDriverDocumentsDetailQuery(driverId, enabled = true) {
  return useQuery({
    queryKey: documentsKeys.driver(driverId),
    queryFn: () => documentsApi.fetchDriverDocumentsDetail(driverId),
    enabled: enabled && Boolean(driverId),
  });
}

export function useVerifyDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, requirementId }) =>
      documentsApi.verifyDriverDocument(driverId, requirementId),
    onSuccess: () => invalidateDocuments(qc),
  });
}

export function useRejectDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, requirementId, reason }) =>
      documentsApi.rejectDriverDocument(driverId, requirementId, reason),
    onSuccess: () => invalidateDocuments(qc),
  });
}

export function useRequestDocumentUploadMutation() {
  return useMutation({
    mutationFn: ({ driverId, requirementId }) =>
      documentsApi.requestDriverDocumentUpload(driverId, requirementId),
  });
}

export function useDocumentRequirementsQuery(enabled = true) {
  return useQuery({
    queryKey: documentsKeys.requirements,
    queryFn: documentsApi.fetchDocumentRequirements,
    enabled,
  });
}

export function useCreateRequirementMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: documentsApi.createDocumentRequirement,
    onSuccess: () => invalidateDocuments(qc),
  });
}

export function useUpdateRequirementMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requirementId, ...body }) =>
      documentsApi.updateDocumentRequirement(requirementId, body),
    onSuccess: () => invalidateDocuments(qc),
  });
}

export function useDeleteRequirementMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: documentsApi.deleteDocumentRequirement,
    onSuccess: () => invalidateDocuments(qc),
  });
}
