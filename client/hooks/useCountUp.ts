import { useState, useEffect } from 'react'

export function useCountUp(target: number, duration: number = 800, startOnMount: boolean = true) {
    const [value, setValue] = useState(0)

    useEffect(() => {
        if (!startOnMount) return

        let startTime: number | null = null
        let animationFrameId: number

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp
            const elapsed = timestamp - startTime

            // Math.min(elapsed / duration, 1)^0.5 easing curve
            const progress = Math.min(elapsed / duration, 1)
            const easeOut = Math.pow(progress, 0.5)

            setValue(Math.floor(easeOut * target))

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate)
            } else {
                setValue(target)
            }
        }

        animationFrameId = requestAnimationFrame(animate)

        return () => cancelAnimationFrame(animationFrameId)
    }, [target, duration, startOnMount])

    return value
}
