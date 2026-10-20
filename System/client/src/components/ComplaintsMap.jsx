import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { MapPinned } from 'lucide-react';
import { ComplaintPriorityBadge, ComplaintStatusBadge } from './complaint/ComplaintStatusBadge';

const colors = { Pending: '#f59e0b', 'Under Review': '#2563eb', Assigned: '#4f46e5', 'In Progress': '#7c3aed', Resolved: '#16a34a', Closed: '#64748b' };

const pin = (status) => L.divIcon({
  html: `<span style="display:block;width:18px;height:18px;border:3px solid white;border-radius:999px;background:${colors[status] || '#2563eb'};box-shadow:0 2px 8px rgba(15,23,42,.22)"></span>`,
  className: 'custom-leaflet-icon', iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -10],
});

const coordinatesFor = (complaint) => {
  const coordinates = complaint.location?.coordinates;
  return Array.isArray(coordinates) && coordinates.length === 2 ? [coordinates[1], coordinates[0]] : null;
};

export default function ComplaintsMap({ complaints = [] }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const categories = useMemo(() => [...new Set(complaints.map(({ category }) => category).filter(Boolean))], [complaints]);
  const mappableComplaints = useMemo(() => complaints.filter((complaint) => coordinatesFor(complaint) && (!selectedCategory || complaint.category === selectedCategory)), [complaints, selectedCategory]);
  const center = mappableComplaints[0] ? coordinatesFor(mappableComplaints[0]) : null;

  return <section className="rounded-card border border-slate-200 bg-white p-5 shadow-soft">
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="flex items-center gap-2 font-outfit text-lg font-bold text-slate-900"><MapPinned className="h-5 w-5 text-primary" /> My reports map</h2><p className="mt-1 text-xs text-slate-500">Only your reported issues are shown here.</p></div>
      {categories.length > 1 && <label className="text-xs font-semibold text-slate-500">Category <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="ml-2 rounded-button border border-slate-200 bg-slate-50 px-2 py-1.5 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"><option value="">All</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>}
    </div>
    <div className="h-80 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      {!center ? <div className="grid h-full place-items-center px-5 text-center text-sm text-slate-400">Reports with verified coordinates will appear on the map.</div> : <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{mappableComplaints.map((complaint) => <Marker key={complaint._id} position={coordinatesFor(complaint)} icon={pin(complaint.status)}><Popup><div className="min-w-48 space-y-2 font-sans"><p className="text-sm font-bold text-slate-800">{complaint.title}</p><p className="text-xs text-slate-500">{complaint.location?.address || 'Location being verified'}</p><div className="flex gap-1"><ComplaintPriorityBadge priority={complaint.priority} /><ComplaintStatusBadge status={complaint.status} /></div><Link to={`/citizen/complaints/${complaint._id}`} className="block text-xs font-bold text-primary">View details &rarr;</Link></div></Popup></Marker>)}</MapContainer>}
    </div>
  </section>;
}
