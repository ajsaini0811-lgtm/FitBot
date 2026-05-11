import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import './BarcodeScanner.css';

export default function BarcodeScanner({ onResult, onClose }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader.decodeFromConstraints(
      { video: { facingMode: 'environment' } },
      videoRef.current,
      async (result, err) => {
        if (!result || !scanning) return;
        setScanning(false);
        setLoading(true);
        try {
          const barcode = result.getText();
          const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
          const data = await res.json();
          if (data.status !== 1) {
            setError('Product not found in database. Try searching manually.');
            setLoading(false);
            return;
          }
          const p = data.product;
          const per100 = p.nutriments;
          onResult({
            name: p.product_name || p.product_name_en || 'Unknown Product',
            calories: Math.round(per100['energy-kcal_100g'] || per100['energy_100g'] / 4.184 || 0),
            proteinG: Math.round(per100['proteins_100g'] || 0),
            carbsG: Math.round(per100['carbohydrates_100g'] || 0),
            fatG: Math.round(per100['fat_100g'] || 0),
            quantity: 100,
          });
        } catch {
          setError('Failed to fetch product info. Check your connection.');
          setLoading(false);
        }
      }
    ).catch(e => setError('Camera access denied. Please allow camera permission.'));

    return () => { reader.reset(); };
  }, []);

  return (
    <div className="barcode-overlay">
      <div className="barcode-modal">
        <div className="barcode-header">
          <h3>📷 Scan Barcode</h3>
          <button className="barcode-close" onClick={onClose}>✕</button>
        </div>

        {error ? (
          <div className="barcode-error">
            <p>{error}</p>
            <button className="btn btn-outline btn-sm" onClick={() => { setError(null); setScanning(true); }}>Try Again</button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          </div>
        ) : loading ? (
          <div className="barcode-loading">
            <div className="spinner" />
            <p>Looking up product…</p>
          </div>
        ) : (
          <>
            <div className="barcode-viewfinder">
              <video ref={videoRef} className="barcode-video" autoPlay muted playsInline />
              <div className="barcode-frame">
                <div className="barcode-corner tl" />
                <div className="barcode-corner tr" />
                <div className="barcode-corner bl" />
                <div className="barcode-corner br" />
                <div className="barcode-scan-line" />
              </div>
            </div>
            <p className="barcode-hint">Point camera at the barcode on the packaging</p>
          </>
        )}
      </div>
    </div>
  );
}
