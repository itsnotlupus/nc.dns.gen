const USER_AGENT = "node_dns_copy";

var default_host = "127.0.0.1";
var default_port = 9332;
var default_user = "rpcuser";
var default_password = "rpcpassword";
var default_usessl = false;
var ready = false;

require("fs").readFile(process.env.HOME + "/.namecoin/bitcoin.conf", function(err, data) {
  if (err) throw err;
  var lines=  data.toString().split("\n");
  var obj= {};
  for (var i=0;i<lines.length;i++) {
    var line=lines[i].trim();
    if (line.charAt(0)=="#" || line.length==0) continue;
    var tmp=lines[i].split("=",2);
    obj[tmp[0]]=tmp[1];
  }

  default_port = obj.rpcport || 8332; // check default values
  default_user = obj.rpcuser;
  default_password = obj.rpcpassword;

  ready = true;
});

function callRPC(method, args, host, port, user, password, useSSL, callback) {

  var a = arguments;
  if (!ready) {
    return setTimeout(function() { callRPC.apply(null,a); }, 50);
  }

  if (a.length<8) {
    callback = a[a.length-1];
    a[a.length-1] = null;
  }

  // default values;
  args=args||[];
  host=host||default_host;
  port=port||default_port;
  user=user||default_user;
  password=password||default_password;
  useSSL=useSSL||default_usessl;

  // craft request together..

  var content = JSON.stringify({
    method: method,
    params: args,
    id: "some_id"
  });
  var headers = {
    host: host,
    port: port,
    path: "/",
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Host": host,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Content-Length": content.length,
      "Authorization": "Basic " + new Buffer(user+":"+password).toString("base64")
    }
  };

  var transport = require(useSSL?"https":"http");
  var req = transport.request(headers, function(res) {
    if (res.statusCode != 200) {
      callback(new Error("RPC Error: "+res.statusCode));
      return;
    }
    res.setEncoding('utf8');
    var body=[];
    res.on('data', function(chunk) {
      body.push(chunk.toString());
    });
    res.on('end', function() {
      try {
        var obj = JSON.parse(body.join(''));
      } catch (e) {
        callback(e);
        return;
      }
      if (obj.error) {
        callback(new Error(obj.error));
        return;
      }
      callback(null, obj.result);
    });
  });

  req.on('error', function(e) {
    callback(e);
  });

  req.write(content);
  req.end();
}

module.exports = {
  call: callRPC
};
