/**
 * Invalidate ops location/date-scoped data without wiping chat / auth caches.
 */
export function invalidateOpsScopedQueries(queryClient) {
  const prefixes = [
    ["schedules"],
    ["routes"],
    ["dashboard"],
    ["stores"],
    ["store-returns"],
    ["payroll"],
    ["cities"],
    ["locations"],
    ["teams"],
    ["users"],
    ["tracking"],
  ];
  for (const queryKey of prefixes) {
    void queryClient.invalidateQueries({ queryKey });
  }
}
