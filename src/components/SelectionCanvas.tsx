import { useEffect, useRef, MouseEvent, useState } from 'react';
import { SelectionCanvasProps } from '../types.d';

const SelectionCanvas = ({
  width,
  height,
  currDescription,
  updateCoords,
  filterItems,
}: SelectionCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>();
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>();
  const [rect, setRect] = useState<DOMRect | null>();

  const [x1, setX1] = useState<number>();
  const [x2, setX2] = useState<number>();
  const [y1, setY1] = useState<number>();
  const [y2, setY2] = useState<number>();

  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isEnded, setIsEnded] = useState<boolean>(false);

  const [description, setDescription] = useState<string>('');

  useEffect(() => {
    setDescription(currDescription);
  }, []);

  useEffect(() => {
    setCanvas(canvasRef.current);
  }, [canvasRef]);

  useEffect(() => {
    setCtx(canvas?.getContext('2d'));
    setRect(canvas?.getBoundingClientRect());
  }, [canvas]);

  const startRect = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isStarted && rect) {
      setX1((e.clientX - rect.left) / rect.width);
      setY1((e.clientY - rect.top) / rect.height);
      setIsAnimating(true);
      setIsStarted(true);
    }
  };

  const animateRect = (e: MouseEvent<HTMLCanvasElement>) => {
    if (isAnimating && ctx && canvas && rect) {
      ctx.strokeStyle = '#bf4f45';
      ctx.lineWidth = 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setX2((e.clientX - rect.left) / rect.width);
      setY2((e.clientY - rect.top) / rect.height);
      // Scale rectangle with canvas dimensions & draw using integers
      if (x1 && x2 && y1 && y2) {
        ctx.strokeRect(
          Math.round(x1 * canvas.width),
          Math.round(y1 * canvas.height),
          Math.round(x2 * canvas.width) - Math.round(x1 * canvas.width),
          Math.round(y2 * canvas.height) - Math.round(y1 * canvas.height)
        );
      }
    }
  };

  const endRect = (e: MouseEvent<HTMLCanvasElement>) => {
    setIsAnimating(false);
    setIsEnded(true);
    if (!isEnded && ctx && canvas && rect) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setX2((e.clientX - rect.left) / rect.width);
      setY2((e.clientY - rect.top) / rect.height);
      if (x1 && x2 && y1 && y2) {
        ctx.strokeRect(
          Math.round(x1 * canvas.width),
          Math.round(y1 * canvas.height),
          Math.round(x2 * canvas.width) - Math.round(x1 * canvas.width),
          Math.round(y2 * canvas.height) - Math.round(y1 * canvas.height)
        );
      }
      updateCoords(x1, x2, y1, y2);
    }
  };

  const [isRemoved, setIsRemoved] = useState<boolean>(false);

  const handleRemoval = (description: string) => {
    setIsRemoved(true);
    filterItems(description);
  };

  return (
    <div
      className="selection-canvas"
      style={{
        display: isRemoved ? 'none' : 'auto',
        pointerEvents: isEnded ? 'none' : 'auto',
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={(e) => startRect(e)}
        onMouseMove={(e) => animateRect(e)}
        onMouseUp={(e) => endRect(e)}
        width={width}
        height={height}
      ></canvas>

      {isEnded && (
        <button
          onClick={() => handleRemoval(description)}
          style={{
            top: y1 ? `${(y1 * 100).toString()}%` : 0,
            left: x1 ? `${(x1 * 100).toString()}%` : 0,
          }}
        >
          X
        </button>
      )}
    </div>
  );
};

export default SelectionCanvas;
