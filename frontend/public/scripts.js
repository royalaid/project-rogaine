window.addEventListener('DOMContentLoaded', (event) => {
  var WalletConnect = window.WalletConnect.default;
  var WalletConnectQRCodeModal = window.WalletConnectQRCodeModal.default;

  // Setup the image in base64 format (declared intrust-wallet-connect-img.js)
  // this allows to simply open the index.html file in the browser (without
  // the need of a server)
  document.getElementById('trust-wallet-connect').src = trustWalletConnectImg;

  // Get an instance of the WalletConnect connector
  var walletConnector = new WalletConnect({
    bridge: 'https://bridge.walletconnect.org' // Required
  });

  // Display data if connected
  if (walletConnector.connected) {

}

  // When the connect/disconnect button is clicked
  connect = function () {
    // Check if connection is already established
    if (!walletConnector.connected) {
      // create new session
      walletConnector.createSession().then(() => {
        // get uri for QR Code modal
        var uri = walletConnector.uri;
        // display QR Code modal
        WalletConnectQRCodeModal.open(uri, () => {
          console.log('QR Code Modal closed');
        });
      });
    } else {
      // disconnect
      walletConnector.killSession();
    }
  }

  // Subscribe to connection events: connect, session_update and disconnect
  walletConnector.on('connect', function (error, payload) {
    if (error) {
      console.error(error);
    } else {
      // Close QR Code Modal
      WalletConnectQRCodeModal.close();
      // connection is made so we can display all the data
    }
  });

  walletConnector.on('session_update', function (error, payload) {
    if (error) {
      console.error(error);
    } else if (walletConnector.connected) {
      // data may be changed
    }

  });

  walletConnector.on('disconnect', function (error, payload) {
    if (error) {
      console.error(error);
    } else {
    }
  });

});