'use client'

import { Composition } from 'remotion'
import AgentReplay from './AgentReplay'

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="AgentReplay"
        component={AgentReplay}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  )
}
