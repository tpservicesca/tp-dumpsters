'use client';

import { useEffect, useRef, useState } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import Link from 'next/link';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface CityInfo {
  name: string;
  lat: number;
  lng: number;
  slug: string;
  description: string;
  tag: string;
}

const cities: CityInfo[] = [
  // ── Original 4 ──
  { name: 'Oakland', lat: 37.8044, lng: -122.2712, slug: '/oakland',
    description: 'Same-day delivery to all Oakland neighborhoods. Downtown, Fruitvale, Temescal & more.', tag: 'Same-Day' },
  { name: 'Richmond', lat: 37.9358, lng: -122.3478, slug: '/richmond',
    description: 'Our fastest delivery zone. Point Richmond, Hilltop, Marina Bay & West Contra Costa.', tag: 'Fastest Zone' },
  { name: 'Concord', lat: 37.9780, lng: -122.0311, slug: '/concord',
    description: 'Serving all of Central Contra Costa. Downtown, Todos Santos, Clayton & Pleasant Hill.', tag: 'Popular' },
  { name: 'Pinole', lat: 38.0044, lng: -122.2989, slug: '/pinole',
    description: 'Our home base! Old Town, Pinole Valley, Tara Hills. Fastest response time guaranteed.', tag: 'Home Base' },
  // ── Batch 2 ──
  { name: 'Berkeley', lat: 37.8716, lng: -122.2727, slug: '/berkeley',
    description: 'Serving UC Berkeley area, North Berkeley, South Berkeley, Elmwood & all neighborhoods.', tag: '70/mo' },
  { name: 'Hayward', lat: 37.6688, lng: -122.0808, slug: '/hayward',
    description: 'Covering Hayward, Castro Valley, San Lorenzo & southern Alameda County.', tag: '90/mo' },
  { name: 'Fremont', lat: 37.5485, lng: -121.9886, slug: '/fremont',
    description: 'Dumpster delivery to Fremont, Newark, Union City & southern East Bay.', tag: '140/mo' },
  { name: 'Walnut Creek', lat: 37.9101, lng: -122.0652, slug: '/walnut-creek',
    description: 'Premium service for Walnut Creek, Lafayette, Orinda & Lamorinda area.', tag: '90/mo' },
  // ── Batch 3: High volume ──
  { name: 'Alameda', lat: 37.7652, lng: -122.2416, slug: '/alameda',
    description: 'Island city service. Downtown, Bay Farm, Harbor Bay & all Alameda neighborhoods.', tag: '140/mo' },
  { name: 'Antioch', lat: 38.0049, lng: -121.8058, slug: '/antioch',
    description: 'East County leader. Downtown, Deer Valley, Sand Creek, Dallas Ranch & Oakley.', tag: '140/mo' },
  { name: 'San Leandro', lat: 37.7249, lng: -122.1561, slug: '/san-leandro',
    description: 'Central location between Oakland & Hayward. Marina, Estudillo Estates & more.', tag: '70/mo' },
  { name: 'Vallejo', lat: 38.1041, lng: -122.2566, slug: '/vallejo',
    description: 'Waterfront city service. Glen Cove, Mare Island, Hiddenbrooke & Benicia.', tag: '70/mo' },
  { name: 'Livermore', lat: 37.6819, lng: -121.7680, slug: '/livermore',
    description: 'Tri-Valley wine country. Downtown, Springtown, Ruby Hill & South Livermore.', tag: '70/mo' },
  // ── Batch 3: Medium volume ──
  { name: 'Lafayette', lat: 37.8858, lng: -122.1180, slug: '/lafayette',
    description: 'Upscale Lamorinda service. Happy Valley, Burton Valley, Orinda & Moraga.', tag: '70/mo' },
  { name: 'Pleasanton', lat: 37.6604, lng: -121.8758, slug: '/pleasanton',
    description: 'Premium Tri-Valley. Birdland, Vintage Hills, Ruby Hill & Stoneridge.', tag: '50/mo' },
  { name: 'San Ramon', lat: 37.7799, lng: -121.9780, slug: '/san-ramon',
    description: 'Dougherty Valley, Gale Ranch, Canyon Lakes & all San Ramon communities.', tag: '50/mo' },
  { name: 'Dublin', lat: 37.7022, lng: -121.9358, slug: '/dublin',
    description: 'Fastest-growing Tri-Valley city. Dublin Ranch, Fallon, Emerald Glen & more.', tag: '50/mo' },
  { name: 'Brentwood', lat: 37.9317, lng: -121.6961, slug: '/brentwood',
    description: 'East County boom town. Deer Ridge, Summerset, Shadow Lakes & Oakley.', tag: '50/mo' },
  // ── Batch 4 ──
  { name: 'Union City', lat: 37.5934, lng: -122.0439, slug: '/union-city',
    description: 'Serving Union City, Alvarado, Decoto & the southern East Bay corridor.', tag: '50/mo' },
  { name: 'Newark', lat: 37.5316, lng: -122.0402, slug: '/newark',
    description: 'Old Town, NewPark, Lakeshore & all Newark neighborhoods near Fremont.', tag: '50/mo' },
  { name: 'Pleasant Hill', lat: 37.9481, lng: -122.0608, slug: '/pleasant-hill',
    description: 'Central Contra Costa. Gregory Gardens, Poets Corner & Contra Costa Centre.', tag: '40/mo' },
  { name: 'Martinez', lat: 38.0194, lng: -122.1341, slug: '/martinez',
    description: 'County seat. Downtown, Alhambra Valley, waterfront & North Contra Costa.', tag: '40/mo' },
  { name: 'Pittsburg', lat: 38.0280, lng: -121.8847, slug: '/pittsburg',
    description: 'East County growth. Downtown, Old Town, Bay Point & waterfront area.', tag: '40/mo' },
];

