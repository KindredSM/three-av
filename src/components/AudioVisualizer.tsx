'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useScene } from './Scene'

interface AudioVisualizerProps {
  audioData: Uint8Array | null
}

export default function AudioVisualizer({ audioData }: AudioVisualizerProps) {
  const groupRef = useRef<THREE.Group | null>(null)
  const barsRef = useRef<THREE.Mesh[]>([])
  const { scene } = useScene()

  // Setup visualization only once
  useEffect(() => {
    if (!scene) return

    const group = new THREE.Group()
    groupRef.current = group

    const numBars = 32
    const geometry = new THREE.BoxGeometry(0.5, 1, 0.5)

    for (let i = 0; i < numBars; i++) {
      const hue = (i / numBars) * 360
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(`hsl(${hue}, 100%, 50%)`),
        shininess: 100,
        emissive: new THREE.Color(`hsl(${hue}, 100%, 20%)`),
      })

      const bar = new THREE.Mesh(geometry, material)
      const angle = (i / numBars) * Math.PI * 2
      const radius = 5
      bar.position.x = Math.cos(angle) * radius
      bar.position.z = Math.sin(angle) * radius
      bar.scale.y = 1
      group.add(bar)
      barsRef.current.push(bar)
    }

    group.rotation.x = 0.3
    scene.add(group)

    return () => {
      scene.remove(group)
      barsRef.current = []
    }
  }, [scene]) // Only run this effect when scene changes

  // Update bars in a separate effect
  useEffect(() => {
    if (!audioData || !groupRef.current || barsRef.current.length === 0) return

    const numBars = barsRef.current.length
    for (let i = 0; i < numBars; i++) {
      const value = audioData[i] ?? 0
      const bar = barsRef.current[i]
      if (bar) {
        const scale = Math.max((value / 128.0) * 5, 0.5) // Increased multiplier for more visible effect
        bar.scale.y = scale
        bar.rotation.y += 0.02
        bar.position.y = Math.sin(Date.now() * 0.003 + i * 0.2) * 0.2
      }
    }

    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005
    }
  }, [audioData]) // Only run this effect when audioData changes

  // Add debug logging
  useEffect(() => {
    console.log('AudioData received:', audioData?.length ?? 0)
  }, [audioData])

  return null
}