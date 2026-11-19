export default function PlaceholderPage({ title }: { title: string }) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">This page is coming soon.</p>
      </div>
    );
  }