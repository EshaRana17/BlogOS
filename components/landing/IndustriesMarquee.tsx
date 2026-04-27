"use client";

import {
  Code2, Volume2, GraduationCap, Home, Share2, ShoppingCart, Scale,
  Play, UtensilsCrossed, Heart, BatteryCharging, Tv2, Stethoscope,
  Landmark, Plane, Trophy, Shirt, Car, Building2,
} from "lucide-react";

const INDUSTRIES = [
  { icon: Code2, name: "Technology" },
  { icon: Volume2, name: "Marketing" },
  { icon: GraduationCap, name: "Education" },
  { icon: Home, name: "Real Estate" },
  { icon: Share2, name: "Social Network" },
  { icon: ShoppingCart, name: "E-Commerce" },
  { icon: Scale, name: "Legal" },
  { icon: Play, name: "Entertainment" },
  { icon: UtensilsCrossed, name: "Food & Beverage" },
  { icon: Heart, name: "Hospitality" },
  { icon: BatteryCharging, name: "Energy" },
  { icon: Tv2, name: "Media" },
  { icon: Stethoscope, name: "Healthcare" },
  { icon: Landmark, name: "Finance" },
  { icon: Plane, name: "Travel" },
  { icon: Trophy, name: "Sports" },
  { icon: Shirt, name: "Fashion" },
  { icon: Car, name: "Automotive" },
  { icon: Building2, name: "Architecture" },
];

export default function IndustriesMarquee() {
  return (
    <style>{`
      @keyframes marquee {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .marquee-container {
        animation: marquee 60s linear infinite;
      }
      .marquee-container:hover {
        animation-play-state: paused;
      }
    `}
      <div className="relative overflow-hidden">
        <div className="marquee-container flex gap-6 w-max">
          {[...INDUSTRIES, ...INDUSTRIES].map((ind, i) => {
            const Icon = ind.icon;
            return (
              <div
                key={`${i}-${ind.name}`}
                className="flex-shrink-0 flex items-center gap-3 px-6 py-3 rounded-full border border-border bg-card/50 hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <Icon size={18} className="text-primary shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap">{ind.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </style>
  );
}
