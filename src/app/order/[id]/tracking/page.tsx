import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Box, Truck, CheckCircle2, MapPin, QrCode as qrIcon, Navigation } from "lucide-react";
import Image from "next/image";

export default async function OrderTrackingPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: { product: true }
      }
    }
  });

  if (!order) notFound();

  // Generate QR Code for this tracking URL to show on screen
  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://koda-store.com"}/orders/${order.id}/tracking`;
  const qrCodeDataUrl = await QRCode.toDataURL(trackingUrl);

  const steps = [
    { label: "Order Placed", date: order.createdAt, done: true, icon: <Box size={20} /> },
    { label: "Processing", date: order.createdAt, done: order.status !== "pending", icon: <CheckCircle2 size={20} /> },
    { label: "In Transit", date: null, done: order.status === "shipped" || order.status === "delivered", icon: <Truck size={20} /> },
    { label: "Delivered", date: null, done: order.status === "delivered", icon: <MapPin size={20} /> },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-zinc-900">Track Your Shipment</h1>
          <p className="text-zinc-500 mt-1">Order ID: #{order.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div className="flex items-center gap-4 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Status</p>
            <p className="font-semibold text-zinc-900 uppercase">{order.status}</p>
          </div>
          <div className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
            <Navigation size={20} />
          </div>
        </div>
      </div>

      {/* Progress Line */}
      <div className="relative flex justify-between items-start pt-4">
        <div className="absolute top-[2.4rem] left-0 w-full h-0.5 bg-zinc-100 -z-10" />
        {steps.map((step, idx) => (
          <div key={idx} className="flex flex-col items-center flex-1 text-center group">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 border-4 border-white shadow-md ${step.done ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-400"}`}>
              {step.icon}
            </div>
            <p className={`mt-4 font-medium text-sm ${step.done ? "text-zinc-900" : "text-zinc-400"}`}>{step.label}</p>
            {step.date && <p className="text-[10px] text-zinc-400 mt-1">{step.date.toLocaleDateString()}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Tracking Details */}
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Truck size={18} className="text-zinc-400" /> Logistics Information
          </h3>
          <div className="space-y-4">
            <TrackingItem label="Carrier" value="Koda Logistics Prime" />
            <TrackingItem label="Tracking Number" value={(order as any).trackingNumber || "Assigning..."} />
            <TrackingItem label="Destination" value={order.shippingAddress || "Main Registry"} />
          </div>
          
          <div className="mt-8 pt-6 border-t border-zinc-100">
            <div className="flex items-center gap-4">
              <img src={qrCodeDataUrl} alt="QR code" className="w-24 h-24 border border-zinc-200 rounded-lg p-1 bg-white" />
              <div>
                <p className="text-sm font-semibold">Mobile Track</p>
                <p className="text-xs text-zinc-500 mt-1">Scan this code to follow progress on your device.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-zinc-900 text-zinc-100 p-8 rounded-3xl shadow-xl space-y-6">
          <h3 className="text-lg font-semibold">Package Contents</h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 justify-between border-b border-zinc-800 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                     {Array.isArray(item.product.images) && item.product.images[0] && (
                         <Image src={item.product.images[0] as string} alt={item.product.name} fill className="object-cover" />
                     )}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">{item.product.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="text-sm font-bold">{order.currency} {item.price.toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="pt-6 border-t border-zinc-800 flex justify-between items-center">
            <p className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Total Paid</p>
            <p className="text-xl font-bold text-white">{order.currency} {order.total.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackingItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  );
}
