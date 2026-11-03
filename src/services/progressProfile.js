// The profile is fixed for the lifetime of this page. An outstanding submission
// cannot write into the other profile while the user switches views.
export const isDemoProfile = new URLSearchParams(globalThis.location?.search).get('profile') === 'demo';

export function progressStorage() {
  return isDemoProfile ? globalThis.sessionStorage : globalThis.localStorage;
}

export function switchProgressProfile() {
  const url = new URL(window.location.href);
  if (isDemoProfile) url.searchParams.delete('profile');
  else url.searchParams.set('profile', 'demo');
  window.location.assign(url);
}
