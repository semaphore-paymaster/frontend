import type { FC } from 'react';

const CopyIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V16.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 017 16.5v-13z" />
    <path d="M4.5 6A1.5 1.5 0 003 7.5v10A1.5 1.5 0 004.5 19h7a1.5 1.5 0 001.5-1.5v-2.378a.75.75 0 00-1.5 0V17.5a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5v-10a.5.5 0 01.5-.5h2.378a.75.75 0 000-1.5H4.5z" />
  </svg>
);

export default CopyIcon; 