import { useEffect, useState } from "react";

/** Google calls window.gm_authFailure when the Maps JS API key is invalid or blocked. */
export function useGoogleMapsKeyError(enabled = true) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;

    const previous = window.gm_authFailure;
    window.gm_authFailure = () => {
      setFailed(true);
    };

    return () => {
      if (previous) {
        window.gm_authFailure = previous;
      } else {
        delete window.gm_authFailure;
      }
    };
  }, [enabled]);

  return failed;
}

export function GoogleMapsKeyHelp() {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
      <p className="font-bold">Google Maps key is invalid or not enabled</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-red-800">
        <li>Open Google Cloud Console → APIs &amp; Services → Credentials</li>
        <li>Create an API key (or use a valid existing one)</li>
        <li>Enable <strong>Maps JavaScript API</strong> and <strong>Geocoding API</strong></li>
        <li>Turn on billing for the project (free tier applies)</li>
        <li>
          Put the key in <code className="text-xs">dev-lodgical/.env.local</code> as{" "}
          <code className="text-xs">VITE_GOOGLE_MAPS_API_KEY=your_key</code>
        </li>
        <li>Restart the web app: <code className="text-xs">npm run dev</code></li>
      </ol>
    </div>
  );
}
