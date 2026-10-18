// codeguard:components:start
// codeguard:defines: isAdminHost
export function isAdminHost(hostname, development = false) {
  return hostname === 'admin.ahmad-makatreh.vip' || (development && hostname === 'admin.localhost');
}
// codeguard:components:end
