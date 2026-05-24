export function AnsiTerminal({ output }: { output: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 my-4 font-mono text-sm overflow-x-auto">
      <div className="flex items-center gap-1.5 mb-3">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
      </div>
      <pre
        className="text-zinc-100 whitespace-pre"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: ANSI output from trusted build-time source
        dangerouslySetInnerHTML={{ __html: output }}
      />
    </div>
  );
}
