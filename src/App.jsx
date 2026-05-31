import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  Heart, 
  Activity, 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  Navigation, 
  MapPin, 
  X, 
  ArrowRight, 
  Play, 
  RotateCcw, 
  AlertOctagon, 
  User, 
  ShieldAlert, 
  Share2, 
  Layers, 
  Check, 
  Bell, 
  MessageSquare,
  Clock,
  Compass,
  CheckCircle2,
  Tv,
  HelpCircle,
  TrendingUp,
  Cpu,
  Wifi,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Hospitals List
const HOSPITALS_DATA = [
  { 
    id: 1, 
    name: "City General Trauma Center", 
    beds: "3 / 15", 
    bedsCount: 3,
    status: "CRITICAL BEDS", 
    latency: "42ms", 
    distance: 3.8, 
    eta: 9, 
    x: 80, 
    y: 90, 
    color: "#EF4444",
    phone: "+1 (555) 019-2831"
  },
  { 
    id: 2, 
    name: "Metro Surgical & Trauma Guild", 
    beds: "1 / 8", 
    bedsCount: 1,
    status: "NEAR CAPACITY", 
    latency: "32ms", 
    distance: 2.4, 
    eta: 6, 
    x: 70, 
    y: 310, 
    color: "#F59E0B",
    phone: "+1 (555) 019-9481"
  },
  { 
    id: 3, 
    name: "St. Jude Trauma Center", 
    beds: "11 / 25", 
    bedsCount: 11,
    status: "OPTIMAL", 
    latency: "18ms", 
    distance: 1.2, 
    eta: 3, 
    x: 290, 
    y: 110, 
    color: "#10B981",
    phone: "+1 (555) 019-3382"
  },
  { 
    id: 4, 
    name: "Mercy Critical Care Clinic", 
    beds: "8 / 12", 
    bedsCount: 8,
    status: "OPTIMAL", 
    latency: "51ms", 
    distance: 5.1, 
    eta: 12, 
    x: 270, 
    y: 280, 
    color: "#10B981",
    phone: "+1 (555) 019-1058"
  }
];

