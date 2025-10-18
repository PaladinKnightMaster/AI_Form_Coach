"use client";
import { type Landmark3D } from '@/lib/pose/engine';
import React, { useEffect, useRef, useCallback } from 'react';
import { getCurrentDepthConfig, getDepthMetricsTracker } from '@/lib/pose/depthOptimization';

// Enhanced skeleton connections for Sword Health style
const EDGES: [number, number][] = [
	// Upper body
	[11, 12], // shoulders
	[11, 13], [13, 15], // left arm
	[12, 14], [14, 16], // right arm
	[11, 23], [12, 24], // torso
	[23, 24], // hips
	
	// Lower body
	[23, 25], [25, 27], [27, 29], [29, 31], // left leg
	[24, 26], [26, 28], [28, 30], [30, 32], // right leg
	
	// Additional connections for better skeleton visualization
	[0, 1], [1, 2], [2, 3], [3, 7], // face
	[0, 4], [4, 5], [5, 6], [6, 8], // face
];

const LEFT_INDICES = new Set([11,13,15,23,25,27]);
const RIGHT_INDICES = new Set([12,14,16,24,26,28]);

interface PoseOverlayProps {
  landmarks?: Landmark3D[] | null; // Made optional since we use landmarksRef
  landmarksRef?: React.MutableRefObject<Landmark3D[] | null>;
  video: HTMLVideoElement | null;
  mirror?: boolean;
  labels?: boolean;
  showConfidence?: boolean;
  highlightJoints?: number[];
  corrections?: Array<{
    joint: string;
    position: { x: number; y: number };
    message: string;
  }>;
  debug?: boolean; // Add debug mode for troubleshooting
}

