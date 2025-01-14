import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect } from 'react';

const Html5QrcodePlugin = ({ fps, qrbox, disableFlip, qrCodeSuccessCallback }) => {
  useEffect(() => {
    // Creates the configuration object
    const config = {
      fps,
      qrbox,
      disableFlip,
    };

    // Create a new instance of Html5QrcodeScanner
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      config,
      /* verbose= */ false
    );

    // Render the scanner and handle success/failure
    html5QrcodeScanner.render(qrCodeSuccessCallback, (errorMessage) => {
      console.error(errorMessage);
    });

    // Cleanup on component unmount
    return () => {
      html5QrcodeScanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, [fps, qrbox, disableFlip, qrCodeSuccessCallback]);

  return <div id="reader"></div>;
};

export default Html5QrcodePlugin; 