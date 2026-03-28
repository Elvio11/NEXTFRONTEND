'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'

function Orb({ isActive }: { isActive: boolean }) {
    const meshRef = useRef<THREE.Mesh>(null)

    useFrame((_state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * 0.2
            meshRef.current.rotation.y += delta * 0.3
            const scale = isActive ? 1.2 : 1
            meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1)
        }
    })

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[1.5, 64, 64]} />
            <meshStandardMaterial 
                color={isActive ? '#3b82f6' : '#1e3a8a'} 
                wireframe={true} 
                transparent 
                opacity={0.3} 
            />
        </mesh>
    )
}

export function ThreeDeeOrb() {
    const [isActive, setIsActive] = useState(false)

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8080/ws/signals')
        ws.onmessage = () => {
             setIsActive(true)
             setTimeout(() => setIsActive(false), 500)
        }
        return () => ws.close()
    }, [])

    return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <Orb isActive={isActive} />
            </Canvas>
        </div>
    )
}
