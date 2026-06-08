import { api } from "@/shared/utils/api.js";

export async function fetchPayrollPendingSummary() {
  const res = await api.get("/payroll/pending-summary");
  return res.data.data;
}

export async function fetchPayrollBills(params = {}) {
  const res = await api.get("/payroll/bills", { params });
  return res.data.data ?? [];
}

export async function fetchPayrollBill(id) {
  const res = await api.get(`/payroll/bills/${id}`);
  return res.data.data;
}

export async function fetchPayrollSettings() {
  const res = await api.get("/payroll/settings");
  return res.data.data;
}

export async function updatePayrollSettings(body) {
  const res = await api.put("/payroll/settings", body);
  return res.data.data;
}

export async function fetchPayrollStoreRates(storeId) {
  const res = await api.get(`/payroll/settings/stores/${storeId}`);
  return res.data.data;
}

export async function updatePayrollStoreRates(storeId, body) {
  const res = await api.put(`/payroll/settings/stores/${storeId}`, body);
  return res.data.data;
}

export async function fetchPayrollPreview(params) {
  const res = await api.get("/payroll/preview", { params });
  return res.data.data;
}

export async function generatePayrollBill(body) {
  const res = await api.post("/payroll/bills/generate", body);
  return res.data.data;
}

export async function updatePayrollBill(id, body) {
  const res = await api.put(`/payroll/bills/${id}`, body);
  return res.data.data;
}

export async function deletePayrollBill(id) {
  await api.delete(`/payroll/bills/${id}`);
}

export async function sendPayrollToTeamLead(id) {
  const res = await api.post(`/payroll/bills/${id}/send-to-team-lead`);
  return res.data.data;
}

export async function acknowledgePayroll(id) {
  const res = await api.post(`/payroll/bills/${id}/acknowledge`);
  return res.data.data;
}

export async function approvePayroll(id) {
  const res = await api.post(`/payroll/bills/${id}/team-lead/approve`);
  return res.data.data;
}

export async function disputePayroll(id, note) {
  const res = await api.post(`/payroll/bills/${id}/team-lead/dispute`, { note });
  return res.data.data;
}

export async function markPayrollPaid(id, file) {
  const form = new FormData();
  form.append("receipt", file);
  const res = await api.post(`/payroll/bills/${id}/mark-paid`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

export async function fetchStoreBillingSettings() {
  const res = await api.get("/payroll/store-billing-settings");
  return res.data.data;
}

export async function updateStoreBillingSettings(body) {
  const res = await api.put("/payroll/store-billing-settings", body);
  return res.data.data;
}

export async function fetchStoreBillingRates(storeId) {
  const res = await api.get(`/payroll/store-billing-settings/stores/${storeId}`);
  return res.data.data;
}

export async function updateStoreBillingRates(storeId, body) {
  const res = await api.put(`/payroll/store-billing-settings/stores/${storeId}`, body);
  return res.data.data;
}

export async function fetchStorePayrollSummary(params) {
  const res = await api.get("/payroll/store-payroll/summary", { params });
  return res.data.data;
}

export async function fetchStorePayrollDetail(storeId, params) {
  const res = await api.get(`/payroll/store-payroll/stores/${storeId}`, { params });
  return res.data.data;
}

export async function fetchInvoiceBillTos() {
  const res = await api.get("/payroll/store-invoice/bill-tos");
  return res.data.data ?? [];
}

export async function fetchStoreInvoicePreview(params) {
  const res = await api.get("/payroll/store-invoice/preview", { params });
  return res.data.data;
}

export async function generateStoreInvoice(body) {
  const res = await api.post("/payroll/store-invoice/generate", body);
  return res.data.data;
}

export async function fetchCities() {
  const res = await api.get("/cities");
  return res.data.data?.cities ?? [];
}
