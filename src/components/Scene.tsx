'use client'

import { ReactNode, useEffect, useRef, createContext, useContext } from 'react'
import * as THREE from 'three'

interface SceneContextType {
  scene: THREE.Scene | null
}

const SceneContext = createContext<SceneContextType>({ scene: null })

export const useScene = () => useContext(SceneContext)

interface SceneProps {
  children?: ReactNode
}

export default function Scene({ children }: SceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x000000, 1, 100)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    })
    
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    containerRef.current.appendChild(renderer.domElement)

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const pointLight1 = new THREE.PointLight(0xff0000, 2, 50)
    pointLight1.position.set(10, 10, 10)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0x0000ff, 2, 50)
    pointLight2.position.set(-10, -10, -10)
    scene.add(pointLight2)

    const pointLight3 = new THREE.PointLight(0x00ff00, 2, 50)
    pointLight3.position.set(0, 10, -10)
    scene.add(pointLight3)

    camera.position.z = 12
    camera.position.y = 2
    camera.lookAt(0, 0, 0)

    const animate = () => {
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)
    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      containerRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])

  return (
    <SceneContext.Provider value={{ scene: sceneRef.current }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
        {children}
      </div>
    </SceneContext.Provider>
  )
} 