import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as payrollApi from "./payroll.api.js";
import { useLocationQueryParams } from "@/modules/manager-home/application/OpsLocationScopeProvider.jsx";

export const payrollKeys = {
  all: ["payroll"],
  pendingSummary: ["payroll", "pending-summary"],
  settings: ["payroll", "settings"],
  payrollStoreRates: (storeId) => ["payroll", "payroll-store-rates", storeId],
  storeBillingSettings: ["payroll", "store-billing-settings"],
  storeBillingRates: (storeId) => ["payroll", "store-billing-rates", storeId],
  storePayrollSummary: (params) => ["payroll", "store-payroll-summary", params ?? {}],
  storePayrollDetail: (storeId, params) => ["payroll", "store-payroll-detail", storeId, params ?? {}],
  invoiceBillTos: ["payroll", "invoice-bill-tos"],
  storeInvoicePreview: (params) => ["payroll", "store-invoice-preview", params ?? {}],
  preview: (params) => ["payroll", "preview", params],
  bills: (filters) => ["payroll", "bills", filters ?? {}],
  bill: (id) => ["payroll", "bill", id],
  cities: ["cities"],
};

function invalidatePayroll(qc) {
  void qc.invalidateQueries({ queryKey: payrollKeys.all });
}

export function usePayrollPendingSummaryQuery(enabled = true) {
  return useQuery({
    queryKey: payrollKeys.pendingSummary,
    queryFn: payrollApi.fetchPayrollPendingSummary,
    enabled,
  });
}

export function usePayrollBillsQuery(filters, enabled = true) {
  return useQuery({
    queryKey: payrollKeys.bills(filters),
    queryFn: () => payrollApi.fetchPayrollBills(filters),
    enabled,
  });
}

export function usePayrollBillQuery(id, enabled = true) {
  return useQuery({
    queryKey: payrollKeys.bill(id),
    queryFn: () => payrollApi.fetchPayrollBill(id),
    enabled: enabled && Boolean(id),
  });
}

export function usePayrollSettingsQuery(enabled = true) {
  return useQuery({
    queryKey: payrollKeys.settings,
    queryFn: payrollApi.fetchPayrollSettings,
    enabled,
  });
}

export function useUpdatePayrollSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.updatePayrollSettings,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: payrollKeys.settings });
      invalidatePayroll(qc);
    },
  });
}

export function usePayrollStoreRatesQuery(storeId, enabled = true) {
  return useQuery({
    queryKey: payrollKeys.payrollStoreRates(storeId),
    queryFn: () => payrollApi.fetchPayrollStoreRates(storeId),
    enabled: enabled && Boolean(storeId),
  });
}

export function useUpdatePayrollStoreRatesMutation(storeId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => payrollApi.updatePayrollStoreRates(storeId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: payrollKeys.payrollStoreRates(storeId) });
      invalidatePayroll(qc);
    },
  });
}

export function usePayrollPreviewQuery(params, enabled = true) {
  return useQuery({
    queryKey: payrollKeys.preview(params),
    queryFn: () => payrollApi.fetchPayrollPreview(params),
    enabled: enabled && Boolean(params?.teamId && params?.periodStart && params?.periodEnd),
  });
}

export function useGeneratePayrollMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.generatePayrollBill,
    onSuccess: () => invalidatePayroll(qc),
  });
}

export function useUpdatePayrollBillMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => payrollApi.updatePayrollBill(id, body),
    onSuccess: (bill) => {
      qc.setQueryData(payrollKeys.bill(bill.id), bill);
      invalidatePayroll(qc);
    },
  });
}

export function useDeletePayrollBillMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.deletePayrollBill,
    onSuccess: () => invalidatePayroll(qc),
  });
}

export function useSendPayrollToTeamLeadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.sendPayrollToTeamLead,
    onSuccess: (bill) => {
      qc.setQueryData(payrollKeys.bill(bill.id), bill);
      invalidatePayroll(qc);
    },
  });
}

export function useAcknowledgePayrollMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.acknowledgePayroll,
    onSuccess: (bill) => {
      qc.setQueryData(payrollKeys.bill(bill.id), bill);
      invalidatePayroll(qc);
    },
  });
}

export function useApprovePayrollMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.approvePayroll,
    onSuccess: (bill) => {
      qc.setQueryData(payrollKeys.bill(bill.id), bill);
      invalidatePayroll(qc);
    },
  });
}

export function useDisputePayrollMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }) => payrollApi.disputePayroll(id, note),
    onSuccess: (bill) => {
      qc.setQueryData(payrollKeys.bill(bill.id), bill);
      invalidatePayroll(qc);
    },
  });
}

export function useMarkPayrollPaidMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }) => payrollApi.markPayrollPaid(id, file),
    onSuccess: (bill) => {
      qc.setQueryData(payrollKeys.bill(bill.id), bill);
      invalidatePayroll(qc);
    },
  });
}

export function useStoreBillingSettingsQuery(enabled = true) {
  return useQuery({
    queryKey: payrollKeys.storeBillingSettings,
    queryFn: payrollApi.fetchStoreBillingSettings,
    enabled,
  });
}

export function useUpdateStoreBillingSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.updateStoreBillingSettings,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: payrollKeys.storeBillingSettings });
      invalidatePayroll(qc);
    },
  });
}

export function useStoreBillingRatesQuery(storeId, enabled = true) {
  return useQuery({
    queryKey: payrollKeys.storeBillingRates(storeId),
    queryFn: () => payrollApi.fetchStoreBillingRates(storeId),
    enabled: enabled && Boolean(storeId),
  });
}

export function useUpdateStoreBillingRatesMutation(storeId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => payrollApi.updateStoreBillingRates(storeId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: payrollKeys.storeBillingRates(storeId) });
      invalidatePayroll(qc);
    },
  });
}

export function useStorePayrollSummaryQuery(params, enabled = true) {
  const scopeParams = useLocationQueryParams(params);
  const merged = { ...params, ...scopeParams };
  return useQuery({
    queryKey: payrollKeys.storePayrollSummary(merged),
    queryFn: () => payrollApi.fetchStorePayrollSummary(merged),
    enabled,
  });
}

export function useStorePayrollDetailQuery(storeId, params, enabled = true) {
  return useQuery({
    queryKey: payrollKeys.storePayrollDetail(storeId, params),
    queryFn: () => payrollApi.fetchStorePayrollDetail(storeId, params),
    enabled: enabled && Boolean(storeId),
  });
}

export function useInvoiceBillTosQuery(enabled = true) {
  return useQuery({
    queryKey: payrollKeys.invoiceBillTos,
    queryFn: payrollApi.fetchInvoiceBillTos,
    enabled,
  });
}

export function useStoreInvoicePreviewQuery(params, enabled = true) {
  const enabledFlag = typeof enabled === "function" ? enabled : Boolean(enabled);
  return useQuery({
    queryKey: payrollKeys.storeInvoicePreview(params),
    queryFn: () => payrollApi.fetchStoreInvoicePreview(params),
    enabled:
      enabledFlag &&
      Boolean(
        params?.periodStart &&
          params?.periodEnd &&
          (params?.storeIds || params?.storeId) &&
          params?.billToName &&
          params?.billToAddress
      ),
  });
}

export function useGenerateStoreInvoiceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.generateStoreInvoice,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: payrollKeys.invoiceBillTos });
    },
  });
}

export function useCitiesQuery(enabled = true) {
  return useQuery({
    queryKey: payrollKeys.cities,
    queryFn: payrollApi.fetchCities,
    enabled,
  });
}
