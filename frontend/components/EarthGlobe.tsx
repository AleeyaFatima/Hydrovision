"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface Hotspot {
  name: string;
  location: string;
  lat: number;
  lon: number;
  year: string;
  impact: string;
  waterFraction: string;
}

const HOTSPOTS: Hotspot[] = [
  {
    name: "Valencia Flash Floods",
    location: "Valencia, Spain",
    lat: 39.4699,
    lon: -0.3763,
    year: "2024",
    impact: "Over 500mm rainfall in 8 hours",
    waterFraction: "38.4% inundation",
  },
  {
    name: "Storm Daniel Inundation",
    location: "Derna, Libya",
    lat: 32.767,
    lon: 22.6367,
    year: "2023",
    impact: "Catastrophic dual dam collapse",
    waterFraction: "52.1% inundation",
  },
  {
    name: "Hurricane Harvey",
    location: "Houston, TX, USA",
    lat: 29.7604,
    lon: -95.3698,
    year: "2017",
    impact: "1,000+ year rainfall event",
    waterFraction: "44.7% inundation",
  },
  {
    name: "Kerala Monsoon Deluge",
    location: "Kerala, India",
    lat: 10.8505,
    lon: 76.2711,
    year: "2018",
    impact: "Widespread reservoir releases",
    waterFraction: "41.2% inundation",
  },
];

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export function EarthGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSpot, setActiveSpot] = useState<Hotspot>(HOTSPOTS[0]);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check WebGL support
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    const container = containerRef.current;
    const width = container.clientWidth || 450;
    const height = container.clientHeight || 450;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 240;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const radius = 70;

    // 1. Inner core dark sphere
    const coreGeo = new THREE.SphereGeometry(radius * 0.99, 48, 48);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x081326,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    globeGroup.add(coreMesh);

    // 2. Wireframe / Latitude-Longitude Grid
    const wireGeo = new THREE.SphereGeometry(radius, 28, 28);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x1e3a5f,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireMesh);

    // 3. Dot Grid (Continents / Dense Particles)
    const particleCount = 2400;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Golden spiral sphere distribution for uniform points
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < particleCount; i++) {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);
      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(theta) * Math.sin(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Cyan / Ice-blue tint
      colors[i * 3] = 0.13;
      colors[i * 3 + 1] = 0.82;
      colors[i * 3 + 2] = 0.93;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
    });
    const pointCloud = new THREE.Points(particleGeo, particleMat);
    globeGroup.add(pointCloud);

    // 4. Hotspots (Pulsing markers)
    const markerMeshes: THREE.Mesh[] = [];
    HOTSPOTS.forEach((spot) => {
      const pos = latLonToVector3(spot.lat, spot.lon, radius + 0.5);
      
      // Marker core
      const mGeo = new THREE.SphereGeometry(1.6, 12, 12);
      const mMat = new THREE.MeshBasicMaterial({ color: 0xfb7185 }); // Coral danger
      const mesh = new THREE.Mesh(mGeo, mMat);
      mesh.position.copy(pos);
      globeGroup.add(mesh);
      markerMeshes.push(mesh);

      // Marker outer glow ring
      const ringGeo = new THREE.RingGeometry(2.0, 3.2, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos.clone().multiplyScalar(1.01));
      ringMesh.lookAt(pos.clone().multiplyScalar(2));
      globeGroup.add(ringMesh);
    });

    // 5. Atmosphere outer ring glow
    const atmosGeo = new THREE.SphereGeometry(radius * 1.08, 32, 32);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    scene.add(atmosMesh);

    // Drag Interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotationVelocityX = 0;
    let rotationVelocityY = 0.0018; // auto slow rotation

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      rotationVelocityY = deltaX * 0.004;
      rotationVelocityX = deltaY * 0.004;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    // Touch handlers for mobile phones
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      const deltaY = e.touches[0].clientY - prevMouseY;
      rotationVelocityY = deltaX * 0.004;
      rotationVelocityX = deltaY * 0.004;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    // Resize handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // Animation loop
    let animId: number;
    let time = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.02;

      // Apply rotation with damping
      globeGroup.rotation.y += rotationVelocityY;
      globeGroup.rotation.x += rotationVelocityX;

      if (!isDragging) {
        // Return to standard gentle spin
        rotationVelocityY += (0.002 - rotationVelocityY) * 0.05;
        rotationVelocityX += (0 - rotationVelocityX) * 0.05;
      }

      // Marker pulse animation
      markerMeshes.forEach((m, idx) => {
        const s = 1 + Math.sin(time * 3 + idx) * 0.25;
        m.scale.set(s, s, s);
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", onResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  if (!webglSupported) {
    return (
      <div className="relative flex h-[380px] w-full max-w-[420px] items-center justify-center rounded-3xl border border-white/10 bg-surface p-6 text-center">
        <div className="space-y-3">
          <div className="mx-auto h-24 w-24 rounded-full border-2 border-dashed border-accent-cyan/40 bg-accent-cyan/5 flex items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-accent-cyan/20 animate-pulse" />
          </div>
          <p className="text-sm font-semibold text-slate-200">Global Flood Hotspot Radar</p>
          <p className="text-xs text-slate-400">Monitoring 4 major worldwide flood events with sub-pixel aerial telemetry.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Ambient background glow behind globe */}
      <div className="absolute inset-0 -m-8 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="relative h-[380px] w-[380px] sm:h-[440px] sm:w-[440px] cursor-grab active:cursor-grabbing select-none"
      />

      {/* Clean Telemetry Tag underneath */}
      <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#07101E]/80 px-3.5 py-1 text-[11px] font-mono text-slate-400 backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>Global Optical & Drone Telemetry • Drag to Rotate</span>
      </div>
    </div>
  );
}

