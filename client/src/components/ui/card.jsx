// client/src/components/ui/card.jsx
export function Card({ children, className = "", ...props }) {
  return (
    <div className={`rounded-xl border bg-white p-6 shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }) {
  return (
    <div className={`text-lg font-semibold mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "", ...props }) {
  return (
    <div className={`text-sm text-gray-800 ${className}`} {...props}>
      {children}
    </div>
  );
}
