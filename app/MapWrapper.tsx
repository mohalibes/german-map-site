'use client';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./Map'), { ssr: false });

interface MapWrapperProps {
  mapType: string;
  setMapType: (type: string) => void;
  data: any;
}

export default function MapWrapper({ mapType, setMapType, data }: MapWrapperProps) {
  return <Map mapType={mapType} setMapType={setMapType} data={data} />;
}