function PoseOverlayComponent({ 
  landmarksRef,
  video, 
  mirror = false, 
  labels = false,
  showConfidence = false,
  highlightJoints = [],
  corrections = [],
  debug = false
}: PoseOverlayProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number | undefined>(undefined);
	
	// 🚀 PERFORMANCE: Cache sorted arrays to avoid re-sorting every frame
	const lastZValuesRef = useRef<number[]>([]);
	const cachedSortedEdgesRef = useRef<[number, number][]>([]);
	const cachedSortedJointsRef = useRef<number[]>([]);
	
	// 🏥 PHASE D: Depth rendering optimization
	const depthConfigRef = useRef(getCurrentDepthConfig());
	const depthMetricsRef = useRef(getDepthMetricsTracker());
	const sortStartTimeRef = useRef<number>(0);
	
	// Continuous animation loop for smooth skeleton updates
	const animate = useCallback(() => {
		const canvas = canvasRef.current; 
		if (!canvas || !video) {
			animationRef.current = requestAnimationFrame(animate);
			return;
		}
		
		// 🏥 PHASE B: Mark render start time
		const renderStartTime = performance.now();
		
		const ctx = canvas.getContext('2d'); 
		if (!ctx) {
			animationRef.current = requestAnimationFrame(animate);
			return;
		}
		
		// Update canvas size to match video display
		const displayWidth = video.clientWidth;
		const displayHeight = video.clientHeight;
		
		// Ensure we have valid dimensions
		if (displayWidth <= 0 || displayHeight <= 0) {
			animationRef.current = requestAnimationFrame(animate);
			return;
		}
		
		// Only update canvas size if it changed to avoid unnecessary redraws
		if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
			canvas.width = displayWidth;
			canvas.height = displayHeight;
		}
		
		// Use landmarksRef for immediate updates (no React state dependency)
		const currentLandmarks = landmarksRef?.current;
		
		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		// If no landmarks, continue animation loop but don't draw
		if (!currentLandmarks || currentLandmarks.length === 0) {
			// Debug: Show "No pose detected" message
			if (debug) {
				ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
				ctx.font = 'bold 16px system-ui';
				ctx.fillText('No pose detected', 10, 30);
			}
			animationRef.current = requestAnimationFrame(animate);
			return;
		}
		
		// Debug: Show landmark count and visibility info
		if (debug) {
			const visibleLandmarks = currentLandmarks.filter(lm => lm && lm.visibility > 0.3).length;
			const avgVisibility = currentLandmarks.reduce((sum, lm) => sum + (lm?.visibility || 0), 0) / currentLandmarks.length;
			
			ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
			ctx.font = 'bold 14px system-ui';
			ctx.fillText(`Landmarks: ${visibleLandmarks}/${currentLandmarks.length}`, 10, 30);
			ctx.fillText(`Avg Visibility: ${avgVisibility.toFixed(2)}`, 10, 50);
			ctx.fillText(`Canvas: ${canvas.width}x${canvas.height}`, 10, 70);
		}
		
		ctx.save();
		
		// ✅ CRITICAL FIX: Mirror coordinates when video is mirrored
		// MediaPipe returns coordinates in original video space (0-1)
		// When video has scaleX(-1), we must mirror the x-coordinates
		
		// 🚀 PERFORMANCE: Check if Z-values changed significantly before re-sorting
		// This avoids expensive Array.sort on every frame
		const currentZValues = currentLandmarks.map(lm => lm?.z || 0);
		let needsResort = false;
		
		if (lastZValuesRef.current.length !== currentZValues.length) {
			needsResort = true;
		} else {
			// Check if any Z-value changed by more than 0.05 (5cm in normalized space)
			for (let i = 0; i < currentZValues.length; i++) {
				if (Math.abs(currentZValues[i] - lastZValuesRef.current[i]) > 0.05) {
					needsResort = true;
					break;
				}
			}
		}
		
		// 🏥 PHASE 2.4: Sort edges and joints by Z-depth for proper occlusion
		// Back-to-front rendering for natural 3D appearance
		let sortedEdges: [number, number][];
		
		if (needsResort || cachedSortedEdgesRef.current.length === 0) {
			// 🏥 PHASE D: Only sort if depth rendering is enabled
			if (depthConfigRef.current.enableDepthSorting) {
				sortStartTimeRef.current = performance.now();
				
				sortedEdges = [...EDGES].sort((edgeA, edgeB) => {
					const [a1, b1] = edgeA;
					const [a2, b2] = edgeB;
					const p1 = currentLandmarks[a1];
					const p2 = currentLandmarks[b1];
					const p3 = currentLandmarks[a2];
					const p4 = currentLandmarks[b2];
					if (!p1 || !p2 || !p3 || !p4) return 0;
					// Average Z for each edge (higher Z = further from camera)
					const z1 = (p1.z + p2.z) / 2;
					const z2 = (p3.z + p4.z) / 2;
					return z2 - z1; // Sort back to front (higher Z first)
				});
				
				// 🏥 PHASE D: Track sort performance
				const sortDuration = performance.now() - sortStartTimeRef.current;
				depthMetricsRef.current.recordSort(sortDuration);
				
				cachedSortedEdgesRef.current = sortedEdges;
				lastZValuesRef.current = currentZValues;
			} else {
				// 🏥 PHASE D: Use unsorted edges if depth disabled
				sortedEdges = EDGES;
				depthMetricsRef.current.recordCacheMiss();
			}
		} else {
			// 🚀 PERFORMANCE: Use cached sorted arrays (saves ~5-10ms per frame)
			sortedEdges = cachedSortedEdgesRef.current;
			depthMetricsRef.current.recordCacheHit();
		}
		
		// 🏥 Draw skeleton edges with Sword Health clinical style + depth
		for (const [a, b] of sortedEdges) {
			const p1 = currentLandmarks[a]; 
			const p2 = currentLandmarks[b]; 
			
			// Skip if landmarks don't exist or have low visibility
			if (!p1 || !p2 || p1.visibility < 0.3 || p2.visibility < 0.3) continue;
			
			// Check if edge is highlighted (error or active)
			const isHighlighted = highlightJoints.includes(a) || highlightJoints.includes(b);
			const isError = isHighlighted; // For now, highlighted = error
			
			// 🏥 PHASE 2.4: Calculate depth-based visual adjustments
			const avgZ = (p1.z + p2.z) / 2;
			const depthFactor = Math.max(0.5, 1 - Math.abs(avgZ) * 0.3); // Fade distant segments
			const depthOpacity = depthFactor * (isError ? 1 : 0.95);
			
			// 🏥 SWORD HEALTH: Pure white skeleton with depth-based dimming
			const edgeColorValue = edgeColor(a, b, isError, false);
			
			// 🏥 PHASE 2.4: Adjust line width based on depth (closer = thicker)
			const baseWidth = isHighlighted ? 14 : 12;
			ctx.lineWidth = baseWidth * depthFactor;
			ctx.strokeStyle = edgeColorValue;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			
			// 🏥 PHASE 2.4: Depth-aware glow (closer = brighter)
			const glowIntensity = depthFactor * (isHighlighted ? 0.6 : 0.5);
			ctx.shadowColor = isHighlighted 
				? `rgba(255, 107, 107, ${glowIntensity})` 
				: `rgba(255, 255, 255, ${glowIntensity})`;
			ctx.shadowBlur = (isHighlighted ? 14 : 12) * depthFactor;
			ctx.globalAlpha = depthOpacity;
			
			ctx.beginPath();
			// ✅ CRITICAL FIX: Mirror x-coordinate when video is mirrored
			const x1 = mirror ? (1 - p1.x) * canvas.width : p1.x * canvas.width;
			const y1 = p1.y * canvas.height;
			const x2 = mirror ? (1 - p2.x) * canvas.width : p2.x * canvas.width;
			const y2 = p2.y * canvas.height;
			
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();
			
			// Reset effects
			ctx.shadowBlur = 0;
			ctx.globalAlpha = 1;
		}
		
		// 🏥 PHASE 2.4: Sort joints by Z-depth for proper rendering order
		// 🚀 PERFORMANCE: Use cached sort if Z-values haven't changed significantly
		let sortedJoints: number[];
		
		if (needsResort || cachedSortedJointsRef.current.length === 0) {
			const jointIndices = Array.from({ length: currentLandmarks.length }, (_, i) => i);
			sortedJoints = jointIndices.sort((a, b) => {
				const pA = currentLandmarks[a];
				const pB = currentLandmarks[b];
				if (!pA || !pB) return 0;
				return pB.z - pA.z; // Back to front
			});
			cachedSortedJointsRef.current = sortedJoints;
		} else {
			// 🚀 PERFORMANCE: Use cached sorted joints
			sortedJoints = cachedSortedJointsRef.current;
		}
		
		// 🏥 Draw joints with Sword Health clinical style + depth
		for (const i of sortedJoints) {
			const p = currentLandmarks[i]; 
			if (!p || p.visibility < 0.3) continue; // Skip low visibility joints
			
			// ✅ CRITICAL FIX: Mirror x-coordinate when video is mirrored
			const x = mirror ? (1 - p.x) * canvas.width : p.x * canvas.width;
			const y = p.y * canvas.height;
			
			// Determine joint state
			const isHighlighted = highlightJoints.includes(i);
			const isError = isHighlighted;
			const confidence = showConfidence ? p.visibility : 1;
			
			// 🏥 PHASE 2.4: Calculate depth factor for this joint
			const jointDepthFactor = Math.max(0.5, 1 - Math.abs(p.z) * 0.3);
			const jointDepthOpacity = jointDepthFactor * Math.max(confidence, 0.95);
			
			// 🏥 PHASE 2.4: Adjust size based on depth (closer = larger)
			const baseSize = isHighlighted ? 16 : 12;
			const size = baseSize * jointDepthFactor;
			
			// 🏥 SWORD HEALTH: Pure white with subtle error/success states
			const jointColor = pointColor(i, isError, false);
			
			// 🏥 PHASE 2.4: Depth-aware multi-layer rendering
			// Layer 1: Outer glow ring (depth perception, dimmer when further)
			ctx.globalAlpha = 0.5 * jointDepthFactor;
			ctx.fillStyle = jointColor;
			ctx.shadowColor = jointColor;
			ctx.shadowBlur = 18 * jointDepthFactor;
			ctx.beginPath();
			ctx.arc(x, y, size + 6, 0, Math.PI * 2);
			ctx.fill();
			
			// Layer 2: Subtle shadow for depth (stronger shadow when further back)
			const shadowOpacity = 0.3 + (1 - jointDepthFactor) * 0.2;
			ctx.globalAlpha = shadowOpacity;
			ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
			ctx.shadowBlur = 0;
			ctx.beginPath();
			ctx.arc(x + 1, y + 1, size + 2, 0, Math.PI * 2);
			ctx.fill();
			
			// Layer 3: Main joint circle with outline
			ctx.globalAlpha = jointDepthOpacity;
			ctx.shadowColor = jointColor;
			ctx.shadowBlur = 12 * jointDepthFactor;
			
			// Black outline for contrast against any background
			ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(x, y, size, 0, Math.PI * 2);
			ctx.stroke();
			
			// Fill with pure white (or error/success color)
			ctx.fillStyle = jointColor;
			ctx.globalAlpha = jointDepthOpacity;
			ctx.beginPath();
			ctx.arc(x, y, size, 0, Math.PI * 2);
			ctx.fill();
			
			// Layer 4: Inner highlight for 3D effect (brighter when closer)
			ctx.globalAlpha = 0.6 * jointDepthFactor;
			ctx.fillStyle = '#FFFFFF';
			ctx.shadowBlur = 0;
			ctx.beginPath();
			ctx.arc(x - size * 0.25, y - size * 0.25, size * 0.4, 0, Math.PI * 2);
			ctx.fill();
			
			// Reset effects
			ctx.shadowBlur = 0;
			ctx.globalAlpha = 1;
			
			// Draw confidence ring for low confidence joints
			if (showConfidence && confidence < 0.7) {
				ctx.strokeStyle = '#ff4444';
				ctx.lineWidth = 3;
				ctx.globalAlpha = 0.9;
				ctx.beginPath();
				ctx.arc(x, y, size + 5, 0, Math.PI * 2);
				ctx.stroke();
				ctx.globalAlpha = 1;
			}
			
			// Draw labels (only for debugging)
			if (labels && (LEFT_INDICES.has(i) || RIGHT_INDICES.has(i))) {
				ctx.fillStyle = 'rgba(255,255,255,0.9)';
				ctx.font = 'bold 12px system-ui';
				ctx.strokeStyle = 'rgba(0,0,0,0.8)';
				ctx.lineWidth = 2;
				ctx.strokeText(String(i), x + 8, y - 8);
				ctx.fillText(String(i), x + 8, y - 8);
			}
		}
		
		// Draw corrections with mirror support
		corrections.forEach(correction => {
			// ✅ CRITICAL FIX: Mirror x-coordinate when video is mirrored
			const x = mirror ? (1 - correction.position.x) * canvas.width : correction.position.x * canvas.width;
			const y = correction.position.y * canvas.height;
			
			ctx.globalAlpha = 0.8;
			ctx.strokeStyle = '#ff4444';
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.arc(x, y, 8, 0, Math.PI * 2);
			ctx.stroke();
			
			// Draw correction message
			ctx.fillStyle = 'rgba(255, 68, 68, 0.9)';
			ctx.font = '12px system-ui';
			ctx.globalAlpha = 1;
			ctx.fillText(correction.message, x + 12, y - 4);
		});
		
		ctx.restore();
		
		// 🏥 PHASE C: Mark render end time and log timing
		const renderEndTime = performance.now();
		const renderDuration = renderEndTime - renderStartTime;
		if (debug) {
			console.log(`PoseOverlay render duration: ${renderDuration.toFixed(2)}ms`);
		}
		
		// Continue animation loop
		animationRef.current = requestAnimationFrame(animate);
	}, [landmarksRef, video, mirror, labels, showConfidence, highlightJoints, corrections, debug]);
	
	// Start animation loop
	useEffect(() => {
		// Ensure animation starts immediately
		animationRef.current = requestAnimationFrame(animate);
		
		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
				animationRef.current = undefined;
			}
		};
	}, [animate]);
	
	// Debug: Log component mount/unmount
	useEffect(() => {
		console.log('PoseOverlay mounted');
		return () => {
			console.log('PoseOverlay unmounted');
		};
	}, []);
	return <canvas 
		ref={canvasRef} 
		className="absolute inset-0 pointer-events-none z-20"
		style={{
			width: '100%',
			height: '100%',
			objectFit: 'contain'
		}}
	/>;
}

