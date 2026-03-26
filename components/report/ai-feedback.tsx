interface Props { feedback: string; fillerWords: { count: number; words: string[] } }
export function AIFeedback({ feedback, fillerWords }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-6">
      <h3 className="mb-3 font-semibold text-foreground">AI Feedback</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{feedback}</p>
      {fillerWords.count > 0 && (
        <div className="mt-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
          <p className="text-sm font-medium text-yellow-400">
            Filler words detected: {fillerWords.count} times
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {fillerWords.words.map((w, i) => (
              <span key={i} className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs text-yellow-300">
                {w}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
