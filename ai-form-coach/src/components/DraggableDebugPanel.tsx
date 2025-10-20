"use client";
import { useState, useRef, useEffect } from 'react';

interface DraggableDebugPanelProps {
  isVisible: boolean;
  onClose: () => void;
  onShow: () => void;
  engineReady: boolean;
  videoDimensions: string;
  landmarkCount: number;
  visibilityScore: number;
  fps: number;
  running: boolean;
}

export default function DraggableDebugPanel({
  isVisible,
  onClose,
  onShow,
  engineReady,
  videoDimensions,
  landmarkCount,
  visibilityScore,
  fps,
  running
}: DraggableDebugPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start dragging if clicking on buttons
    const target = e.target as HTMLElement;
    if (!target.closest('button') && panelRef.current) {
      e.preventDefault();
      setIsDragging(true);
      const rect = panelRef.current.getBoundingClientRect();
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && panelRef.current) {
        // Convert to absolute positioning when dragging starts
        panelRef.current.style.position = 'fixed';
        panelRef.current.style.zIndex = '9999';
        
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Keep panel within viewport bounds
        const maxX = window.innerWidth - panelRef.current.offsetWidth;
        const maxY = window.innerHeight - panelRef.current.offsetHeight;
        
        panelRef.current.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
        panelRef.current.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
        panelRef.current.style.right = 'auto';
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Reset to relative positioning when dragging ends
      if (panelRef.current) {
        panelRef.current.style.position = 'relative';
        panelRef.current.style.zIndex = '30';
        panelRef.current.style.left = 'auto';
        panelRef.current.style.top = 'auto';
        panelRef.current.style.right = 'auto';
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  if (isVisible) {
    return (
      <div
        ref={panelRef}
        className={`relative z-30 bg-black bg-opacity-75 text-white p-2 rounded text-sm select-none border border-gray-600 mt-2 ${
          isDragging ? 'cursor-grabbing' : 'cursor-move'
        }`}
        style={{
          minWidth: '200px'
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="debug-header flex items-center gap-2 mb-2 pb-2 border-b border-gray-600">
          <span className="font-bold">Debug Mode</span>
          <button 
            onClick={onClose}
            className="text-xs bg-red-600 px-2 py-1 rounded hover:bg-red-700 ml-auto"
          >
            Hide
          </button>
        </div>
        <div className="space-y-1">
          <div>Pose Engine: {engineReady ? 'Ready' : 'Not Ready'}</div>
          <div>Video: {videoDimensions}</div>
          <div>Landmarks: {landmarkCount}</div>
          <div>Visibility: {visibilityScore.toFixed(2)}</div>
          <div>FPS: {fps || 0}</div>
          <div>Running: {running ? 'Yes' : 'No'}</div>
        </div>
        <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-600">
          Drag anywhere to move • Buttons still work
        </div>
      </div>
    );
  }

  return (
    <button 
      onClick={onShow}
      className="fixed top-4 left-4 z-30 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
    >
      Debug
    </button>
  );
}
