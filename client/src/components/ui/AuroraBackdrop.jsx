export default function AuroraBackdrop({ forceLight = false }) {
  if (forceLight) {
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-[#F4F7FB]"
        style={{
          contain: 'strict',
          backgroundImage:
            'radial-gradient(620px circle at 12% 10%, rgba(103, 232, 249, 0.24), transparent 68%), radial-gradient(600px circle at 88% 18%, rgba(165, 180, 252, 0.24), transparent 68%), radial-gradient(660px circle at 48% 92%, rgba(110, 231, 183, 0.2), transparent 68%)',
        }}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-[#F4F7FB] dark:bg-[#070B14]"
      style={{ contain: 'strict' }}
    >
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          backgroundImage:
            'radial-gradient(620px circle at 12% 10%, rgba(34, 211, 238, 0.2), transparent 68%), radial-gradient(600px circle at 88% 18%, rgba(129, 140, 248, 0.2), transparent 68%), radial-gradient(660px circle at 48% 92%, rgba(52, 211, 153, 0.15), transparent 68%)',
        }}
      />
      <div
        className="hidden dark:block absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(620px circle at 12% 10%, rgba(6, 182, 212, 0.14), transparent 68%), radial-gradient(600px circle at 88% 18%, rgba(99, 102, 241, 0.14), transparent 68%), radial-gradient(660px circle at 48% 92%, rgba(16, 185, 129, 0.1), transparent 68%)',
        }}
      />
    </div>
  );
}
