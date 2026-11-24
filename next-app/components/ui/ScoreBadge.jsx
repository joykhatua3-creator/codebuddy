'use client';

const ScoreBadge = ({ score, size = 'md' }) => {
  const sizes = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-lg',
    lg: 'w-20 h-20 text-2xl',
  };
  return (
    <div className={`flex flex-col items-center justify-center rounded-full border-2 font-bold ${sizes[size]} ${
      score >= 85 ? 'border-green-400 bg-green-50 text-green-700'
      : score >= 70 ? 'border-blue-400 bg-blue-50 text-blue-700'
      : score >= 50 ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
      : 'border-red-400 bg-red-50 text-red-700'
    }`}>
      <span>{score}</span>
      {size !== 'sm' && <span className="text-xs font-normal opacity-75">/100</span>}
    </div>
  );
};

export default ScoreBadge;
