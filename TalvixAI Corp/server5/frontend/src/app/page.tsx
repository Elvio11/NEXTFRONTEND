import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-black text-green-400 font-mono">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-800 bg-gradient-to-b from-zinc-900 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Talvix AI Corp &nbsp;
          <code className="font-mono font-bold text-green-300">Phase 9 Online</code>
        </p>
      </div>

      <div className="relative flex place-items-center flex-col my-12 before:absolute before:h-[300px] before:w-full sm:before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-green-500/20 before:to-transparent before:blur-2xl after:absolute after:-z-20 after:h-[180px] after:w-full sm:after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-green-900 after:via-black after:blur-2xl after:content-['']">
        <h1 className="text-6xl font-extrabold tracking-widest uppercase mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-500 z-10 text-center">
          Mega Hyper Master
          <br /> Control Panel
        </h1>
        <p className="z-10 text-xl tracking-wider text-gray-400">Founder Visualizer & Chat Interface</p>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left z-10 gap-4">
        <a
          href="#"
          className="group rounded-lg border border-gray-800 px-5 py-4 transition-colors hover:border-green-400 hover:bg-gray-900/50"
        >
          <h2 className={`mb-3 text-2xl font-semibold text-green-300`}>
            3D Neural Web{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-70`}>
            Visualize all 50 OpenFang departments operating in real-time.
          </p>
        </a>

        <a
          href="#"
          className="group rounded-lg border border-gray-800 px-5 py-4 transition-colors hover:border-green-400 hover:bg-gray-900/50"
        >
          <h2 className={`mb-3 text-2xl font-semibold text-green-300`}>
            Agent Toggles{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-70`}>
            Live God-mode switches. Pause, restart, or kill any department instantly.
          </p>
        </a>

        <a
          href="#"
          className="group rounded-lg border border-gray-800 px-5 py-4 transition-colors hover:border-green-400 hover:bg-gray-900/50"
        >
          <h2 className={`mb-3 text-2xl font-semibold text-green-300`}>
            API Burn Rate{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-70`}>
            Track token usage for Cerebras, Groq, Gemini, and Claude per department.
          </p>
        </a>

      </div>

      <div className="w-full max-w-5xl mt-12 border border-green-900/50 rounded-xl bg-black/60 backdrop-blur-md overflow-hidden flex flex-col h-[400px]">
        <div className="bg-green-900/30 border-b border-green-900/50 px-4 py-3 flex items-center justify-between">
          <h2 className="text-green-400 font-bold tracking-widest text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            COMMANDER AI LINK
          </h2>
          <span className="text-xs text-green-600 font-mono">SECURE WEBSOCKET: CONNECTED</span>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-4">
          <div className="flex gap-3">
            <span className="text-green-500 font-bold shrink-0">[COMMANDER]:</span>
            <p className="text-gray-300 leading-relaxed">System initialized. All 50 departments are standing by. Marketing is currently executing the morning brief. How can I assist you, Founder?</p>
          </div>
          <div className="flex gap-3">
            <span className="text-cyan-500 font-bold shrink-0">[FOUNDER]:</span>
            <p className="text-gray-300 leading-relaxed">Halt the Marketing Director. Spin up a Ruflo swarm to deploy the new Next.js dashboard.</p>
          </div>
          <div className="flex gap-3">
            <span className="text-green-500 font-bold shrink-0">[COMMANDER]:</span>
            <p className="text-gray-300 leading-relaxed">Acknowledged. Hand 4 paused. Engineering Commander (Dept 39) has been notified and is allocating a 3-tier Ruflo swarm. ETA: 45 seconds.</p>
          </div>
        </div>

        <div className="p-4 border-t border-green-900/50 bg-black/80">
          <div className="flex items-center gap-2">
            <span className="text-green-500 font-bold">&gt;</span>
            <input 
              type="text" 
              placeholder="Enter direct command..." 
              className="w-full bg-transparent border-none outline-none text-green-400 placeholder-green-800 font-mono text-sm"
              readOnly
            />
            <button className="px-4 py-1 rounded bg-green-900/50 hover:bg-green-800 text-green-300 text-xs font-bold uppercase tracking-wider transition-colors">
              Execute
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}