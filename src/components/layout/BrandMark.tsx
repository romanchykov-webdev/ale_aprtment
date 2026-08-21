/**
 * Знак бренда — линейный домик. Тот же контур используется фавиконом сайта.
 * Иконки в этом стиле только линейные: обводка 1.6px, скруглённые концы,
 * никаких заливок.
 */
interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 15.5 16 6l12 9.5" />
      <path d="M7.5 14v11h17V14" />
      <path d="M13.4 25v-6.2h5.2V25" />
    </svg>
  );
}
