var ttn = require('ttn');

var region,
    appId,
    accessKey;

/*
*
* Get env variables for the TTN Netowork
*/
var init = function() {
  Parse.Config.get().then(function(config) {
      return {
          region: config.get("TTN_REGION"),
          appId: config.get("TTN_APPID"),
          accessKey: config.get("TTN_ACCESSKEY")
      }
  }, function(error) {
      return {
          region: process.env.TTN_REGION,
          appId: process.env.TTN_APPID,
          accessKey: process.env.TTN_ACCESSKEY
      }
  }).then(function(config) {

      var client = new ttn.Client(config.region, config.appId, config.accessKey);

      client.on('connect', function(connack) {
          console.info('[DEBUG]', 'Connect:', connack);

          var TTNConnect = Parse.Object.extend("TTNConnect");
          var ttnConnect = new TTNConnect();

          ttnConnect.set("connack", connack);

          ttnConnect.save(null, {
              success: function(ttnConnect) {
                  // Execute any logic that should take place after the object is saved.
                  console.info('[OK]', ttnConnect);
              },
              error: function(ttnConnect, error) {
                  // Execute any logic that should take place if the save fails.
                  // error is a Parse.Error with an error code and message.
                  console.error('[ERROR]', error.message);
              }
          });
      });

      client.on('error', function(err) {
          console.error('[ERROR]', err.message);
      });

      client.on('activation', function(deviceId, data) {
          console.info('[INFO] ', 'Activation:', deviceId, data);
      });

      client.on('message', function(deviceId, data) {
          console.info('[INFO] ', 'Message:', deviceId, JSON.stringify(data, null, 2));
      });

      /*
       *
       * null = all devices *, 'led' = field to listen for
       */
      client.on('message', null, 'led', function(deviceId, led) {

          // Toggle the LED
          var payload = {
              led: !led
          };

          // If you don't have an encoder payload function:
          // var payload = [led ? 0 : 1];

          console.info('[DEBUG]', 'Sending:', JSON.stringify(payload));
          client.send(deviceId, payload);
      });
  });
}



/*
 * Simple Cloud Code Example
 */

Parse.Cloud.define('init', function(request, response) {
    var message = "TTN Server has been started!";
    init();
    console.info(message);
    response.success(message);
});
