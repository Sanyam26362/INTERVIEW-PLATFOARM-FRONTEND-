import { ChatPanel } from "@/components/interview/chat-panel";
import { InfoPanel } from "@/components/interview/info-panel";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function InterviewPage({ params }: Props) {
  const { sessionId } = await params;
  return (
    <div className="flex h-screen bg-background">
      <div className="flex w-[60%] flex-col border-r border-white/10">
        <ChatPanel sessionId={sessionId} />
      </div>
      <div className="w-[40%] bg-white/[0.02]">
        <InfoPanel sessionId={sessionId} />
      </div>
    </div>
  );
}
