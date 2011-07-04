// no noticeable speed impact from this caching layer. keep it or lose it?
var dns_cache = {};

function isIPv4Address(str) {
  var re = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return re.exec(str);
}
function isRoutableIPv4Address(str) {
  var arr = isIPv4Address(str);
  if (!arr) {
    return; // not an IP
  }
  if (arr[1] == "10") return; // class A not routable
  if (arr[1] == "127") return;
  if (arr[1] == "172" && arr[2]&0xF0 == 16) return;  // class B not routable
  if (arr[1] == "192" && arr[2] == "168") return; // class C
  if (arr[1] >= "224" && arr[1] <= "247") return; // class D+E
  // still here? okay.
  return true;
}

function isPlausibleDomain(str) {
  var parts = str.split(".");
  for (var i=0;i<parts.length;i++) {
    var part=parts[i];
    if (part.length<1 || part.length>63) return;
    if (!part.match(/^[a-z][a-z0-9-]*$/)) return;
  }
  return true;
}

function lookupDomain(str, callback) {
  if (dns_cache[str]) {
    callback(null, dns_cache[str]);
    return;
  }
  require("dns").lookup(str, 4, function(err, address, family) {
    if (err) { callback(err); return }
    dns_cache[str] = address;
    callback(null, address);
  });
}

function clearDnsCache() {
  dns_cache = {};
}

module.exports = {
  isIPv4Address: isIPv4Address,
  isRoutableIPv4Address: isRoutableIPv4Address,
  isPlausibleDomain: isPlausibleDomain,
  lookupDomain: lookupDomain,
  clearDnsCache: clearDnsCache
};
