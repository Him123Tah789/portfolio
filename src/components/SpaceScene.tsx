"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";

const CODE_SNIPPETS = [
  { language: "TypeScript", code: "const api = await fetch('/api/projects');" },
  { language: "Python", code: "def train(model, data): return model.fit(data)" },
  { language: "Go", code: "func main() { fmt.Println(\"Hello\") }" },
  { language: "Rust", code: "fn main() { println!(\"safe & fast\"); }" },
  { language: "SQL", code: "SELECT title FROM projects ORDER BY created_at DESC;" },
  { language: "Java", code: "record User(String name, String role) {}" },
  { language: "C++", code: "std::vector<int> nums = {1,2,3};" },
  { language: "Bash", code: "npm run build && npm run start" },
];

function getSceneConfig(pathname: string) {
  const isHome = pathname === "/";
  const isAdmin = pathname.startsWith("/admin");
  const isBlog = pathname.startsWith("/blog");

  if (isHome) {
    return {
      starCount: 3400,
      objectCount: 22,
      spread: 115,
      sizeMin: 0.35,
      sizeMax: 1.2,
      colors: [0x6c63ff, 0xff6584, 0x00f2ff, 0xffd700],
    };
  }

  if (isAdmin) {
    return {
      starCount: 2400,
      objectCount: 16,
      spread: 95,
      sizeMin: 0.28,
      sizeMax: 0.95,
      colors: [0x6c63ff, 0x4f46e5, 0x22d3ee, 0xff6584],
    };
  }

  if (isBlog) {
    return {
      starCount: 2700,
      objectCount: 18,
      spread: 105,
      sizeMin: 0.32,
      sizeMax: 1.05,
      colors: [0x6c63ff, 0xff6584, 0x38bdf8, 0xf59e0b],
    };
  }

  return {
    starCount: 2800,
    objectCount: 18,
    spread: 100,
    sizeMin: 0.32,
    sizeMax: 1.05,
    colors: [0x6c63ff, 0xff6584, 0x00f2ff, 0xffd700],
  };
}

