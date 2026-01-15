import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, CheckCircle2, MapPin, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

function GateIndicator({ gate1, gate2, gate3 }) {
  return (
    <div className="flex items-center gap-1">
      <div className={`w-1.5 h-1.5 rounded-full ${gate1 ? 'bg-emerald-500' : 'bg-neutral-200'}`} 
           title="Time Gate" />
      <div className={`w-1.5 h-1.5 rounded-full ${gate2 ? 'bg-emerald-500' : 'bg-neutral-200'}`}
           title="Location Gate" />
      <div className={`w-1.5 h-1.5 rounded-full ${gate3 ? 'bg-emerald-500' : 'bg-neutral-200'}`}
           title="Proximity Gate" />
    </div>
  );
}

export default function HandshakeFeed({ handshakes = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayHandshakes = isExpanded ? handshakes : handshakes.slice(0, 2);

  return (
    <div className="space-y-2.5">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between hover:opacity-70 transition-opacity"
      >
        <span className="text-xs tracking-[0.2em] uppercase text-neutral-400 font-medium">
          Live Handshakes
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-neutral-400">Live</span>
          </div>
          {handshakes.length > 2 && (
            <div className="text-neutral-400">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          )}
        </div>
      </button>

      <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: isExpanded ? '600px' : '160px' }}>
        <AnimatePresence mode="popLayout">
          {handshakes.length === 0 ? (
            <div className="py-12 text-center">
              <Wifi className="w-8 h-8 text-neutral-200 mx-auto mb-3" />
              <p className="text-sm text-neutral-400">Awaiting handshakes...</p>
            </div>
          ) : (
            displayHandshakes.map((handshake, index) => (
              <motion.div
                key={handshake.id || index}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="bg-white border border-neutral-100 rounded-xl p-3 hover:border-neutral-200 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-neutral-600">
                        {handshake.athleteName?.charAt(0) || 'A'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-neutral-900">
                        {handshake.athleteName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-neutral-400">
                          {format(new Date(handshake.verifiedAt), 'h:mm a')}
                        </span>
                        <GateIndicator 
                          gate1={handshake.verification?.gate_1_time}
                          gate2={handshake.verification?.gate_2_location}
                          gate3={handshake.verification?.gate_3_proximity}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <motion.p 
                      className="text-sm font-medium text-neutral-900"
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                    >
                      +${handshake.amount}
                    </motion.p>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                      <span className="text-[10px] text-emerald-600">Verified</span>
                    </div>
                  </div>
                </div>

                {handshake.facilityName && (
                  <div className="mt-2 pt-2 border-t border-neutral-50 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-neutral-300" />
                    <span className="text-[10px] text-neutral-400">{handshake.facilityName}</span>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}