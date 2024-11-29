'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useScene } from './Scene'

interface AudioVisualizerProps {
  audioData: Uint8Array | null
}

export default function AudioVisualizer({ audioData }: AudioVisualizerProps) {
  const particlesRef = useRef<THREE.Points | null>(null)
  const particlesGeometryRef = useRef<THREE.BufferGeometry | null>(null)
  const { scene } = useScene()
  const backgroundRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const bg = document.createElement('div')
    bg.className = 'fixed inset-0 pointer-events-none transition-colors duration-100'
    bg.style.zIndex = '-1'
    document.body.appendChild(bg)
    backgroundRef.current = bg

    return () => {
      document.body.removeChild(bg)
    }
  }, [])

  useEffect(() => {
    if (!scene) return

    const particlesGeometry = new THREE.BufferGeometry()
    const particleCount = 5000
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    const galaxyColors = [
      new THREE.Color('#ff0000'),
      new THREE.Color('#ff4d4d'),
      new THREE.Color('#ff9999'),
      new THREE.Color('#cc0000'),
      new THREE.Color('#ff1a1a'),
    ]

    for (let i = 0; i < particleCount; i++) {
      const armCount = 5
      const arm = i % armCount
      const radius = Math.random() * 15
      const angle = (i / particleCount) * Math.PI * 2 + (arm * Math.PI * 2 / armCount)

      const spread = 2 * Math.random()
      const x = Math.cos(angle) * (radius + spread)
      const z = Math.sin(angle) * (radius + spread)
      const y = (Math.random() - 0.5) * 2

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      const colorIndex = Math.floor(Math.random() * galaxyColors.length)
      const mixColor = galaxyColors[(colorIndex + 1) % galaxyColors.length]
      const color = galaxyColors[colorIndex].clone()
      color.lerp(mixColor, Math.random())

      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      sizes[i] = Math.random() * 1.5
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const particlesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        pixelRatio: { value: window.devicePixelRatio }
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 xy = gl_PointCoord.xy - vec2(0.5);
          float r = length(xy);
          if (r > 0.5) discard;
          float intensity = 1.0 - r * 2.0;
          gl_FragColor = vec4(vColor, intensity);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const particles = new THREE.Points(particlesGeometry, particlesMaterial)
    particlesRef.current = particles
    particlesGeometryRef.current = particlesGeometry
    scene.add(particles)

    return () => {
      scene.remove(particles)
      particlesGeometry.dispose()
      particlesMaterial.dispose()
    }
  }, [scene])

  useEffect(() => {
    if (!audioData || !particlesRef.current || !particlesGeometryRef.current || !backgroundRef.current) return

    const positions = particlesGeometryRef.current.attributes.position.array as Float32Array
    const sizes = particlesGeometryRef.current.attributes.size.array as Float32Array

    const avgIntensity = Array.from(audioData).reduce((a, b) => a + b, 0) / audioData.length / 255
    
    if (avgIntensity > 0.6) {
      const redIntensity = Math.floor((avgIntensity - 0.6) * 2.5 * 15)
      backgroundRef.current.style.backgroundColor = `rgb(${redIntensity}, 0, 0)`
    } else {
      backgroundRef.current.style.backgroundColor = 'transparent'
    }

    for (let i = 0; i < positions.length / 3; i++) {
      const audioIndex = i % audioData.length
      const audioValue = audioData[audioIndex] / 255

      sizes[i] = (0.5 + audioValue * 2) * (Math.random() + 0.5) * (audioValue * 4)

      const x = positions[i * 3]
      const z = positions[i * 3 + 2]
      const distance = Math.sqrt(x * x + z * z)
      const angle = Math.atan2(z, x)

      const wave = Math.sin(distance * 0.2) * audioValue * 0.1 * (audioValue * 2)
      positions[i * 3 + 1] += wave * 0.5
    }

    particlesGeometryRef.current.attributes.position.needsUpdate = true
    particlesGeometryRef.current.attributes.size.needsUpdate = true
  }, [audioData])

  return null
}