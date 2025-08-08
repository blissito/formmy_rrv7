import { useRef, useEffect, useState } from "react";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
}

export const ColorPicker = ({ color, onChange, onClose }: ColorPickerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hexInput, setHexInput] = useState(color);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create a single smooth circle with proper color wheel
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= radius) {
          const angle = Math.atan2(dy, dx);
          const hue = (angle * 180 / Math.PI + 360) % 360;
          const saturation = distance / radius;
          const lightness = 0.5;
          
          const rgb = hslToRgb(hue / 360, saturation, lightness);
          
          const index = (y * canvas.width + x) * 4;
          data[index] = rgb[0];     // Red
          data[index + 1] = rgb[1]; // Green
          data[index + 2] = rgb[2]; // Blue
          data[index + 3] = 255;    // Alpha
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }, []);
  
  const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };
  
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radius = Math.min(centerX, centerY) - 10;
    
    // Only handle clicks within the circle
    if (distance <= radius) {
      // Calculate hue from angle
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const hue = (angle + 360) % 360;
      
      // Calculate saturation from distance to center
      const saturation = Math.min((distance / radius) * 100, 100);
      const lightness = 50;
      
      // Convert to hex
      const hex = hslToHex(hue, saturation, lightness);
      setHexInput(hex);
      onChange(hex);
    }
  };
  
  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHexInput(value);
    
    // Validate hex format and update if valid
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (hexRegex.test(value)) {
      onChange(value);
    }
  };
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={200}
          height={200}
          onClick={handleCanvasClick}
          className="cursor-pointer"
        />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 justify-center">
          <div 
            className="w-6 h-6 border rounded"
            style={{ backgroundColor: color }}
          />
          <input
            type="text"
            value={hexInput}
            onChange={handleHexInputChange}
            className="text-sm px-2 py-1 border rounded w-24 text-center"
            placeholder="#000000"
            maxLength={7}
          />
        </div>
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};