export default function App() {
  // VICTIM APP STATE
  // 'idle' (State 0) | 'countdown' (State 1) | 'triage' (State 2) | 'handshake' (State 3)
  const [victimState, setVictimState] = useState('idle');
  const [countdown, setCountdown] = useState(3);
  const [radialProgress, setRadialProgress] = useState(100);
  
  // INCIDENT PAYLOAD STATE
  const [activeIncident, setActiveIncident] = useState(null);
  const [activeHospitalIndex, setActiveHospitalIndex] = useState(0);
  const [vitals, setVitals] = useState({ hr: 72, spo2: 98, bp: "120/80" });
  
  // HOSPITAL SLA TIMER
  const [slaTimeLeft, setSlaTimeLeft] = useState(30);
  const [slaActive, setSlaActive] = useState(false);
  const [escalatedCount, setEscalatedCount] = useState(0);

  // MOCK SYSTEM VARIABLES
  const [availableBedsTotal, setAvailableBedsTotal] = useState(23);
  const [avgLatency, setAvgLatency] = useState(27);
  const [activeIncidentsCount, setActiveIncidentsCount] = useState(0);

  // FAMILY STATE
  const [familyAlerted, setFamilyAlerted] = useState(false);
  const [familyMessages, setFamilyMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  
  // SIMULATOR TELEMENTRY LOGS
  const [logs, setLogs] = useState([
    { time: "21:28:20", message: "RoadSOS Core Telemetry Engine initialized.", type: "success" },
    { time: "21:28:21", message: "WebSocket Node established. Awaiting victim emergency beacon signal...", type: "info" }
  ]);

  // Timers references
  const countdownIntervalRef = useRef(null);
  const slaIntervalRef = useRef(null);
  const vitalIntervalRef = useRef(null);
  const chatScrollRef = useRef(null);

  // Add a telemetry log
  const addLog = (message, type = 'info') => {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    setLogs(prev => [{ time, message, type }, ...prev].slice(0, 30));
  };

  // Fluctuate Vitals when in crisis
  useEffect(() => {
    if (victimState === 'triage' || victimState === 'handshake') {
      vitalIntervalRef.current = setInterval(() => {
        setVitals(prev => {
          // Keep vitals erratic during triage, stabilizing slightly post-handshake
          const isTriage = victimState === 'triage';
          const targetHR = isTriage 
            ? Math.floor(Math.random() * (136 - 122 + 1)) + 122
            : Math.floor(Math.random() * (115 - 105 + 1)) + 105;
          const targetSPO2 = isTriage 
            ? Math.floor(Math.random() * (87 - 82 + 1)) + 82
            : Math.floor(Math.random() * (94 - 91 + 1)) + 91;
          const targetBP = isTriage 
            ? (Math.random() > 0.5 ? "142/96" : "138/92")
            : (Math.random() > 0.5 ? "128/84" : "124/80");

          return { hr: targetHR, spo2: targetSPO2, bp: targetBP };
        });
      }, 1500);
    } else {
      setVitals({ hr: 74, spo2: 99, bp: "120/80" });
      clearInterval(vitalIntervalRef.current);
    }

    return () => clearInterval(vitalIntervalRef.current);
  }, [victimState]);

  // SLA countdown timer
  useEffect(() => {
    if (slaActive && slaTimeLeft > 0) {
      slaIntervalRef.current = setInterval(() => {
        setSlaTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (slaActive && slaTimeLeft === 0) {
      // SLA EXPIRED - TRIGGER AUTO-ESCALATION
      triggerEscalation();
    }

    return () => clearInterval(slaIntervalRef.current);
  }, [slaActive, slaTimeLeft]);

  // Auto-scroll family chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [familyMessages]);

  // STAGE 1: Radial Countdown Effect
  useEffect(() => {
    if (victimState === 'countdown') {
      setRadialProgress(100);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            triggerActiveSOS();
            return 3;
          }
          return prev - 1;
        });
      }, 1000);

      // Smooth progress decrease
      const progressTimer = setInterval(() => {
        setRadialProgress(prev => Math.max(prev - (100 / 60), 0));
      }, 50);

      return () => {
        clearInterval(countdownIntervalRef.current);
        clearInterval(progressTimer);
      };
    }
  }, [victimState]);

  // Action: Launch SOS Countdown
  const startSOSCountdown = () => {
    setCountdown(3);
    setRadialProgress(100);
    setVictimState('countdown');
    addLog("Victim initiated SOS beacon trigger. 3-second countdown buffer active.", "warning");
  };

  // Action: Abort Countdown
  const abortSOS = () => {
    setVictimState('idle');
    clearInterval(countdownIntervalRef.current);
    addLog("Victim aborted SOS countdown. Beacon deactivated.", "info");
  };

  // Action: Trigger Active Triage (State 2)
  const triggerActiveSOS = (customPayload = null) => {
    setVictimState('triage');
    setActiveIncidentsCount(1);
    
    const payload = customPayload || {
      victimName: "Alex Mercer (You)",
      bloodType: "A+",
      chronicConditions: "None Specified",
      gcsScore: "GCS 14 (Confused)",
      heartRate: 128,
      spo2: 85,
      bp: "140/94",
      coords: "37.7749° N, 122.4194° W",
      severity: "CRITICAL",
      aiDiagnosis: "Trauma suspected. Elevated heart rate and hypoxic respiratory threat detected.",
      timestamp: new Date().toLocaleTimeString()
    };

    setActiveIncident(payload);
    setActiveHospitalIndex(0);
    setSlaTimeLeft(30);
    setSlaActive(true);
    setFamilyAlerted(true);
    setEscalatedCount(0);

    // Alert Family Message Feed
    setFamilyMessages([
      { sender: 'system', text: '🚨 ROAD SAFETY BEACON INITIATED 🚨', time: 'Just Now' },
      { sender: 'system', text: `GPS coordinates locked at: ${payload.coords}`, time: 'Just now' },
      { sender: 'family', text: 'Alex! Oh my god, the system just alerted me. Are you okay? Did you crash?', time: 'Just now' },
      { sender: 'system', text: 'Establishing real-time vital telemetry streams with trauma command...', time: 'Just now' }
    ]);

    addLog(`Emergency broadcasted to nearest 10 hospitals via WebSocket protocols.`, "warning");
    addLog(`AI Tele-Diagnostics: Severity assessed as CRITICAL (SpO2: ${payload.spo2}%, HR: ${payload.heartRate} BPM)`, "danger");
    addLog(`Routing to Primary Command: ${HOSPITALS_DATA[0].name}. Starting 30s SLA countdown.`, "warning");
  };

  // Action: Escalate Incident to next hospital
  const triggerEscalation = () => {
    const nextIndex = activeHospitalIndex + 1;
    clearInterval(slaIntervalRef.current);

    if (nextIndex < HOSPITALS_DATA.length) {
      addLog(`SLA EXPIRED: ${HOSPITALS_DATA[activeHospitalIndex].name} bypassed. Auto-escalating request.`, "danger");
      setActiveHospitalIndex(nextIndex);
      setSlaTimeLeft(30);
      setSlaActive(true);
      setEscalatedCount(prev => prev + 1);
      
      // Update family chat about the delay/reroute
      setFamilyMessages(prev => [
        ...prev,
        { 
          sender: 'system', 
          text: `🔄 Rerouting dispatch request: Escaled to ${HOSPITALS_DATA[nextIndex].name} due to SLA timeout.`, 
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) 
        }
      ]);

      addLog(`Routing incident to Backup Command: ${HOSPITALS_DATA[nextIndex].name}. Starting new 30s SLA.`, "warning");
    } else {
      // Loop back or fallback to national emergency dispatcher
      addLog(`CRITICAL FAILURE: All primary trauma facilities bypassed. Initiating National Trauma Fallback Protocol.`, "danger");
      setActiveHospitalIndex(0);
      setSlaTimeLeft(30);
      setSlaActive(true);
      setEscalatedCount(0);
      
      setFamilyMessages(prev => [
        ...prev,
        { sender: 'system', text: `⚠️ Alerting central backup units. Standby.`, time: 'Just Now' }
      ]);
    }
  };

  // Action: Reject/Pass manually
  const handleRejectPass = () => {
    addLog(`MANUAL PASS: ${HOSPITALS_DATA[activeHospitalIndex].name} declined incident. Moving to next triage point.`, "danger");
    triggerEscalation();
  };

  // Action: Accept Dispatch (State 3 Handshake)
  const handleAcceptDispatch = () => {
    setVictimState('handshake');
    setSlaActive(false);
    setActiveIncidentsCount(0);
    
    // Decrement bed count of the accepting hospital
    HOSPITALS_DATA[activeHospitalIndex].bedsCount = Math.max(HOSPITALS_DATA[activeHospitalIndex].bedsCount - 1, 0);
    setAvailableBedsTotal(prev => Math.max(prev - 1, 0));

    // Update family chat
    setFamilyMessages(prev => [
      ...prev,
      { 
        sender: 'system', 
        text: `✅ DISPATCH CONFIRMED: ${HOSPITALS_DATA[activeHospitalIndex].name} accepted the dispatch.`, 
        time: 'Just Now' 
      },
      { 
        sender: 'system', 
        text: `🚑 Ambulance Unit ALS-09 deployed. ETA: ${HOSPITALS_DATA[activeHospitalIndex].eta} mins (${HOSPITALS_DATA[activeHospitalIndex].distance} km).`, 
        time: 'Just Now' 
      },
      { 
        sender: 'family', 
        text: `Thank goodness! I am driving straight to St. Jude right now. Hold on, Alex!`, 
        time: 'Just Now' 
      }
    ]);

    addLog(`DISPATCH LOCKED: Handshake established with ${HOSPITALS_DATA[activeHospitalIndex].name}.`, "success");
    addLog(`Telemetry link secured. Relaying live telemetry feed to incoming Ambulance Unit ALS-09.`, "success");
  };

  // Simulator Triggers
  const simulateCriticalAccident = () => {
    addLog("💥 SIMULATION INITIATED: Critical High-G Crash Sensor Triggered.", "danger");
    
    const payload = {
      victimName: "John Doe (Simulated Crash)",
      bloodType: "O-Negative",
      chronicConditions: "Diabetic (Type 1)",
      gcsScore: "GCS 9 (Severe)",
      heartRate: 138,
      spo2: 82,
      bp: "148/98",
      coords: "37.7699° N, 122.4468° W",
      severity: "IMMEDIATE CODE RED",
      aiDiagnosis: "Severe trauma. Multi-system shock, high impact G-Force (14.2G) recorded. Extreme hypoxic respiratory distress.",
      timestamp: new Date().toLocaleTimeString()
    };

    triggerActiveSOS(payload);
  };

  const simulateSuccessHandshake = () => {
    if (victimState !== 'triage') {
      addLog("Cannot simulate success handshake - no active emergency in progress.", "warning");
      return;
    }
    addLog("⚡ SIMULATION INITIATED: Automated Remote Dispatch Confirmed.", "success");
    handleAcceptDispatch();
  };

  const simulateTimeout = () => {
    if (victimState !== 'triage') {
      addLog("Cannot simulate timeout - no active emergency in progress.", "warning");
      return;
    }
    addLog("⏰ SIMULATION INITIATED: Fast-Forwarding 30s SLA Timeout.", "warning");
    triggerEscalation();
  };

  const resetAll = () => {
    clearInterval(countdownIntervalRef.current);
    clearInterval(slaIntervalRef.current);
    clearInterval(vitalIntervalRef.current);
    
    setVictimState('idle');
    setCountdown(3);
    setRadialProgress(100);
    setActiveIncident(null);
    setActiveHospitalIndex(0);
    setSlaTimeLeft(30);
    setSlaActive(false);
    setEscalatedCount(0);
    setFamilyAlerted(false);
    setFamilyMessages([]);
    setVitals({ hr: 72, spo2: 98, bp: "120/80" });
    setActiveIncidentsCount(0);
    setAvailableBedsTotal(23);
    
    // Reset bed count in mock array
    HOSPITALS_DATA[0].bedsCount = 3;
    HOSPITALS_DATA[1].bedsCount = 1;
    HOSPITALS_DATA[2].bedsCount = 11;
    HOSPITALS_DATA[3].bedsCount = 8;

    addLog("Simulation cleared. System state restored to Tactical Monitoring Standby.", "info");
  };

  // Send Chat message
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setFamilyMessages(prev => [
      ...prev,
      { sender: 'user', text: chatInput, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
    ]);
    
    const userMsg = chatInput;
    setChatInput('');

    // Auto simulated relative response
    setTimeout(() => {
      if (victimState === 'triage') {
        setFamilyMessages(prev => [
          ...prev,
          { sender: 'family', text: "I'm looking at your live vitals. Breathe slowly. Help is coming!", time: 'Just now' }
        ]);
      } else if (victimState === 'handshake') {
        setFamilyMessages(prev => [
          ...prev,
          { sender: 'family', text: "I just called the hospital, they are ready for you. See you there in 15 mins!", time: 'Just now' }
        ]);
      }
    }, 1500);
  };

  // Current Active Hospital
  const currentHospital = HOSPITALS_DATA[activeHospitalIndex];

  return (
    <div className="min-h-screen w-full bg-[#0B0F19] tactical-grid scanline relative text-slate-100 p-4 font-sans select-none flex flex-col justify-between">
      
      {/* GLOWING HEADLINES HEADER */}
      <header className="w-full flex items-center justify-between border-b border-slate-800 pb-3 mb-4 bg-slate-950/70 p-3 rounded-xl backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-red-600/25 border border-red-500/50 flex items-center justify-center pulse-ring-active">
            <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-wider text-slate-100 flex items-center gap-2">
              Road<span className="text-red-500 text-glow-crimson font-black">SOS</span>
              <span className="text-[10px] bg-red-950/80 text-red-400 border border-red-800 px-2 py-0.5 rounded uppercase font-mono tracking-widest">
                TACTICAL CAD v3.8
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">Telemetry Link: Secure • Host Node: active-websocket-node</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-md">
            <Wifi className="h-4 w-4 text-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono text-slate-300">WEBSOCKET: CONNECTED</span>
          </div>
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-md">
            <Cpu className="h-4 w-4 text-red-500" />
            <span className="text-[11px] font-mono text-slate-300">AI AGENT STATE: NOMINAL</span>
          </div>
        </div>
      </header>

      {/* THREE-COLUMN GRID VIEWPORT */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-grow">
        
        {/* ========================================================
            LEFT COLUMN: VICTIM APP VIEWPORT (iPhone Chassis Wrapper)
            ======================================================== */}
        <section className="lg:col-span-3 flex flex-col items-center justify-center p-2">
          {/* IPHONE CASING */}
          <div className="w-[330px] h-[670px] bg-slate-950 rounded-[48px] border-8 border-slate-800 shadow-2xl relative overflow-hidden flex flex-col p-3 ring-1 ring-slate-700/50">
            {/* iPhone Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-5 w-32 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-between px-6">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-900"></div>
              <div className="h-1.5 w-8 rounded-full bg-slate-900"></div>
            </div>
            
            {/* Screen Inner Container */}
            <div className="flex-grow rounded-[38px] overflow-hidden bg-slate-950 flex flex-col relative">
              
              {/* iPhone Header Status Bar */}
              <div className="h-8 px-5 flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 z-20 bg-slate-950">
                <span>09:41</span>
                <div className="flex items-center gap-1.5">
                  <Wifi className="h-3 w-3" />
                  <span className="text-[10px]">5G</span>
                  <div className="h-2.5 w-5 border border-slate-500 rounded-sm p-[1px] flex items-center">
                    <div className="h-full w-4/5 bg-slate-300 rounded-2xs"></div>
                  </div>
                </div>
              </div>

              {/* SCREEN INTERACTIVE LIFE CYCLE */}
              <div className="flex-grow flex flex-col p-4 justify-between relative z-10">
                
                {/* STATE 0: IDLE SCREEN */}
                {victimState === 'idle' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-grow flex flex-col justify-between h-full"
                  >
                    {/* App Branding */}
                    <div className="text-center pt-2">
                      <div className="inline-flex p-2 bg-red-950/50 border border-red-900/60 rounded-xl mb-1">
                        <ShieldAlert className="h-6 w-6 text-red-500 animate-pulse" />
                      </div>
                      <h2 className="text-lg font-bold text-white uppercase tracking-wider">RoadSOS Mobile</h2>
                      <p className="text-[11px] text-slate-400 font-mono">Immediate Crash & Trauma Dispatch</p>
                    </div>

                    {/* Patient Card Preview */}
                    <div className="bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-2xl flex flex-col gap-2.5 shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-white">Alex Mercer</h4>
                          <span className="text-[10px] text-slate-400 font-mono">PROFILE LINKED • DEVICE ID #9822</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-2.5">
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                          <span className="block text-[8px] text-slate-400 font-mono uppercase">Blood Type</span>
                          <span className="text-sm font-bold text-red-400">A+ Positive</span>
                        </div>
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                          <span className="block text-[8px] text-slate-400 font-mono uppercase">Allergies</span>
                          <span className="text-xs font-bold text-slate-300 truncate">None Registered</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono px-1">
                        <span className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-emerald-500" /> Vitals Sync (72 BPM)
                        </span>
                        <span className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-emerald-500" /> GPS Locked
                        </span>
                      </div>
                    </div>

                    {/* Action SOS Button */}
                    <div className="flex flex-col items-center gap-3 pb-8">
                      <button 
                        onClick={startSOSCountdown}
                        className="h-36 w-36 rounded-full bg-gradient-to-br from-red-600 to-red-900 border-4 border-slate-950 shadow-[0_0_40px_rgba(239,68,68,0.4)] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 group pulse-ring-active relative"
                      >
                        <AlertOctagon className="h-10 w-10 text-white animate-bounce" />
                        <span className="text-white text-xs font-black tracking-widest mt-1.5 uppercase">
                          TRIGGER
                        </span>
                        <span className="text-red-200 text-[10px] font-bold font-mono tracking-wider">
                          SOS
                        </span>
                      </button>
                      <span className="text-[10px] text-red-500/80 font-bold uppercase tracking-widest font-mono text-glow-crimson animate-pulse">
                        HOLD OR TAP IN EMERGENCY
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* STATE 1: 3-SECOND RADIAL COUNTDOWN */}
                {victimState === 'countdown' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-grow flex flex-col justify-between items-center py-6"
                  >
                    <div className="text-center">
                      <h2 className="text-lg font-bold text-red-500 text-glow-crimson uppercase tracking-widest">
                        TRANSMITTING SOS
                      </h2>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">Acquiring high-priority satellite link...</p>
                    </div>

                    {/* Radial Countdown Circle */}
                    <div className="relative h-48 w-48 flex items-center justify-center">
                      {/* Background SVG Circle */}
                      <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle 
                          cx="50" cy="50" r="45" 
                          stroke="#1E293B" strokeWidth="6" 
                          fill="transparent" 
                        />
                        <circle 
                          cx="50" cy="50" r="45" 
                          stroke="#EF4444" strokeWidth="6" 
                          fill="transparent" 
                          strokeDasharray="283"
                          strokeDashoffset={283 - (283 * radialProgress) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      {/* Countdown text inside */}
                      <div className="z-10 flex flex-col items-center">
                        <span className="text-6xl font-black text-white font-mono leading-none tracking-tighter">
                          {countdown}
                        </span>
                        <span className="text-[9px] text-slate-400 tracking-widest uppercase font-mono mt-1">SECONDS</span>
                      </div>
                    </div>

                    <button 
                      onClick={abortSOS}
                      className="px-8 py-3 rounded-full bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold tracking-widest hover:bg-slate-800 transition-colors uppercase cursor-pointer"
                    >
                      ABORT SOS
                    </button>
                  </motion.div>
                )}

                {/* STATE 2: ACTIVE TRIAGE */}
                {victimState === 'triage' && activeIncident && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-grow flex flex-col justify-between h-full pb-5"
                  >
                    {/* Live Broadcast Header */}
                    <div className="bg-red-950/70 border border-red-900/60 p-2 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest font-mono">
                          BROADCASTING SOS FEED
                        </span>
                      </div>
                      <span className="text-[9px] bg-red-900/80 px-1.5 py-0.5 rounded font-mono text-red-200">
                        P1 DISPATCH
                      </span>
                    </div>

                    {/* Mini SVG Live Map Visualization */}
                    <div className="h-32 w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden relative shadow-inner">
                      <div className="absolute inset-0 opacity-15">
                        <div className="w-full h-full bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:12px_12px]"></div>
                      </div>
                      
                      {/* Grid Roads */}
                      <svg className="w-full h-full absolute inset-0 text-slate-800/40" viewBox="0 0 100 100">
                        <line x1="10" y1="0" x2="10" y2="100" stroke="currentColor" strokeWidth="0.5" />
                        <line x1="40" y1="0" x2="40" y2="100" stroke="currentColor" strokeWidth="0.5" />
                        <line x1="70" y1="0" x2="70" y2="100" stroke="currentColor" strokeWidth="0.5" />
                        <line x1="0" y1="30" x2="100" y2="30" stroke="currentColor" strokeWidth="0.5" />
                        <line x1="0" y1="70" x2="100" y2="70" stroke="currentColor" strokeWidth="0.5" />
                      </svg>
                      
                      {/* Victim Pulsing Radar */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <span className="flex h-5 w-5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                        </span>
                      </div>

                      {/* Map Coordinate overlay */}
                      <div className="absolute bottom-1 right-2 bg-slate-950/80 border border-slate-800 px-1.5 py-0.5 rounded text-[8px] font-mono text-slate-400">
                        GPS: {activeIncident.coords}
                      </div>
                    </div>

                    {/* Vitals Telemetry Tracker */}
                    <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500 animate-pulse" />
                        <div>
                          <span className="block text-[8px] text-slate-400 uppercase font-mono">Heart Rate</span>
                          <span className="text-sm font-bold text-white font-mono">{vitals.hr} BPM</span>
                        </div>
                      </div>
                      <div className="h-6 w-12 border-r border-slate-800"></div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-amber-500" />
                        <div>
                          <span className="block text-[8px] text-slate-400 uppercase font-mono">SpO2 level</span>
                          <span className={`text-sm font-bold font-mono ${vitals.spo2 < 90 ? 'text-red-500 animate-pulse text-glow-crimson' : 'text-amber-500'}`}>
                            {vitals.spo2}%
                          </span>
                        </div>
                      </div>
                      <div className="h-6 w-12 border-r border-slate-800"></div>
                      <div className="flex items-center gap-1.5">
                        <div>
                          <span className="block text-[8px] text-slate-400 uppercase font-mono">BP</span>
                          <span className="text-sm font-bold text-slate-300 font-mono">{vitals.bp}</span>
                        </div>
                      </div>
                    </div>

                    {/* Triage Live Operations Feed */}
                    <div className="flex-grow flex flex-col gap-1.5 overflow-y-auto max-h-40 my-2 px-1">
                      <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-mono">
                        <Check className="h-3.5 w-3.5 bg-emerald-950 border border-emerald-800 rounded-full p-0.5 flex-shrink-0" />
                        <span>High-G Sensor triggers resolved</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-mono">
                        <Check className="h-3.5 w-3.5 bg-emerald-950 border border-emerald-800 rounded-full p-0.5 flex-shrink-0" />
                        <span>Relaying coordinates via WebSockets</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-amber-400 font-mono">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping flex-shrink-0"></div>
                        <span>Awaiting trauma Command acceptance...</span>
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono border-t border-slate-900 pt-1 mt-1">
                        Active SLA Target: <span className="text-amber-400">{currentHospital.name}</span>
                      </div>
                    </div>

                    <button 
                      onClick={resetAll}
                      className="w-full py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-bold font-mono tracking-widest rounded-lg transition-colors uppercase mt-auto"
                    >
                      ABORT BEACON
                    </button>
                  </motion.div>
                )}

                {/* STATE 3: ACCEPTED HANDSHAKE */}
                {victimState === 'handshake' && activeIncident && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-grow flex flex-col justify-between h-full pb-5"
                  >
                    {/* Connection Locked Header */}
                    <div className="bg-emerald-950/70 border border-emerald-900/60 p-2.5 rounded-xl flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-full bg-emerald-900/80 border border-emerald-600/50 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-extrabold text-white tracking-wider uppercase">HANDSHAKE ACCEPTED</h4>
                        <span className="text-[8px] text-emerald-400 font-mono uppercase tracking-widest">Telemetry Link Secured</span>
                      </div>
                    </div>

                    {/* Success Map with Path tracing */}
                    <div className="h-40 w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden relative shadow-inner my-2">
                      <div className="absolute inset-0 opacity-15">
                        <div className="w-full h-full bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:12px_12px]"></div>
                      </div>
                      
                      {/* Live SVG routing map */}
                      <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
                        {/* Hospital Grid */}
                        <line x1="20" y1="0" x2="20" y2="100" stroke="#1E293B" strokeWidth="0.8" />
                        <line x1="50" y1="0" x2="50" y2="100" stroke="#1E293B" strokeWidth="0.8" />
                        <line x1="80" y1="0" x2="80" y2="100" stroke="#1E293B" strokeWidth="0.8" />
                        <line x1="0" y1="30" x2="100" y2="30" stroke="#1E293B" strokeWidth="0.8" />
                        <line x1="0" y1="70" x2="100" y2="70" stroke="#1E293B" strokeWidth="0.8" />
                        
                        {/* Dispatch ambulance path */}
                        <path 
                          d={`M ${currentHospital.x / 4} ${currentHospital.y / 4} L 50 30 L 50 50`}
                          fill="none" 
                          stroke="#10B981" 
                          strokeWidth="2.5" 
                          strokeDasharray="4 2" 
                          className="animate-shimmer"
                        />

                        {/* Blinking Hospital Pin */}
                        <circle cx={currentHospital.x / 4} cy={currentHospital.y / 4} r="3" fill="#10B981" />
                        
                        {/* Blinking Victim Pin */}
                        <g transform="translate(50, 50)">
                          <circle cx="0" cy="0" r="6" fill="#EF4444" className="animate-ping opacity-60" />
                          <circle cx="0" cy="0" r="3" fill="#EF4444" />
                        </g>

                        {/* Moving Ambulance dot */}
                        <g className="animate-pulse">
                          <circle cx="50" cy="40" r="3" fill="#10B981" />
                        </g>
                      </svg>
                      
                      <div className="absolute top-1.5 right-1.5 bg-slate-900/90 px-2 py-0.5 rounded text-[8px] font-mono text-emerald-400 border border-emerald-800">
                        UNIT ALS-09 EN ROUTE
                      </div>
                    </div>

                    {/* Hospital Info & ETA Info Card */}
                    <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block text-[8px] text-slate-400 uppercase font-mono">Responding Facility</span>
                          <span className="text-xs font-bold text-white tracking-wide">{currentHospital.name}</span>
                        </div>
                        <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded font-bold font-mono">
                          {currentHospital.distance} km
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-2">
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-900 flex flex-col justify-center items-center">
                          <Clock className="h-4 w-4 text-emerald-500 mb-0.5" />
                          <span className="text-[8px] text-slate-400 font-mono uppercase">ETA</span>
                          <span className="text-sm font-black text-white">{currentHospital.eta} MINS</span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-900 flex flex-col justify-center items-center">
                          <Phone className="h-4 w-4 text-emerald-500 mb-0.5" />
                          <span className="text-[8px] text-slate-400 font-mono uppercase">Trauma Desk</span>
                          <span className="text-[10px] font-bold text-slate-300 truncate w-full text-center">
                            {currentHospital.phone}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Vitals Stabilization Tracker */}
                    <div className="mt-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Heart className="h-3 w-3 text-red-500 animate-pulse" />
                        <span>{vitals.hr} BPM</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Activity className="h-3 w-3 text-emerald-400" />
                        <span>SpO2: {vitals.spo2}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Navigation className="h-3 w-3 text-emerald-400 animate-bounce" />
                        <span>GPS locked</span>
                      </div>
                    </div>

                    <button 
                      onClick={resetAll}
                      className="w-full py-2 bg-emerald-950 border border-emerald-800 hover:bg-emerald-900 text-emerald-300 hover:text-white text-[10px] font-bold font-mono tracking-widest rounded-lg transition-colors uppercase mt-2"
                    >
                      RESET INCIDENT
                    </button>
                  </motion.div>
                )}

              </div>
            </div>
            
            {/* iPhone Home Indicator Button */}
            <div className="h-1 w-28 bg-slate-700 rounded-full mx-auto mt-2"></div>
          </div>
        </section>

        {/* ========================================================
            CENTER COLUMN: HOSPITAL LIVE COMMAND CONSOLE (Desktop CAD)
            ======================================================== */}
        <section className="lg:col-span-6 flex flex-col gap-4">
          
          {/* STATS COUNTDOWN DASHBOARD OVERVIEW */}
          <div className="grid grid-cols-3 gap-4">
            {/* Stat 1: Total Beds */}
            <div className="glass-panel p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between relative overflow-hidden">
              <div className="z-10">
                <span className="block text-[10px] text-slate-400 font-mono uppercase tracking-wider">AVAILABLE BEDS</span>
                <span className="text-2xl font-black text-white font-mono tracking-tight text-glow-emerald">
                  {availableBedsTotal} <span className="text-xs text-slate-500">/ 60</span>
                </span>
                <span className="block text-[9px] text-emerald-400 font-mono mt-1">SYSTEM CAPACITY SAFE</span>
              </div>
              <Layers className="h-10 w-10 text-emerald-500/10 absolute right-2 top-1/2 transform -translate-y-1/2" />
            </div>

            {/* Stat 2: Active Incidents */}
            <div className="glass-panel p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between relative overflow-hidden">
              <div className="z-10">
                <span className="block text-[10px] text-slate-400 font-mono uppercase tracking-wider">ACTIVE INCIDENTS</span>
                <span className={`text-2xl font-black font-mono tracking-tight ${activeIncidentsCount > 0 ? 'text-red-500 animate-pulse text-glow-crimson' : 'text-slate-300'}`}>
                  {activeIncidentsCount}
                </span>
                <span className="block text-[9px] text-slate-500 font-mono mt-1">
                  {activeIncidentsCount > 0 ? 'DISPATCH CYCLE ACTIVE' : 'MONITORING CHANNELS'}
                </span>
              </div>
              <AlertTriangle className={`h-10 w-10 absolute right-2 top-1/2 transform -translate-y-1/2 ${activeIncidentsCount > 0 ? 'text-red-500/15' : 'text-slate-800/20'}`} />
            </div>

            {/* Stat 3: Avg Response Latency */}
            <div className="glass-panel p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between relative overflow-hidden">
              <div className="z-10">
                <span className="block text-[10px] text-slate-400 font-mono uppercase tracking-wider">AVG SYSTEM RESPONSE</span>
                <span className="text-2xl font-black text-slate-300 font-mono tracking-tight">
                  {avgLatency} <span className="text-xs text-slate-500">ms</span>
                </span>
                <span className="block text-[9px] text-emerald-400 font-mono mt-1">SLA ADHERENCE: 100%</span>
              </div>
              <TrendingUp className="h-10 w-10 text-slate-700/25 absolute right-2 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>

          {/* MAIN RADAR GRAPHICS & LIVE DISPATCH TICKET GRID */}
          <div className="flex-grow glass-panel rounded-2xl border border-slate-800/60 overflow-hidden flex flex-col p-4 relative min-h-[510px]">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-ping"></div>
                <h3 className="text-sm font-bold text-white tracking-widest uppercase">
                  TRAUMA TRIAGE PIPELINE & LOCAL RADAR
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                BROADCAST TARGETS: {HOSPITALS_DATA.length} FACILITIES CONNECTED
              </span>
            </div>

            {/* RADAR MAP VISUALIZATION PANEL */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-grow items-stretch">
              
              {/* Radar Live Map SVG Representation */}
              <div className="md:col-span-7 rounded-xl bg-slate-950 border border-slate-900 relative overflow-hidden flex items-center justify-center p-2 min-h-[220px]">
                <div className="absolute inset-0 radar-bg-sweep opacity-20 pointer-events-none"></div>
                
                <svg className="w-full h-full min-h-[200px]" viewBox="0 0 400 400">
                  {/* Grid Lines */}
                  <line x1="50" y1="0" x2="50" y2="400" stroke="#1E293B" strokeWidth="0.5" />
                  <line x1="150" y1="0" x2="150" y2="400" stroke="#1E293B" strokeWidth="0.5" />
                  <line x1="250" y1="0" x2="250" y2="400" stroke="#1E293B" strokeWidth="0.5" />
                  <line x1="350" y1="0" x2="350" y2="400" stroke="#1E293B" strokeWidth="0.5" />
                  <line x1="0" y1="50" x2="400" y2="50" stroke="#1E293B" strokeWidth="0.5" />
                  <line x1="0" y1="150" x2="400" y2="150" stroke="#1E293B" strokeWidth="0.5" />
                  <line x1="0" y1="250" x2="400" y2="250" stroke="#1E293B" strokeWidth="0.5" />
                  <line x1="0" y1="350" x2="400" y2="350" stroke="#1E293B" strokeWidth="0.5" />

                  {/* Concentric rings */}
                  <circle cx="200" cy="200" r="180" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="1" />
                  <circle cx="200" cy="200" r="130" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                  <circle cx="200" cy="200" r="70" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 4" />

                  {/* Hospitals Render */}
                  {HOSPITALS_DATA.map((hosp, idx) => {
                    const isActive = victimState === 'triage' && idx === activeHospitalIndex;
                    const isAccepted = victimState === 'handshake' && idx === activeHospitalIndex;
                    return (
                      <g key={hosp.id}>
                        {/* Pulse Ring if Active */}
                        {isActive && (
                          <circle 
                            cx={hosp.x} 
                            cy={hosp.y} 
                            r="16" 
                            fill="none" 
                            stroke={hosp.color} 
                            strokeWidth="1.5" 
                            className="animate-ping" 
                            style={{ transformOrigin: `${hosp.x}px ${hosp.y}px` }} 
                          />
                        )}
                        {/* Hospital Circle Dot */}
                        <circle 
                          cx={hosp.x} 
                          cy={hosp.y} 
                          r={isActive || isAccepted ? "9" : "6"} 
                          fill={isAccepted ? "#10B981" : hosp.color} 
                          className={`${isActive ? 'animate-pulse' : ''}`}
                        />
                        <text 
                          x={hosp.x + 12} 
                          y={hosp.y + 4} 
                          fill={isActive ? "#FFF" : "#94A3B8"} 
                          fontSize="9.5" 
                          fontWeight={isActive ? "bold" : "normal"}
                          fontFamily="sans-serif"
                        >
                          H{hosp.id}: {hosp.name.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}

                  {/* Triage active connecting laser line from victim to active hospital */}
                  {victimState === 'triage' && (
                    <line 
                      x1="200" y1="200" 
                      x2={currentHospital.x} y2={currentHospital.y} 
                      stroke="#F59E0B" 
                      strokeWidth="2.5" 
                      strokeDasharray="6 3" 
                      className="animate-shimmer"
                    />
                  )}

                  {/* Handshake Route Locked Line */}
                  {victimState === 'handshake' && (
                    <path 
                      d={`M 200 200 L ${currentHospital.x} ${currentHospital.y}`}
                      fill="none" 
                      stroke="#10B981" 
                      strokeWidth="3" 
                      strokeDasharray="4 2"
                    />
                  )}

                  {/* Victim Node in the center */}
                  {victimState !== 'idle' ? (
                    <g transform="translate(200, 200)">
                      <circle cx="0" cy="0" r="22" fill="none" stroke="#EF4444" strokeWidth="1" className="animate-ping" />
                      <circle cx="0" cy="0" r="12" fill="rgba(239, 68, 68, 0.15)" stroke="#EF4444" strokeWidth="1.5" />
                      <circle cx="0" cy="0" r="6" fill="#EF4444" />
                      <text x="12" y="3" fill="#EF4444" fontSize="10" fontWeight="black" fontFamily="sans-serif" className="text-glow-crimson animate-pulse">
                        VICTIM LOCKED
                      </text>
                    </g>
                  ) : (
                    <g transform="translate(200, 200)">
                      <circle cx="0" cy="0" r="5" fill="#475569" />
                      <text x="10" y="3" fill="#475569" fontSize="9" fontFamily="sans-serif">STANDBY BEACON</text>
                    </g>
                  )}
                </svg>

                {/* Radar Grid overlay metrics */}
                <div className="absolute top-2 left-2 bg-slate-950/80 border border-slate-900 rounded p-1.5 text-[8.5px] font-mono text-slate-400 leading-tight">
                  <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">TELE-LOCK GRID</span>
                  <span className="block">ANTENNA: SECURE GRID-SAT4</span>
                  <span className="block">AZIMUTH: 288.42° RAD</span>
                </div>
              </div>

              {/* LIVE DISPATCH TICKETS CORE PANEL */}
              <div className="md:col-span-5 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {victimState === 'triage' && activeIncident ? (
                    <motion.div 
                      key="active-incident-card"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="rounded-xl border border-red-500 bg-red-950/20 glow-crimson flex flex-col h-full overflow-hidden"
                    >
                      {/* Ticket Header */}
                      <div className="bg-gradient-to-r from-red-950 to-red-900 border-b border-red-800/80 p-3 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                          <AlertOctagon className="h-4.5 w-4.5 text-red-500 animate-pulse" />
                          <span className="text-xs font-black tracking-widest font-mono uppercase">
                            INCOMING MEDICAL DISPATCH
                          </span>
                        </div>
                        <span className="text-[10px] bg-red-600/35 border border-red-500 text-white font-bold px-2 py-0.5 rounded font-mono uppercase animate-pulse">
                          CRITICAL
                        </span>
                      </div>

                      {/* Ticket Content */}
                      <div className="p-3.5 flex-grow flex flex-col justify-between gap-3 text-slate-200">
                        {/* Patient Profile */}
                        <div className="bg-slate-950/80 border border-slate-900 rounded-lg p-2.5">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">Patient Identity</span>
                            <span className="text-[9px] text-red-400 font-mono tracking-wider">MAPPED PROFILE</span>
                          </div>
                          <h4 className="text-sm font-bold text-white leading-none mb-1">
                            {activeIncident.victimName}
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 mt-2">
                            <span>BLOOD: <strong className="text-red-400">{activeIncident.bloodType}</strong></span>
                            <span>CONDITIONS: <strong className="text-slate-300">{activeIncident.chronicConditions}</strong></span>
                            <span>GCS: <strong className="text-slate-300">{activeIncident.gcsScore}</strong></span>
                          </div>
                        </div>

                        {/* Diagnostics & AI assessment */}
                        <div className="bg-slate-950/80 border border-slate-900 rounded-lg p-2.5">
                          <span className="block text-[8px] text-slate-500 uppercase font-mono tracking-wider mb-1">
                            AI DIAGNOSTICS STREAM
                          </span>
                          <p className="text-[11px] text-red-300 leading-tight">
                            {activeIncident.aiDiagnosis}
                          </p>
                        </div>

                        {/* Real-Time Live Vitals Mirror */}
                        <div className="bg-slate-950/80 border border-slate-900 rounded-lg p-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Heart className="h-4 w-4 text-red-500 animate-heartbeat" />
                              <div>
                                <span className="block text-[8px] text-slate-500 uppercase font-mono">Pulse Rate</span>
                                <span className="text-xs font-black text-white font-mono">{vitals.hr} BPM</span>
                              </div>
                            </div>
                            <div className="h-6 w-px bg-slate-800"></div>
                            <div className="flex items-center gap-1.5">
                              <Activity className="h-4 w-4 text-amber-500 animate-pulse" />
                              <div>
                                <span className="block text-[8px] text-slate-500 uppercase font-mono">SpO2 Feed</span>
                                <span className="text-xs font-black text-amber-400 font-mono">{vitals.spo2}%</span>
                              </div>
                            </div>
                            <div className="h-6 w-px bg-slate-800"></div>
                            <div>
                              <span className="block text-[8px] text-slate-500 uppercase font-mono">BP Telemetry</span>
                              <span className="text-xs font-black text-slate-300 font-mono">{vitals.bp}</span>
                            </div>
                          </div>
                        </div>

                        {/* SLA TIMER METRIC */}
                        <div className="bg-slate-950/80 border border-slate-900 rounded-lg p-2.5">
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1.5">
                            <span>QUEUE TARGET: <strong className="text-white text-glow-amber">{currentHospital.name}</strong></span>
                            <span className="text-amber-400 font-bold flex items-center gap-1 animate-pulse">
                              <Clock className="h-3.5 w-3.5" /> {slaTimeLeft}s LEFT
                            </span>
                          </div>
                          
                          {/* SLA Progress Bar */}
                          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div 
                              className={`h-full transition-all duration-1000 ${
                                slaTimeLeft < 10 
                                  ? 'bg-gradient-to-r from-red-500 to-red-700 animate-pulse' 
                                  : 'bg-gradient-to-r from-amber-500 to-amber-600'
                              }`}
                              style={{ width: `${(slaTimeLeft / 30) * 100}%` }}
                            />
                          </div>
                          {escalatedCount > 0 && (
                            <span className="block text-[9px] text-red-400 font-mono mt-1 uppercase tracking-wider text-glow-crimson font-semibold animate-pulse">
                              ⚠️ ESCALATION DETECTED: {escalatedCount} PRIMARY HOP(S) PASSED
                            </span>
                          )}
                        </div>

                        {/* COMMAND ACTION BUTTONS */}
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <button 
                            onClick={handleRejectPass}
                            className="py-2.5 bg-red-950/60 border border-red-800 hover:bg-red-900 text-red-200 text-xs font-bold font-mono tracking-widest rounded-lg transition-all uppercase cursor-pointer"
                          >
                            REJECT / PASS
                          </button>
                          
                          <button 
                            onClick={handleAcceptDispatch}
                            className="py-2.5 bg-emerald-600 border border-emerald-500 hover:bg-emerald-500 hover:scale-[1.02] text-white text-xs font-black tracking-widest rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] uppercase cursor-pointer flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="h-4.5 w-4.5 animate-bounce" /> ACCEPT DISPATCH
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : victimState === 'handshake' && activeIncident ? (
                    <motion.div 
                      key="handshake-locked-card"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-xl border border-emerald-500 bg-emerald-950/15 glow-emerald flex flex-col h-full overflow-hidden p-4 justify-between text-slate-200 gap-4"
                    >
                      <div className="text-center pt-2">
                        <div className="inline-flex p-3 bg-emerald-900/60 border border-emerald-600/50 rounded-full mb-2">
                          <CheckCircle2 className="h-8 w-8 text-emerald-400 animate-bounce" />
                        </div>
                        <h3 className="text-base font-black text-white uppercase tracking-widest">
                          DISPATCH CONFIRMED
                        </h3>
                        <p className="text-[11px] text-emerald-400 font-mono mt-1">Telemetry feed established. Responding unit deployed.</p>
                      </div>

                      <div className="bg-slate-950/80 border border-slate-900 rounded-lg p-3 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-slate-500 font-mono uppercase">Primary Trauma Site</span>
                          <span className="text-[9px] text-emerald-400 font-mono">CONNECTED</span>
                        </div>
                        <span className="text-sm font-bold text-white">{currentHospital.name}</span>
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-400">
                          <span>DISTANCE: <strong className="text-white">{currentHospital.distance} km</strong></span>
                          <span>ETA: <strong className="text-white">{currentHospital.eta} mins</strong></span>
                        </div>
                      </div>

                      <div className="bg-slate-950/80 border border-slate-900 rounded-lg p-3 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                        <span>ALS Unit Dispatch ID:</span>
                        <span className="text-white font-bold">#ALS-09-TRAUMA</span>
                      </div>

                      <button 
                        onClick={resetAll}
                        className="w-full py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold font-mono tracking-widest rounded-lg transition-colors uppercase cursor-pointer"
                      >
                        CLOSE ACTIVE TELE-LINK
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="standby-card"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-center flex flex-col items-center justify-center h-full min-h-[350px]"
                    >
                      <Tv className="h-10 w-10 text-slate-600 mb-3 animate-pulse" />
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5">
                        AWAITING TACTICAL INCIDENTS
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs font-mono">
                        No trauma beacons are currently active. WebSocket listeners are broadcasting telemetry.
                      </p>
                      
                      <div className="mt-4 flex items-center gap-1.5 px-3 py-1 bg-slate-950 rounded-full border border-slate-800">
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">NETWORK BROADCAST SAFE</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* LIVE HOSPITAL CAPACITY LIST GRID AT THE BOTTOM */}
            <div className="mt-4 border-t border-slate-800 pt-3">
              <h4 className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2 font-mono">
                REGIONAL TRAUMA NETWORKS TELEMETRY STATUS
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {HOSPITALS_DATA.map((hosp, idx) => {
                  const isActive = victimState === 'triage' && idx === activeHospitalIndex;
                  const isAccepted = victimState === 'handshake' && idx === activeHospitalIndex;
                  return (
                    <div 
                      key={hosp.id} 
                      className={`p-2 rounded-lg border transition-all duration-300 ${
                        isAccepted 
                          ? 'border-emerald-500 bg-emerald-950/20 glow-emerald' 
                          : isActive 
                            ? 'border-amber-500 bg-amber-950/15 glow-amber animate-pulse' 
                            : 'border-slate-900 bg-slate-950/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold text-white truncate max-w-[100px]">
                          {hosp.name.split(' ')[0]} {hosp.name.split(' ')[1] === 'Trauma' ? 'Trauma' : ''}
                        </span>
                        <span 
                          className="h-1.5 w-1.5 rounded-full" 
                          style={{ backgroundColor: isAccepted ? '#10B981' : hosp.color }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                        <span>Beds: <strong className="text-white">{hosp.bedsCount} Avail</strong></span>
                        <span>{hosp.latency}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================
            RIGHT COLUMN: FAMILY PHONE VIEWPORT & HACKATHON LIVE CONTROLS
            ======================================================== */}
        <section className="lg:col-span-3 flex flex-col gap-4">
          
          {/* FAMILY DEVICE STREAM (iPhone Chassis Simulation) */}
          <div className="w-full glass-panel border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${familyAlerted ? 'bg-red-500 animate-ping' : 'bg-slate-700'}`}></div>
                <h3 className="text-xs font-bold text-white tracking-widest uppercase">
                  FAMILY EMERGENCY LINK
                </h3>
              </div>
              <span className="text-[9px] bg-slate-900 text-slate-400 px-2 py-0.5 border border-slate-850 rounded font-mono">
                {familyAlerted ? 'ALERT BROADCASTED' : 'STANDBY'}
              </span>
            </div>

            {familyAlerted ? (
              <div className="flex flex-col flex-grow gap-2.5 h-[210px] justify-between">
                {/* Active Message Feed Container */}
                <div 
                  ref={chatScrollRef}
                  className="flex-grow overflow-y-auto max-h-40 bg-slate-950/80 border border-slate-900 rounded-lg p-2.5 flex flex-col gap-2 shadow-inner"
                >
                  {familyMessages.map((msg, index) => {
                    const isSystem = msg.sender === 'system';
                    const isUser = msg.sender === 'user';
                    return (
                      <div 
                        key={index}
                        className={`flex flex-col max-w-[85%] ${
                          isSystem 
                            ? 'self-center w-full text-center' 
                            : isUser 
                              ? 'self-end items-end' 
                              : 'self-start items-start'
                        }`}
                      >
                        {isSystem ? (
                          <span className="text-[9px] font-mono py-1 px-2 rounded-md bg-slate-900/60 border border-slate-850 text-amber-400 tracking-tight leading-normal my-0.5">
                            {msg.text}
                          </span>
                        ) : (
                          <>
                            <span className="text-[8px] font-mono text-slate-500 mb-0.5">
                              {isUser ? 'You (Alex)' : 'Spouse (Sarah)'} • {msg.time}
                            </span>
                            <div className={`px-2.5 py-1.5 rounded-xl text-[10.5px] leading-relaxed shadow-sm ${
                              isUser 
                                ? 'bg-emerald-600 text-white rounded-tr-none' 
                                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-750'
                            }`}>
                              {msg.text}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Chat input box */}
                <form onSubmit={handleSendChat} className="flex gap-1.5 mt-auto">
                  <input 
                    type="text" 
                    placeholder="Type urgent update..." 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-grow bg-slate-950 border border-slate-850 text-[11px] font-mono text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-red-500/80 transition-colors"
                  />
                  <button 
                    type="submit"
                    className="px-3 bg-red-950/70 border border-red-800 hover:bg-red-900 text-red-400 hover:text-white rounded-lg text-[10px] font-mono font-bold transition-all uppercase cursor-pointer"
                  >
                    SEND
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-3">
                <Bell className="h-8 w-8 text-slate-700 mb-2 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  FAMILY STREAM SLEEPING
                </span>
                <p className="text-[9.5px] text-slate-500 font-mono mt-1 max-w-[200px]">
                  Family is automatically alerted via high-urgency SMS override when the accident beacon goes hot.
                </p>
              </div>
            )}
          </div>

          {/* HACKATHON LIVE CONTROL PANEL */}
          <div className="glass-panel border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3 relative">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <div className="h-4 w-4 bg-amber-500/10 border border-amber-500/50 rounded flex items-center justify-center">
                <Play className="h-2.5 w-2.5 text-amber-500 animate-pulse" />
              </div>
              <h3 className="text-xs font-bold text-white tracking-widest uppercase">
                HACKATHON DEMO CONTROL
              </h3>
            </div>

            <div className="flex flex-col gap-2 flex-grow">
              <button 
                onClick={simulateCriticalAccident}
                className="w-full py-2.5 bg-gradient-to-r from-red-950 to-red-800 border border-red-500/60 hover:from-red-900 hover:to-red-700 text-white text-xs font-black tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.25)] flex items-center justify-center gap-1.5 uppercase cursor-pointer"
              >
                <AlertTriangle className="h-4 w-4 animate-bounce" /> Simulate G-Crash Sensor
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={simulateTimeout}
                  disabled={victimState !== 'triage'}
                  className={`py-2 px-1 border rounded-lg text-[9.5px] font-bold font-mono tracking-wider transition-all uppercase cursor-pointer flex flex-col items-center justify-center gap-1 leading-tight ${
                    victimState === 'triage'
                      ? 'border-amber-500/50 bg-amber-950/30 text-amber-400 hover:bg-amber-900/40'
                      : 'border-slate-850 bg-slate-900/20 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Clock className="h-4 w-4" /> Trigger SLA Timeout
                </button>

                <button 
                  onClick={simulateSuccessHandshake}
                  disabled={victimState !== 'triage'}
                  className={`py-2 px-1 border rounded-lg text-[9.5px] font-bold font-mono tracking-wider transition-all uppercase cursor-pointer flex flex-col items-center justify-center gap-1 leading-tight ${
                    victimState === 'triage'
                      ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/40'
                      : 'border-slate-850 bg-slate-900/20 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" /> Simulate Acceptance
                </button>
              </div>

              <button 
                onClick={resetAll}
                className="w-full py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white text-[10px] font-black tracking-widest rounded-lg transition-all uppercase cursor-pointer flex items-center justify-center gap-1.5 mt-1"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset CAD simulation
              </button>
            </div>

            {/* LIVE OPERATIONS TELEMETRY LOGGER */}
            <div className="border-t border-slate-800 pt-2 mt-auto">
              <span className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1 font-mono">
                TELEMETRY STREAMS LOG
              </span>
              <div className="h-28 overflow-y-auto bg-slate-950 rounded-lg p-2 font-mono text-[9px] leading-tight flex flex-col gap-1 border border-slate-900">
                {logs.map((log, index) => (
                  <div key={index} className="flex gap-1.5">
                    <span className="text-slate-600 flex-shrink-0">[{log.time}]</span>
                    <span className={
                      log.type === 'danger' ? 'text-red-400 text-glow-crimson font-semibold' :
                      log.type === 'warning' ? 'text-amber-400' :
                      log.type === 'success' ? 'text-emerald-400 text-glow-emerald' :
                      'text-slate-400'
                    }>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* FOOTER METRICS AND TECH TAGS */}
      <footer className="w-full mt-4 pt-2 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-slate-500 gap-2 bg-slate-950/30 p-2 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>ROADSOS CENTRAL CORE PIPELINE ACTIVE</span>
        </div>
        <div className="flex items-center gap-4">
          <span>REACT 19 • TAILWIND v4 • FRAMER MOTION • LUCIDE</span>
          <span className="hidden sm:inline">• SECURED BY AES-256 DISPATCH KEYS</span>
        </div>
      </footer>

    </div>
  );
}
