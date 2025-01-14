import React, { useState, useEffect } from 'react';
import { useLocation } from "react-router-dom";
import { Html5QrcodeScanner } from 'html5-qrcode';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import app from '../../firebase';

import Sidebar from '../../components/Sidebar';

const QRScanner = () => {
  const location = useLocation();
  const role = location.state?.role || localStorage.getItem('userRole');
  // const name = location.state?.name || localStorage.getItem('userName');

  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 5,
    });

    const handleSuccess = async (decodedText) => {
      scanner.clear();
      const data = JSON.parse(decodedText);
      
      try {
        const db = getFirestore(app);
        const collectionRef = doc(db, 'collectionHistory', data.collectionId);
        await updateDoc(collectionRef, {
          status: 'Collected',
          collectedAt: new Date()
        });
        setScanResult({
          success: true,
          message: `Item "${data.itemName}" collected by ${data.userName}`,
          data: data
        });
      } catch (error) {
        setScanResult({
          success: false,
          message: 'Failed to update collection status',
          error: error.message
        });
      }
    };

  scanner.render(handleSuccess, (error) => {
    console.warn(error);
  });

  return () => {
    scanner.clear();
  };
  }, []);
  
  return (
      <div className="dashboard-layout">
        <Sidebar userRole={role} />
        <div className="dashboard-content">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Scan Collection QR Code</h1>
          <div id="reader"></div>
          {scanResult && (
            <div
              className={`mt-4 p-4 rounded ${
                scanResult.success ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              <p className="font-bold">{scanResult.message}</p>
              <button
                className="ml-4 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                onClick={() => setScanResult(null)}
              >
                Close
              </button>
            </div>
          )}
        </div>
        </div>
    </div>
  );
    
};

export default QRScanner;