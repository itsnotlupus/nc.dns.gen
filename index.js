/**
 * What this does:
 * 1. call namecoind name_scan to get a list of domains
 * 2. generate conf files for bind9, dnsmasq and static /etc/hosts.
 *
 * What this doesn't do:
 * - copy the proper conf files for your particular DNS mechanism
 *   ( but feel free to modify the constant below to generate the files in the right spot.)
 * - restart your DNS server (or tell it to use those new conf files.)
 *
 * What this should do, but doesn't:
 * - implement the full namecoin specification (currently, only legacy is implemented)
 */

const DNSMASQ_CONF_FILE_PATH = "conf/dnsmasq.conf";
const NAMED_CONF_FILE_PATH = "conf/named.conf";
const NAMED_ZONE_FILE_PATH = "conf/db.bit";
const ETC_HOSTS_FILE_PATH = "conf/hosts.conf";

/*
const DNSMASQ_CONF_FILE_PATH = "conf/dnsmasq.conf";
const NAMED_CONF_FILE_PATH = "/etc/bind/named.conf.bit";
const NAMED_ZONE_FILE_PATH = "/etc/bind/db.bit";
const ETC_HOSTS_FILE_PATH = "conf/hosts.conf";
*/

// fire a name_scan to enumerate domains
require("./rpc").call("name_scan",['',1e7], function(err, data) {
    if (err) throw err;

    // transform the array into a map, weeding out obviously invalid entries
    var obj = {};
    for (var i=0;i<data.length;i++) {
      var record=data[i], name=record.name;
      if (name.indexOf("d/")===0 && record.value.charAt(0)==='{') {
        try {
          obj[name.substr(2)] = JSON.parse(record.value);
        } catch (e) {
          //console.log("Invalid value for name="+name+" :"+record.value);
        } 
      }
    }

    console.log("Names defined or reserved: ",data.length);
    console.log("Names with plausible values: ", Object.keys(obj).length);

    // generate useful files from it
    require("./dnsmasq").generateDnsmasqConf(obj, DNSMASQ_CONF_FILE_PATH);
    require("./named").generateNamedConf(obj, NAMED_CONF_FILE_PATH, NAMED_ZONE_FILE_PATH);
    require("./hosts").generateHostsConf(obj, ETC_HOSTS_FILE_PATH);
});

