"use client"; // Must be a client component now

import { use, useState } from "react";
import { ChatPanel } from "@/components/interview/chat-panel";
import { InfoPanel } from "@/components/interview/info-panel";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default function InterviewPage({ params }: Props) {
  // Unwrap the promise
  const { sessionId } = use(params);
  
  // Create the shared state to hold the live chat
  const [liveTranscript, setLiveTranscript] = useState<any[]>([]);

  return (
    <div className="flex h-screen bg-background">
      <div className="flex w-[60%] flex-col border-r border-white/10">
        {/* Pass the state setter UP to the ChatPanel */}
        <ChatPanel 
          sessionId={sessionId} 
          onTranscriptChange={setLiveTranscript} 
        />
      </div>
      <div className="w-[40%] bg-white/[0.02]">
        {/* Pass the live data DOWN to the InfoPanel */}
        <InfoPanel 
          sessionId={sessionId} 
          liveTranscript={liveTranscript} 
        />
      </div>
    </div>
  );
}