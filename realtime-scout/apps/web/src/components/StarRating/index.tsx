import './StarRating.css';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}

export default function StarRating({ value, onChange, size = 20 }: StarRatingProps) {
  const readonly = !onChange;
  return (
    <span className={`star-rating ${readonly ? 'readonly' : ''}`} style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = readonly ? value >= n - 0.25 : value >= n;
        return (
          <span
            key={n}
            className={`star ${filled ? 'filled' : ''}`}
            onClick={() => onChange?.(n)}
          >
            ★
          </span>
        );
      })}
    </span>
  );
}