const activeCities = cities.filter((c) => c.slug !== '#');

export default function ServiceAreaMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityInfo | null>(null);

  useEffect(() => {
    if ((window as any).google?.maps) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBI6Vup5IKvfvlyvdhV_9nipF5FXaVnZ04&callback=initDumpsterMap`;
    script.async = true;
    script.defer = true;

    (window as any).initDumpsterMap = () => {
      setMapLoaded(true);
    };

    document.head.appendChild(script);

    return () => {
      delete (window as any).initDumpsterMap;
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !(window as any).google?.maps) return;

    const map = new (window as any).google.maps.Map(mapRef.current, {
      center: { lat: 37.85, lng: -122.15 },
      zoom: 10,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        { featureType: 'water', stylers: [{ color: '#c9e7f5' }] },
        { featureType: 'landscape', stylers: [{ color: '#f0f4e8' }] },
        { featureType: 'road.highway', stylers: [{ color: '#fcd4a4' }] },
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    cities.forEach((city) => {
      const isActive = city.slug !== '#';
      const marker = new (window as any).google.maps.Marker({
        position: { lat: city.lat, lng: city.lng },
        map,
        title: city.name,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: isActive ? '#E02B20' : '#999999',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
        },
      });

      const linkHtml = isActive
        ? `<a href="${city.slug}" style="display:inline-block;margin-top:8px;background:#E02B20;color:white;padding:6px 16px;border-radius:6px;font-size:13px;font-weight:bold;text-decoration:none;">View ${city.name} Page →</a>`
        : `<span style="display:inline-block;margin-top:8px;background:#eee;color:#888;padding:4px 12px;border-radius:6px;font-size:12px;">Page coming soon</span>`;

      const infoWindow = new (window as any).google.maps.InfoWindow({
        content: `
          <div style="padding:10px;max-width:240px;font-family:sans-serif;">
            <h3 style="margin:0 0 4px 0;font-size:16px;color:#1a1a1a;">${city.name}</h3>
            <span style="display:inline-block;background:${isActive ? '#E02B20' : '#ccc'};color:white;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:bold;margin-bottom:6px;">${city.tag}</span>
            <p style="margin:6px 0;font-size:13px;color:#555;line-height:1.4;">${city.description}</p>
            ${linkHtml}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        setSelectedCity(city);
      });
    });
  }, [mapLoaded]);

  return (
    <section id="service-area" className="py-20" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
      <div className="w-[90%] max-w-[1200px] mx-auto">
        <h4 className="font-[var(--font-red-hat)] text-sm font-bold text-tp-gold uppercase tracking-[2px] mb-2 text-center">
          SERVICE AREA
        </h4>
        <h2 className="font-[var(--font-poppins)] text-[26px] md:text-[32px] font-bold text-white mb-10 text-center">
          Dumpster Delivery Across the Bay Area
        </h2>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Map Header */}
          <div className="bg-gradient-to-r from-tp-red to-[#c0221b] text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h3 className="text-xl md:text-2xl font-bold mb-1 font-[var(--font-poppins)]">
                Click a City for Local Info
              </h3>
              <p className="opacity-90 text-sm">
                Red markers have dedicated pages — click to visit
              </p>
            </div>
            <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm border border-white/30">
              <div className="flex gap-8 text-white justify-center">
                <div className="text-center">
                  <span className="block text-2xl font-bold">{activeCities.length}</span>
                  <span className="text-sm">Active Pages</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold">{cities.length}</span>
                  <span className="text-sm">Cities Served</span>
                </div>
              </div>
            </div>
          </div>

          {/* Google Map */}
          <div className="relative">
            <div ref={mapRef} className="h-[350px] md:h-[500px] w-full" />
            {!mapLoaded && (
              <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center gap-4 text-gray-500">
                <FaMapMarkerAlt className="text-tp-red text-5xl animate-pulse" />
                <p className="text-base font-semibold text-gray-800">Loading map...</p>
              </div>
            )}
          </div>

          {/* City Pills */}
          <div className="bg-gray-50 p-6 md:p-8 border-t border-gray-200">
            <div className="flex flex-wrap justify-center gap-3 mb-4">
              {cities.map((city) => {
                const isActive = city.slug !== '#';
                const pill = (
                  <span
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                      selectedCity?.name === city.name
                        ? 'bg-tp-red text-white'
                        : isActive
                        ? 'bg-white text-gray-800 border border-gray-200 hover:border-tp-red hover:text-tp-red'
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}
                  >
                    <FaMapMarkerAlt className="text-xs" /> {city.name}
                    {!isActive && <span className="text-[10px] ml-1 opacity-60">soon</span>}
                  </span>
                );

                return isActive ? (
                  <Link key={city.name} href={city.slug}>
                    {pill}
                  </Link>
                ) : (
                  <span key={city.name}>{pill}</span>
                );
              })}
            </div>
            <p className="text-center text-gray-500 text-sm font-[var(--font-poppins)]">
              Serving the entire Bay Area with fast, reliable dumpster rental service
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
