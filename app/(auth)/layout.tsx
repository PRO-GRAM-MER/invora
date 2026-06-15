export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full">
      {/* Left panel — decorative, hidden on mobile */}
      <div className="hidden flex-1 flex-col justify-between bg-indigo-600 p-12 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-white">Invora</span>
        </div>

        <div>
          <blockquote className="text-2xl font-semibold leading-snug text-white/90">
            &ldquo;Invora cut my invoicing time in half. My clients love how professional everything looks.&rdquo;
          </blockquote>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20" />
            <div>
              <p className="text-sm font-medium text-white">Sarah Johnson</p>
              <p className="text-sm text-indigo-200">Freelance Designer</p>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {[
            { value: "2,400+", label: "Invoices sent" },
            { value: "$1.2M+", label: "Revenue tracked" },
            { value: "98%", label: "Client satisfaction" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-sm text-indigo-200">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:max-w-md lg:px-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
