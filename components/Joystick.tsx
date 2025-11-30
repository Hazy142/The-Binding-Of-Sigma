import React, { useRef, useState, useEffect } from 'react';
import { Vector2 } from '../types';

interface JoystickProps {
  onMove: (vector: Vector2) => void;
  color?: string;
  label?: string;
}

const Joystick: React.FC<JoystickProps> = ({ onMove, color = 'white', label }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const touchId = useRef<number | null>(null);

  const RADIUS = 40; // Max distance for knob visual
  const SIZE = 120; // Container size

  const handleStart = (clientX: number, clientY: number, id: number | null) => {
    if (active) return;
    touchId.current = id;
    setActive(true);
    updatePosition(clientX, clientY);
  };

  const handleMove = (clientX: number, clientY: number) => {
    updatePosition(clientX, clientY);
  };

  const handleEnd = () => {
    setActive(false);
    touchId.current = null;
    setPosition({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  };

  const updatePosition = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let x = dx;
    let y = dy;

    // Clamp visual knob
    if (distance > RADIUS) {
      x = (dx / distance) * RADIUS;
      y = (dy / distance) * RADIUS;
    }

    setPosition({ x, y });
    
    // Normalize output -1 to 1 based on RADIUS interaction range
    // We allow pulling slightly past radius for full 1.0 magnitude
    const inputX = Math.max(-1, Math.min(1, dx / RADIUS));
    const inputY = Math.max(-1, Math.min(1, dy / RADIUS));
    
    onMove({ x: inputX, y: inputY });
  };

  // Event Listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      // Find the first changed touch
      const touch = e.changedTouches[0];
      handleStart(touch.clientX, touch.clientY, touch.identifier);
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!active) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId.current) {
          handleMove(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
          break;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        if (!active) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchId.current) {
                handleEnd();
                break;
            }
        }
    };

    // Mouse fallbacks for testing on desktop
    const onMouseDown = (e: MouseEvent) => {
      handleStart(e.clientX, e.clientY, null);
    };
    const onMouseMove = (e: MouseEvent) => {
        if (active && touchId.current === null) {
            handleMove(e.clientX, e.clientY);
        }
    };
    const onMouseUp = () => {
        if (active && touchId.current === null) {
            handleEnd();
        }
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: false });
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [active]);

  return (
    <div 
      ref={containerRef}
      className={`relative rounded-full border-2 backdrop-blur-md transition-opacity duration-200 ${active ? 'opacity-90 bg-white/10' : 'opacity-40 bg-black/20'}`}
      style={{ 
        width: SIZE + 'px', 
        height: SIZE + 'px', 
        borderColor: color,
        touchAction: 'none'
      }}
    >
        {/* Center Indicator/Label */}
        {label && <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white font-bold opacity-50 text-[10px] tracking-widest">{label}</div>}
        
        {/* Knob */}
        <div 
            className="absolute rounded-full shadow-lg"
            style={{
                width: (SIZE / 2.5) + 'px',
                height: (SIZE / 2.5) + 'px',
                backgroundColor: color,
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
                pointerEvents: 'none'
            }}
        />
    </div>
  );
};

export default Joystick;