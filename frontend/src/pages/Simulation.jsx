import { useEffect, useState, useRef } from "react";
import "./Simulation.css";
import { runFloodSimulation } from "../services/api";

const getRiskFromProbability = (p) => {
  if (p < 0.3) return "LOW";
  if (p < 0.5) return "MODERATE";
  if (p < 0.7) return "HIGH";
  return "CRITICAL";
};

const getColorFromProbability = (p) => {
  if (p < 0.3) return "#22c55e";
  if (p < 0.5) return "#facc15";
  if (p < 0.7) return "#f97316";
  return "#ef4444";
};

export default function Simulation({ initialCity = null }) {
  const [timeline, setTimeline] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [muted, setMuted] = useState(false);
  const [baseInput, setBaseInput] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [useSimulationMode, setUseSimulationMode] = useState(false);
  const [sandboxProbability, setSandboxProbability] = useState(60);
  const [sandboxDuration, setSandboxDuration] = useState(24);

  const canvasRef = useRef(null);
  const levelRef = useRef(0);
  const targetLevelRef = useRef(0);

  const audioCtxRef = useRef(null);
  const rainRef = useRef(null);
  const rainGainRef = useRef(null);
  const warningRef = useRef(null);
  const warningGainRef = useRef(null);

  useEffect(() => {
    if (initialCity) {
      // Use prediction data from the multi-city scan
      setSandboxProbability(Math.round(initialCity.probability * 100));
      setUseSimulationMode(true);
    } else {
      // Fall back to localStorage for standalone simulation
      const saved = localStorage.getItem("latestSimulationInput");
      if (saved) {
        try {
          setBaseInput(JSON.parse(saved));
          setUseSimulationMode(false);
        } catch (e) {
          setBaseInput(null);
        }
      }
    }
  }, [initialCity]);

  useEffect(() => {
    resizeCanvas();
    const handleResize = () => resizeCanvas();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!playing || !timeline.length) return undefined;

    const id = setInterval(() => {
      setCurrentStep((s) => {
        if (s >= timeline.length - 1) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 1200);

    return () => clearInterval(id);
  }, [playing, timeline]);

  const ensureAudio = async () => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = Ctx ? new Ctx() : null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const stopRain = () => {
    try {
      if (rainRef.current) rainRef.current.stop();
    } catch (e) {
      // ignore
    }
    if (rainGainRef.current) rainGainRef.current.disconnect();
    rainRef.current = null;
    rainGainRef.current = null;
  };

  const stopWarning = () => {
    try {
      if (warningRef.current) warningRef.current.stop();
    } catch (e) {
      // ignore
    }
    if (warningGainRef.current) warningGainRef.current.disconnect();
    warningRef.current = null;
    warningGainRef.current = null;
  };

  const stopAllSound = () => {
    stopRain();
    stopWarning();
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const width = parent.clientWidth;
    const height = 360;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    drawFrame(levelRef.current, 0);
  };

  const drawFrame = (level, probability) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.clientWidth;
    const height = canvas.clientHeight || 360;
    ctx.clearRect(0, 0, width, height);

    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, "#0b132b");
    bgGrad.addColorStop(1, "#0f172a");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const color = getColorFromProbability(probability || level);
    const waterHeight = Math.max(0, Math.min(1, level)) * height;
    ctx.fillStyle = color;
    ctx.fillRect(0, height - waterHeight, width, waterHeight);

    ctx.fillStyle = "rgba(255,255,255,0.18)";
    for (let i = 1; i <= 5; i += 1) {
      const y = height - (height * i) / 6;
      ctx.fillRect(0, y, width, 1);
    }
  };

  const startRain = async (level) => {
    const ctx = await ensureAudio();
    if (!ctx || muted) return;

    stopRain();
    const bufferSize = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * 0.22;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800 + level * 600;

    const gain = ctx.createGain();
    gain.gain.value = level;

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start();

    rainRef.current = noise;
    rainGainRef.current = gain;
  };

  const startWarning = async () => {
    const ctx = await ensureAudio();
    if (!ctx || muted) return;

    stopWarning();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = 880;
    gain.gain.value = 0.06;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    warningRef.current = osc;
    warningGainRef.current = gain;
  };

  const updateSound = (risk, prob) => {
    if (muted) {
      stopAllSound();
      return;
    }

    const rainLevel = Math.min(0.9, Math.max(0.08, prob));
    startRain(rainLevel);

    if (risk === "CRITICAL") {
      startWarning();
    } else {
      stopWarning();
    }
  };

  useEffect(() => {
    if (!playing) {
      stopAllSound();
      return undefined;
    }
    const current = timeline[currentStep];
    if (!current) {
      stopAllSound();
      return undefined;
    }
    const prob = Number(current.probability) || 0;
    const risk = getRiskFromProbability(prob);
    updateSound(risk, prob);

    return () => undefined;
  }, [timeline, currentStep, muted, playing]);

  useEffect(() => () => stopAllSound(), []);

  useEffect(() => {
    const target = Math.min(1, Math.max(0, Number(timeline[currentStep]?.probability) || 0));
    targetLevelRef.current = target;
    let raf;
    const tick = () => {
      const current = levelRef.current;
      const next = current + (targetLevelRef.current - current) * 0.08;
      levelRef.current = Math.abs(next - targetLevelRef.current) < 0.001 ? targetLevelRef.current : next;
      drawFrame(levelRef.current, targetLevelRef.current);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [timeline, currentStep]);

  const handleRun = async () => {
    if (useSimulationMode) {
      setLoading(true);
      setError(null);
      setTimeline([]);
      setCurrentStep(0);
      setPlaying(false);

      try {
        await ensureAudio();
        const list = generateSandboxTimeline(sandboxProbability, sandboxDuration);
        setTimeline(list);
        setCurrentStep(0);
        setPlaying(list.length > 0);
      } catch (err) {
        stopAllSound();
        setError(err.message || "Simulation failed.");
      } finally {
        setLoading(false);
      }
    } else {
      if (!baseInput) {
        setError("Provide inputs via the Custom tab before running the simulation.");
        return;
      }

      setLoading(true);
      setError(null);
      setTimeline([]);
      setCurrentStep(0);
      setPlaying(false);

      try {
        await ensureAudio();
        const res = await runFloodSimulation(baseInput);
        const seq = res.timeline || res;
        const list = Array.isArray(seq) ? seq : [];
        setTimeline(list);
        setCurrentStep(0);
        setPlaying(list.length > 0);
      } catch (err) {
        stopAllSound();
        setError(err.message || "Simulation failed.");
      } finally {
        setLoading(false);
      }
    }
  };

  const togglePlay = () => {
    if (!timeline.length) return;
    setPlaying((p) => !p);
  };

  const generateSandboxTimeline = (prob, hours) => {
    const timeline = [];
    const probDecimal = Math.min(1, Math.max(0, prob / 100));
    for (let h = 0; h < hours; h += 1) {
      const variation = Math.sin((h / hours) * Math.PI) * 0.15;
      const hourProb = Math.min(1, Math.max(0, probDecimal + (Math.random() - 0.5) * 0.1 + variation));
      timeline.push({
        hour: h,
        probability: hourProb,
        risk_state: getRiskFromProbability(hourProb).toUpperCase()
      });
    }
    return timeline;
  };

  const current = timeline[currentStep] || null;
  const probability = current ? Number(current.probability) || 0 : 0;
  const riskState = getRiskFromProbability(probability);
  const riskColor = getColorFromProbability(probability);

  return (
    <div className="simulation-container">
      <div className="sim-header">
        <div>
          <h2>Flood Simulation</h2>
          <p>Choose between ML prediction or sandbox demo mode to visualize flood dynamics.</p>
        </div>
        <div className="sim-actions">
          <button className="action-button" onClick={handleRun} disabled={loading || (!useSimulationMode && !baseInput)}>
            {loading ? "Simulating..." : "Run Simulation"}
          </button>
          <button className="action-button" onClick={togglePlay} disabled={!timeline.length}>
            {playing ? "Pause" : "Play"}
          </button>
          <button
            className={`mute-button ${muted ? "muted" : ""}`}
            onClick={() => {
              setMuted((m) => !m);
              if (!muted) stopAllSound();
            }}
          >
            {muted ? "Unmute" : "Mute"}
          </button>
        </div>
      </div>

      <div className="sim-mode-selector">
        <label className="mode-toggle">
          <input
            type="checkbox"
            checked={useSimulationMode}
            onChange={(e) => {
              setUseSimulationMode(e.target.checked);
              setTimeline([]);
              setCurrentStep(0);
              setPlaying(false);
              stopAllSound();
            }}
          />
          <span className="toggle-label">{useSimulationMode ? "Sandbox Mode" : "ML Prediction Mode"}</span>
        </label>
      </div>

      {useSimulationMode && (
        <div className="sandbox-inputs">
          <div className="sandbox-input-group">
            <label>Flood Probability (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={sandboxProbability}
              onChange={(e) => setSandboxProbability(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
            />
          </div>
          <div className="sandbox-input-group">
            <label>Duration (hours)</label>
            <input
              type="number"
              min="1"
              max="168"
              value={sandboxDuration}
              onChange={(e) => setSandboxDuration(Math.max(1, Math.min(168, parseInt(e.target.value) || 24)))}
            />
          </div>
        </div>
      )}

      {!baseInput && (
        <div className="sim-warning">Enter values in the Custom tab and run a prediction to enable simulation.</div>
      )}
      {error && <div className="sim-error">{error}</div>}

      <div className="sim-visual-panel">
        <div className="water-column">
          <canvas ref={canvasRef} style={{ width: "100%", height: "360px" }} />
          <div className="water-overlay">
            <div className="metric">Hour {current ? current.hour : "-"}</div>
            <div className="metric">Probability {(probability * 100).toFixed(1)}%</div>
            <div className="metric risk-label" style={{ color: riskColor }}>{riskState}</div>
          </div>
        </div>

        <div className="timeline-panel">
          <div className="timeline-header">
            <h4>Timeline</h4>
            {timeline.length > 0 && (
              <span className="timeline-meta">{timeline.length} hours</span>
            )}
          </div>
          <div className="timeline-list">
            {timeline.length === 0 && (
              <div className="timeline-empty">Run the simulation to see hourly probabilities.</div>
            )}
            {timeline.map((step, idx) => (
              <div key={idx} className={`timeline-row ${idx === currentStep ? "active" : ""}`}>
                <span className="timeline-hour">Hour {step.hour}</span>
                <span className="timeline-prob">{(Number(step.probability) * 100).toFixed(1)}%</span>
                <span className={`risk-chip ${String(step.risk_state || "").toLowerCase()}`}>
                  {step.risk_state}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
