// client/src/components/ui/badge.jsx
export function Badge({ children, className = "" }) {
  return (
    <span className={`inline-block rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-800 ${className}`}>
      {children}
    </span>
  );
}
