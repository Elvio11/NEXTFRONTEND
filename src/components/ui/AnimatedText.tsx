'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface AnimatedTextProps {
    words: string[]
    interval?: number
    className?: string
}

export function AnimatedText({
    words,
    interval = 2000,
    className,
}: AnimatedTextProps) {
    const [index, setIndex] = useState(0)

    useEffect(() => {
        const t = setInterval(
            () => setIndex((i) => (i + 1) % words.length),
            interval
        )
        return () => clearInterval(t)
    }, [words.length, interval])

    return (
        <span className={className} aria-live="polite">
            <AnimatePresence mode="wait">
                <motion.span
                    key={words[index]}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="inline-block text-[#3b82f6]"
                >
                    {words[index]}
                </motion.span>
            </AnimatePresence>
        </span>
    )
}
