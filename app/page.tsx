'use client';
import { useState, useEffect } from 'react';
import MapWrapper from './MapWrapper';

interface MapLegendProps {
  mapType: string;
  data: any;
}

const MapLegend = ({ mapType, data }: MapLegendProps) => {
  const metadata = data?.metadata[mapType];
  
  if (!metadata) return null;

  return (
    <div style={{ 
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      fontSize: '14px',
      marginTop: '20px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        {metadata.type === 'categorical' ? metadata.title : `${metadata.title} (${metadata.unit || ''})`}
      </div>
      
      {metadata.type === 'categorical' && metadata.legend && 
        Object.entries(metadata.legend).map(([key, item]: [string, any]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
            <div style={{ width: '20px', height: '15px', backgroundColor: item.color, marginRight: '8px' }}></div>
            <span>{item.label}</span>
          </div>
        ))
      }
      
      {metadata.type === 'numeric' && metadata.ranges && 
        metadata.ranges.map((range: any, index: number) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
            <div style={{ width: '20px', height: '15px', backgroundColor: range.color, marginRight: '8px' }}></div>
            <span>{range.label}</span>
          </div>
        ))
      }
    </div>
  );
};

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [mapType, setMapType] = useState<string>('');
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  useEffect(() => {
    // Load data from JSON file
    fetch('/data/german-states-data.json')
      .then(r => r.json())
      .then(loadedData => {
        setData(loadedData);
        const types = Object.keys(loadedData.metadata);
        setAvailableTypes(types);
        setMapType(types[0] || '');
      })
      .catch(err => {
        console.error('Failed to load data:', err);
        // Fallback to embedded data if file doesn't exist
        const fallbackData = {
          "metadata": {
            "division": {
              "title": "East-West Division",
              "description": "Historical division between former East Germany (GDR) and West Germany",
              "year": "1949-1990",
              "source": "Historical Records",
              "displayName": "Division",
              "type": "categorical",
              "legend": {
                "west": { "color": "#3498db", "label": "Former West Germany" },
                "east": { "color": "#e74c3c", "label": "Former East Germany (GDR)" },
                "berlin": { "color": "#9b59b6", "label": "Berlin" }
              }
            }
          },
          "states": {
            "Brandenburg": { "region": "east" }
          }
        };
        setData(fallbackData);
        const types = Object.keys(fallbackData.metadata);
        setAvailableTypes(types);
        setMapType(types[0] || '');
      });
  }, []);

  const currentIndex = availableTypes.indexOf(mapType);

  const goToPrevious = () => {
    const prevIndex = currentIndex === 0 ? availableTypes.length - 1 : currentIndex - 1;
    setMapType(availableTypes[prevIndex]);
  };

  const goToNext = () => {
    const nextIndex = currentIndex === availableTypes.length - 1 ? 0 : currentIndex + 1;
    setMapType(availableTypes[nextIndex]);
  };

  const getCurrentMetadata = () => {
    return data?.metadata[mapType] || {
      title: 'German States',
      description: 'Data visualization',
      year: '2023',
      source: 'Various'
    };
  };

  if (!data || !mapType) {
    return <div>Loading...</div>;
  }

  const info = getCurrentMetadata();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      backgroundColor: 'transparent'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
        <div style={{ width: '900px', height: '700px' }}>
          <MapWrapper mapType={mapType} setMapType={setMapType} data={data} />
        </div>
       
        <div style={{ 
          padding: '40px', 
          backgroundColor: 'transparent', 
          borderRadius: '10px', 
          boxShadow: 'none',
          width: '320px',
          height: '600px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            marginTop: 0, 
            marginBottom: '1rem', 
            marginLeft: 0, 
            marginRight: 0 
          }}>German States Across Different Metrics</h1>
           <p style={{ 
            fontSize: '1rem', 
            fontWeight: 'bold', 
            marginTop: 0, 
            marginBottom: '1rem', 
            marginLeft: 0, 
            marginRight: 0 
          }}>By Mohamed Ali Besbes</p>
          <p style={{ 
            marginTop: 0, 
            marginBottom: '0.5rem', 
            marginLeft: 0, 
            marginRight: 0 
          }}><strong>Data:</strong> {info.description}</p>
          <p style={{ 
            marginTop: 0, 
            marginBottom: '0.5rem', 
            marginLeft: 0, 
            marginRight: 0 
          }}><strong>Year:</strong> {info.year}</p>
          <p style={{ 
            marginTop: 0, 
            marginBottom: 0, 
            marginLeft: 0, 
            marginRight: 0 
          }}><strong>Source:</strong> {info.source}</p>
          
          <MapLegend mapType={mapType} data={data} />
          
          {/* Map Type Switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            marginTop: '20px'
          }}>
            <button
              onClick={goToPrevious}
              style={{
                padding: '8px 12px',
                backgroundColor: 'transparent',
                color: '#2c3e50',
                border: 'none',
                cursor: 'pointer',
                fontSize: '24px',
                fontWeight: 'bold'
              }}
            >
              &#8249;
            </button>
            <span style={{ 
              fontSize: '16px', 
              fontWeight: 'bold',
              minWidth: '120px',
              textAlign: 'center'
            }}>
              {info.displayName || mapType}
            </span>
            <button
              onClick={goToNext}
              style={{
                padding: '8px 12px',
                backgroundColor: 'transparent',
                color: '#2c3e50',
                border: 'none',
                cursor: 'pointer',
                fontSize: '24px',
                fontWeight: 'bold'
              }}
            >
              &#8250;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}