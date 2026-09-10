// Simple device fingerprint for anti-duplicate voting
export function getVoterDeviceId() {
  let deviceId = typeof window !== 'undefined' ? localStorage.getItem('dance_comp_voter_device_id') : null;
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dance_comp_voter_device_id', deviceId);
    }
  }
  return deviceId;
}
