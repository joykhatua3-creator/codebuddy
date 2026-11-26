export default function AuroraBackdrop({ forceLight = false }) {
  if (forceLight) {
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-[#F4F7FB]"
      >
        <div className="absolute -top-32 -left-24 w-[540px] h-[540px] rounded-full bg-cyan-300/25 blur-[110px]" />
        <div className="absolute top-12 -right-24 w-[520px] h-[520px] rounded-full bg-indigo-300/25 blur-[110px]" />
        <div className="absolute -bottom-36 left-1/3 w-[560px] h-[560px] rounded-full bg-emerald-300/20 blur-[120px]" />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-[#F4F7FB] dark:bg-[#070B14]"
    >
      <div className="absolute -top-32 -left-24 w-[540px] h-[540px] rounded-full bg-cyan-400/20 dark:bg-cyan-500/15 blur-[110px]" />
      <div className="absolute top-12 -right-24 w-[520px] h-[520px] rounded-full bg-indigo-400/20 dark:bg-indigo-500/15 blur-[110px]" />
      <div className="absolute -bottom-36 left-1/3 w-[560px] h-[560px] rounded-full bg-emerald-400/15 dark:bg-emerald-500/10 blur-[120px]" />
    </div>
  );
}
