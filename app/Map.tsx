'use client';
import { useEffect, useState } from 'react';
import { MapContainer, GeoJSON } from 'react-leaflet';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function FitBounds({ data }: { data: any }) {
  const map = useMap();
  
  useEffect(() => {
    if (data) {
      const geoJsonLayer = L.geoJSON(data);
      map.fitBounds(geoJsonLayer.getBounds(), { padding: [10, 10] });
    }
  }, [data, map]);

  return null;
}

interface MapProps {
  mapType: string;
  setMapType: (type: string) => void;
  data: any;
}

export default function Map({ mapType, setMapType, data: statesData }: MapProps) {
  const [geoData, setGeoData] = useState(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/german-states.geojson')
      .then(r => r.json())
      .then(setGeoData);
  }, []);

  const getStateData = (stateName: string) => {
    // Debug: log what state names we're getting
    console.log('Looking for state:', stateName);
    console.log('Available states:', Object.keys(statesData?.states || {}));
    
    // Try exact match first
    if (statesData?.states[stateName]) {
      return statesData.states[stateName];
    }
    
    // Try to find partial matches for common naming differences
    const availableStates = Object.keys(statesData?.states || {});
    const match = availableStates.find(state => 
      state.toLowerCase().includes(stateName.toLowerCase()) ||
      stateName.toLowerCase().includes(state.toLowerCase())
    );
    
    if (match) {
      console.log('Found match:', match, 'for', stateName);
      return statesData.states[match];
    }
    
    console.log('No match found for:', stateName);
    return {};
  };

  const getColor = (stateName: string) => {
    const stateData = getStateData(stateName);
    const metadata = statesData?.metadata[mapType];
    
    if (!metadata) return '#95a5a6';
    
    if (metadata.type === 'categorical') {
      let value;
      if (mapType === 'division') {
        value = stateData.region;
      } else if (mapType === 'voting') {
        value = stateData.votedParty; // Map voting to votedParty
      } else {
        value = stateData[mapType];
      }
      return metadata.legend[value]?.color || '#95a5a6';
    } else if (metadata.type === 'numeric') {
      const value = stateData[mapType] || 0;
      const range = metadata.ranges?.find((r: any) => value >= r.min && value < r.max);
      return range?.color || '#95a5a6';
    }
    
    return '#95a5a6';
  };

  const style = (feature: any) => {
    const stateName = feature.properties?.NAME_1 || feature.properties?.name;
    return {
      fillColor: getColor(stateName),
      weight: 2,
      opacity: 1,
      color: '#2c3e50',
      fillOpacity: 0.8
    };
  };

  const getDisplayValue = (stateName: string, mapType: string) => {
    const stateData = getStateData(stateName);
    const metadata = statesData?.metadata[mapType];
    
    if (!metadata) return '';
    
    if (mapType === 'division') {
      const regionText = stateData.region === 'east' ? 'Former East Germany' : 
                       stateData.region === 'west' ? 'Former West Germany' : 'Berlin';
      return regionText;
    } else if (mapType === 'gdp') {
      return `GDP: €${stateData.gdp.toLocaleString()} million`;
    } else if (mapType === 'voting') {
      return `Voted: ${stateData.votedParty}`;
    } else if (metadata.type === 'numeric') {
      return `${metadata.displayName}: ${stateData[mapType]}${metadata.unit}`;
    } else if (metadata.type === 'categorical') {
      const value = stateData[mapType];
      return `${metadata.displayName}: ${value}`;
    }
    
    return '';
  };

  const onEachFeature = (feature: any, layer: any) => {
    const stateName = feature.properties?.NAME_1 || feature.properties?.name;
    
    layer.on({
      mouseover: (e: L.LeafletMouseEvent) => {
        const target = e.target;
        target.setStyle({
          weight: 3,
          color: '#1d4ed8',
          fillOpacity: 0.9
        });
        target.bringToFront();
      },
      mouseout: (e: L.LeafletMouseEvent) => {
        const target = e.target;
        target.setStyle(style(feature));
      },
      click: (e: L.LeafletMouseEvent) => {
        setSelectedState(stateName);
      }
    });

    const displayText = getDisplayValue(stateName, mapType);
    
    layer.bindTooltip(`
      <div style="font-size: 14px;">
        <strong>${stateName}</strong><br/>
        ${displayText}
      </div>
    `);
  };

  if (!geoData || !statesData) return <div>Loading...</div>;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={[51.1657, 10.4515]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        boxZoom={false}
        keyboard={false}
        attributionControl={false}
      >
        <FitBounds data={geoData} />
        <GeoJSON
          key={mapType}
          data={geoData}
          style={style}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
      
      {/* Selected State Info */}
      {selectedState && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          fontSize: '14px',
          zIndex: 1000
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{selectedState}</div>
          {Object.keys(statesData.metadata).map(key => {
            const stateData = getStateData(selectedState);
            const metadata = statesData.metadata[key];
            let displayValue = '';
            
            if (key === 'division') {
              displayValue = stateData.region === 'east' ? 'Former East Germany' : 
                           stateData.region === 'west' ? 'Former West Germany' : 'Berlin';
            } else if (key === 'gdp') {
              displayValue = `€${stateData.gdp.toLocaleString()} million`;
            } else if (key === 'voting') {
              displayValue = stateData.votedParty || '';
            } else if (metadata.type === 'numeric') {
              displayValue = `${stateData[key]}${metadata.unit}`;
            } else {
              displayValue = stateData[key] || '';
            }
            
            return (
              <div key={key}>
                {metadata.displayName}: {displayValue}
              </div>
            );
          })}
          <button 
            onClick={() => setSelectedState(null)}
            style={{
              marginTop: '8px',
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}