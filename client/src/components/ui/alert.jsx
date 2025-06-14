// client/src/components/ui/alert.jsx
export function Alert({ children, className = "" }) {
  return (
    <div className={`relative border-l-4 border-yellow-500 bg-yellow-100 p-4 rounded-md ${className}`}>
      {children}
    </div>
  );
}

export function AlertDescription({ children }) {
  return <p className="text-sm text-yellow-800">{children}</p>;
}