// 🚀 PERFORMANCE: Wrap with React.memo to prevent unnecessary re-renders
// Only re-render when props actually change
const PoseOverlay = React.memo(PoseOverlayComponent, (prevProps, nextProps) => {
	// Custom comparison: only re-render if these specific props change
	return (
		prevProps.video === nextProps.video &&
		prevProps.mirror === nextProps.mirror &&
		prevProps.debug === nextProps.debug &&
		prevProps.labels === nextProps.labels &&
		prevProps.showConfidence === nextProps.showConfidence &&
		prevProps.landmarksRef === nextProps.landmarksRef &&
		prevProps.highlightJoints?.length === nextProps.highlightJoints?.length &&
		prevProps.corrections?.length === nextProps.corrections?.length
	);
});

PoseOverlay.displayName = 'PoseOverlay';

export default PoseOverlay;

// 🏥 SWORD HEALTH STYLE: Clinical-grade pure white skeleton
// Professional medical appearance for maximum trust and visibility
function pointColor(i: number, isError: boolean = false, isSuccess: boolean = false) {
	// Error state: subtle red
	if (isError) return '#FF6B6B';
	
	// Success state: subtle green
	if (isSuccess) return '#4ECDC4';
	
	// Default: pure white for all joints (clinical appearance)
	return '#FFFFFF';
}

function edgeColor(a: number, b: number, isError: boolean = false, isActive: boolean = false) {
	// Error state: subtle red tint
	if (isError) return '#FF6B6B';
	
	// Active limb: brighter white
	if (isActive) return '#FFFFFF';
	
	// Default: pure white for all connections (clinical appearance)
	return '#FFFFFF';
}
