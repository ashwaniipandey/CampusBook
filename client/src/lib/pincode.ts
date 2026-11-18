export interface PincodeLookupResult {
  city: string;
  state: string;
  error?: string;
}

export async function lookupPincode(pincode: string): Promise<PincodeLookupResult | null> {
  const cleanPincode = pincode.trim();
  if (!/^[1-9]\d{5}$/.test(cleanPincode)) {
    return { city: '', state: '', error: 'Pincode must be exactly 6 digits (cannot start with 0)' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPincode}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { city: '', state: '', error: 'Unable to verify pincode. Please enter city/state manually.' };
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return { city: '', state: '', error: 'Invalid pincode' };
    }

    const first = data[0];
    if (first.Status !== 'Success' || !Array.isArray(first.PostOffice) || first.PostOffice.length === 0) {
      return { city: '', state: '', error: 'Invalid pincode' };
    }

    const postOffice = first.PostOffice[0];
    const city = postOffice.District || postOffice.Block || postOffice.Name || '';
    const state = postOffice.State || '';

    return { city, state };
  } catch (err) {
    // Network error or timeout: allow user to type manually
    return {
      city: '',
      state: '',
      error: 'Network issue looking up pincode. You can type city & state manually.',
    };
  }
}