export default function SpaceScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number>(0);
  const scrollProgressRef = useRef(0);
  const smoothScrollRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const smoothPointerRef = useRef({ x: 0, y: 0 });
  const pathname = usePathname();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const config = getSceneConfig(pathname);
    const isHomeRoute = pathname === "/";

    const scene = new THREE.Scene();

    const width = window.innerWidth;
    const height = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

    let renderer: any;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const starGeometry = new THREE.BufferGeometry();
    const starCount = window.innerWidth < 768 ? Math.round(config.starCount * 0.5) : config.starCount;
    const posArray = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 1000;
    }

    starGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    const starMaterial = new THREE.PointsMaterial({ size: 0.7, color: 0xffffff });
    const starMesh = new THREE.Points(starGeometry, starMaterial);
    scene.add(starMesh);

    const objects: any[] = [];

    const pickGeometry = () => {
      const size = config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin);
      const variant = Math.floor(Math.random() * 4);

      if (variant === 0) return new THREE.IcosahedronGeometry(size, 1);
      if (variant === 1) return new THREE.TorusKnotGeometry(size * 0.55, size * 0.16, 64, 10);
      if (variant === 2) return new THREE.OctahedronGeometry(size, 1);
      return new THREE.DodecahedronGeometry(size, 0);
    };

    const createSpaceObject = () => {
      const geometry = pickGeometry();
      const baseColor = config.colors[Math.floor(Math.random() * config.colors.length)];
      const material = new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: baseColor,
        emissiveIntensity: 1.9,
        wireframe: true,
      });

      const mesh = new THREE.Mesh(geometry, material);
      const baseX = (Math.random() - 0.5) * config.spread;
      const baseY = (Math.random() - 0.5) * config.spread;
      const baseZ = (Math.random() - 0.5) * config.spread;
      mesh.position.set(baseX, baseY, baseZ);

      mesh.userData = {
        velocity: 0.03 + Math.random() * 0.08,
        pulseSpeed: 0.01 + Math.random() * 0.04,
        orbitRadius: 0.7 + Math.random() * 2.4,
        orbitSpeed: 0.7 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
        baseX,
        baseY,
        baseZ,
      };

      scene.add(mesh);
      objects.push(mesh);
    };

    const objectCount = config.objectCount;
    for (let i = 0; i < objectCount; i++) createSpaceObject();

    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    let mouseFollower: any = null;
    if (isHomeRoute) {
      const followerGeometry = new THREE.SphereGeometry(0.5, 24, 24);
      const followerMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b7bff,
        emissive: 0x8b7bff,
        emissiveIntensity: 2.4,
        wireframe: true,
      });
      mouseFollower = new THREE.Mesh(followerGeometry, followerMaterial);
      mouseFollower.position.set(0, 0, 18);
      scene.add(mouseFollower);
    }

    const baseCameraZ = 50;
    camera.position.z = baseCameraZ;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      const time = Date.now() * 0.001;
      smoothScrollRef.current += (scrollProgressRef.current - smoothScrollRef.current) * 0.08;
      const scrollFactor = smoothScrollRef.current;
      const speedBoost = 1 + scrollFactor * 2.2;

      smoothPointerRef.current.x += (pointerRef.current.x - smoothPointerRef.current.x) * 0.09;
      smoothPointerRef.current.y += (pointerRef.current.y - smoothPointerRef.current.y) * 0.09;

      camera.position.z = baseCameraZ - scrollFactor * 16;
      camera.position.y = Math.sin(time * 0.25) * (0.5 + scrollFactor * 2.2);
      if (isHomeRoute) {
        camera.position.x = smoothPointerRef.current.x * 2.4;
        camera.rotation.y = smoothPointerRef.current.x * 0.08;
        camera.rotation.x = -smoothPointerRef.current.y * 0.05;
      }

      starMesh.rotation.y += 0.0012 * speedBoost;
      starMesh.rotation.z += 0.001 * speedBoost;
      starMaterial.size = 0.62 + scrollFactor * 0.3;
      ambientLight.intensity = 1.8 + scrollFactor * 0.9;

      objects.forEach((obj, i) => {
        const orbitTime = time * obj.userData.orbitSpeed * speedBoost + obj.userData.phase;
        const dynamicRadius = obj.userData.orbitRadius * (1 + scrollFactor * 1.6);
        obj.rotation.x += obj.userData.velocity * (0.8 + scrollFactor * 1.4);
        obj.rotation.y += obj.userData.velocity * (1.1 + scrollFactor * 1.8);

        obj.position.x = obj.userData.baseX + Math.cos(orbitTime + i * 0.15) * dynamicRadius;
        obj.position.y = obj.userData.baseY + Math.sin(orbitTime * 1.2 + i * 0.1) * dynamicRadius * 0.75;
        obj.position.z = obj.userData.baseZ + Math.cos(orbitTime * 0.85 + i * 0.12) * dynamicRadius * 0.6;

        const intensity = Math.abs(Math.sin(time * obj.userData.pulseSpeed * 100));
        const material = obj.material as any;
        material.emissiveIntensity = intensity * (2.2 + scrollFactor * 2.4);
      });

      if (mouseFollower) {
        const followerTargetX = smoothPointerRef.current.x * 22;
        const followerTargetY = smoothPointerRef.current.y * 13;
        mouseFollower.position.x += (followerTargetX - mouseFollower.position.x) * 0.08;
        mouseFollower.position.y += (followerTargetY - mouseFollower.position.y) * 0.08;
        mouseFollower.position.z = 18 + Math.sin(time * 2.4) * 1.2;
        mouseFollower.rotation.x += 0.04;
        mouseFollower.rotation.y += 0.06;
      }

      renderer.render(scene, camera);
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(frameRef.current);
      } else {
        animate();
      }
    };

    const handleScroll = () => {
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const next = window.scrollY / maxScroll;
      scrollProgressRef.current = Math.min(1, Math.max(0, next));
    };

    const handleMouseMove = (event: MouseEvent) => {
      const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
      const normalizedY = (event.clientY / window.innerHeight) * 2 - 1;
      pointerRef.current.x = normalizedX;
      pointerRef.current.y = -normalizedY;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    handleScroll();
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      objects.forEach((obj) => {
        scene.remove(obj);
        obj.geometry.dispose();
        obj.material.dispose();
      });

      if (mouseFollower) {
        scene.remove(mouseFollower);
        mouseFollower.geometry.dispose();
        mouseFollower.material.dispose();
      }

      starGeometry.dispose();
      starMaterial.dispose();

      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [pathname]);

  return (
    <>
      <div ref={containerRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} aria-hidden />
      <div className="code-float-layer" aria-hidden>
        {CODE_SNIPPETS.map((snippet, index) => (
          <div
            key={`${snippet.language}-${index}`}
            className="code-float-chip"
            style={{
              top: `${10 + (index % 4) * 22}%`,
              left: `${5 + index * 10}%`,
              animationDelay: `${index * 0.8}s`,
              animationDuration: `${14 + (index % 3) * 2}s`,
            }}
          >
            <span className="code-float-lang">{snippet.language}</span>
            <span className="code-float-text">{snippet.code}</span>
          </div>
        ))}
      </div>
    </>
  );
}
