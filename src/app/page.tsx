'use client'

import { useState, useRef, DragEvent } from 'react'
import Scene from '../components/Scene'
import AudioVisualizer from '../components/AudioVisualizer'
import { Play, Pause, Volume2 } from "lucide-react"

export default function Home() {
  const [audioData, setAudioData] = useState<Uint8Array | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [fileName, setFileName] = useState<string>('')
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const animationFrameRef = useRef<number>()
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const startTimeRef = useRef<number>(0)

  const setupAudioNodes = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }

    if (!analyserRef.current) {
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 64
    }

    if (!gainNodeRef.current) {
      gainNodeRef.current = audioContextRef.current.createGain()
    }

    // Ensure analyzer is always connected to gain node
    analyserRef.current.disconnect()
    gainNodeRef.current.disconnect()
    
    analyserRef.current.connect(gainNodeRef.current)
    gainNodeRef.current.connect(audioContextRef.current.destination)
  }

  const startVisualization = () => {
    const updateData = () => {
      if (!analyserRef.current) return
      const data = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(data)
      setAudioData(data)
      animationFrameRef.current = requestAnimationFrame(updateData)
    }
    updateData()
  }

  const stopCurrentAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    sourceNodeRef.current?.stop()
    sourceNodeRef.current?.disconnect()
    sourceNodeRef.current = null
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const playAudio = (startAt = 0) => {
    if (!audioContextRef.current || !audioBufferRef.current) return

    // Setup audio nodes if they don't exist
    setupAudioNodes()

    // Stop any currently playing audio
    sourceNodeRef.current?.stop()
    sourceNodeRef.current?.disconnect()

    // Create new source node
    const sourceNode = audioContextRef.current.createBufferSource()
    sourceNode.buffer = audioBufferRef.current
    sourceNodeRef.current = sourceNode

    // Set volume
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume
    }

    // Connect source -> analyzer -> gain -> destination
    sourceNode.connect(analyserRef.current!)

    // Start playback
    sourceNode.start(0, startAt)
    startTimeRef.current = audioContextRef.current.currentTime - startAt
    setIsPlaying(true)

    // Start visualization
    startVisualization()

    // Update time
    const updateTime = () => {
      if (!audioContextRef.current) return
      const elapsed = audioContextRef.current.currentTime - startTimeRef.current
      setCurrentTime(elapsed)
      if (elapsed < duration) {
        requestAnimationFrame(updateTime)
      } else {
        setIsPlaying(false)
        setCurrentTime(duration)
      }
    }
    updateTime()
  }

  const handleAudioFile = async (file: File) => {
    try {
      stopCurrentAudio()
      setFileName(file.name)

      setupAudioNodes()

      const arrayBuffer = await file.arrayBuffer()
      const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer)
      audioBufferRef.current = audioBuffer
      setDuration(audioBuffer.duration)
      
      playAudio()
    } catch (error) {
      console.error('Error processing audio file:', error)
    }
  }

  const togglePlayPause = () => {
    if (isPlaying) {
      stopCurrentAudio()
    } else {
      playAudio(currentTime)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setCurrentTime(value)
    if (audioBufferRef.current) {
      playAudio(value)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setVolume(value)
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = value
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('audio/')) {
      handleAudioFile(file)
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  return (
    <div 
      className="h-screen w-full relative bg-zinc-800 font-sans overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Drop zone */}
      <div 
        className={`absolute inset-0 z-10 transition-all duration-300 m-8
          border-2 border-dashed rounded-2xl
          ${isDragging 
            ? "border-zinc-500 bg-zinc-500/10 opacity-100" 
            : "border-transparent opacity-0 pointer-events-none"
          }`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-zinc-200 text-2xl font-light">
            Drop audio file here
          </p>
        </div>
      </div>

      {/* Audio Controls - Full width at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        <div className="bg-zinc-900/80 backdrop-blur-2xl border-t border-zinc-800/50 p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {fileName && (
              <div className="text-zinc-400 text-sm font-medium truncate mb-3">
                {fileName}
              </div>
            )}
            
            <div className="flex items-center gap-6">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlayPause}
                className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 
                  flex items-center justify-center text-zinc-200 
                  transition-all hover:scale-105 active:scale-95"
              >
                {isPlaying 
                  ? <Pause className="w-4 h-4" />
                  : <Play className="w-4 h-4 ml-0.5" />
                }
              </button>

              {/* Time Slider */}
              <div className="flex-1 space-y-2">
                <input
                  type="range"
                  min={0}
                  max={duration}
                  value={currentTime}
                  onChange={handleTimeChange}
                  className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-3
                    [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-zinc-200
                    [&::-webkit-slider-thumb]:hover:bg-white
                    [&::-webkit-slider-thumb]:transition-colors
                    hover:[&::-webkit-slider-runnable-track]:bg-zinc-700
                    [&::-webkit-slider-runnable-track]:transition-colors"
                />
                <div className="flex justify-between text-xs text-zinc-500 font-medium">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-2 w-24 group">
                <Volume2 className="w-4 h-4 text-zinc-400 group-hover:text-zinc-300 transition-colors" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-3
                    [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-zinc-200
                    [&::-webkit-slider-thumb]:hover:bg-white
                    [&::-webkit-slider-thumb]:transition-colors
                    hover:[&::-webkit-slider-runnable-track]:bg-zinc-700
                    [&::-webkit-slider-runnable-track]:transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Scene>
        <AudioVisualizer audioData={audioData} />
      </Scene>
    </div>
  )
}
