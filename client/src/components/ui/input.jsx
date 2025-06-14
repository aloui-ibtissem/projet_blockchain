// client/src/components/ui/input.jsx
export function Input({ className = "", ...props }) {
  return (
    <input
      className={`block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${className}`}
      {...props}
    />
  );
}
